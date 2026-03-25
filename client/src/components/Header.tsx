import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSummary } from "@/hooks/use-portfolio";
import type { MarketSentiment, LiveQuote } from "@/hooks/use-portfolio";
import { getQueryFn } from "@/lib/queryClient";

interface HeaderProps {
  portfolioId: string;
  liveSentiment?: MarketSentiment;
  liveQuotes?: { quotes: LiveQuote[]; updatedAt: string };
}

interface PerformancePoint {
  date: string;
  portfolio: number;
  voo: number;
  qqq: number;
}

export function Header({ portfolioId, liveSentiment, liveQuotes }: HeaderProps) {
  const { data: summary } = useSummary(portfolioId);

  // Fetch performance data to compute real period returns
  const { data: perfData } = useQuery<PerformancePoint[]>({
    queryKey: [`/api/performance?portfolioId=${portfolioId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: Infinity,
  });

  const totalValue = summary?.totalValue ?? 0;
  const dayChange = summary?.dayChange ?? 0;
  const dayChangePct = summary?.dayChangePct ?? 0;
  const totalReturn = summary?.totalGainLossPct ?? 0;
  const totalReturnDollar = summary?.totalGainLoss ?? 0;

  // Compute period returns from real performance data
  const periodReturns = useMemo(() => {
    if (!perfData || perfData.length === 0) {
      return [
        { label: "1D", value: dayChangePct },
        { label: "5D", value: null },
        { label: "1M", value: null },
        { label: "6M", value: null },
        { label: "1Y", value: null },
      ];
    }

    const latest = perfData[perfData.length - 1];
    const latestPct = latest.portfolio;

    // Helper to get return N trading days back
    function getReturnNDaysBack(n: number): number | null {
      if (perfData!.length <= n) return null;
      const pastPoint = perfData![perfData!.length - 1 - n];
      return latestPct - pastPoint.portfolio;
    }

    // 1D = 1 trading day back
    const oneDay = getReturnNDaysBack(1);
    // 5D = 5 trading days back
    const fiveDay = getReturnNDaysBack(5);
    // 1M ≈ 21 trading days
    const oneMonth = perfData.length > 21 ? getReturnNDaysBack(21) : getReturnNDaysBack(perfData.length - 1);
    // Since inception (we only have ~30 days of data)
    const sinceInception = latestPct;

    return [
      { label: "1D", value: oneDay },
      { label: "5D", value: fiveDay },
      { label: "1M", value: oneMonth },
      { label: "30D", value: sinceInception },
    ];
  }, [perfData, dayChangePct]);

  const dayColor = dayChange >= 0 ? "#00E6A8" : "#FF4458";

  return (
    <div
      className="flex items-center justify-between px-3 flex-shrink-0"
      style={{
        background: "#0D1117",
        borderBottom: "1px solid #1A2332",
        height: 52,
        minHeight: 52,
      }}
    >
      {/* Left: Logo + Name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="flex items-center justify-center font-bold"
          style={{
            width: 28,
            height: 28,
            background: "#00D9FF",
            color: "#080C14",
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 2,
            letterSpacing: 1,
          }}
        >
          MT
        </div>
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#C9D1D9",
              letterSpacing: 2,
              lineHeight: 1,
            }}
          >
            MAPO TERMINAL
          </div>
          <div
            style={{
              fontSize: 8,
              color: "#8B949E",
              letterSpacing: 1.5,
              textTransform: "uppercase",
              marginTop: 1,
            }}
          >
            PERSONAL PORTFOLIO
          </div>
        </div>
      </div>

      {/* Center-left: Portfolio Value */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ borderLeft: "1px solid #1A2332", paddingLeft: 12 }}>
        <div
          style={{
            fontSize: 8,
            color: "#8B949E",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          PORTFOLIO VALUE
        </div>
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: 20, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.1 }}
        >
          ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: 10, color: dayColor, lineHeight: 1 }}
        >
          {dayChange >= 0 ? "+" : ""}${dayChange.toLocaleString("en-US", { minimumFractionDigits: 2 })} today
        </div>
      </div>

      {/* Center: Period Returns */}
      <div className="flex items-center gap-0 flex-shrink-0">
        <div
          style={{
            fontSize: 8,
            color: "#8B949E",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginRight: 8,
          }}
        >
          CHANGE
        </div>
        {periodReturns.map((p) => (
          <div
            key={p.label}
            className="flex flex-col items-center"
            style={{
              padding: "2px 8px",
              borderLeft: "1px solid #1A2332",
            }}
          >
            <div style={{ fontSize: 8, color: "#8B949E", letterSpacing: 1 }}>
              {p.label}
            </div>
            <div
              className="font-mono tabular-nums"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: p.value === null ? "#8B949E" : p.value >= 0 ? "#00E6A8" : "#FF4458",
                lineHeight: 1.2,
              }}
            >
              {p.value === null ? "—" : `${p.value >= 0 ? "+" : ""}${p.value.toFixed(1)}%`}
            </div>
          </div>
        ))}
      </div>

      {/* Center-right: Total Return */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ borderLeft: "1px solid #1A2332", paddingLeft: 12 }}>
        <div
          style={{
            fontSize: 8,
            color: "#8B949E",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          TOTAL P/L
        </div>
        <div
          className="font-mono tabular-nums"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: totalReturn >= 0 ? "#00E6A8" : "#FF4458",
            lineHeight: 1.1,
          }}
        >
          {totalReturn >= 0 ? "+" : ""}
          {totalReturn.toFixed(1)}%
        </div>
        <div
          className="font-mono tabular-nums"
          style={{ fontSize: 9, color: "#8B949E", lineHeight: 1 }}
        >
          {totalReturnDollar >= 0 ? "+" : ""}${totalReturnDollar.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Right: Sentiment + Live + Market */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex flex-col items-center">
          <div style={{ fontSize: 8, color: "#8B949E", letterSpacing: 1, textTransform: "uppercase" }}>
            SENTIMENT
          </div>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: liveSentiment?.sentiment === "BULLISH" ? "#00E6A8" : liveSentiment?.sentiment === "BEARISH" ? "#FF4458" : "#F0883E",
            letterSpacing: 1,
          }}>
            {liveSentiment?.sentiment || "LOADING"}
          </div>
        </div>

        <div className="flex flex-col items-center" style={{ borderLeft: "1px solid #1A2332", paddingLeft: 8 }}>
          <div className="flex items-center gap-1">
            <div
              className="animate-pulse-dot"
              style={{ width: 5, height: 5, borderRadius: "50%", background: liveQuotes ? "#00E6A8" : "#F0883E" }}
            />
            <span style={{ fontSize: 8, color: liveQuotes ? "#00E6A8" : "#F0883E", letterSpacing: 1 }}>
              {liveQuotes ? "LIVE" : "LOADING"}
            </span>
          </div>
          <div className="font-mono tabular-nums" style={{ fontSize: 9, color: "#8B949E" }}>
            {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true, timeZone: "America/Chicago" })} CST
          </div>
        </div>

        {(() => {
          const quoteMktStatus = liveQuotes?.quotes?.[0]?.marketStatus;
          const sentimentMktStatus = liveSentiment?.marketStatus;
          // Prefer quotes-based status (reliable); only use sentiment if it's a real value (not "unknown")
          const mktStatus = (quoteMktStatus && quoteMktStatus !== "unknown" ? quoteMktStatus : null)
            || (sentimentMktStatus && sentimentMktStatus !== "unknown" ? sentimentMktStatus : null)
            || "unknown";
          const isOpen = mktStatus === "open";
          return (
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1,
                padding: "3px 8px",
                borderRadius: 2,
                background: isOpen ? "rgba(0, 230, 168, 0.15)" : "rgba(255, 68, 88, 0.15)",
                color: isOpen ? "#00E6A8" : "#FF4458",
                border: `1px solid ${isOpen ? "rgba(0, 230, 168, 0.3)" : "rgba(255, 68, 88, 0.3)"}`,
              }}
            >
              MARKET: {isOpen ? "OPEN" : "CLOSED"}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
