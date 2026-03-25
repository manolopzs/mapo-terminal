import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface CorrelationMatrixProps {
  holdings: Holding[];
}

function getCellColor(val: number): string {
  if (val >= 0.95) return "#00D9FF";
  if (val >= 0.7) return "rgba(0, 217, 255, 0.6)";
  if (val >= 0.4) return "rgba(0, 217, 255, 0.3)";
  if (val >= 0.2) return "rgba(0, 217, 255, 0.15)";
  if (val >= 0) return "rgba(0, 217, 255, 0.07)";
  return "rgba(255, 68, 88, 0.3)";
}

function getTextColor(val: number): string {
  if (val >= 0.7) return "#FFFFFF";
  if (val >= 0.3) return "#C9D1D9";
  return "#8B949E";
}

// Generate deterministic pseudo-correlations based on sector similarity
function generateCorrelation(h1: Holding, h2: Holding): number {
  if (h1.ticker === h2.ticker) return 1.0;
  // Same sector => higher correlation
  const sameSector = h1.sector === h2.sector;
  // Deterministic seed from ticker pair
  const pairKey = [h1.ticker, h2.ticker].sort().join("");
  let hash = 0;
  for (let i = 0; i < pairKey.length; i++) {
    hash = (hash * 31 + pairKey.charCodeAt(i)) % 100;
  }
  const base = sameSector ? 0.55 : 0.15;
  const range = sameSector ? 0.35 : 0.45;
  return parseFloat((base + (hash / 100) * range).toFixed(2));
}

export function CorrelationMatrix({ holdings }: CorrelationMatrixProps) {
  const tickers = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return sorted.slice(0, 6);
  }, [holdings]);

  const matrix = useMemo(() => {
    return tickers.map((h1) =>
      tickers.map((h2) => generateCorrelation(h1, h2))
    );
  }, [tickers]);

  if (tickers.length < 2) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 0, background: "#0D1117" }}>
        <div className="terminal-panel-header" style={{ flexShrink: 0 }}>
          <span className="terminal-panel-title">Correlation Matrix</span>
          <span className="terminal-badge">HEAT MAP</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
          <span style={{ fontSize: 9, color: "#8B949E" }}>Need 2+ holdings</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 0, background: "#0D1117" }}>
      <div className="terminal-panel-header" style={{ flexShrink: 0 }}>
        <span className="terminal-panel-title">Correlation Matrix</span>
        <span className="terminal-badge">HEAT MAP</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }}>
        <table style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ width: 36 }} />
              {tickers.map((h) => (
                <th
                  key={h.ticker}
                  style={{
                    fontSize: 7,
                    fontWeight: 600,
                    color: "#8B949E",
                    letterSpacing: 0.5,
                    padding: "2px 1px",
                    textAlign: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    width: 38,
                  }}
                >
                  {h.ticker}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowH, ri) => (
              <tr key={rowH.ticker}>
                <td
                  style={{
                    fontSize: 7,
                    fontWeight: 600,
                    color: "#8B949E",
                    letterSpacing: 0.5,
                    padding: "1px 4px 1px 0",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {rowH.ticker}
                </td>
                {matrix[ri].map((val, ci) => (
                  <td
                    key={ci}
                    className="font-mono tabular-nums"
                    style={{
                      fontSize: 8,
                      fontWeight: 500,
                      color: getTextColor(val),
                      background: getCellColor(val),
                      textAlign: "center",
                      padding: "3px 1px",
                      border: "1px solid #0D1117",
                      width: 38,
                      height: 24,
                    }}
                  >
                    {val.toFixed(2)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
