# MAPO Terminal V2 — Full Bloomberg Rebuild Specification

## Reference Layout Analysis

The reference screenshot shows a dense, information-packed Bloomberg-style terminal with a **4-column grid layout** that fills the entire viewport with NO whitespace. Every pixel is used.

### Overall Structure (top to bottom):

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | PORTFOLIO VALUE $62,825.55 | 1D 5D 1M 6M 1Y changes | TOTAL    │
│         MAPO TERMINAL  -$31.66 today      │ -0.1% -0.4% -2.8% +5.5% +21.2%   │
│                                            │ RETURN +55.0% | SENTIMENT | LIVE  │
│                                            │ $21,642.97    | UNCERTAIN | 9:35PM│
│                                            │               |           | MARKET │
│                                            │               |           | CLOSED │
├─────────────────────────────────────────────────────────────────────────────────┤
│ MARKETS TAPE: XOM 148.12 -1.54% | BRK-B 494.14 -0.62% | MA 514.72 -0.58% ... │
├──────────────┬──────────────────┬─────────────────────┬─────────────────────────┤
│ HOLDINGS     │ PORTFOLIO vs S&P │ RISK ANALYSIS       │ RISK SUGGESTIONS        │
│ 16 POSITIONS │ 500 (1Y PERF)    │ ┌────────┬────────┐ │ ┌───────────────────┐   │
│              │                  │ │W.Vol   │Max DD  │ │ │🔴 High US Equity  │   │
│ TICKER PRICE │ Line chart with  │ │8.8%    │3.1%   │ │ │  Concentration     │   │
│ CHG CHG% AL% │ portfolio (cyan) │ ├────────┼────────┤ │ │  SCHB (43%)...    │   │
│              │ vs S&P (orange/  │ │Top Con │Beta   │ │ ├───────────────────┤   │
│ IBIT  40.07  │ dotted)          │ │52%     │0.78   │ │ │🔴 Emerging Market │   │
│ IREN  41.98  │                  │ ├────────┼────────┤ │ │  Overlap          │   │
│ NBIS 112.00  │                  │ │Sharpe  │Sortino│ │ │  VWO+IEMG...     │   │
│ STRL 420.60  │                  │ │1.42    │1.68   │ │ ├───────────────────┤   │
│ AMD  204.83  │                  │ └────────┴────────┘ │ │🔴 Limited Fixed   │   │
│ TE     8.14  │                  │                     │ │  Income Buffer    │   │
│ COHR 251.41  ├──────────────────┤                     │ │  Bonds only 10%  │   │
│ VELO  13.98  │ ASSET ALLOCATION │                     │ └───────────────────┘   │
│ DLO   12.01  │ ┌──────────────┐ │                     │                         │
│ SMCI  31.79  │ │  Donut Chart │ │                     │                         │
│ INDI   2.59  │ │  with legend │ │                     ├─────────────────────────┤
│ HIMS  25.88  │ └──────────────┘ │                     │ TOP MOVERS TODAY        │
│ CLSK   9.81  ├──────────────────┤                     │ ┌─────────┬─────────┐   │
│ VST  159.16  │ CORRELATION      │ VOLATILITY          │ │▲ GAINER │▲ GAINER │   │
│ ELF   79.95  │ MATRIX           │ (Annualized)        │ │ NBIS    │ HIMS    │   │
│              │ Heatmap grid     │ Per-ticker bars      │ │+16.14%  │+10.27%  │   │
├──────────────┤ with values      │ IBIT ████ 48.6%     │ │52W range│52W range│   │
│ EARNINGS     │                  │ IREN ███ 35.2%      │ ├─────────┼─────────┤   │
│ CALENDAR     │                  │ NBIS ██ 28.4%       │ │▼ LOSER  │▼ LOSER  │   │
│              │                  │ STRL █ 25.1%        │ │ COHR    │ VST     │   │
│ Upcoming     │                  │ AMD  █ 22.3%        │ │-3.54%   │-3.19%   │   │
│ earnings for │                  │ ...                  │ │52W range│52W range│   │
│ holdings     │                  │                     │ └─────────┴─────────┘   │
├──────────────┴──────────────────┴─────────────────────┴─────────────────────────┤
│ NEWS: 🟢 Analyst calls... | AAPL Wedbush's Dan Ives... | SPY February nonfarm..│
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Design Details:

