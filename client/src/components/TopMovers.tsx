import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface TopMoversProps {
  holdings: Holding[];
}

function RangeBar({ pct, isGainer }: { pct: number; isGainer: boolean }) {
  const dotColor = isGainer ? "#00E6A8" : "#FF4458";
  return (
    <div>
      <div style={{ fontSize: 7, color: "#8B949E", letterSpacing: 0.5, marginBottom: 2 }}>
        52W RANGE
      </div>
      <div className="flex items-center gap-1">
        <div style={{ flex: 1, height: 3, background: "#1A2332", borderRadius: 1, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              left: `${Math.min(Math.max(pct, 2), 98)}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: dotColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function MoverCard({ holding, type }: { holding: Holding; type: "gainer" | "loser" }) {
  const isGainer = type === "gainer";
  const color = isGainer ? "#00E6A8" : "#FF4458";
  const arrow = isGainer ? "▲" : "▼";
  const label = isGainer ? "GAINER" : "LOSER";
  const changePct = holding.dayChangePct ?? 0;
  // Estimate 52w range position from gain/loss
  const rangePct = Math.min(Math.max(50 + (holding.gainLossPct ?? 0), 5), 95);

  return (
    <div
      style={{
        background: "#0A0E18",
        border: "1px solid #1A2332",
        borderRadius: 2,
        padding: "6px 8px",
      }}
    >
      <div style={{ fontSize: 8, color, fontWeight: 600, letterSpacing: 0.8, marginBottom: 2 }}>
        {arrow} {label}
      </div>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <span
          className="font-mono"
          style={{ fontSize: 12, fontWeight: 700, color: "#C9D1D9" }}
        >
          {holding.ticker}
        </span>
        <span
          className="font-mono tabular-nums"
          style={{ fontSize: 12, fontWeight: 700, color }}
        >
          {changePct >= 0 ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>
      <RangeBar pct={rangePct} isGainer={isGainer} />
    </div>
  );
}

export function TopMovers({ holdings }: TopMoversProps) {
  const { gainers, losers, upCount, downCount } = useMemo(() => {
    const sorted = [...holdings].sort((a, b) => (b.dayChangePct ?? 0) - (a.dayChangePct ?? 0));
    const up = sorted.filter((h) => (h.dayChangePct ?? 0) > 0);
    const down = sorted.filter((h) => (h.dayChangePct ?? 0) < 0);
    return {
      gainers: sorted.filter((h) => (h.dayChangePct ?? 0) > 0).slice(0, 2),
      losers: sorted.filter((h) => (h.dayChangePct ?? 0) < 0).slice(-2).reverse().sort((a, b) => (a.dayChangePct ?? 0) - (b.dayChangePct ?? 0)),
      upCount: up.length,
      downCount: down.length,
    };
  }, [holdings]);

  return (
    <div className="terminal-panel" style={{ flex: "0.8 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Top Movers Today</span>
        <span className="terminal-badge">DAILY</span>
      </div>
      <div style={{ padding: "2px 4px", fontSize: 9, color: "#8B949E", borderBottom: "1px solid #1A2332" }}>
        <span style={{ color: "#00E6A8" }}>▲ {upCount} up</span>
        {"  "}
        <span style={{ color: "#FF4458" }}>▼ {downCount} down</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: 4 }}>
        {(gainers.length > 0 || losers.length > 0) ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {gainers.map((m) => (
              <MoverCard key={m.id} holding={m} type="gainer" />
            ))}
            {losers.map((m) => (
              <MoverCard key={m.id} holding={m} type="loser" />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <span style={{ fontSize: 9, color: "#8B949E" }}>No movers today</span>
          </div>
        )}
      </div>
    </div>
  );
}
