import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; expiry: number }>();

async function cachedAsync<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiry > now) return entry.data as T;
  const data = await fn();
  cache.set(key, { data, expiry: now + ttlMs });
  return data;
}

async function callTool(sourceId: string, toolName: string, args: Record<string, any>): Promise<any> {
  try {
    const params = JSON.stringify({ source_id: sourceId, tool_name: toolName, arguments: args });
    // Escape single quotes for shell
    const escaped = params.replace(/'/g, "'\\''");
    const { stdout } = await execAsync(`external-tool call '${escaped}'`, { timeout: 30000 });
    return JSON.parse(stdout);
  } catch (e: any) {
    console.error(`external-tool error (${toolName}):`, e.message?.slice(0, 200));
    return null;
  }
}

// Parse the markdown table from finance_quotes into structured data
function parseQuotes(content: string): Array<Record<string, string>> {
  const results: Array<Record<string, string>> = [];
  const blocks = content.split(/##\s+\w+\s+Quote/);

  for (const block of blocks) {
    if (!block.includes("|")) continue;
    const lines = block.split("\n").filter(l => l.trim().startsWith("|") && !l.includes("---"));
    if (lines.length < 2) continue;

    const headers = lines[0].split("|").filter(c => c.trim() !== "").map(c => c.trim());
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split("|").filter(c => c.trim() !== "").map(c => c.trim());
      if (cells.length >= headers.length) {
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = cells[idx]; });
        results.push(row);
      }
    }
  }

  return results;
}

export interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  previousClose: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  volume: number;
  marketCap: number;
  marketStatus: string;
}

// Fetch live quotes for a batch of tickers — async, non-blocking
// Cache for 60 seconds
export async function fetchLiveQuotes(tickers: string[]): Promise<LiveQuote[]> {
  if (tickers.length === 0) return [];
  const key = `quotes:${tickers.sort().join(",")}`;
  return cachedAsync(key, 60_000, async () => {
    // Fetch all batches in parallel
    const batches: string[][] = [];
    for (let i = 0; i < tickers.length; i += 10) {
      batches.push(tickers.slice(i, i + 10));
    }

    const batchResults = await Promise.all(
      batches.map(batch =>
        callTool("finance", "finance_quotes", {
          ticker_symbols: batch,
          fields: ["price", "change", "changesPercentage", "previousClose", "dayLow", "dayHigh", "yearLow", "yearHigh", "volume", "marketCap"],
        })
      )
    );

    const allQuotes: LiveQuote[] = [];
    for (const result of batchResults) {
      if (!result?.content) continue;
      const parsed = parseQuotes(result.content);
      for (const row of parsed) {
        allQuotes.push({
          symbol: row.symbol || "",
          name: row.name || "",
          price: parseFloat(row.price) || 0,
          change: parseFloat(row.change) || 0,
          changesPercentage: parseFloat(row.changesPercentage) || 0,
          previousClose: parseFloat(row.previousClose) || 0,
          dayLow: parseFloat(row.dayLow) || 0,
          dayHigh: parseFloat(row.dayHigh) || 0,
          yearLow: parseFloat(row.yearLow) || 0,
          yearHigh: parseFloat(row.yearHigh) || 0,
          volume: parseFloat(row.volume) || 0,
          marketCap: parseFloat(row.marketCap) || 0,
          marketStatus: row.market_status || row.marketStatus || "unknown",
        });
      }
    }
    return allQuotes;
  });
}

export interface EarningsEvent {
  ticker: string;
  date: string;
  time: string;
  fiscalPeriod: string;
  status: string;
}

