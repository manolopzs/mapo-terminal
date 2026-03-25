import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateHolding, usePortfolios } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";

export function AddPositionDialog() {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Stock");
  const [sector, setSector] = useState("Other");

  const { data: portfolios } = usePortfolios();
  const createHolding = useCreateHolding();
  const { toast } = useToast();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    const cost = parseFloat(costBasis);
    const prc = parseFloat(price) || cost / qty;
    const value = qty * prc;
    const gainLoss = value - cost;
    const gainLossPct = cost > 0 ? (gainLoss / cost) * 100 : 0;

    const portfolioId = portfolios?.[0]?.id;
    if (!portfolioId) {
      toast({ title: "Error", description: "No portfolio found", variant: "destructive" });
      return;
    }

    createHolding.mutate(
      {
        portfolioId,
        ticker: ticker.toUpperCase(),
        name,
        quantity: qty,
        costBasis: cost,
        price: prc,
        value,
        dayChange: 0,
        dayChangePct: 0,
        gainLoss,
        gainLossPct,
        type,
        sector,
        source: "manual",
      },
      {
        onSuccess: () => {
          toast({ title: "Position added", description: `${ticker.toUpperCase()} added to portfolio` });
          setOpen(false);
          resetForm();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to add position", variant: "destructive" });
        },
      }
    );
  }

  function resetForm() {
    setTicker("");
    setName("");
    setQuantity("");
    setCostBasis("");
    setPrice("");
    setType("Stock");
    setSector("Other");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="gap-1.5"
          style={{ background: "hsl(var(--color-cyan))", color: "hsl(var(--background))" }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Position
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border" style={{ borderColor: "hsl(var(--border) / 0.5)" }}>
        <DialogHeader>
          <DialogTitle className="text-foreground uppercase tracking-wider text-sm">
            Add Position
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Ticker</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="AAPL"
                required
                className="mt-1 bg-accent border-border/50 tabular-nums"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apple Inc."
                required
                className="mt-1 bg-accent border-border/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Quantity</Label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                required
                className="mt-1 bg-accent border-border/50 tabular-nums"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Total Cost</Label>
              <Input
                type="number"
                step="any"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                placeholder="15000"
                required
                className="mt-1 bg-accent border-border/50 tabular-nums"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Current Price</Label>
              <Input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="175.00"
                className="mt-1 bg-accent border-border/50 tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1 bg-accent border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Bond">Bond</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="mt-1 bg-accent border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financials">Financials</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Industrials">Industrials</SelectItem>
                  <SelectItem value="Consumer Discretionary">Consumer Discretionary</SelectItem>
                  <SelectItem value="Utilities">Utilities</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ background: "hsl(var(--color-cyan))", color: "hsl(var(--background))" }}
            disabled={createHolding.isPending}
          >
            {createHolding.isPending ? "Adding..." : "Add Position"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
