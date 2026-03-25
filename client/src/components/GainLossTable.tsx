import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface GainLossTableProps {
  holdings: Holding[];
}

export function GainLossTable({ holdings }: GainLossTableProps) {
  const rows = useMemo(() => {
    return [...holdings]
      .filter(h => h.type !== "Cash" && h.ticker !== "CASH")
      .map(h => ({
        ticker: h.ticker,
        costBasis: h.costBasis ?? 0,
        value: h.value ?? 0,
        pnl: (h.value ?? 0) - (h.costBasis ?? 0),
        pnlPct: h.gainLossPct ?? 0,
      }))
      .sort((a, b) => b.pnl - a.pnl);
  }, [holdings]);

  const totalCost = rows.reduce((s, r) => s + r.costBasis, 0);
  const totalVal = rows.reduce((s, r) => s + r.value, 0);
  const totalPnl = totalVal - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  if (rows.length === 0) {
    return (
      <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Gain / Loss</span>
          <span className="terminal-badge terminal-badge-green">ALL TIME</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span style={{ fontSize: 9, color: "#8B949E" }}>No holdings</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Gain / Loss</span>
        <span className="terminal-badge terminal-badge-green">ALL TIME</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                position: "sticky",
                top: 0,
                background: "#0D1117",
                zIndex: 1,
                borderBottom: "1px solid #1A2332",
              }}
            >
              {["TICKER", "COST", "VALUE", "P&L", "P&L%"].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: 7,
                    fontWeight: 600,
                    color: "#8B949E",
                    letterSpacing: 0.8,
                    textTransform: "uppercase",
                    padding: "3px 5px",
                    textAlign: h === "TICKER" ? "left" : "right",
                    fontFamily: "'Inter', system-ui, sans-serif",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const color = r.pnl >= 0 ? "#00E6A8" : "#FF4458";
              return (
                <tr
                  key={r.ticker}
                  style={{ borderBottom: "1px solid rgba(26, 35, 50, 0.4)" }}
                >
                  <td
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      color: "#00D9FF",
                      padding: "2px 5px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {r.ticker}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 9, color: "#8B949E", padding: "2px 5px", textAlign: "right" }}
                  >
                    ${r.costBasis.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 9, color: "#C9D1D9", padding: "2px 5px", textAlign: "right" }}
                  >
                    ${r.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 9, fontWeight: 600, color, padding: "2px 5px", textAlign: "right" }}
                  >
                    {r.pnl >= 0 ? "+" : ""}${Math.abs(r.pnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 9, fontWeight: 600, color, padding: "2px 5px", textAlign: "right" }}
                  >
                    {r.pnlPct >= 0 ? "+" : ""}{r.pnlPct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total footer */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid #1A2332",
          background: "#080C14",
          padding: "4px 5px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#8B949E",
          }}
        >
          TOTAL
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            className="font-mono tabular-nums"
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: totalPnl >= 0 ? "#00E6A8" : "#FF4458",
            }}
          >
            {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            className="font-mono tabular-nums"
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: totalPnlPct >= 0 ? "#00E6A8" : "#FF4458",
              opacity: 0.8,
            }}
          >
            ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
