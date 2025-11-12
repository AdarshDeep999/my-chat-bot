import React, { useEffect, useRef, useState } from "react";
import {
  createSession,
  clearSession,
  summarizeSession,
  exportConversation,
  streamSSE,
} from "../api"; 
import ProviderPicker from "./ProviderPicker"; 

// --- FIX 1 ---
// We no longer define handleLogout here.
// It will be passed in as a prop.
/*
const handleLogout = () => {
  localStorage.removeItem("token");
  window.location.reload();
};
*/

// --- FIX 2 ---
// Add onLogout to the list of props
export default function ChatWindow({ token, initialTokens = 200000, onLogout }) {
  const [provider, setProvider] = useState("google");
  // ... (rest of your state is perfect) ...
  const [model, setModel] = useState("gemini-2.5-flash");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(initialTokens);
  const [showSummarySidebar, setShowSummarySidebar] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const scRef = useRef(null);

  // ... (all your functions like useEffect, handleProviderChange, newSession, etc. are perfect) ...
  useEffect(() => {
    scRef.current?.scrollTo({
      top: scRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const handleProviderChange = (newProvider) => {
    setProvider(newProvider);
    setMessages([]);
    setConversation(null);
    setShowSummarySidebar(false); 
    
    if (newProvider === "google") {
      setModel("gemini-2.5-flash");
    } else if (newProvider === "dialogflow") {
      setModel("dialogflow");
    }
  };

  async function newSession() {
    const { conversationId } = await createSession(token, { provider, model });
    setConversation({ _id: conversationId, provider, model });
    setMessages([]);
    setShowSummarySidebar(false); 
  }

  async function onSend() {
    if (!input.trim()) return;

    let conv = conversation;
    if (!conv) {
      const { conversationId } = await createSession(token, { provider, model });
      conv = { _id: conversationId, provider, model };
      setConversation(conv);
    }

    const tempUser = {
      role: "user",
      content: input,
      createdAt: new Date().toISOString(),
    };

    const tempAsst = {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    setMessages((m) => [...m, tempUser, tempAsst]);
    setInput("");
    setStreaming(true);

    const sse = await streamSSE({
      token,
      conversationId: conv._id,
      message: input,
      provider,
      model,
    });

    let idx = messages.length + 1;
    let queue = [];

    for await (const { event, data } of sse.events()) {
      if (event === "token") {
        queue.push(data.t);
      } else if (event === "tokens") {
        setTokensRemaining(data.remaining);
      } else if (event === "error") {
        alert(data.message);
        break;
      } else if (event === "end") {
        break;
      }
    }

    async function animateTokens() {
      while (queue.length) {
        const chunk = queue.shift();
        const chars = [...chunk];
        for (const c of chars) {
          setMessages((m) => {
            const next = [...m];
            if (next[idx]) {
              next[idx] = { ...next[idx], content: next[idx].content + c };
            }
            return next;
          });
          await new Promise((res) => setTimeout(res, 20));
        }
      }

      setMessages((m) => {
        const next = [...m];
        if (next[idx]) {
          next[idx] = { ...next[idx], streaming: false };
        }
        return next;
      });
      setStreaming(false);
    }

    animateTokens();
  }

  async function onClear() {
    if (!conversation) return;
    await clearSession(token, conversation._id);
    setMessages([]);
    setShowSummarySidebar(false); 
  }

  async function onSummarize() {
    if (!conversation || provider === 'dialogflow') return;
    
    setIsLoadingSummary(true);
    setSummaryText("");
    setShowSummarySidebar(true); 

    try {
      const r = await summarizeSession(token, conversation._id);
      setSummaryText(r.summary || "No summary available.");
    } catch (error) {
      console.error("Summarize error:", error);
      setSummaryText("Failed to load summary due to an error.");
    }
    
    setIsLoadingSummary(false);
  }

  async function onExport() {
    if (!conversation) return;
    const blob = await exportConversation(token, conversation._id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${conversation._id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }


  return (
    <div className="h-screen w-full bg-[#050510] text-white relative overflow-hidden flex">
      {/* ... (background glow) ... */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(120,30,255,0.18),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(0,200,255,0.14),transparent_60%)]"></div>

      {/* SIDEBAR */}
      <aside className="hidden md:flex w-[300px] flex-col border-r border-white/10 bg-white/5 backdrop-blur-xl">
        {/* ... (sidebar header) ... */}
        <div className="p-5 border-b border-white/10">
          <h2 className="text-xl font-semibold tracking-tight">AI Chat</h2>
          <p className="text-xs text-white/60 mt-1">
            {conversation ? `Active: ${conversation._id}` : "No session yet"}
          </p>
        </div>

        {/* ... (sidebar content) ... */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          
          <div>
            <div className="rounded-xl border border-white/10 p-3 bg-white/5">
              <ProviderPicker
                provider={provider}
                setProvider={handleProviderChange} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={newSession}
                className="rounded-lg px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 
                            hover:from-purple-500 hover:to-indigo-500 text-sm font-semibold"
              >
                New Session
              </button>

              <button
                onClick={onClear}
                disabled={!conversation || messages.length === 0}
                className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 
                            disabled:opacity-30 text-sm disabled:cursor-not-allowed"
              >
                Clear
              </button>

              <button
                onClick={onSummarize}
                disabled={!conversation || messages.length === 0 || isLoadingSummary || provider === 'dialogflow'}
                className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 
                            disabled:opacity-30 text-sm disabled:cursor-not-allowed"
                title={provider === 'dialogflow' ? "Summarization is not available for Dialogflow" : "Summarize the conversation"}
              >
                {isLoadingSummary ? "Loading..." : "Summarize"}
              </button>

              <button
                onClick={onExport}
                disabled={!conversation || messages.length === 0}
                className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 
                            disabled:opacity-30 text-sm disabled:cursor-not-allowed"
              >
                Export
              </button>
            </div>
          </div>
          
          {showSummarySidebar && (
            <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-white/10 bg-white/5 mt-4">
              
              <div className="flex items-center justify-between p-3 border-b border-white/10">
                <h3 className="text-base font-semibold text-white">Summary</h3>
                <button
                  onClick={() => setShowSummarySidebar(false)}
                  className="p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-3">
                {isLoadingSummary ? (
                  <div className="flex items-center justify-center h-20">
                    <span className="text-white/70 animate-pulse">Loading summary...</span>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed text-white/90 text-sm">
                    {summaryText}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col bg-[#050510]">
        <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 md:px-10 bg-white/5 backdrop-blur-xl">
          <h1 className="text-lg font-semibold text-white tracking-tight">
            {conversation ? "Chat Session" : "Start a New Conversation"}
          </h1>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-400/30">
              <span className="text-indigo-300 text-sm">Tokens Left:</span>
              <span className="text-white font-semibold text-sm">
                {tokensRemaining.toLocaleString()}
              </span>
            </div>
            
            {/* --- FIX 3 --- */}
            {/* This now calls the onLogout prop from App.jsx */}
            <button
              onClick={onLogout} 
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </header>

        {/* ... (rest of your chat UI) ... */}
        <div
          ref={scRef}
          className="flex-1 overflow-auto px-3 md:px-6 py-4 space-y-3"
        >
          {messages.map((m, i) => {
            const isLatestAssistant =
              m.role === "assistant" && i === messages.length - 1 && streaming;
            return (
              <MessageBubble
                key={i}
                role={m.role}
                content={m.content}
                createdAt={m.createdAt}
                isLatestAssistant={isLatestAssistant}
                streaming={streaming}
              />
            );
          })}

          {streaming && (
            <div className="max-w-[760px] bg-white/5 border border-white/10 rounded-2xl px-4 py-3 animate-pulse">
              <span className="text-white/70 text-sm">Assistant is typing…</span>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 bg-white/5 backdrop-blur-xl p-3 md:p-4">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input
              className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-purple-500/40"
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
            />
            <button
              onClick={onSend}
              disabled={streaming}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

/* --- Message Bubble --- */
function MessageBubble({
  role,
  content,
  createdAt,
  isLatestAssistant,
  streaming,
}) {
  const isUser = role === "user";

  return (
    <div
      className={[
        "max-w-[760px] rounded-2xl px-4 py-3",
        isUser
          ? "ml-auto bg-gradient-to-br from-[#111325] to-[#0c0f1c] border border-white/10"
          : "mr-auto bg-white/10 border border-white/10 backdrop-blur-xl",
      ].join(" ")}
    >
      <div className="text-[11px] uppercase tracking-wide text-white/50 mb-1">
        {role} • {new Date(createdAt || Date.now()).toLocaleTimeString()}
      </div>

      <div className="whitespace-pre-wrap leading-relaxed text-white/90">
        {content}
        {isLatestAssistant && streaming && (
          <span className="ai-typing-cursor"></span>
        )}
      </div>
    </div>
  );
}