import { useState, useMemo } from "react";
import { useHoldings, useCreateTrade, useUpdateHolding, useDeleteHolding } from "@/hooks/use-portfolio";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LogTradeDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  portfolioId: string;
}

export function LogTradeDialog({ open, onOpenChange, portfolioId }: LogTradeDialogProps) {
  const [action, setAction] = useState<"BUY" | "SELL">("SELL");
  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState("");
  const [price, setPrice] = useState("");
  const [rationale, setRationale] = useState("");

  const { data: holdings } = useHoldings(portfolioId || undefined);
  const createTrade = useCreateTrade();
  const updateHolding = useUpdateHolding();
  const deleteHolding = useDeleteHolding();

  // Find matching holding for auto-fill and P&L calc
  const matchedHolding = useMemo(() => {
    if (!ticker || !holdings) return null;
    return holdings.find(h => h.ticker.toUpperCase() === ticker.toUpperCase());
  }, [ticker, holdings]);

  const sharesNum = parseFloat(shares) || 0;
  const priceNum = parseFloat(price) || 0;
  const total = sharesNum * priceNum;

  // Calculate P&L for sells
  const pnl = useMemo(() => {
    if (action !== "SELL" || !matchedHolding || sharesNum <= 0 || priceNum <= 0) return null;
    const avgCost = matchedHolding.costBasis / matchedHolding.quantity;
    return (priceNum - avgCost) * sharesNum;
  }, [action, matchedHolding, sharesNum, priceNum]);

  const maxShares = matchedHolding?.quantity ?? 0;
  const isFullExit = action === "SELL" && matchedHolding && sharesNum >= matchedHolding.quantity;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!portfolioId || sharesNum <= 0 || priceNum <= 0) return;

    const today = new Date().toISOString().split("T")[0];

    // Log the trade
    createTrade.mutate(
      {
        portfolioId,
        date: today,
        action,
        ticker: ticker.toUpperCase(),
        name: matchedHolding?.name || ticker.toUpperCase(),
        shares: sharesNum,
        price: priceNum,
        total,
        pnl: pnl ?? null,
        rationale: rationale || null,
      },
      {
        onSuccess: () => {
          // Update or remove the holding
          if (action === "SELL" && matchedHolding) {
            if (isFullExit) {
              // Full exit — remove holding
              deleteHolding.mutate(matchedHolding.id);
            } else {
              // Partial sell — reduce quantity and cost basis proportionally
              const newQty = matchedHolding.quantity - sharesNum;
              const costRatio = newQty / matchedHolding.quantity;
              const newCost = matchedHolding.costBasis * costRatio;
              const newValue = newQty * priceNum;
              updateHolding.mutate({
                id: matchedHolding.id,
                data: {
                  quantity: newQty,
                  costBasis: newCost,
                  value: newValue,
                  price: priceNum,
                  gainLoss: newValue - newCost,
                  gainLossPct: newCost > 0 ? ((newValue - newCost) / newCost) * 100 : 0,
                },
              });
            }
          }
          onOpenChange(false);
          resetForm();
        },
      }
    );
  }

  function resetForm() {
    setAction("SELL");
    setTicker("");
    setShares("");
    setPrice("");
    setRationale("");
  }

  // Sell-able holdings for quick select
  const sellableHoldings = (holdings ?? []).filter(h => h.type !== "Cash" && h.ticker !== "CASH");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "#0D1117",
          border: "1px solid #1A2332",
          borderRadius: 4,
          maxWidth: 440,
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              color: "#C9D1D9",
            }}
          >
            Log Trade
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Action toggle */}
          <div className="flex gap-2">
            {(["BUY", "SELL"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAction(a)}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  border: `1px solid ${action === a ? (a === "BUY" ? "#00E6A8" : "#FF4458") : "#1A2332"}`,
                  borderRadius: 2,
                  background: action === a ? (a === "BUY" ? "rgba(0,230,168,0.1)" : "rgba(255,68,88,0.1)") : "#080C14",
                  color: action === a ? (a === "BUY" ? "#00E6A8" : "#FF4458") : "#8B949E",
                  cursor: "pointer",
                }}
              >
                {a}
              </button>
            ))}
          </div>

          {/* Quick select from holdings (for SELL) */}
          {action === "SELL" && sellableHoldings.length > 0 && (
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Select Position
              </Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {sellableHoldings.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setTicker(h.ticker);
                      setShares(String(h.quantity));
                      setPrice(String(h.price.toFixed(2)));
                    }}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: "2px 6px",
                      borderRadius: 2,
                      border: `1px solid ${ticker.toUpperCase() === h.ticker ? "#00D9FF" : "#1A2332"}`,
                      background: ticker.toUpperCase() === h.ticker ? "rgba(0,217,255,0.1)" : "#080C14",
                      color: ticker.toUpperCase() === h.ticker ? "#00D9FF" : "#8B949E",
                      cursor: "pointer",
                    }}
                  >
                    {h.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ticker + Shares + Price */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Ticker</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="STRL"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Shares{action === "SELL" && maxShares > 0 ? ` (max ${maxShares})` : ""}
              </Label>
              <Input
                type="number"
                step="any"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="10"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Price</Label>
              <Input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="450.00"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
          </div>

          {/* Rationale */}
          <div>
            <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Rationale (optional)</Label>
            <Input
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Taking profits / thesis broken / rebalancing..."
              className="mt-1"
              style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 10 }}
            />
          </div>

          {/* Summary */}
          {sharesNum > 0 && priceNum > 0 && (
            <div
              style={{
                background: "#080C14",
                border: "1px solid #1A2332",
                borderRadius: 2,
                padding: "6px 8px",
              }}
            >
              <div className="flex justify-between" style={{ fontSize: 9, marginBottom: 2 }}>
                <span style={{ color: "#8B949E" }}>TOTAL</span>
                <span className="font-mono tabular-nums" style={{ color: "#C9D1D9", fontWeight: 600 }}>
                  ${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {pnl !== null && (
                <div className="flex justify-between" style={{ fontSize: 9 }}>
                  <span style={{ color: "#8B949E" }}>REALIZED P&L</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: pnl >= 0 ? "#00E6A8" : "#FF4458", fontWeight: 700 }}
                  >
                    {pnl >= 0 ? "+" : ""}${Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {isFullExit && (
                <div style={{ fontSize: 8, color: "#F0883E", marginTop: 4 }}>
                  FULL EXIT — position will be removed from holdings
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createTrade.isPending || sharesNum <= 0 || priceNum <= 0}
            style={{
              background: action === "BUY" ? "#00E6A8" : "#FF4458",
              color: "#080C14",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {createTrade.isPending ? "Logging..." : `Log ${action} — ${ticker.toUpperCase() || "..."}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
