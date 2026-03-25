import { Trash2 } from "lucide-react";
import { useDeleteHolding } from "@/hooks/use-portfolio";
import type { Holding } from "@shared/schema";

interface HoldingsTableProps {
  holdings: Holding[];
  totalValue: number;
}

export function HoldingsTable({ holdings, totalValue }: HoldingsTableProps) {
  const sorted = [...holdings].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const deleteHolding = useDeleteHolding();

  return (
    <div className="terminal-panel flex-1" style={{ minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Holdings</span>
        <span className="terminal-badge">{holdings.length} POSITIONS</span>
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
              {["TICKER", "PRICE", "CHG", "CHG%", "ALLOC%", ""].map((h) => (
                <th
                  key={h || "actions"}
                  style={{
                    fontSize: 8,
                    fontWeight: 600,
                    color: "#8B949E",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    padding: "3px 6px",
                    textAlign: h === "TICKER" ? "left" : "right",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    width: h === "" ? 24 : undefined,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((h) => {
              const alloc = totalValue > 0 ? ((h.value ?? 0) / totalValue) * 100 : 0;
              const chgPct = h.dayChangePct ?? 0;
              const chgColor = chgPct > 0 ? "#00E6A8" : chgPct < 0 ? "#FF4458" : "#8B949E";
              return (
                <tr
                  key={h.id}
                  className="group"
                  style={{
                    borderBottom: "1px solid rgba(26, 35, 50, 0.5)",
                  }}
                >
                  <td
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#00D9FF",
                      padding: "2px 6px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {h.ticker}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: "#C9D1D9", padding: "2px 6px", textAlign: "right" }}
                  >
                    {(h.price ?? 0).toFixed(2)}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: chgColor, padding: "2px 6px", textAlign: "right" }}
                  >
                    {(h.dayChange ?? 0) >= 0 ? "+" : ""}
                    {(h.dayChange ?? 0).toFixed(2)}
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: chgColor, padding: "2px 6px", textAlign: "right" }}
                  >
                    {chgPct >= 0 ? "+" : ""}
                    {chgPct.toFixed(2)}%
                  </td>
                  <td
                    className="font-mono tabular-nums"
                    style={{ fontSize: 10, color: "#8B949E", padding: "2px 6px", textAlign: "right" }}
                  >
                    {alloc.toFixed(1)}%
                  </td>
                  <td style={{ padding: "2px 4px", textAlign: "right" }}>
                    <button
                      onClick={() => deleteHolding.mutate(h.id)}
                      disabled={deleteHolding.isPending}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#8B949E",
                        padding: 2,
                        opacity: 0.4,
                        transition: "opacity 100ms, color 100ms",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = "1";
                        e.currentTarget.style.color = "#FF4458";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = "0.4";
                        e.currentTarget.style.color = "#8B949E";
                      }}
                      data-testid={`delete-holding-${h.id}`}
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
