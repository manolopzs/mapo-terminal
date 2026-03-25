import { useMemo } from "react";
import type { Holding } from "@shared/schema";
import { Shield } from "lucide-react";

interface RiskMetricsProps {
  holdings: Holding[];
}

export function RiskMetrics({ holdings }: RiskMetricsProps) {
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);

  const sectorExposure = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h) => {
      const sector = h.sector || "Other";
      map.set(sector, (map.get(sector) || 0) + h.value);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, pct: (value / totalValue) * 100 }))
      .sort((a, b) => b.pct - a.pct);
  }, [holdings, totalValue]);

  const topConcentration = useMemo(() => {
    if (!holdings.length) return 0;
    const maxValue = Math.max(...holdings.map((h) => h.value));
    return (maxValue / totalValue) * 100;
  }, [holdings, totalValue]);

  const topHolding = useMemo(() => {
    if (!holdings.length) return null;
    return holdings.reduce((max, h) => (h.value > max.value ? h : max), holdings[0]);
  }, [holdings]);

  const diversificationScore = useMemo(() => {
    if (holdings.length === 0) return 0;
    // Simple HHI-based score
    const hhi = holdings.reduce((sum, h) => {
      const weight = h.value / totalValue;
      return sum + weight * weight;
    }, 0);
    // Convert HHI to 0-100 scale (lower HHI = better diversification)
    return Math.min(100, Math.max(0, Math.round((1 - hhi) * 100)));
  }, [holdings, totalValue]);

  const COLORS = [
    "hsl(187, 100%, 50%)",
    "hsl(160, 80%, 45%)",
    "hsl(280, 70%, 60%)",
    "hsl(35, 90%, 55%)",
    "hsl(354, 80%, 55%)",
    "hsl(200, 80%, 55%)",
    "hsl(45, 85%, 60%)",
    "hsl(320, 70%, 55%)",
  ];

  return (
    <div className="glass-card rounded-lg p-4 animate-fade-in-delay-1">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Risk Metrics
        </h3>
      </div>

      {/* Diversification score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Diversification Score
          </span>
          <span className="tabular-nums text-sm font-bold" style={{ color: "hsl(var(--color-cyan))" }}>
            {diversificationScore}/100
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${diversificationScore}%`,
              background: `linear-gradient(90deg, hsl(187, 100%, 50%), hsl(160, 80%, 45%))`,
            }}
          />
        </div>
      </div>

      {/* Top concentration */}
      <div className="mb-4 flex items-center justify-between py-2 border-t border-b" style={{ borderColor: "hsl(var(--border) / 0.3)" }}>
        <div>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Top Concentration
          </span>
          <span className="text-xs text-muted-foreground">
            {topHolding?.ticker ?? "—"}
          </span>
        </div>
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {topConcentration.toFixed(1)}%
        </span>
      </div>

      {/* Sector exposure bars */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          Sector Exposure
        </p>
        <div className="space-y-2">
          {sectorExposure.map((s, i) => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-muted-foreground">{s.name}</span>
                <span className="tabular-nums text-[10px] text-foreground">{s.pct.toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: "hsl(var(--muted))" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${s.pct}%`,
                    background: COLORS[i % COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
