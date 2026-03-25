import { useMemo } from "react";
import type { Holding } from "@shared/schema";

interface RiskSuggestionsProps {
  holdings: Holding[];
}

interface Suggestion {
  title: string;
  description: string;
  suggestion: string;
}

export function RiskSuggestions({ holdings }: RiskSuggestionsProps) {
  const suggestions = useMemo(() => {
    if (holdings.length === 0) return [];

    const totalValue = holdings.reduce((s, h) => s + (h.value ?? 0), 0);
    const results: Suggestion[] = [];

    // Sector concentration analysis
    const sectorMap = new Map<string, number>();
    holdings.forEach((h) => {
      const sec = h.sector || "Other";
      sectorMap.set(sec, (sectorMap.get(sec) || 0) + (h.value ?? 0));
    });
    const sectorPcts = Array.from(sectorMap.entries()).map(([name, val]) => ({
      name,
      pct: totalValue > 0 ? (val / totalValue) * 100 : 0,
    })).sort((a, b) => b.pct - a.pct);

    if (sectorPcts[0] && sectorPcts[0].pct > 40) {
      results.push({
        title: `High ${sectorPcts[0].name} Concentration`,
        description: `${sectorPcts[0].name} stocks make up ${sectorPcts[0].pct.toFixed(0)}% of the portfolio — a single sector downturn would significantly impact your returns.`,
        suggestion: `Consider rebalancing 10-15% into other sectors to reduce concentration risk.`,
      });
    }

    // Single position concentration
    const sorted = [...holdings].sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const topHolding = sorted[0];
    if (topHolding && totalValue > 0) {
      const topPct = ((topHolding.value ?? 0) / totalValue) * 100;
      if (topPct > 15) {
        results.push({
          title: `${topHolding.ticker} Overweight`,
          description: `${topHolding.ticker} (${topPct.toFixed(1)}%) is your single largest position${topHolding.sector === "Crypto" ? " with concentrated crypto exposure" : ""}.`,
          suggestion: `Consider trimming to 5-10% and redirecting into less correlated assets for better risk-adjusted returns.`,
        });
      }
    }

    // Geographic diversification (all holdings assumed US)
    results.push({
      title: "Limited Geographic Diversification",
      description: "100% U.S. equity exposure leaves the portfolio vulnerable to domestic-only macro shocks and USD risk.",
      suggestion: "Add 10-15% international allocation via VXUS or EFA to capture global growth and reduce country risk.",
    });

    // Number of positions
    if (holdings.length < 8) {
      results.push({
        title: "Low Diversification",
        description: `Only ${holdings.length} positions — the portfolio is vulnerable to single-stock events.`,
        suggestion: "Consider adding positions across different sectors to reach 10-15 holdings for better risk distribution.",
      });
    }

    // High volatility names
    const highVolHoldings = holdings.filter((h) =>
      (h.sector === "Crypto" || Math.abs(h.gainLossPct ?? 0) > 50)
    );
    if (highVolHoldings.length > 0 && results.length < 3) {
      const names = highVolHoldings.map((h) => h.ticker).join(", ");
      results.push({
        title: "High Volatility Exposure",
        description: `${names} ${highVolHoldings.length > 1 ? "are" : "is"} high-volatility ${highVolHoldings.length > 1 ? "positions" : "position"} that can amplify portfolio drawdowns.`,
        suggestion: "Consider hedging with low-correlation assets or reducing position sizes.",
      });
    }

    return results.slice(0, 3);
  }, [holdings]);

  if (suggestions.length === 0) {
    return (
      <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Risk Suggestions</span>
          <span className="terminal-badge terminal-badge-orange">INTEL</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span style={{ fontSize: 9, color: "#8B949E" }}>Add holdings to see suggestions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Risk Suggestions</span>
        <span className="terminal-badge terminal-badge-orange">INTEL</span>
      </div>
      <div className="flex-1 overflow-auto" style={{ padding: 4 }}>
        {suggestions.map((s, i) => (
          <div
            key={i}
            style={{
              background: "#0A0E18",
              border: "1px solid #1A2332",
              borderRadius: 2,
              padding: "6px 8px",
              marginBottom: i < suggestions.length - 1 ? 4 : 0,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  padding: "1px 5px",
                  borderRadius: 1,
                  background: "rgba(255, 68, 88, 0.2)",
                  color: "#FF4458",
                  textTransform: "uppercase",
                }}
              >
                RISK
              </span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#C9D1D9" }}>
                {s.title}
              </span>
            </div>
            <p style={{ fontSize: 9, color: "#8B949E", lineHeight: 1.4, margin: 0, marginBottom: 4 }}>
              {s.description}
            </p>
            <div className="flex items-start gap-1">
              <span style={{ color: "#00D9FF", fontSize: 10, lineHeight: 1.3 }}>→</span>
              <span style={{ fontSize: 9, color: "#00D9FF", lineHeight: 1.3 }}>
                {s.suggestion}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
