import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";
import { fetchLiveQuotes, fetchEarningsSchedule, fetchMarketSentiment, fetchPortfolioNews } from "./liveData";

const anthropic = new Anthropic();
const openai = new OpenAI();

type AIModel = "claude" | "gpt" | "gemini";

const MODEL_MAP: Record<AIModel, { sdk: "anthropic" | "openai"; modelId: string; label: string }> = {
  claude: { sdk: "anthropic", modelId: "claude_sonnet_4_6", label: "Claude Sonnet 4.6" },
  gpt: { sdk: "openai", modelId: "gpt_5_1", label: "GPT-5.1" },
  gemini: { sdk: "openai", modelId: "gemini_3_flash", label: "Gemini 3 Flash" },
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Portfolios
  app.get("/api/portfolios", async (_req, res) => {
    const portfolios = await storage.getPortfolios();
    res.json(portfolios);
  });

  app.post("/api/portfolios", async (req, res) => {
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: "name and type are required" });
    }
    const portfolio = await storage.createPortfolio({ name, type });
    res.status(201).json(portfolio);
  });

  app.delete("/api/portfolios/:id", async (req, res) => {
    const deleted = await storage.deletePortfolio(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Portfolio not found" });
    res.json({ success: true });
  });

  // Holdings
  app.get("/api/holdings", async (req, res) => {
    const portfolioId = req.query.portfolioId as string | undefined;
    const holdings = await storage.getHoldings(portfolioId);
    res.json(holdings);
  });

  app.post("/api/holdings", async (req, res) => {
    const holding = await storage.createHolding(req.body);
    res.status(201).json(holding);
  });

  app.put("/api/holdings/:id", async (req, res) => {
    const updated = await storage.updateHolding(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Holding not found" });
    res.json(updated);
  });

  app.delete("/api/holdings/:id", async (req, res) => {
    const deleted = await storage.deleteHolding(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Holding not found" });
    res.json({ success: true });
  });

  // Trades
  app.get("/api/trades", async (req, res) => {
    const portfolioId = req.query.portfolioId as string | undefined;
    const trades = await storage.getTrades(portfolioId);
    res.json(trades);
  });

  app.post("/api/trades", async (req, res) => {
    const trade = await storage.createTrade(req.body);
    res.status(201).json(trade);
  });

  // Chat messages
  app.get("/api/chat", async (req, res) => {
    const portfolioId = req.query.portfolioId as string;
    if (!portfolioId) return res.status(400).json({ error: "portfolioId required" });
    const messages = await storage.getChatMessages(portfolioId);
    res.json(messages);
  });

  app.delete("/api/chat", async (req, res) => {
    const portfolioId = req.query.portfolioId as string;
    if (!portfolioId) return res.status(400).json({ error: "portfolioId required" });
    await storage.clearChatMessages(portfolioId);
    res.json({ success: true });
  });

  // AI Analyst endpoint
  app.post("/api/chat", async (req, res) => {
    const { portfolioId, message, model: modelKey } = req.body;
    if (!portfolioId || !message) {
      return res.status(400).json({ error: "portfolioId and message required" });
    }

    const selectedModel = MODEL_MAP[(modelKey as AIModel) || "claude"] || MODEL_MAP.claude;

    try {
      // Save user message
      await storage.createChatMessage({
        portfolioId,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      // Get context data
      const holdings = await storage.getHoldings(portfolioId);
      const trades = await storage.getTrades(portfolioId);
      const summary = await storage.getPortfolioSummary(portfolioId);
      const portfolio = await storage.getPortfolio(portfolioId);

      // Build compact context for the AI
      const holdingsContext = holdings.map(h =>
        `${h.ticker}: ${h.quantity}sh, $${h.value.toFixed(0)} (${(h.gainLossPct ?? 0) >= 0 ? '+' : ''}${(h.gainLossPct ?? 0).toFixed(1)}%), ${h.sector}`
      ).join("\n");

      const tradesContext = trades.slice(0, 20).map(t =>
        `${t.date} ${t.action} ${t.ticker} ${t.shares}sh @$${t.price.toFixed(2)}${t.pnl != null ? ` P&L:$${t.pnl.toFixed(0)}` : ''}`
      ).join("\n");

      const systemPrompt = `You are the MAPO Portfolio Analyst — an AI-powered investment research system. You analyze portfolios using the MAPO (Market Analysis Portfolio Operations) framework.

PORTFOLIO: ${portfolio?.name ?? "Unknown"}
TOTAL VALUE: $${summary.totalValue.toFixed(2)}
TOTAL COST BASIS: $${summary.totalCostBasis.toFixed(2)}
TOTAL G/L: ${summary.totalGainLoss >= 0 ? '+' : ''}$${summary.totalGainLoss.toFixed(2)} (${summary.totalGainLossPct >= 0 ? '+' : ''}${summary.totalGainLossPct.toFixed(2)}%)
HOLDINGS COUNT: ${summary.holdingsCount}

CURRENT HOLDINGS:
${holdingsContext || "No holdings"}

TRADE HISTORY:
${tradesContext || "No trades recorded"}

MAPO FRAMEWORK RULES:
- 6-Factor Scoring: Financial Health (25%), Valuation (20%), Growth (20%), Technical (15%), Sentiment (10%), Macro Fit (10%)
- Score thresholds: 80-100 Strong Buy, 65-79 Buy, 50-64 Hold, <50 Avoid
- Portfolio rules: 4-8 positions, max 25% single position, max 40% single sector, max 30% mega cap
- Market cap focus: Under $50B preferred, mega caps (>$200B) limited to 30%
- Monthly 4-week rebalancing cycle: Week 1 Macro, Week 2 Screening, Week 3 Deep Dive, Week 4 Construction
- Entry: Score 65+, clear bull case, 2+ catalysts, not at 52-week high
- Exit triggers: Score below 50, thesis broken, 15-20% drawdown, better opportunity

EXCLUSION LIST: BMNR, UP, MP, CLSK, NBIS, AMD, TE, IREN, IBIT

MAPO v4.0 ENHANCED RULES:

Drawdown Escalation:
- 10% drawdown: Review thesis, confirm catalysts
- 15% drawdown: Re-score mandatory. If score <65, reduce by 50%
- 20% drawdown: Auto-exit unless catalyst imminent within 30 days
- 25% drawdown: Forced full exit, 90-day cooldown
- Portfolio-level: >12% drawdown in 30 days = halt new entries, 10% to cash

Cash Management:
- Minimum 5% cash reserve at all times
- Maximum 20% cash (must deploy within 2 weeks or justify)
- Freed cash from exits: redeploy within 10 trading days

Liquidity Rules:
- Minimum avg daily volume: $5M+
- No entry within 3 trading days of earnings
- Scale-in for positions >15%: enter in 2-3 tranches over 5-7 days

Correlation Guard:
- Max pairwise correlation: 0.75
- Portfolio avg correlation >0.60 triggers mandatory diversification

Earnings Protocol:
- SUE >1.0 (beat by >1 std dev): +3 pts, consider adding
- SUE < -1.0 (miss by >1 std dev): re-score within 24 hours

INSTRUCTIONS:
- Be very concise — keep responses under 250 words, use bullet points
- When analyzing a stock, use the 6-factor scoring methodology
- Flag any portfolio rule violations
- Provide actionable recommendations with clear rationale
- For alerts: flag positions with 15%+ drawdown, sector concentration >40%, single position >25%
- Use markdown formatting for tables and emphasis
- Be direct and specific — avoid generic advice`;

      // Get previous chat context (last 10 messages)
      const prevMessages = await storage.getChatMessages(portfolioId);
      const recentMessages = prevMessages.slice(-10);
      const chatHistory = recentMessages.map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      let assistantContent: string;

      if (selectedModel.sdk === "anthropic") {
        // Anthropic Messages API
        const response = await anthropic.messages.create({
          model: selectedModel.modelId,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...chatHistory,
            { role: "user", content: message },
          ],
        });
        assistantContent = response.content[0].type === "text"
          ? response.content[0].text
          : "I couldn't generate a response.";
      } else {
        // OpenAI Responses API
        const inputMessages = [
          ...chatHistory.map(m => ({ type: "message" as const, role: m.role as "user" | "assistant", content: m.content })),
          { type: "message" as const, role: "user" as const, content: message },
        ];

        const response = await openai.responses.create({
          model: selectedModel.modelId,
          instructions: systemPrompt,
          input: inputMessages,
          max_output_tokens: 1024,
        });

        const outputMsg = response.output.find((o: any) => o.type === "message");
        assistantContent = outputMsg?.content?.[0]?.text || "I couldn't generate a response.";
      }

      // Save assistant message
      const saved = await storage.createChatMessage({
        portfolioId,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date().toISOString(),
      });

      res.json({ message: saved, model: selectedModel.label });
    } catch (error) {
      console.error("AI Analyst error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Performance data
  app.get("/api/performance", async (req, res) => {
    const portfolioId = req.query.portfolioId as string | undefined;
    try {
      // Load price data and trade data to compute performance
      const priceDataPath = join(process.cwd(), "price-data.json");
      const priceDataRaw = readFileSync(priceDataPath, "utf-8");
      const prices: Record<string, Record<string, number>> = JSON.parse(priceDataRaw);

      // Get trades for this portfolio
      const trades = await storage.getTrades(portfolioId);

      // Determine portfolio type
      let portfolio;
      if (portfolioId) {
        portfolio = await storage.getPortfolio(portfolioId);
      }

      // For Mapo AI portfolio, compute from trades
      if (trades.length > 0) {
        // Load mapo-ai-portfolio.json for starting capital
        let startingCapital = 20454.16;
        try {
          const mapoPath = join(process.cwd(), "mapo-ai-portfolio.json");
          const mapoRaw = readFileSync(mapoPath, "utf-8");
          const mapoData = JSON.parse(mapoRaw);
          startingCapital = mapoData.startingCapital || startingCapital;
        } catch (e) {}

        // Sort trades by date
        const sortedTrades = [...trades].sort((a, b) => a.date.localeCompare(b.date));
        const firstTradeDate = sortedTrades[0].date;

        // Get all trading dates from VOO
        const allDates = Object.keys(prices.VOO || {}).sort();

        // Group trades by date
        const tradesByDate: Record<string, typeof trades> = {};
        for (const t of sortedTrades) {
          if (!tradesByDate[t.date]) tradesByDate[t.date] = [];
          tradesByDate[t.date].push(t);
        }

        const positions: Record<string, number> = {};
        let cash = startingCapital;

        const vooBase = prices.VOO?.[firstTradeDate] || 1;
        const qqqBase = prices.QQQ?.[firstTradeDate] || 1;

        const performanceData: { date: string; portfolio: number; voo: number; qqq: number }[] = [];

        for (const date of allDates) {
          // Process trades
          if (tradesByDate[date]) {
            for (const t of tradesByDate[date]) {
              if (t.action === "BUY") {
                cash -= t.total;
                positions[t.ticker] = (positions[t.ticker] || 0) + t.shares;
              } else if (t.action === "SELL") {
                cash += t.total;
                positions[t.ticker] = (positions[t.ticker] || 0) - t.shares;
                if ((positions[t.ticker] || 0) <= 0) delete positions[t.ticker];
              }
            }
          }

          // Calc holdings value
          let holdingsValue = 0;
          for (const [ticker, shares] of Object.entries(positions)) {
            if (prices[ticker]?.[date]) {
              holdingsValue += shares * prices[ticker][date];
            }
          }

          const totalValue = cash + holdingsValue;
          const pctReturn = ((totalValue - startingCapital) / startingCapital) * 100;
          const vooReturn = prices.VOO?.[date] ? ((prices.VOO[date] - vooBase) / vooBase) * 100 : 0;
          const qqqReturn = prices.QQQ?.[date] ? ((prices.QQQ[date] - qqqBase) / qqqBase) * 100 : 0;

          performanceData.push({
            date,
            portfolio: Math.round(pctReturn * 100) / 100,
            voo: Math.round(vooReturn * 100) / 100,
            qqq: Math.round(qqqReturn * 100) / 100,
          });
        }

        return res.json(performanceData);
      }

      // For Schwab portfolio (no trades), compute actual weighted portfolio return
      // using real stock prices and current portfolio weights
      const allDates = Object.keys(prices.VOO || {}).sort();
      const holdings = await storage.getHoldings(portfolioId);
      const totalCurrentValue = holdings.reduce((s, h) => s + h.value, 0);

      // Use first available date as base for benchmarks
      const firstDate = allDates[0];
      const vooBase = prices.VOO?.[firstDate] || 1;
      const qqqBase = prices.QQQ?.[firstDate] || 1;

      // Calculate weighted portfolio return based on holdings
      // For each day, compute the portfolio return as the weighted sum
      // of each holding's return using current weights
      const holdingWeights = holdings.map(h => ({
        ticker: h.ticker,
        weight: totalCurrentValue > 0 ? h.value / totalCurrentValue : 0,
      }));

      // Get base prices for each holding on the first date
      const holdingBasePrices: Record<string, number> = {};
      for (const h of holdings) {
        holdingBasePrices[h.ticker] = prices[h.ticker]?.[firstDate] || h.price;
      }

      const performanceData = allDates.map(date => {
        const vooReturn = prices.VOO?.[date] ? ((prices.VOO[date] - vooBase) / vooBase) * 100 : 0;
        const qqqReturn = prices.QQQ?.[date] ? ((prices.QQQ[date] - qqqBase) / qqqBase) * 100 : 0;

        // Weighted portfolio return
        let portfolioReturn = 0;
        for (const hw of holdingWeights) {
          const basePrice = holdingBasePrices[hw.ticker];
          const currentPrice = prices[hw.ticker]?.[date];
          if (basePrice && currentPrice) {
            const holdingReturn = ((currentPrice - basePrice) / basePrice) * 100;
            portfolioReturn += holdingReturn * hw.weight;
          }
        }

        return {
          date,
          portfolio: Math.round(portfolioReturn * 100) / 100,
          voo: Math.round(vooReturn * 100) / 100,
          qqq: Math.round(qqqReturn * 100) / 100,
        };
      });

      return res.json(performanceData);
    } catch (error) {
      console.error("Performance data error:", error);
      return res.json([]);
    }
  });

  // Summary
  app.get("/api/summary", async (req, res) => {
    const portfolioId = req.query.portfolioId as string | undefined;
    const summary = await storage.getPortfolioSummary(portfolioId);
    res.json(summary);
  });

  // ====== LIVE DATA ENDPOINTS ======

  // Live quotes for portfolio holdings + market tickers
  app.get("/api/live/quotes", async (req, res) => {
    try {
      const portfolioId = req.query.portfolioId as string | undefined;
      const holdings = await storage.getHoldings(portfolioId);
      const holdingTickers = holdings.map(h => h.ticker);

      // Market tickers for the tape
      const marketTickers = ["SPY", "QQQ", "DIA", "IWM", "VIX", "GLD", "TLT", "VOO"];

      // Combine and deduplicate
      const allTickers = [...new Set([...holdingTickers, ...marketTickers])];

      const quotes = await fetchLiveQuotes(allTickers);

      // Also update holdings in storage with live prices
      for (const holding of holdings) {
        const quote = quotes.find(q => q.symbol === holding.ticker);
        if (quote && quote.price > 0) {
          const newValue = holding.quantity * quote.price;
          const gainLoss = newValue - holding.costBasis;
          const gainLossPct = holding.costBasis > 0 ? (gainLoss / holding.costBasis) * 100 : 0;
          await storage.updateHolding(holding.id, {
            price: quote.price,
            value: newValue,
            dayChange: holding.quantity * quote.change,
            dayChangePct: quote.changesPercentage,
            gainLoss,
            gainLossPct,
          });
        }
      }

      res.json({
        quotes,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Live quotes error:", error);
      res.status(500).json({ error: "Failed to fetch live quotes" });
    }
  });

  // Live earnings schedule for portfolio holdings
  app.get("/api/live/earnings", async (req, res) => {
    try {
      const portfolioId = req.query.portfolioId as string | undefined;
      const holdings = await storage.getHoldings(portfolioId);
      const tickers = holdings.map(h => h.ticker);
      const earnings = await fetchEarningsSchedule(tickers);
      res.json(earnings);
    } catch (error) {
      console.error("Earnings schedule error:", error);
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });

  // Live market sentiment
  app.get("/api/live/sentiment", async (_req, res) => {
    try {
      const sentiment = await fetchMarketSentiment();
      res.json(sentiment);
    } catch (error) {
      console.error("Market sentiment error:", error);
      res.status(500).json({ error: "Failed to fetch sentiment" });
    }
  });

  // Live news for portfolio holdings
  app.get("/api/live/news", async (req, res) => {
    try {
      const portfolioId = req.query.portfolioId as string | undefined;
      const holdings = await storage.getHoldings(portfolioId);
      const tickers = holdings.map(h => h.ticker);
      const news = await fetchPortfolioNews(tickers);
      res.json(news);
    } catch (error) {
      console.error("Live news error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  return httpServer;
}
