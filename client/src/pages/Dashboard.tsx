import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { TickerTape } from "@/components/TickerTape";
import { HoldingsTable } from "@/components/HoldingsTable";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AssetAllocation } from "@/components/AssetAllocation";
import { RiskAnalysis } from "@/components/RiskAnalysis";
import { RiskSuggestions } from "@/components/RiskSuggestions";
import { PortfolioHealth } from "@/components/PortfolioHealth";
import { DrawdownMonitor } from "@/components/DrawdownMonitor";
import { EarningsCalendar } from "@/components/EarningsCalendar";
import { CorrelationMatrix } from "@/components/CorrelationMatrix";
import { VolatilityBars } from "@/components/VolatilityBars";
import { TopMovers } from "@/components/TopMovers";
import { NewsTicker } from "@/components/NewsTicker";
import { TerminalSidebar } from "@/components/TerminalSidebar";
import { TradeHistory } from "@/components/TradeHistory";
import { AIAnalyst } from "@/components/AIAnalyst";
import { AddPositionDialog } from "@/components/AddPositionDialog";
import { useHoldings, usePortfolios, useSummary, useLiveQuotes, useLiveEarnings, useLiveSentiment, useLiveNews } from "@/hooks/use-portfolio";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Bot } from "lucide-react";

export default function Dashboard() {
  const [activePortfolioId, setActivePortfolioId] = useState<string>("");
  const [addPositionOpen, setAddPositionOpen] = useState(false);
  const [analystOpen, setAnalystOpen] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Safety timeout: if loading takes >8s, show dashboard anyway
  useEffect(() => {
    const timer = setTimeout(() => setLoadingTimeout(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const { data: portfolios, isLoading: portfoliosLoading, isError: portfoliosError } = usePortfolios();

  // Auto-select first portfolio when portfolios load (or when active one is deleted)
  useEffect(() => {
    if (portfolios && portfolios.length > 0) {
      if (!activePortfolioId || !portfolios.find((p) => p.id === activePortfolioId)) {
        setActivePortfolioId(portfolios[0].id);
      }
    }
  }, [portfolios, activePortfolioId]);

  // If loading timed out but we still have no portfolio, set a fallback
  useEffect(() => {
    if (loadingTimeout && !activePortfolioId && portfoliosError) {
      setActivePortfolioId("fallback");
    }
  }, [loadingTimeout, activePortfolioId, portfoliosError]);

  const { data: holdings, isLoading: holdingsLoading, isError: holdingsError } = useHoldings(activePortfolioId || undefined);
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useSummary(activePortfolioId || undefined);

  // Live data — triggers server-side price updates + caches
  const { data: liveQuotesData } = useLiveQuotes(activePortfolioId || undefined);
  const { data: liveEarnings } = useLiveEarnings(activePortfolioId || undefined);
  const { data: liveSentiment } = useLiveSentiment();
  const { data: liveNews } = useLiveNews(activePortfolioId || undefined);

  // When live quotes arrive, refetch holdings & summary to get updated prices
  const liveUpdatedAt = liveQuotesData?.updatedAt;
  useEffect(() => {
    if (liveUpdatedAt) {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"], exact: false });
    }
  }, [liveUpdatedAt]);

  // Only block on initial portfolio load — errors should not block rendering
  // After 8s timeout, force-show the dashboard even if data hasn't arrived
  const stillLoading = portfoliosLoading || (!holdingsError && holdingsLoading) || (!summaryError && summaryLoading);
  const shouldShowLoader = !loadingTimeout && stillLoading && !activePortfolioId;
  if (shouldShowLoader) {
    return (
      <div
        className="h-screen w-screen flex items-center justify-center"
        style={{ background: "#080C14" }}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#00D9FF" }} />
          <span
            style={{
              fontSize: 11,
              color: "#8B949E",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            Initializing terminal...
          </span>
          <span
            style={{
              fontSize: 9,
              color: "#484F58",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 4,
            }}
          >
            Connecting to market data
          </span>
        </div>
      </div>
    );
  }

  const holdingsData = holdings ?? [];
  const totalValue = summary?.totalValue ?? 0;

  return (
    <div
      className="h-screen w-screen flex overflow-hidden"
      style={{ background: "#080C14" }}
    >
      {/* Sidebar */}
      <TerminalSidebar
        activePortfolioId={activePortfolioId}
        onSelectPortfolio={setActivePortfolioId}
        onAddPosition={() => setAddPositionOpen(true)}
      />

      {/* Main terminal area */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
        {/* Header bar */}
        <Header portfolioId={activePortfolioId} liveSentiment={liveSentiment} liveQuotes={liveQuotesData} />

        {/* Markets ticker tape */}
        <TickerTape />

        {/* 4-column grid — fills remaining space */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1.4fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 0,
            minHeight: 0,
          }}
        >
          {/* Col 1, Row 1: Holdings */}
          <div className="flex flex-col" style={{ borderRight: "1px solid #1A2332", overflow: "auto" }}>
            <HoldingsTable holdings={holdingsData} totalValue={totalValue} />
          </div>

          {/* Col 2, Row 1: Performance Chart */}
          <div className="flex flex-col" style={{ borderRight: "1px solid #1A2332", overflow: "hidden" }}>
            <PerformanceChart portfolioId={activePortfolioId} />
          </div>

          {/* Col 3, Row 1: Risk Analysis */}
          <div className="flex flex-col" style={{ borderRight: "1px solid #1A2332", overflow: "auto" }}>
            <RiskAnalysis holdings={holdingsData} />
          </div>

          {/* Col 4, Row 1: Portfolio Health + Risk Suggestions */}
          <div className="flex flex-col" style={{ overflow: "hidden" }}>
            <div style={{ flex: "0 0 auto", maxHeight: "45%", overflow: "auto" }}>
              <PortfolioHealth portfolioId={activePortfolioId} />
            </div>
            <div style={{ flex: 1, overflow: "auto", borderTop: "1px solid #1A2332", minHeight: 0 }}>
              <RiskSuggestions holdings={holdingsData} />
            </div>
          </div>

          {/* Col 1, Row 2: Trade History + Drawdown Monitor */}
          <div className="flex flex-col" style={{ borderRight: "1px solid #1A2332", borderTop: "1px solid #1A2332", overflow: "hidden" }}>
            <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
              <TradeHistory portfolioId={activePortfolioId} />
            </div>
            <div style={{ flex: "0 0 auto", maxHeight: "45%", overflow: "auto", borderTop: "1px solid #1A2332" }}>
              <DrawdownMonitor portfolioId={activePortfolioId} />
            </div>
          </div>

          {/* Col 2, Row 2: Asset Allocation + Correlation Matrix */}
          <div
            className="flex flex-col"
            style={{ borderRight: "1px solid #1A2332", borderTop: "1px solid #1A2332", overflow: "auto" }}
          >
            <AssetAllocation holdings={holdingsData} />
            <CorrelationMatrix holdings={holdingsData} />
          </div>

          {/* Col 3, Row 2: Volatility + Earnings Calendar */}
          <div className="flex flex-col" style={{ borderRight: "1px solid #1A2332", borderTop: "1px solid #1A2332", overflow: "hidden" }}>
            <div className="flex-1" style={{ minHeight: 0, overflow: "auto" }}>
              <VolatilityBars holdings={holdingsData} />
            </div>
            <div className="flex-1" style={{ borderTop: "1px solid #1A2332", minHeight: 0, overflow: "auto" }}>
              <EarningsCalendar holdings={holdingsData} liveEarnings={liveEarnings} />
            </div>
          </div>

          {/* Col 4, Row 2: Top Movers */}
          <div className="flex flex-col" style={{ borderTop: "1px solid #1A2332", overflow: "auto" }}>
            <TopMovers holdings={holdingsData} />
          </div>
        </div>

        {/* News ticker at bottom */}
        <NewsTicker holdings={holdingsData} liveNews={liveNews} />
      </div>

      {/* AI Analyst FAB */}
      <button
        onClick={() => setAnalystOpen(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: 14,
          background: "linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,217,255,0.25)",
          border: "none",
          cursor: "pointer",
          zIndex: 90,
          transition: "all 0.2s ease",
          opacity: analystOpen ? 0 : 1,
          pointerEvents: analystOpen ? "none" : "auto",
          transform: analystOpen ? "scale(0.8)" : "scale(1)",
        }}
        onMouseEnter={(e) => {
          if (!analystOpen) e.currentTarget.style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          if (!analystOpen) e.currentTarget.style.transform = "scale(1)";
        }}
        data-testid="button-open-analyst"
      >
        <Bot size={22} color="#fff" />
      </button>

      {/* AI Analyst Panel */}
      <AIAnalyst
        portfolioId={activePortfolioId}
        open={analystOpen}
        onClose={() => setAnalystOpen(false)}
      />

      {/* Add Position Dialog (controlled by sidebar) */}
      <AddPositionDialogControlled
        open={addPositionOpen}
        onOpenChange={setAddPositionOpen}
        activePortfolioId={activePortfolioId}
      />
    </div>
  );
}

/* Controlled version of AddPositionDialog that takes open/onOpenChange props */
import { useCreateHolding } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

function AddPositionDialogControlled({
  open,
  onOpenChange,
  activePortfolioId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  activePortfolioId: string;
}) {
  const [ticker, setTicker] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costBasis, setCostBasis] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("Stock");
  const [sector, setSector] = useState("Other");

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

    const portfolioId = activePortfolioId;
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
          onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{
          background: "#0D1117",
          border: "1px solid #1A2332",
          borderRadius: 4,
          maxWidth: 420,
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
            Add Position
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Ticker</Label>
              <Input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="AAPL"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Apple Inc."
                required
                className="mt-1"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Quantity</Label>
              <Input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Total Cost</Label>
              <Input
                type="number"
                step="any"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                placeholder="15000"
                required
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Current Price</Label>
              <Input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="175.00"
                className="mt-1 font-mono"
                style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 11 }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1" style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 10 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "#0D1117", border: "1px solid #1A2332" }}>
                  <SelectItem value="Stock">Stock</SelectItem>
                  <SelectItem value="ETF">ETF</SelectItem>
                  <SelectItem value="Crypto">Crypto</SelectItem>
                  <SelectItem value="Bond">Bond</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label style={{ fontSize: 8, color: "#8B949E", textTransform: "uppercase", letterSpacing: 0.8 }}>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="mt-1" style={{ background: "#080C14", border: "1px solid #1A2332", color: "#C9D1D9", fontSize: 10 }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: "#0D1117", border: "1px solid #1A2332" }}>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financials">Financials</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Industrials">Industrials</SelectItem>
                  <SelectItem value="Consumer Discretionary">Consumer Disc.</SelectItem>
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
            style={{
              background: "#00D9FF",
              color: "#080C14",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
            disabled={createHolding.isPending}
          >
            {createHolding.isPending ? "Adding..." : "Add Position"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