// Fetch upcoming earnings — batch tickers in smaller groups for reliability
// Cache for 1 hour
export async function fetchEarningsSchedule(tickers: string[]): Promise<EarningsEvent[]> {
  if (tickers.length === 0) return [];
  const key = `earnings:${tickers.sort().join(",")}`;
  return cachedAsync(key, 3_600_000, async () => {
    // Batch into groups of 5 for reliability
    const batches: string[][] = [];
    for (let i = 0; i < tickers.length; i += 5) {
      batches.push(tickers.slice(i, i + 5));
    }

    const batchResults = await Promise.all(
      batches.map(batch =>
        callTool("finance", "finance_earnings_schedule", {
          ticker_symbols: batch,
          direction: "upcoming",
          limit: 1,
        })
      )
    );

    const events: EarningsEvent[] = [];
    for (const result of batchResults) {
      if (!result?.content) continue;
      try {
        const parsed = JSON.parse(result.content);
        for (const item of parsed) {
          if (!item.content) continue;
          const lines = item.content.split("\n");
          let currentTicker = "";
          for (const line of lines) {
            const tickerMatch = line.match(/\*\*(\w+)\*\*/);
            if (tickerMatch) {
              currentTicker = tickerMatch[1];
            }
            const dateMatch = line.match(/Earnings Date:\s*(.+)/);
            if (dateMatch && currentTicker) {
              const dateParts = dateMatch[1].split(" at ");
              const fiscalMatch = item.content.match(new RegExp(`${currentTicker}[\\s\\S]*?Fiscal Period:\\s*(.+)`));
              events.push({
                ticker: currentTicker,
                date: dateParts[0]?.trim() || "",
                time: dateParts[1]?.trim() || "",
                fiscalPeriod: fiscalMatch?.[1]?.trim() || "",
                status: "upcoming",
              });
              currentTicker = "";
            }
          }
        }
      } catch (e) {
        console.error("Error parsing earnings batch:", e);
      }
    }
    return events;
  });
}

export interface MarketSentiment {
  sentiment: string;
  marketStatus: string;
}

// Fetch market sentiment — async
// Cache for 5 minutes
export async function fetchMarketSentiment(): Promise<MarketSentiment> {
  return cachedAsync("market-sentiment", 300_000, async () => {
    const result = await callTool("finance", "finance_market_sentiment", {
      query: "US stock market sentiment today",
      action: "Analyzing US stock market sentiment",
      market_type: "market",
      country: "US",
    });

    if (!result?.content) return { sentiment: "UNCERTAIN", marketStatus: "unknown" };

    const content = result.content as string;
    let sentiment = "UNCERTAIN";
    if (content.includes("BULLISH")) sentiment = "BULLISH";
    else if (content.includes("BEARISH")) sentiment = "BEARISH";
    else if (content.includes("NEUTRAL")) sentiment = "NEUTRAL";

    const statusMatch = content.match(/Market Status:\s*(\w+)/);
    const marketStatus = statusMatch?.[1] || "unknown";

    return { sentiment, marketStatus };
  });
}

// Fetch news headlines — only 2 tickers to keep it fast
// Cache for 10 minutes
export async function fetchPortfolioNews(tickers: string[]): Promise<Array<{ ticker: string; headline: string; time: string; source: string }>> {
  if (tickers.length === 0) return [];
  const key = `news:${tickers.slice(0, 2).sort().join(",")}`;
  return cachedAsync(key, 600_000, async () => {
    const results: Array<{ ticker: string; headline: string; time: string; source: string }> = [];

    // Fetch 2 tickers in parallel (not sequential)
    const newsResults = await Promise.all(
      tickers.slice(0, 2).map(async (ticker) => {
        try {
          const result = await callTool("finance", "finance_ticker_sentiment", {
            ticker_symbol: ticker,
            query: `Latest news and analysis for ${ticker}`,
            action: `Analyzing sentiment for ${ticker}`,
          });
          return { ticker, result };
        } catch {
          return { ticker, result: null };
        }
      })
    );

    for (const { ticker, result } of newsResults) {
      if (!result?.content) continue;
      const content = result.content as string;

      // Extract key topics from bull/bear analysis
      const issueMatch = content.match(/(?:Issue|Topic|Question)[\s\d]*[:\-]\s*(.+)/i);
      const bullMatch = content.match(/(?:Bull|Bullish)[^:]*:\s*(.+?)(?:\n|$)/i);
      const bearMatch = content.match(/(?:Bear|Bearish)[^:]*:\s*(.+?)(?:\n|$)/i);

      if (issueMatch) {
        results.push({ ticker, headline: issueMatch[1].trim().slice(0, 120), time: "now", source: "Analyst" });
      }
      if (bullMatch) {
        results.push({ ticker, headline: bullMatch[1].trim().slice(0, 120), time: "today", source: "Analysis" });
      }
      if (bearMatch) {
        results.push({ ticker, headline: bearMatch[1].trim().slice(0, 120), time: "today", source: "Analysis" });
      }
    }

    return results.slice(0, 8);
  });
}
