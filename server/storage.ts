import {
  type Portfolio, type InsertPortfolio,
  type Holding, type InsertHolding,
  type Trade, type InsertTrade,
  type ChatMessage, type InsertChatMessage,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { join } from "path";

export interface IStorage {
  getPortfolios(): Promise<Portfolio[]>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  deletePortfolio(id: string): Promise<boolean>;
  getHoldings(portfolioId?: string): Promise<Holding[]>;
  getHolding(id: string): Promise<Holding | undefined>;
  createHolding(holding: InsertHolding): Promise<Holding>;
  updateHolding(id: string, holding: Partial<InsertHolding>): Promise<Holding | undefined>;
  deleteHolding(id: string): Promise<boolean>;
  getTrades(portfolioId?: string): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  getChatMessages(portfolioId: string): Promise<ChatMessage[]>;
  createChatMessage(msg: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(portfolioId: string): Promise<void>;
  getPortfolioSummary(portfolioId?: string): Promise<{
    totalValue: number;
    dayChange: number;
    dayChangePct: number;
    totalGainLoss: number;
    totalGainLossPct: number;
    holdingsCount: number;
    totalCostBasis: number;
    bestPerformer: { ticker: string; gainLossPct: number } | null;
    worstPerformer: { ticker: string; gainLossPct: number } | null;
  }>;
}

export class MemStorage implements IStorage {
  private portfolios: Map<string, Portfolio>;
  private holdings: Map<string, Holding>;
  private trades: Map<string, Trade>;
  private chatMessages: Map<string, ChatMessage>;
  public portfolioMeta: Map<string, { cash: number; startingCapital: number }>;

  constructor() {
    this.portfolios = new Map();
    this.holdings = new Map();
    this.trades = new Map();
    this.chatMessages = new Map();
    this.portfolioMeta = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed Charles Schwab (Plaid data)
    try {
      const dataPath = join(process.cwd(), "portfolio-data.json");
      const raw = readFileSync(dataPath, "utf-8");
      const data = JSON.parse(raw);

      const portfolioId = randomUUID();
      const portfolio: Portfolio = {
        id: portfolioId,
        name: data.institution || "Charles Schwab",
        type: "brokerage",
      };
      this.portfolios.set(portfolioId, portfolio);

      for (const h of data.holdings) {
        const holdingId = randomUUID();
        const holding: Holding = {
          id: holdingId,
          portfolioId,
          ticker: h.ticker,
          name: h.name,
          quantity: h.quantity,
          costBasis: h.costBasis,
          price: h.price,
          value: h.value,
          dayChange: h.dayChange ?? 0,
          dayChangePct: h.dayChangePct ?? 0,
          gainLoss: h.gainLoss ?? 0,
          gainLossPct: h.gainLossPct ?? 0,
          type: h.type,
          sector: h.sector ?? "Other",
          source: "manual",
        };
        this.holdings.set(holdingId, holding);
      }
    } catch (e) {
      console.error("Failed to seed Schwab portfolio data:", e);
    }

    // Seed Mapo AI Portfolio
    try {
      const mapoPath = join(process.cwd(), "mapo-ai-portfolio.json");
      const mapoRaw = readFileSync(mapoPath, "utf-8");
      const mapoData = JSON.parse(mapoRaw);

      const mapoId = randomUUID();
      const mapoPortfolio: Portfolio = {
        id: mapoId,
        name: mapoData.name || "Mapo AI Portfolio",
        type: mapoData.type || "custom",
      };
      this.portfolios.set(mapoId, mapoPortfolio);
      this.portfolioMeta.set(mapoId, {
        cash: 277.49,
        startingCapital: mapoData.startingCapital || 20454.16,
      });

      for (const h of mapoData.holdings) {
        const holdingId = randomUUID();
        const holding: Holding = {
          id: holdingId,
          portfolioId: mapoId,
          ticker: h.ticker,
          name: h.name,
          quantity: h.quantity,
          costBasis: h.costBasis,
          price: h.price,
          value: h.value,
          dayChange: h.dayChange ?? 0,
          dayChangePct: h.dayChangePct ?? 0,
          gainLoss: h.gainLoss ?? 0,
          gainLossPct: h.gainLossPct ?? 0,
          type: h.type,
          sector: h.sector ?? "Other",
          source: "manual",
        };
        this.holdings.set(holdingId, holding);
      }

      // Seed trade history for Mapo AI Portfolio
      if (mapoData.trades) {
        for (const t of mapoData.trades) {
          const tradeId = randomUUID();
          const trade: Trade = {
            id: tradeId,
            portfolioId: mapoId,
            date: t.date,
            action: t.action,
            ticker: t.ticker,
            name: t.name,
            shares: t.shares,
            price: t.price,
            total: t.total,
            pnl: t.pnl ?? null,
            rationale: t.rationale ?? null,
          };
          this.trades.set(tradeId, trade);
        }
      }
    } catch (e) {
      console.error("Failed to seed Mapo AI portfolio data:", e);
    }
  }

  async getPortfolios(): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values());
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolio: Portfolio = { id, ...insertPortfolio };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async deletePortfolio(id: string): Promise<boolean> {
    const deleted = this.portfolios.delete(id);
    if (deleted) {
      const toDelete: string[] = [];
      this.holdings.forEach((h, hId) => {
        if (h.portfolioId === id) toDelete.push(hId);
      });
      toDelete.forEach((hId) => this.holdings.delete(hId));
      // Also delete trades
      const tradesToDelete: string[] = [];
      this.trades.forEach((t, tId) => {
        if (t.portfolioId === id) tradesToDelete.push(tId);
      });
      tradesToDelete.forEach((tId) => this.trades.delete(tId));
      // Also delete chat messages
      const chatToDelete: string[] = [];
      this.chatMessages.forEach((m, mId) => {
        if (m.portfolioId === id) chatToDelete.push(mId);
      });
      chatToDelete.forEach((mId) => this.chatMessages.delete(mId));
    }
    return deleted;
  }

  async getHoldings(portfolioId?: string): Promise<Holding[]> {
    const all = Array.from(this.holdings.values());
    if (portfolioId) return all.filter((h) => h.portfolioId === portfolioId);
    return all;
  }

  async getHolding(id: string): Promise<Holding | undefined> {
    return this.holdings.get(id);
  }

  async createHolding(insertHolding: InsertHolding): Promise<Holding> {
    const id = randomUUID();
    const holding: Holding = {
      id,
      ...insertHolding,
      dayChange: insertHolding.dayChange ?? 0,
      dayChangePct: insertHolding.dayChangePct ?? 0,
      gainLoss: insertHolding.gainLoss ?? 0,
      gainLossPct: insertHolding.gainLossPct ?? 0,
      sector: insertHolding.sector ?? "Other",
      source: insertHolding.source ?? "manual",
    };
    this.holdings.set(id, holding);
    return holding;
  }

  async updateHolding(id: string, updates: Partial<InsertHolding>): Promise<Holding | undefined> {
    const existing = this.holdings.get(id);
    if (!existing) return undefined;
    const updated: Holding = { ...existing, ...updates, id };
    this.holdings.set(id, updated);
    return updated;
  }

  async deleteHolding(id: string): Promise<boolean> {
    return this.holdings.delete(id);
  }

  async getTrades(portfolioId?: string): Promise<Trade[]> {
    const all = Array.from(this.trades.values());
    if (portfolioId) return all.filter((t) => t.portfolioId === portfolioId);
    return all.sort((a, b) => b.date.localeCompare(a.date));
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = randomUUID();
    const trade: Trade = {
      id,
      ...insertTrade,
      pnl: insertTrade.pnl ?? null,
      rationale: insertTrade.rationale ?? null,
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getChatMessages(portfolioId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((m) => m.portfolioId === portfolioId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async createChatMessage(msg: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = { id, ...msg };
    this.chatMessages.set(id, message);
    return message;
  }

  async clearChatMessages(portfolioId: string): Promise<void> {
    const toDelete: string[] = [];
    this.chatMessages.forEach((m, mId) => {
      if (m.portfolioId === portfolioId) toDelete.push(mId);
    });
    toDelete.forEach((mId) => this.chatMessages.delete(mId));
  }

  async getPortfolioSummary(portfolioId?: string) {
    let allHoldings = Array.from(this.holdings.values());
    if (portfolioId) allHoldings = allHoldings.filter((h) => h.portfolioId === portfolioId);
    const holdingsValue = allHoldings.reduce((sum, h) => sum + h.value, 0);
    const totalCostBasis = allHoldings.reduce((sum, h) => sum + h.costBasis, 0);
    const dayChange = allHoldings.reduce((sum, h) => sum + (h.dayChange ?? 0), 0);

    // Include cash for portfolios that have it
    const meta = portfolioId ? this.portfolioMeta.get(portfolioId) : null;
    const cash = meta?.cash ?? 0;
    const startingCapital = meta?.startingCapital ?? 0;
    const totalValue = holdingsValue + cash;

    // For portfolios with trades/starting capital, compute real total P/L
    let totalGainLoss: number;
    let totalGainLossPct: number;
    if (startingCapital > 0) {
      // Real P/L = current total (holdings + cash) - starting capital
      totalGainLoss = totalValue - startingCapital;
      totalGainLossPct = (totalGainLoss / startingCapital) * 100;
    } else {
      // Fallback for brokerage portfolios (no starting capital known)
      totalGainLoss = allHoldings.reduce((sum, h) => sum + (h.gainLoss ?? 0), 0);
      totalGainLossPct = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;
    }

    const dayChangePct = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    let bestPerformer: { ticker: string; gainLossPct: number } | null = null;
    let worstPerformer: { ticker: string; gainLossPct: number } | null = null;

    for (const h of allHoldings) {
      const pct = h.gainLossPct ?? 0;
      if (!bestPerformer || pct > bestPerformer.gainLossPct) {
        bestPerformer = { ticker: h.ticker, gainLossPct: pct };
      }
      if (!worstPerformer || pct < worstPerformer.gainLossPct) {
        worstPerformer = { ticker: h.ticker, gainLossPct: pct };
      }
    }

    return {
      totalValue,
      dayChange,
      dayChangePct,
      totalGainLoss,
      totalGainLossPct,
      holdingsCount: allHoldings.length,
      totalCostBasis,
      cash,
      bestPerformer,
      worstPerformer,
    };
  }
}

export const storage = new MemStorage();
