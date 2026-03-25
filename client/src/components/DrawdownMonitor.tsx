import { useMemo } from "react";
import { useHoldings } from "@/hooks/use-portfolio";
import type { Holding } from "@shared/schema";

interface DrawdownEntry {
  ticker: string;
  drawdownPct: number;
  level: "OK" | "WATCH" | "REVIEW" | "EXIT";
  color: string;
}

function getDrawdownLevel(pct: number): { level: DrawdownEntry["level"]; color: string } {
  if (pct >= 20) return { level: "EXIT", color: "#FF4458" };
  if (pct >= 15) return { level: "REVIEW", color: "#F0883E" };
  if (pct >= 10) return { level: "WATCH", color: "#F0C83E" };
  return { level: "OK", color: "#00E6A8" };
}

function computeDrawdowns(holdings: Holding[]): DrawdownEntry[] {
  return holdings
    .filter(h => h.type !== "Cash" && h.ticker !== "CASH")
    .map(h => {
      // gainLossPct is negative when position is in drawdown
      const drawdownPct = (h.gainLossPct ?? 0) < 0 ? Math.abs(h.gainLossPct ?? 0) : 0;
      const { level, color } = getDrawdownLevel(drawdownPct);
      return { ticker: h.ticker, drawdownPct, level, color };
    })
    .sort((a, b) => b.drawdownPct - a.drawdownPct);
}

export function DrawdownMonitor({ portfolioId }: { portfolioId: string }) {
  const { data: holdings } = useHoldings(portfolioId || undefined);
  const holdingsData = holdings ?? [];

  const drawdowns = useMemo(() => computeDrawdowns(holdingsData), [holdingsData]);

  const hasAlert = drawdowns.some(d => d.level === "EXIT" || d.level === "REVIEW");

  return (
    <div
      style={{
        background: "#0D1117",
        border: "1px solid #1A2332",
        padding: "8px 10px",
        overflow: "auto",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#8B949E",
            }}
          >
            Drawdown Monitor
          </span>
          {hasAlert && (
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#FF4458",
                animation: "pulse-alert 1.5s ease-in-out infinite",
              }}
            />
          )}
        </div>
        <span
          style={{
            fontSize: 8,
            fontWeight: 600,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: "#484F58",
          }}
        >
          From Cost
        </span>
      </div>

      {/* Drawdown rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {drawdowns.length === 0 && (
          <span style={{ fontSize: 9, color: "#484F58", fontStyle: "italic" }}>No holdings</span>
        )}
        {drawdowns.map((d) => (
          <div
            key={d.ticker}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 0",
            }}
          >
            {/* Ticker */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                fontWeight: 600,
                color: "#C9D1D9",
                width: 40,
                flexShrink: 0,
              }}
            >
              {d.ticker}
            </span>

            {/* Bar */}
            <div
              style={{
                flex: 1,
                height: 6,
                background: "#1A2332",
                borderRadius: 1,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${Math.min(d.drawdownPct * 4, 100)}%`, // scale: 25% drawdown = full bar
                  background: d.color,
                  borderRadius: 1,
                  opacity: 0.85,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Value */}
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontVariantNumeric: "tabular-nums",
                fontSize: 9,
                fontWeight: 600,
                color: d.color,
                width: 38,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {d.drawdownPct > 0 ? `-${d.drawdownPct.toFixed(1)}%` : "0.0%"}
            </span>

            {/* Level badge */}
            {d.level !== "OK" && (
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                  color: d.color,
                  background: `${d.color}15`,
                  padding: "1px 4px",
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              >
                {d.level}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Pulsing animation (injected via style tag) */}
      <style>{`
        @keyframes pulse-alert {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}
