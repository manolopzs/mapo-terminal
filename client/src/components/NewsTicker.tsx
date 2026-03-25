import { useMemo } from "react";
import type { Holding } from "@shared/schema";
import type { NewsItem } from "@/hooks/use-portfolio";

interface NewsTickerProps {
  holdings: Holding[];
  liveNews?: NewsItem[];
}

// Fallback headlines when live news hasn't loaded yet
const FALLBACK_TEMPLATES = [
  { text: "surges on strong quarterly earnings beat", time: "2h ago" },
  { text: "holds above key support level on institutional buying", time: "3h ago" },
  { text: "rallies after FDA approval for new product", time: "4h ago" },
  { text: "announces new strategic partnership with major cloud provider", time: "5h ago" },
  { text: "holds steady near 52-week high as market sentiment improves", time: "6h ago" },
  { text: "dips on profit-taking after extended rally", time: "1h ago" },
  { text: "gains on analyst upgrade and raised price target", time: "2h ago" },
  { text: "trading higher on AI infrastructure demand outlook", time: "3h ago" },
];

export function NewsTicker({ holdings, liveNews }: NewsTickerProps) {
  const headlines = useMemo(() => {
    // Use live news if available
    if (liveNews && liveNews.length > 0) {
      return liveNews.map(n => ({
        source: n.ticker,
        text: n.headline,
        time: n.time,
      }));
    }

    // Fallback to template-based headlines
    if (holdings.length === 0) return [];
    return holdings.slice(0, 8).map((h, i) => ({
      source: h.ticker,
      text: FALLBACK_TEMPLATES[i % FALLBACK_TEMPLATES.length].text,
      time: FALLBACK_TEMPLATES[i % FALLBACK_TEMPLATES.length].time,
    }));
  }, [holdings, liveNews]);

  if (headlines.length === 0) return null;

  return (
    <div
      className="flex items-center flex-shrink-0 overflow-hidden"
      style={{
        height: 22,
        minHeight: 22,
        background: "#0A0E18",
        borderTop: "1px solid #1A2332",
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          background: "rgba(0, 217, 255, 0.1)",
          padding: "0 8px",
          height: "100%",
          borderRight: "1px solid #1A2332",
        }}
      >
        <span
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: "#00D9FF",
            letterSpacing: 1,
          }}
        >
          {liveNews && liveNews.length > 0 ? "LIVE NEWS" : "NEWS"}
        </span>
      </div>
      <div
        className="flex-1 overflow-hidden whitespace-nowrap"
        style={{ padding: "0 8px" }}
      >
        <div className="inline-flex animate-marquee items-center gap-6">
          {headlines.concat(headlines).map((h, i) => (
            <span key={i} className="inline-flex items-center gap-2" style={{ fontSize: 9 }}>
              <span
                className="font-mono"
                style={{ color: "#00D9FF", fontWeight: 600 }}
              >
                {h.source}
              </span>
              <span style={{ color: "#8B949E" }}>{h.text}</span>
              <span style={{ color: "#4A5568", fontSize: 8 }}>{h.time}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
