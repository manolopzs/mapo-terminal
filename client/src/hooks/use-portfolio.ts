import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Holding, Portfolio, Trade, ChatMessage } from "@shared/schema";

const API_BASE = "";

interface PortfolioSummary {
  totalValue: number;
  dayChange: number;
  dayChangePct: number;
  totalGainLoss: number;
  totalGainLossPct: number;
  holdingsCount: number;
  totalCostBasis: number;
  bestPerformer: { ticker: string; gainLossPct: number } | null;
  worstPerformer: { ticker: string; gainLossPct: number } | null;
}

export function useHoldings(portfolioId?: string) {
  const url = portfolioId ? `/api/holdings?portfolioId=${portfolioId}` : "/api/holdings";
  return useQuery<Holding[]>({
    queryKey: ["/api/holdings", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch holdings");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function usePortfolios() {
  return useQuery<Portfolio[]>({
    queryKey: ["/api/portfolios"],
    refetchInterval: 30000,
  });
}

export function useSummary(portfolioId?: string) {
  const url = portfolioId ? `/api/summary?portfolioId=${portfolioId}` : "/api/summary";
  return useQuery<PortfolioSummary>({
    queryKey: ["/api/summary", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useCreateHolding() {
  return useMutation({
    mutationFn: async (data: Partial<Holding>) => {
      const res = await apiRequest("POST", "/api/holdings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"], exact: false });
    },
  });
}

export function useDeleteHolding() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/holdings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"], exact: false });
    },
  });
}

export function useCreatePortfolio() {
  return useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      const res = await apiRequest("POST", "/api/portfolios", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
    },
  });
}

export function useDeletePortfolio() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portfolios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolios"] });
    },
  });
}

export function useCreateTrade() {
  return useMutation({
    mutationFn: async (data: Partial<Trade>) => {
      const res = await apiRequest("POST", "/api/trades", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"], exact: false });
    },
  });
}

export function useUpdateHolding() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Holding> }) => {
      const res = await apiRequest("PUT", `/api/holdings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holdings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/summary"], exact: false });
    },
  });
}

export function useTrades(portfolioId?: string) {
  const url = portfolioId ? `/api/trades?portfolioId=${portfolioId}` : "/api/trades";
  return useQuery<Trade[]>({
    queryKey: ["/api/trades", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch trades");
      return res.json();
    },
    refetchInterval: 30000,
  });
}

export function useChatMessages(portfolioId?: string) {
  return useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", portfolioId],
    queryFn: async () => {
      if (!portfolioId) return [];
      const res = await fetch(`${API_BASE}/api/chat?portfolioId=${portfolioId}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      return res.json();
    },
    enabled: !!portfolioId,
  });
}

export function useSendChatMessage() {
  return useMutation({
    mutationFn: async (data: { portfolioId: string; message: string; model?: string }) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000);
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed (${res.status})`);
        }
        return res.json();
      } catch (err: any) {
        clearTimeout(timeout);
        if (err.name === "AbortError") throw new Error("Request timed out. Try a simpler question.");
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", variables.portfolioId] });
    },
  });
}

export function useClearChat() {
  return useMutation({
    mutationFn: async (portfolioId: string) => {
      await apiRequest("DELETE", `/api/chat?portfolioId=${portfolioId}`);
    },
    onSuccess: (_data, portfolioId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", portfolioId] });
    },
  });
}

// Live data hooks
export interface LiveQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  previousClose: number;
  dayLow: number;
  dayHigh: number;
  yearLow: number;
  yearHigh: number;
  volume: number;
  marketCap: number;
  marketStatus: string;
}

export function useLiveQuotes(portfolioId?: string) {
  const url = portfolioId ? `/api/live/quotes?portfolioId=${portfolioId}` : "/api/live/quotes";
  return useQuery<{ quotes: LiveQuote[]; updatedAt: string }>({
    queryKey: ["/api/live/quotes", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch live quotes");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000, // Auto-refresh every minute
  });
}

export interface EarningsEvent {
  ticker: string;
  date: string;
  time: string;
  fiscalPeriod: string;
  status: string;
}

export function useLiveEarnings(portfolioId?: string) {
  const url = portfolioId ? `/api/live/earnings?portfolioId=${portfolioId}` : "/api/live/earnings";
  return useQuery<EarningsEvent[]>({
    queryKey: ["/api/live/earnings", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch earnings");
      return res.json();
    },
    staleTime: 3_600_000, // 1 hour
  });
}

export interface MarketSentiment {
  sentiment: string;
  marketStatus: string;
}

export function useLiveSentiment() {
  return useQuery<MarketSentiment>({
    queryKey: ["/api/live/sentiment"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/live/sentiment`);
      if (!res.ok) throw new Error("Failed to fetch sentiment");
      return res.json();
    },
    staleTime: 300_000, // 5 minutes
  });
}

export interface NewsItem {
  ticker: string;
  headline: string;
  time: string;
  source: string;
}

export function useLiveNews(portfolioId?: string) {
  const url = portfolioId ? `/api/live/news?portfolioId=${portfolioId}` : "/api/live/news";
  return useQuery<NewsItem[]>({
    queryKey: ["/api/live/news", portfolioId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}${url}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    staleTime: 600_000, // 10 minutes
  });
}
