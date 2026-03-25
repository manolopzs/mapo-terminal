import { useState, useRef, useEffect } from "react";
import { useChatMessages, useSendChatMessage, useClearChat } from "@/hooks/use-portfolio";
import { Send, Trash2, X, Sparkles, Loader2, TrendingUp, Shield, BarChart3, RefreshCw, ChevronDown } from "lucide-react";
import type { ChatMessage } from "@shared/schema";

const AI_MODELS = [
  { key: "claude", label: "Claude", sub: "Sonnet 4.6", color: "#D97706" },
  { key: "gpt", label: "GPT", sub: "5.1", color: "#10B981" },
  { key: "gemini", label: "Gemini", sub: "3 Flash", color: "#6366F1" },
] as const;

type ModelKey = typeof AI_MODELS[number]["key"];

interface AIAnalystProps {
  portfolioId: string;
  open: boolean;
  onClose: () => void;
}

export function AIAnalyst({ portfolioId, open, onClose }: AIAnalystProps) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<ModelKey>("claude");
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useChatMessages(portfolioId);
  const sendMessage = useSendChatMessage();
  const clearChat = useClearChat();

  // Close model menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    }
    if (modelMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [modelMenuOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
    sendMessage.mutate({ portfolioId, message: trimmed, model: selectedModel });
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickPrompt(prompt: string) {
    if (sendMessage.isPending) return;
    sendMessage.mutate({ portfolioId, message: prompt, model: selectedModel });
  }

  const quickPrompts = [
    { icon: TrendingUp, label: "Portfolio health check", color: "#00E6A8" },
    { icon: BarChart3, label: "Score my holdings", color: "#00D9FF" },
    { icon: Shield, label: "Risk alerts", color: "#F0883E" },
    { icon: RefreshCw, label: "Rebalancing ideas", color: "#A78BFA" },
  ];

  const hasMessages = messages && messages.length > 0;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 99,
            transition: "opacity 0.2s ease",
          }}
        />
      )}

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          bottom: 0,
          width: 460,
          maxWidth: "100vw",
          background: "#0A0E16",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #1A2332",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #00D9FF 0%, #0066FF 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#E6EDF3", letterSpacing: -0.2 }}>
                MAPO Analyst
              </div>
              <div style={{ fontSize: 11, color: "#3FB950", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3FB950", display: "inline-block" }} />
                Ready
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {hasMessages && (
              <button
                onClick={() => clearChat.mutate(portfolioId)}
                title="Clear conversation"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#161B22")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                data-testid="button-clear-chat"
              >
                <Trash2 size={15} color="#484F58" />
              </button>
            )}
            <button
              onClick={onClose}
              title="Close"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#161B22")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              data-testid="button-close-chat"
            >
              <X size={16} color="#484F58" />
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 20px",
            borderBottom: "1px solid #1A2332",
            flexShrink: 0,
            background: "#0A0E16",
          }}
        >
          <span style={{ fontSize: 10, color: "#484F58", textTransform: "uppercase", letterSpacing: 0.8, marginRight: 4, fontWeight: 500 }}>Model</span>
          {AI_MODELS.map((m) => {
            const active = selectedModel === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedModel(m.key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "4px 10px",
                  borderRadius: 6,
                  border: active ? `1px solid ${m.color}44` : "1px solid transparent",
                  background: active ? `${m.color}15` : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "#111822";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: active ? m.color : "#2D333B",
                    flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                />
                <span style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#E6EDF3" : "#8B949E",
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}>
                  {m.label}
                </span>
                <span style={{
                  fontSize: 10,
                  color: active ? "#8B949E" : "#484F58",
                  whiteSpace: "nowrap",
                }}>
                  {m.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            minHeight: 0,
            padding: "16px 20px",
          }}
        >
          {!hasMessages && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: 24,
            }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "linear-gradient(135deg, rgba(0,217,255,0.1) 0%, rgba(0,102,255,0.1) 100%)",
                border: "1px solid rgba(0,217,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Sparkles size={26} color="#00D9FF" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#E6EDF3", marginBottom: 6 }}>
                  How can I help?
                </div>
                <div style={{ fontSize: 13, color: "#484F58", lineHeight: 1.5, maxWidth: 280 }}>
                  Ask about your portfolio, get scoring analysis, risk alerts, or rebalancing recommendations.
                </div>
              </div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                width: "100%",
                maxWidth: 360,
                marginTop: 4,
              }}>
                {quickPrompts.map(({ icon: Icon, label, color }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickPrompt(label)}
                    disabled={sendMessage.isPending}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: "1px solid #1A2332",
                      background: "#0D1117",
                      cursor: sendMessage.isPending ? "default" : "pointer",
                      textAlign: "left",
                      transition: "all 0.15s",
                      opacity: sendMessage.isPending ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!sendMessage.isPending) {
                        e.currentTarget.style.borderColor = "#2D333B";
                        e.currentTarget.style.background = "#111822";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#1A2332";
                      e.currentTarget.style.background = "#0D1117";
                    }}
                    data-testid={`button-quick-${label.replace(/\s+/g, "-").toLowerCase()}`}
                  >
                    <Icon size={15} color={color} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#C9D1D9", lineHeight: 1.3 }}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages?.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {sendMessage.isPending && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              marginBottom: 8,
            }}>
              <div style={{
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}>
                <span className="analyst-dot analyst-dot-1" />
                <span className="analyst-dot analyst-dot-2" />
                <span className="analyst-dot analyst-dot-3" />
              </div>
              <span style={{ fontSize: 12, color: "#484F58" }}>
                Analyzing...
              </span>
              <style>{`
                .analyst-dot {
                  width: 5px; height: 5px; border-radius: 50%;
                  background: #00D9FF; opacity: 0.4;
                  animation: analystPulse 1.4s ease-in-out infinite;
                }
                .analyst-dot-1 { animation-delay: 0s; }
                .analyst-dot-2 { animation-delay: 0.2s; }
                .analyst-dot-3 { animation-delay: 0.4s; }
                @keyframes analystPulse {
                  0%, 100% { opacity: 0.3; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </div>
          )}

          {sendMessage.isError && (
            <div style={{
              padding: "10px 14px",
              marginBottom: 8,
              borderRadius: 10,
              background: "rgba(255,68,88,0.08)",
              border: "1px solid rgba(255,68,88,0.2)",
              fontSize: 12,
              color: "#FF4458",
              lineHeight: 1.5,
            }}>
              {sendMessage.error?.message || "Failed to get response. Try again."}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          flexShrink: 0,
          padding: "12px 20px 16px",
          borderTop: "1px solid #1A2332",
        }}>
          <div style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            background: "#0D1117",
            border: "1px solid #1A2332",
            borderRadius: 12,
            padding: "10px 12px 10px 16px",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#2D333B")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2332")}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your portfolio..."
              rows={1}
              style={{
                flex: 1,
                resize: "none",
                outline: "none",
                background: "transparent",
                color: "#E6EDF3",
                fontSize: 13,
                lineHeight: 1.5,
                maxHeight: 100,
                border: "none",
                fontFamily: "Inter, -apple-system, sans-serif",
              }}
              data-testid="input-chat-message"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sendMessage.isPending}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "none",
                background: input.trim() ? "#00D9FF" : "transparent",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              data-testid="button-send-chat"
            >
              <Send
                size={15}
                color={input.trim() ? "#080C14" : "#2D333B"}
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBottom: 16,
      }}>
        <div style={{
          maxWidth: "80%",
          padding: "10px 14px",
          borderRadius: "14px 14px 4px 14px",
          background: "#1A2332",
          fontSize: 13,
          lineHeight: 1.6,
          color: "#E6EDF3",
          wordBreak: "break-word",
        }}>
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: "#C9D1D9",
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }}
      />
      <div style={{ fontSize: 10, color: "#2D333B", marginTop: 6 }}>
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatMarkdown(text: string) {
  let html = escapeHtml(text);

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#E6EDF3;font-weight:600">$1</strong>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code style="background:#161B22;padding:2px 6px;border-radius:4px;font-size:12px;color:#58A6FF;font-family:JetBrains Mono,monospace">$1</code>');

  // H3
  html = html.replace(/^### (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:#E6EDF3;margin:16px 0 6px;letter-spacing:-0.2px">$1</div>');

  // H2
  html = html.replace(/^## (.+)$/gm, '<div style="font-size:14px;font-weight:600;color:#E6EDF3;margin:18px 0 8px;letter-spacing:-0.2px">$1</div>');

  // List items
  html = html.replace(/^[-•] (.+)$/gm, '<div style="padding-left:16px;position:relative;margin:3px 0"><span style="position:absolute;left:0;color:#484F58">•</span>$1</div>');

  // Numbered list
  html = html.replace(/^(\d+)\. (.+)$/gm, '<div style="padding-left:20px;position:relative;margin:3px 0"><span style="position:absolute;left:0;color:#484F58;font-size:12px;font-weight:500">$1.</span>$2</div>');

  // Simple table rows
  html = html.replace(
    /\|(.+)\|/g,
    (match) => {
      const cells = match.split("|").filter(Boolean).map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) return "";
      return `<div style="display:flex;gap:12px;font-family:JetBrains Mono,monospace;font-size:11px;padding:3px 0;border-bottom:1px solid #1A2332">${cells.map((c) => `<span style="flex:1;color:#8B949E">${c}</span>`).join("")}</div>`;
    }
  );

  // Horizontal rule
  html = html.replace(/^---$/gm, '<div style="border-top:1px solid #1A2332;margin:12px 0"></div>');

  return html;
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
