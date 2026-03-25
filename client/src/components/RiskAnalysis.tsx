import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface RiskAnalysisProps {
  holdings: Holding[];
}

export function RiskAnalysis({ holdings }: RiskAnalysisProps) {
  const metrics = useMemo(() => {
    if (holdings.length === 0) {
      return [
        { label: "WEIGHTED VOLATILITY", value: "—", sub: "Annualized" },
        { label: "MAX DRAWDOWN (1Y)", value: "—", sub: "Peak to trough" },
        { label: "TOP CONCENTRATION", value: "—", sub: "No holdings" },
        { label: "PORTFOLIO BETA", value: "—", sub: "vs S&P 500" },
        { label: "SHARPE RATIO", value: "—", sub: "Risk-adj. return" },
        { label: "SORTINO RATIO", value: "—", sub: "Downside risk-adj." },
      ];
    }

    const totalValue = holdings.reduce((s, h) => s + (h.value ?? 0), 0);
    const sorted = [...holdings].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    // Weighted volatility estimate based on sector
    const sectorVol: Record<string, number> = {
      Crypto: 72, Technology: 48, Energy: 42, Industrials: 35,
      Financials: 30, Healthcare: 38, "Consumer Discretionary": 32, Utilities: 22, Other: 40,
    };
    const weightedVol = totalValue > 0
      ? holdings.reduce((s, h) => s + (sectorVol[h.sector || "Other"] || 40) * ((h.value ?? 0) / totalValue), 0)
      : 0;

    // Top concentration - largest sector %
    const sectorMap = new Map<string, number>();
    holdings.forEach((h) => {
      const sec = h.sector || "Other";
      sectorMap.set(sec, (sectorMap.get(sec) || 0) + (h.value ?? 0));
    });
    let topSector = "—";
    let topSectorPct = 0;
    sectorMap.forEach((val, key) => {
      const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
      if (pct > topSectorPct) {
        topSectorPct = pct;
        topSector = key;
      }
    });

    // Portfolio beta estimate
    const betaMap: Record<string, number> = {
      Crypto: 1.8, Technology: 1.3, Energy: 1.1, Industrials: 1.0,
      Financials: 1.1, Healthcare: 0.9, "Consumer Discretionary": 1.05, Utilities: 0.6, Other: 1.0,
    };
    const beta = totalValue > 0
      ? holdings.reduce((s, h) => s + (betaMap[h.sector || "Other"] || 1.0) * ((h.value ?? 0) / totalValue), 0)
      : 0;

    // Sharpe/Sortino estimates
    const totalReturnPct = totalValue > 0
      ? holdings.reduce((s, h) => s + (h.gainLossPct ?? 0) * ((h.value ?? 0) / totalValue), 0)
      : 0;
    const sharpe = weightedVol > 0 ? ((totalReturnPct - 4.5) / weightedVol * 4).toFixed(2) : "—";
    const sortino = weightedVol > 0 ? ((totalReturnPct - 4.5) / (weightedVol * 0.7) * 4).toFixed(2) : "—";

    // Max drawdown estimate
    const drawdown = (weightedVol * 0.35).toFixed(1);

    return [
      { label: "WEIGHTED VOLATILITY", value: `${weightedVol.toFixed(1)}%`, sub: "Annualized" },
      { label: "MAX DRAWDOWN (1Y)", value: `${drawdown}%`, sub: "Peak to trough" },
      { label: "TOP CONCENTRATION", value: `${topSectorPct.toFixed(0)}%`, sub: topSector },
      { label: "PORTFOLIO BETA", value: beta.toFixed(2), sub: "vs S&P 500" },
      { label: "SHARPE RATIO", value: sharpe, sub: "Risk-adj. return" },
      { label: "SORTINO RATIO", value: sortino, sub: "Downside risk-adj." },
    ];
  }, [holdings]);

  return (
    <div className="terminal-panel" style={{ flex: "1 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Risk Analysis</span>
        <span className="terminal-badge">METRICS</span>
      </div>
      <div
        className="flex-1 overflow-auto"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          padding: 0,
        }}
      >
        {metrics.map((m, i) => (
          <div
            key={m.label}
            style={{
              padding: "8px 10px",
              borderRight: i % 2 === 0 ? "1px solid #1A2332" : "none",
              borderBottom: i < 4 ? "1px solid #1A2332" : "none",
            }}
          >
            <div
              style={{
                fontSize: 8,
                color: "#8B949E",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 2,
              }}
            >
              {m.label}
            </div>
            <div
              className="font-mono tabular-nums"
              style={{ fontSize: 18, fontWeight: 700, color: "#FFFFFF", lineHeight: 1.2 }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 8, color: "#8B949E", marginTop: 1 }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
