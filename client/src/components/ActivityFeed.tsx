import { useMemo } from "react";
import type { Holding } from "@shared/schema";
import { format, subDays } from "date-fns";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface ActivityFeedProps {
  holdings: Holding[];
}

interface Activity {
  id: string;
  type: "buy" | "sell";
  ticker: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  date: Date;
}

export function ActivityFeed({ holdings }: ActivityFeedProps) {
  const activities = useMemo(() => {
    const items: Activity[] = holdings.map((h, i) => ({
      id: h.id,
      type: "buy" as const,
      ticker: h.ticker,
      name: h.name,
      quantity: h.quantity,
      price: h.costBasis / h.quantity,
      total: h.costBasis,
      date: subDays(new Date(), Math.floor(Math.random() * 90) + 1),
    }));

    return items.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 8);
  }, [holdings]);

  return (
    <div className="glass-card rounded-lg p-4 animate-fade-in-delay-3">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
            style={{ borderColor: "hsl(var(--border) / 0.2)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: a.type === "buy" ? "hsl(var(--color-profit) / 0.15)" : "hsl(var(--color-loss) / 0.15)",
                }}
              >
                {a.type === "buy" ? (
                  <ArrowDownLeft className="h-3.5 w-3.5" style={{ color: "hsl(var(--color-profit))" }} />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5" style={{ color: "hsl(var(--color-loss))" }} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-foreground">{a.type === "buy" ? "Buy" : "Sell"}</span>
                  <span className="text-xs font-medium" style={{ color: "hsl(var(--color-cyan))" }}>{a.ticker}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {a.quantity} shares @ {formatCurrency(a.price)}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="tabular-nums text-xs font-medium text-foreground block">
                {formatCurrency(a.total)}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {format(a.date, "MMM dd, yyyy")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
