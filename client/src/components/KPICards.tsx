import { TrendingUp, TrendingDown, BarChart3, Award, Layers } from "lucide-react";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

interface KPICardsProps {
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  holdingsCount: number;
  bestPerformer: { ticker: string; gainLossPct: number } | null;
}

function KPICard({
  label,
  value,
  subValue,
  icon: Icon,
  colorStyle,
  delay,
}: {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ElementType;
  colorStyle?: string;
  delay: number;
}) {
  return (
    <div
      className={`glass-card rounded-lg p-4 flex flex-col gap-2 ${delay === 0 ? "animate-fade-in" : delay === 1 ? "animate-fade-in-delay-1" : delay === 2 ? "animate-fade-in-delay-2" : "animate-fade-in-delay-3"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className="tabular-nums text-xl font-bold"
          style={colorStyle ? { color: colorStyle } : undefined}
        >
          {value}
        </span>
        {subValue && (
          <span
            className="tabular-nums text-xs font-medium"
            style={colorStyle ? { color: colorStyle } : undefined}
          >
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
}

export function KPICards({
  totalValue,
  dayChange,
  dayChangePct,
  totalGainLoss,
  totalGainLossPct,
  holdingsCount,
  bestPerformer,
}: KPICardsProps) {
  const dayPositive = dayChange >= 0;
  const gainPositive = totalGainLoss >= 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 px-6">
      <KPICard
        label="Total Value"
        value={formatCurrency(totalValue)}
        icon={BarChart3}
        colorStyle="hsl(var(--color-cyan))"
        delay={0}
      />
      <KPICard
        label="Day Change"
        value={formatSignedCurrency(dayChange)}
        subValue={`${dayPositive ? "+" : ""}${dayChangePct.toFixed(2)}%`}
        icon={dayPositive ? TrendingUp : TrendingDown}
        colorStyle={dayPositive ? "hsl(var(--color-profit))" : "hsl(var(--color-loss))"}
        delay={1}
      />
      <KPICard
        label="Total Gain/Loss"
        value={formatSignedCurrency(totalGainLoss)}
        subValue={`${gainPositive ? "+" : ""}${totalGainLossPct.toFixed(2)}%`}
        icon={gainPositive ? TrendingUp : TrendingDown}
        colorStyle={gainPositive ? "hsl(var(--color-profit))" : "hsl(var(--color-loss))"}
        delay={2}
      />
      <KPICard
        label="Holdings"
        value={`${holdingsCount} positions`}
        icon={Layers}
        delay={2}
      />
      <KPICard
        label="Best Performer"
        value={bestPerformer ? bestPerformer.ticker : "—"}
        subValue={bestPerformer ? `+${bestPerformer.gainLossPct.toFixed(2)}%` : undefined}
        icon={Award}
        colorStyle="hsl(var(--color-profit))"
        delay={3}
      />
    </div>
  );
}
