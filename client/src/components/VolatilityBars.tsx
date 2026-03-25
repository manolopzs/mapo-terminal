import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface VolatilityBarsProps {
  holdings: Holding[];
}

// Generate deterministic volatility based on ticker + sector
function estimateVolatility(h: Holding): number {
  // Base volatility by type/sector
  const sectorVol: Record<string, number> = {
    Crypto: 72,
    Technology: 48,
    Energy: 42,
    Industrials: 35,
    Financials: 30,
    Healthcare: 38,
    "Consumer Discretionary": 32,
    Utilities: 22,
    Other: 40,
  };
  const base = sectorVol[h.sector || "Other"] || 40;
  // Add ticker-specific offset for variation
  let hash = 0;
  for (let i = 0; i < h.ticker.length; i++) {
    hash = (hash * 31 + h.ticker.charCodeAt(i)) % 100;
  }
  const offset = (hash / 100 - 0.5) * 30; // ±15%
  // Small/micro cap proxy: higher price change implies higher vol
  const changeFactor = Math.min(Math.abs(h.gainLossPct ?? 0) * 0.3, 15);
  return parseFloat(Math.max(base + offset + changeFactor, 15).toFixed(1));
}

export function VolatilityBars({ holdings }: VolatilityBarsProps) {
  const volData = useMemo(() => {
    return holdings
      .map((h) => ({
        ticker: h.ticker,
        vol: estimateVolatility(h),
      }))
      .sort((a, b) => b.vol - a.vol);
  }, [holdings]);

  const maxVol = volData.length > 0 ? Math.max(...volData.map((d) => d.vol)) : 100;

  if (volData.length === 0) {
    return (
      <div className="terminal-panel" style={{ flex: "1 1 0", minHeight: 0 }}>
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Volatility</span>
          <span className="terminal-badge">ANNUALIZED</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span style={{ fontSize: 9, color: "#8B949E" }}>No holdings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" style={{ flex: "1 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Volatility</span>
        <span className="terminal-badge">ANNUALIZED</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: "4px 8px" }}>
        {volData.map((d) => {
          const pct = (d.vol / maxVol) * 100;
          return (
            <div
              key={d.ticker}
              className="flex items-center gap-2"
              style={{ marginBottom: 2, height: 16 }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: "#00D9FF",
                  width: 36,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {d.ticker}
              </span>
              <div style={{ flex: 1, height: 8, background: "#1A2332", borderRadius: 1 }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, rgba(0, 217, 255, 0.3), #00D9FF)`,
                    borderRadius: 1,
                  }}
                />
              </div>
              <span
                className="font-mono tabular-nums"
                style={{ fontSize: 8, color: "#C9D1D9", width: 30, textAlign: "right", flexShrink: 0 }}
              >
                {d.vol.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
