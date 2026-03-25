import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getQueryFn } from "@/lib/queryClient";

interface PerformanceChartProps {
  portfolioId: string;
}

interface PerformancePoint {
  date: string;
  portfolio: number;
  voo: number;
  qqq: number;
}

function formatDateLabel(dateStr: string): string {
  // Input: "2026-01-29" → Output: "Jan 29"
  const [, month, day] = dateStr.split("-");
  const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month)]} ${parseInt(day)}`;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      style={{
        background: "#0D1117",
        border: "1px solid #1A2332",
        borderRadius: 6,
        padding: "8px 12px",
        fontSize: 11,
        lineHeight: 1.6,
      }}
    >
      <div style={{ color: "#8B949E", fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
        {formatDateLabel(label)}
      </div>
      {payload.map((entry: any) => {
        const color = entry.dataKey === "portfolio" ? "#00D9FF" : entry.dataKey === "voo" ? "#F0883E" : "#A371F7";
        const name = entry.dataKey === "portfolio" ? "Portfolio" : entry.dataKey === "voo" ? "VOO (S&P 500)" : "QQQ (NASDAQ)";
        const val = entry.value;
        return (
          <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ color }}>{name}</span>
            <span style={{ color: val >= 0 ? "#00E6A8" : "#FF4458", marginLeft: "auto", fontFamily: "JetBrains Mono, monospace" }}>
              {val >= 0 ? "+" : ""}{val.toFixed(2)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PerformanceChart({ portfolioId }: PerformanceChartProps) {
  const { data: rawData, isLoading } = useQuery<PerformancePoint[]>({
    queryKey: [`/api/performance?portfolioId=${portfolioId}`],
    queryFn: getQueryFn({ on401: "throw" }),
    staleTime: Infinity,
  });

  const data = useMemo(() => {
    if (!rawData || rawData.length === 0) return [];
    // Skip the first data point (Jan 28 = pre-trade baseline) if it starts at exactly 0
    const startIdx = rawData.length > 1 && rawData[0].portfolio === 0 && rawData[0].voo !== 0 ? 1 : 0;
    return rawData.slice(startIdx);
  }, [rawData]);

  // Calculate tick interval to show ~8-10 labels
  const tickInterval = data.length > 0 ? Math.max(Math.floor(data.length / 8), 1) : 1;

  // Get latest values for the legend
  const latest = data.length > 0 ? data[data.length - 1] : null;

  if (isLoading) {
    return (
      <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
        <div className="terminal-panel-header">
          <span className="terminal-panel-title">Performance</span>
          <span className="terminal-badge">LOADING...</span>
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#8B949E", fontSize: 10, textTransform: "uppercase", letterSpacing: 1 }}>Loading performance data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-panel" style={{ flex: "1.2 1 0", minHeight: 0 }}>
      <div className="terminal-panel-header">
        <span className="terminal-panel-title">Portfolio vs Benchmarks</span>
        <span className="terminal-badge">LAST 30 TRADING DAYS</span>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 px-2" style={{ height: 22, borderBottom: "1px solid #1A2332" }}>
        <div className="flex items-center gap-1">
          <div style={{ width: 14, height: 2, background: "#00D9FF", borderRadius: 1 }} />
          <span style={{ fontSize: 9, color: "#C9D1D9", fontWeight: 500 }}>Portfolio</span>
          {latest && (
            <span style={{ fontSize: 9, color: latest.portfolio >= 0 ? "#00E6A8" : "#FF4458", fontFamily: "JetBrains Mono, monospace", marginLeft: 2 }}>
              {latest.portfolio >= 0 ? "+" : ""}{latest.portfolio.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 14, height: 0, borderTop: "2px dashed #F0883E" }} />
          <span style={{ fontSize: 9, color: "#C9D1D9", fontWeight: 500 }}>VOO</span>
          {latest && (
            <span style={{ fontSize: 9, color: latest.voo >= 0 ? "#00E6A8" : "#FF4458", fontFamily: "JetBrains Mono, monospace", marginLeft: 2 }}>
              {latest.voo >= 0 ? "+" : ""}{latest.voo.toFixed(2)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 14, height: 0, borderTop: "2px dashed #A371F7" }} />
          <span style={{ fontSize: 9, color: "#C9D1D9", fontWeight: 500 }}>QQQ</span>
          {latest && (
            <span style={{ fontSize: 9, color: latest.qqq >= 0 ? "#00E6A8" : "#FF4458", fontFamily: "JetBrains Mono, monospace", marginLeft: 2 }}>
              {latest.qqq >= 0 ? "+" : ""}{latest.qqq.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2332" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 9, fill: "#8B949E" }}
              axisLine={{ stroke: "#1A2332" }}
              tickLine={false}
              interval={tickInterval}
              tickFormatter={formatDateLabel}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "#8B949E" }}
              axisLine={{ stroke: "#1A2332" }}
              tickLine={false}
              tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v}%`}
              domain={["auto", "auto"]}
            />
            <ReferenceLine y={0} stroke="#1A2332" strokeWidth={1} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="portfolio"
              stroke="#00D9FF"
              strokeWidth={2}
              fill="rgba(0, 217, 255, 0.06)"
              dot={false}
              activeDot={{ r: 3, fill: "#00D9FF", stroke: "#0D1117", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="voo"
              stroke="#F0883E"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: "#F0883E", stroke: "#0D1117", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="qqq"
              stroke="#A371F7"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 3, fill: "#A371F7", stroke: "#0D1117", strokeWidth: 1 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
