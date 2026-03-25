import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  FolderPlus,
  Briefcase,
  TrendingUp,
  Wallet,
  Bitcoin,
  LayoutGrid,
  Trash2,
} from "lucide-react";
// No "All Portfolios" — each portfolio is isolated
import { usePortfolios, useCreatePortfolio, useDeletePortfolio } from "@/hooks/use-portfolio";
import { useToast } from "@/hooks/use-toast";
import type { Portfolio } from "@shared/schema";

interface TerminalSidebarProps {
  activePortfolioId: string;
  onSelectPortfolio: (id: string) => void;
  onAddPosition: () => void;
}

const PORTFOLIO_ICONS: Record<string, typeof Briefcase> = {
  brokerage: TrendingUp,
  retirement: Wallet,
  crypto: Bitcoin,
  custom: LayoutGrid,
};

export function TerminalSidebar({ activePortfolioId, onSelectPortfolio, onAddPosition }: TerminalSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("brokerage");

  const { data: portfolios } = usePortfolios();
  const createPortfolio = useCreatePortfolio();
  const deletePortfolio = useDeletePortfolio();
  const { toast } = useToast();

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createPortfolio.mutate(
      { name: newName.trim(), type: newType },
      {
        onSuccess: () => {
          toast({ title: "Created", description: `${newName} portfolio created` });
          setNewName("");
          setShowNewForm(false);
        },
      }
    );
  }

  function handleDelete(id: string, name: string) {
    deletePortfolio.mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: `${name} removed` });
        // If deleted portfolio was active, select the first remaining one
        if (activePortfolioId === id) {
          const remaining = portfolios?.filter((p) => p.id !== id);
          if (remaining && remaining.length > 0) onSelectPortfolio(remaining[0].id);
        }
      },
    });
  }

  const width = collapsed ? 42 : 200;

  return (
    <div
      className="flex flex-col flex-shrink-0"
      style={{
        width,
        minWidth: width,
        background: "#0A0E18",
        borderRight: "1px solid #1A2332",
        transition: "width 150ms ease, min-width 150ms ease",
        overflow: "hidden",
      }}
    >
      {/* Sidebar header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          height: 52,
          minHeight: 52,
          padding: collapsed ? "0 8px" : "0 10px",
          borderBottom: "1px solid #1A2332",
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: "#8B949E",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            Portfolios
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: "none",
            border: "none",
            color: "#8B949E",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginLeft: collapsed ? "auto" : 0,
            marginRight: collapsed ? "auto" : 0,
          }}
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Ticker tape spacer — match the TickerTape height */}
      <div style={{ height: 24, minHeight: 24, borderBottom: "1px solid #1A2332", flexShrink: 0 }} />

      {/* Portfolio list */}
      <div className="flex-1 overflow-auto" style={{ padding: 0 }}>
        {portfolios?.map((p) => {
          const Icon = PORTFOLIO_ICONS[p.type] || Briefcase;
          const isActive = activePortfolioId === p.id;
          return (
            <div
              key={p.id}
              className="flex items-center"
              style={{
                padding: collapsed ? "7px 0" : "7px 10px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "rgba(0, 217, 255, 0.08)" : "transparent",
                borderBottom: "1px solid rgba(26, 35, 50, 0.5)",
                borderLeft: isActive ? "2px solid #00D9FF" : "2px solid transparent",
                cursor: "pointer",
                position: "relative",
              }}
            >
              <button
                onClick={() => onSelectPortfolio(p.id)}
                className="flex items-center gap-2"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  flex: 1,
                  justifyContent: collapsed ? "center" : "flex-start",
                  padding: 0,
                  color: isActive ? "#00D9FF" : "#C9D1D9",
                }}
                data-testid={`portfolio-${p.id}`}
              >
                <Icon size={collapsed ? 14 : 12} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <div className="flex flex-col items-start" style={{ minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 110,
                        display: "block",
                      }}
                    >
                      {p.name}
                    </span>
                    <span
                      style={{
                        fontSize: 7,
                        color: "#8B949E",
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                      }}
                    >
                      {p.type}
                    </span>
                  </div>
                )}
              </button>
              {!collapsed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id, p.name);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#8B949E",
                    padding: 2,
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                  data-testid={`delete-portfolio-${p.id}`}
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div
        className="flex-shrink-0"
        style={{
          borderTop: "1px solid #1A2332",
          padding: collapsed ? "6px 4px" : "6px 8px",
        }}
      >
        {/* New Portfolio */}
        {!collapsed && showNewForm ? (
          <form onSubmit={handleCreate} style={{ marginBottom: 4 }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Portfolio name..."
              autoFocus
              style={{
                width: "100%",
                fontSize: 9,
                padding: "4px 6px",
                background: "#0D1117",
                border: "1px solid #1A2332",
                borderRadius: 2,
                color: "#C9D1D9",
                outline: "none",
                marginBottom: 3,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              style={{
                width: "100%",
                fontSize: 9,
                padding: "3px 4px",
                background: "#0D1117",
                border: "1px solid #1A2332",
                borderRadius: 2,
                color: "#C9D1D9",
                outline: "none",
                marginBottom: 3,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              <option value="brokerage">Brokerage</option>
              <option value="retirement">Retirement</option>
              <option value="crypto">Crypto</option>
              <option value="custom">Custom</option>
            </select>
            <div className="flex gap-1">
              <button
                type="submit"
                disabled={createPortfolio.isPending}
                style={{
                  flex: 1,
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "3px 0",
                  background: "#00D9FF",
                  color: "#080C14",
                  border: "none",
                  borderRadius: 2,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                {createPortfolio.isPending ? "..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(false);
                  setNewName("");
                }}
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "3px 6px",
                  background: "#1A2332",
                  color: "#8B949E",
                  border: "none",
                  borderRadius: 2,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}
              >
                X
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => (collapsed ? setCollapsed(false) : setShowNewForm(true))}
            className="flex items-center justify-center gap-1"
            style={{
              width: "100%",
              fontSize: 8,
              fontWeight: 600,
              padding: collapsed ? "4px 0" : "4px 0",
              background: "#1A2332",
              color: "#8B949E",
              border: "none",
              borderRadius: 2,
              cursor: "pointer",
              letterSpacing: 0.8,
              textTransform: "uppercase",
              marginBottom: 3,
            }}
            data-testid="new-portfolio-btn"
          >
            <FolderPlus size={10} />
            {!collapsed && <span>New Portfolio</span>}
          </button>
        )}

        {/* Add Position */}
        <button
          onClick={() => {
            if (collapsed) setCollapsed(false);
            onAddPosition();
          }}
          className="flex items-center justify-center gap-1"
          style={{
            width: "100%",
            fontSize: 8,
            fontWeight: 600,
            padding: "4px 0",
            background: "rgba(0, 217, 255, 0.1)",
            color: "#00D9FF",
            border: "1px solid rgba(0, 217, 255, 0.2)",
            borderRadius: 2,
            cursor: "pointer",
            letterSpacing: 0.8,
            textTransform: "uppercase",
          }}
          data-testid="add-position-btn"
        >
          <Plus size={10} />
          {!collapsed && <span>Add Position</span>}
        </button>
      </div>
    </div>
  );
}
