import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Holding } from "@shared/schema";

interface AssetAllocationProps {
  holdings: Holding[];
}

const COLORS = [
  "#00D9FF", // cyan - Technology
  "#F0883E", // orange - Crypto
  "#A855F7", // purple - Industrials
  "#00E6A8", // green - Energy
  "#3B82F6", // blue - Financials
  "#EC4899", // pink - Healthcare
  "#EAB308", // yellow - Consumer Disc.
  "#FF4458", // red - Utilities
];

export function AssetAllocation({ holdings }: AssetAllocationProps) {
  const totalValue = useMemo(() => holdings.reduce((s, h) => s + h.value, 0), [holdings]);

  const sectorData = useMemo(() => {
    const map = new Map<string, number>();
    holdings.forEach((h) => {
      const sector = h.sector || "Other";
      map.set(sector, (map.get(sector) || 0) + h.value);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, pct: (value / totalValue) * 100 }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, totalValue]);

  return (
    <div className="terminal-panel" style={{ flex: "0.8 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Asset Allocation</span>
        <span className="terminal-badge">BREAKDOWN</span>
      </div>
      <div className="flex-1 flex overflow-hidden" style={{ padding: "2px 4px", minHeight: 0 }}>
        <div style={{ width: "45%", minHeight: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius="45%"
                outerRadius="80%"
                paddingAngle={1}
                dataKey="value"
                stroke="none"
              >
                {sectorData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0D1117",
                  border: "1px solid #1A2332",
                  borderRadius: 2,
                  fontSize: 9,
                  color: "#C9D1D9",
                  padding: "3px 6px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 0 })}`, "Value"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5 overflow-auto" style={{ paddingLeft: 4 }}>
          {sectorData.map((s, i) => (
            <div key={s.name} className="flex items-center justify-between" style={{ fontSize: 9 }}>
              <div className="flex items-center gap-1 min-w-0">
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 1,
                    background: COLORS[i % COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: "#8B949E" }} className="truncate">
                  {s.name}
                </span>
              </div>
              <span className="font-mono tabular-nums flex-shrink-0" style={{ color: "#C9D1D9", marginLeft: 4 }}>
                {s.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
