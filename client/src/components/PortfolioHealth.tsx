import { useMemo } from "react";
import { useHoldings, useSummary } from "@/hooks/use-portfolio";
import type { Holding } from "@shared/schema";

const EXCLUSION_LIST = ["BMNR", "UP", "MP", "CLSK", "NBIS", "AMD", "TE", "IREN", "IBIT"];

interface RuleCheck {
  label: string;
  value: string;
  status: "PASS" | "FAIL" | "WARN";
}

const STATUS_COLORS: Record<string, string> = {
  PASS: "#00E6A8",
  FAIL: "#FF4458",
  WARN: "#F0883E",
};

function computeHealthChecks(holdings: Holding[], totalValue: number): RuleCheck[] {
  const checks: RuleCheck[] = [];
  const count = holdings.length;

  // 1. Position Count: 4–8
  checks.push({
    label: "Position Count",
    value: `${count}`,
    status: count >= 4 && count <= 8 ? "PASS" : count === 3 || count === 9 ? "WARN" : "FAIL",
  });

  // 2. Max Single Position <25%
  const maxPosPct = totalValue > 0
    ? Math.max(...holdings.map(h => (h.value / totalValue) * 100), 0)
    : 0;
  checks.push({
    label: "Max Position",
    value: `${maxPosPct.toFixed(1)}%`,
    status: maxPosPct >= 25 ? "FAIL" : maxPosPct >= 20 ? "WARN" : "PASS",
  });

  // 3. Max Sector Exposure <40%
  const sectorMap: Record<string, number> = {};
  holdings.forEach(h => {
    const s = h.sector || "Other";
    sectorMap[s] = (sectorMap[s] || 0) + h.value;
  });
  const maxSectorPct = totalValue > 0
    ? Math.max(...Object.values(sectorMap).map(v => (v / totalValue) * 100), 0)
    : 0;
  checks.push({
    label: "Max Sector",
    value: `${maxSectorPct.toFixed(1)}%`,
    status: maxSectorPct >= 40 ? "FAIL" : maxSectorPct >= 35 ? "WARN" : "PASS",
  });

  // 4. Mega Cap Exposure <30% (type-based heuristic: mega caps are >$200B, we approximate via holdings data)
  // Since we don't have market cap data in holdings, we check if any holding's type hints at mega cap
  // For now, we'll mark any holding with "mega" in its sector/type or known mega-cap tickers
  // This is a best-effort check — in production you'd use live market cap data
  const megaCapTickers = new Set(["AAPL", "MSFT", "GOOGL", "GOOG", "AMZN", "NVDA", "META", "TSLA", "BRK.B", "JPM", "V", "UNH", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "AVGO", "LLY", "COST", "NFLX", "ADBE", "CRM", "ORCL", "CSCO", "PEP", "TMO", "ACN", "ABT"]);
  const megaCapValue = holdings
    .filter(h => megaCapTickers.has(h.ticker))
    .reduce((sum, h) => sum + h.value, 0);
  const megaCapPct = totalValue > 0 ? (megaCapValue / totalValue) * 100 : 0;
  checks.push({
    label: "Mega Cap",
    value: `${megaCapPct.toFixed(1)}%`,
    status: megaCapPct >= 30 ? "FAIL" : megaCapPct >= 25 ? "WARN" : "PASS",
  });

  // 5. Min Sectors: 3+
  const sectorCount = Object.keys(sectorMap).filter(s => s !== "Cash" && s !== "Other" || sectorMap[s] > 0).length;
  const uniqueRealSectors = new Set(holdings.filter(h => h.type !== "Cash").map(h => h.sector || "Other")).size;
  checks.push({
    label: "Min Sectors",
    value: `${uniqueRealSectors}`,
    status: uniqueRealSectors >= 3 ? "PASS" : uniqueRealSectors === 2 ? "WARN" : "FAIL",
  });

  // 6. Cash Reserve >5%
  const cashValue = holdings
    .filter(h => h.type === "Cash" || h.ticker === "CASH" || h.sector === "Cash")
    .reduce((sum, h) => sum + h.value, 0);
  const cashPct = totalValue > 0 ? (cashValue / totalValue) * 100 : 0;
  checks.push({
    label: "Cash Reserve",
    value: `${cashPct.toFixed(1)}%`,
    status: cashPct >= 5 ? "PASS" : cashPct >= 3 ? "WARN" : "FAIL",
  });

  // 7. No Excluded Tickers
  const excludedHeld = holdings.filter(h => EXCLUSION_LIST.includes(h.ticker));
  checks.push({
    label: "No Excluded",
    value: excludedHeld.length > 0 ? excludedHeld.map(h => h.ticker).join(",") : "CLEAR",
    status: excludedHeld.length === 0 ? "PASS" : "FAIL",
  });

  return checks;
}

export function PortfolioHealth({ portfolioId }: { portfolioId: string }) {
  const { data: holdings } = useHoldings(portfolioId || undefined);
  const { data: summary } = useSummary(portfolioId || undefined);

  const holdingsData = holdings ?? [];
  const totalValue = summary?.totalValue ?? 0;

  const checks = useMemo(() => computeHealthChecks(holdingsData, totalValue), [holdingsData, totalValue]);

  const passCount = checks.filter(c => c.status === "PASS").length;
  const healthScore = checks.length > 0 ? Math.round((passCount / checks.length) * 100) : 0;

  const scoreColor = healthScore >= 80 ? "#00E6A8" : healthScore >= 50 ? "#F0883E" : "#FF4458";

  return (
    <div
      style={{
        background: "#0D1117",
        border: "1px solid #1A2332",
        padding: "8px 10px",
        overflow: "auto",
        height: "100%",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "#8B949E",
          }}
        >
          Portfolio Health
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontVariantNumeric: "tabular-nums",
              fontSize: 16,
              fontWeight: 700,
              color: scoreColor,
              lineHeight: 1,
            }}
          >
            {healthScore}
          </span>
          <span
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: scoreColor,
              textTransform: "uppercase",
              letterSpacing: 1,
              opacity: 0.8,
            }}
          >
            %
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ height: 2, background: "#1A2332", borderRadius: 1, marginBottom: 10 }}>
        <div
          style={{
            height: "100%",
            width: `${healthScore}%`,
            background: scoreColor,
            borderRadius: 1,
            transition: "width 0.5s ease",
          }}
        />
      </div>

      {/* Rules grid — 2 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4px 8px",
        }}
      >
        {checks.map((check) => (
          <div
            key={check.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "3px 6px",
              background: "#080C14",
              borderRadius: 2,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#8B949E",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginRight: 4,
              }}
            >
              {check.label}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: 9,
                  fontWeight: 600,
                  color: STATUS_COLORS[check.status],
                }}
              >
                {check.value}
              </span>
              <span
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  color: STATUS_COLORS[check.status],
                  opacity: 0.9,
                }}
              >
                {check.status === "PASS" ? "✓" : check.status === "FAIL" ? "✗" : "!"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
