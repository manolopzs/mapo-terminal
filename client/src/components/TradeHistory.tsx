import { useTrades } from "@/hooks/use-portfolio";
import type { Trade } from "@shared/schema";

export function TradeHistory({ portfolioId }: { portfolioId: string }) {
  const { data: trades } = useTrades(portfolioId);

  const sortedTrades = (trades ?? []).sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "#0D1117" }}>
      <div
        className="flex items-center justify-between px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid #1A2332" }}
      >
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#8B949E",
          }}
        >
          Trade History
        </span>
        <span style={{ fontSize: 9, color: "#58A6FF" }}>
          {sortedTrades.length} TRADES
        </span>
      </div>
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        <table className="w-full" style={{ fontSize: 10 }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #1A2332",
                position: "sticky",
                top: 0,
                background: "#0D1117",
                zIndex: 1,
              }}
            >
              {["DATE", "ACTION", "TICKER", "SHARES", "PRICE", "TOTAL", "P&L"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-2 py-1.5"
                    style={{
                      fontSize: 8,
                      fontWeight: 600,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "#484F58",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {sortedTrades.map((trade, i) => (
              <TradeRow key={trade.id ?? i} trade={trade} />
            ))}
          </tbody>
        </table>
        {sortedTrades.length === 0 && (
          <div
            className="flex items-center justify-center py-8"
            style={{ color: "#484F58", fontSize: 10 }}
          >
            No trades recorded
          </div>
        )}
      </div>
    </div>
  );
}

function TradeRow({ trade }: { trade: Trade }) {
  const isBuy = trade.action === "BUY";
  const actionColor = isBuy ? "#00E6A8" : "#FF4458";
  const pnlColor = trade.pnl != null ? (trade.pnl >= 0 ? "#00E6A8" : "#FF4458") : "#484F58";

  return (
    <tr
      style={{ borderBottom: "1px solid #111820" }}
      className="hover:bg-[#161B22] transition-colors"
    >
      <td className="px-2 py-1.5" style={{ color: "#8B949E", fontFamily: "JetBrains Mono, monospace" }}>
        {formatDate(trade.date)}
      </td>
      <td className="px-2 py-1.5">
        <span
          style={{
            color: actionColor,
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: 0.5,
          }}
        >
          {trade.action}
        </span>
      </td>
      <td className="px-2 py-1.5" style={{ color: "#C9D1D9", fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
        {trade.ticker}
      </td>
      <td className="px-2 py-1.5" style={{ color: "#C9D1D9", fontFamily: "JetBrains Mono, monospace" }}>
        {trade.shares}
      </td>
      <td className="px-2 py-1.5" style={{ color: "#C9D1D9", fontFamily: "JetBrains Mono, monospace" }}>
        ${trade.price.toFixed(2)}
      </td>
      <td className="px-2 py-1.5" style={{ color: "#C9D1D9", fontFamily: "JetBrains Mono, monospace" }}>
        ${trade.total.toFixed(2)}
      </td>
      <td className="px-2 py-1.5" style={{ color: pnlColor, fontFamily: "JetBrains Mono, monospace" }}>
        {trade.pnl != null ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}` : "—"}
      </td>
    </tr>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