1. **Color scheme**: Deep navy (#0A0E1A), borders are subtle dark blue (#1A2332), text is light blue-gray, cyan (#00D9FF) for accents, red for losses, green for gains, orange/yellow for S&P line
2. **Typography**: All uppercase labels, monospaced numbers, very dense spacing (2-4px gaps)
3. **No padding waste**: Panels touch each other with 1px borders, no rounded corners (or very minimal)
4. **Information density**: ~15 distinct data panels visible simultaneously
5. **Every panel has a header bar** with title (left) and a badge/button (right, e.g. "13 POSITIONS", "1Y PERFORMANCE", "METRICS", "INTEL", "UPCOMING", "BREAKDOWN", "HEAT MAP", "ANNUALIZED", "DAILY")

## Portfolio Data (from Plaid)

Total Value: ~$62,825.55
Day Change: +$1,962.75 (+3.22%)
Total Cost Basis: ~$54,037
Total Gain/Loss: +$8,788.55 (+16.26%)

Holdings (16 positions at Charles Schwab):
- IBIT: 200 shares @ $40.07 = $8,014 (12.8%) — ETF/Crypto
- IREN: 150 shares @ $41.98 = $6,297 (10.0%) — Technology
- NBIS: 40 shares @ $112.00 = $4,480 (7.1%) — Technology
- STRL: 10 shares @ $420.60 = $4,206 (6.7%) — Industrials
- BIMI: 200 shares @ $21.03 = $4,206 (6.7%) — Technology
- AMD: 20 shares @ $204.83 = $4,097 (6.5%) — Technology
- TE: 500 shares @ $8.14 = $4,070 (6.5%) — Energy
- COHR: 15 shares @ $251.41 = $3,771 (6.0%) — Technology
- VELO: 250 shares @ $13.98 = $3,495 (5.6%) — Industrials
- DLO: 280 shares @ $12.01 = $3,363 (5.4%) — Financials
- SMCI: 100 shares @ $31.79 = $3,179 (5.1%) — Technology
- INDI: 1200 shares @ $2.59 = $3,108 (4.9%) — Technology
- HIMS: 120 shares @ $25.88 = $3,106 (4.9%) — Healthcare
- CLSK: 270 shares @ $9.81 = $2,649 (4.2%) — Technology
- VST: 15 shares @ $159.16 = $2,387 (3.8%) — Utilities
- ELF: 30 shares @ $79.95 = $2,399 (3.8%) — Consumer Disc.

### Sector Breakdown:
- Technology: 50.6%
- Crypto (IBIT): 12.8%
- Industrials: 12.3%
- Energy: 6.5%
- Financials: 5.4%
- Healthcare: 4.9%
- Consumer Discretionary: 3.8%
- Utilities: 3.8%

### Risk Metrics to calculate/display:
- Weighted Volatility: ~32% (high-beta portfolio)
- Max Drawdown (1Y): ~18%
- Top Concentration: IBIT at 12.8%
- Portfolio Beta: ~1.45 (growth/tech heavy)
- Sharpe Ratio: ~0.89
- Sortino Ratio: ~1.12

### Risk Suggestions (AI-generated):
1. "High Technology Concentration" — Tech (50.6%) dominates. Rebalance 10-15% into defensive sectors.
2. "Bitcoin ETF Overweight" — IBIT (12.8%) single-asset crypto exposure. Consider trimming to 5-8%.
3. "Limited Geographic Diversification" — 100% US equities. Add international ETFs (VXUS, EFA).

### Earnings Calendar (upcoming for holdings):
- AMD: Apr 29, Est EPS $0.94
- HIMS: May 5, Est EPS $0.18
- SMCI: Apr 29, Est EPS $0.48
- COHR: May 7, Est EPS $0.76
- ELF: May 14, Est EPS $0.32
- VST: May 1, Est EPS $1.18
- STRL: Apr 28, Est EPS $2.10
- IREN: May 15, Est EPS $0.12
- DLO: May 20, Est EPS $0.15

### Correlation Matrix (mock realistic values):
Use a 6x6 or 8x8 grid with the biggest holdings. Values range from -0.1 to 1.0.
Tech stocks correlate highly (0.7-0.9), IBIT is less correlated (0.2-0.4).

### Volatility (Annualized, mock realistic):
- IBIT: 52%
- IREN: 78%
- NBIS: 65%
- CLSK: 85%
- VELO: 72%
- INDI: 68%
- HIMS: 61%
- SMCI: 75%
- TE: 58%
- BIMI: 70%
- AMD: 42%
- COHR: 45%
- STRL: 38%
- DLO: 48%
- VST: 35%
- ELF: 40%

### Top Movers Today:
Gainers: NBIS +16.14%, VELO +12.83%
Losers: COHR -3.54%, VST -3.19%

### News Headlines (mock):
- "NBIS surges 16% on AI infrastructure deal with major cloud provider"
- "AMD holds above $200 on strong datacenter GPU demand outlook"
- "HIMS rallies 10% after FDA approval for new GLP-1 compounding"
- "Bitcoin holds steady near $83K as macro uncertainty persists"
- "SMCI announces new liquid cooling server line for AI workloads"
