import { pgTable, text, varchar, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
});

export const holdings = pgTable("holdings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  quantity: real("quantity").notNull(),
  costBasis: real("cost_basis").notNull(),
  price: real("price").notNull(),
  value: real("value").notNull(),
  dayChange: real("day_change").default(0),
  dayChangePct: real("day_change_pct").default(0),
  gainLoss: real("gain_loss").default(0),
  gainLossPct: real("gain_loss_pct").default(0),
  type: text("type").notNull(),
  sector: text("sector").default("Other"),
  source: text("source").default("manual"),
});

export const trades = pgTable("trades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  date: text("date").notNull(),
  action: text("action").notNull(), // BUY or SELL
  ticker: text("ticker").notNull(),
  name: text("name").notNull(),
  shares: real("shares").notNull(),
  price: real("price").notNull(),
  total: real("total").notNull(),
  pnl: real("pnl"),
  rationale: text("rationale"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  role: text("role").notNull(), // user or assistant
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
});

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({ id: true });
export const insertHoldingSchema = createInsertSchema(holdings).omit({ id: true });
export const insertTradeSchema = createInsertSchema(trades).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });

export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;
export type Holding = typeof holdings.$inferSelect;
export type InsertHolding = z.infer<typeof insertHoldingSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
