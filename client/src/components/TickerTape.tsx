import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  marketStatus: string;
}

interface QuotesResponse {
  quotes: LiveQuote[];
  updatedAt: string;
}

const FALLBACK_TICKERS = [
  { symbol: "SPY", price: "527.35", change: 0.42 },
  { symbol: "QQQ", price: "441.20", change: 0.65 },
  { symbol: "DIA", price: "390.15", change: -0.12 },
  { symbol: "IWM", price: "201.45", change: 0.38 },
  { symbol: "VOO", price: "527.00", change: 0.35 },
  { symbol: "VIX", price: "18.52", change: -3.2 },
  { symbol: "GLD", price: "215.80", change: 0.15 },
  { symbol: "TLT", price: "92.30", change: -0.45 },
];

const MARKET_SYMBOLS = ["SPY", "QQQ", "DIA", "IWM", "VOO", "VIX", "GLD", "TLT"];

export function TickerTape() {
  const { data } = useQuery<QuotesResponse>({
    queryKey: ["/api/live/quotes"],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Auto-refresh every minute
  });

  const marketQuotes = data?.quotes?.filter(q => MARKET_SYMBOLS.includes(q.symbol)) ?? [];

  // Build ticker items: use live data if available, fallback otherwise
  const items = MARKET_SYMBOLS.map(sym => {
    const live = marketQuotes.find(q => q.symbol === sym);
    if (live) {
      return {
        symbol: live.symbol,
        price: live.price >= 1000 ? live.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : live.price.toFixed(2),
        change: live.changesPercentage,
      };
    }
    const fb = FALLBACK_TICKERS.find(f => f.symbol === sym);
    return fb ?? { symbol: sym, price: "—", change: 0 };
  });

  // Also add any holding-specific quotes that aren't market tickers
  const holdingQuotes = data?.quotes?.filter(q => !MARKET_SYMBOLS.includes(q.symbol)).slice(0, 10) ?? [];
  for (const hq of holdingQuotes) {
    items.push({
      symbol: hq.symbol,
      price: hq.price.toFixed(2),
      change: hq.changesPercentage,
    });
  }

  const doubled = [...items, ...items];

  return (
    <div
      className="flex items-center overflow-hidden flex-shrink-0"
      style={{
        height: 24,
        minHeight: 24,
        background: "#080C14",
        borderBottom: "1px solid #1A2332",
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          background: "rgba(0, 230, 168, 0.15)",
          color: "#00E6A8",
          fontSize: 8,
          fontWeight: 700,
          letterSpacing: 1,
          padding: "0 8px",
          height: "100%",
          borderRight: "1px solid #1A2332",
          zIndex: 1,
        }}
      >
        MARKETS
      </div>
      <div className="overflow-hidden flex-1">
        <div className="animate-ticker flex items-center whitespace-nowrap">
          {doubled.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 mx-3" style={{ fontSize: 10 }}>
              <span style={{ color: "#00D9FF", fontWeight: 600, letterSpacing: 0.5 }}>
                {t.symbol}
              </span>
              <span className="font-mono tabular-nums" style={{ color: "#C9D1D9" }}>
                {t.price}
              </span>
              <span
                className="font-mono tabular-nums"
                style={{ color: t.change >= 0 ? "#00E6A8" : "#FF4458" }}
              >
                {t.change >= 0 ? "+" : ""}
                {t.change.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
