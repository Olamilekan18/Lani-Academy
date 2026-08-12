import React, { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2, Info } from "lucide-react";
import {
  askCourseQuestion,
  AI_ENABLED,
  type AskAIMessage,
  type AskCourseContext,
} from "../lib/askAi";

interface AskAIProps {
  open: boolean;
  onClose: () => void;
  context: AskCourseContext;
}

const SUGGESTIONS = [
  "Summarise this course in 3 points",
  "Explain the key concepts simply",
  "Quiz me on what I've learned",
  "What should I focus on first?",
];

export default function AskAI({ open, onClose, context }: AskAIProps) {
  const [messages, setMessages] = useState<AskAIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!open) return null;

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || loading) return;
    const next: AskAIMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const reply = await askCourseQuestion(question, context, next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex justify-end bg-slate-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lani-blue to-lani-emerald text-white shadow">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-lani-navy leading-tight">Ask AI</h2>
              <p className="text-[11px] text-slate-500 truncate max-w-[15rem]">
                {context.courseTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview banner while the model isn't connected */}
        {!AI_ENABLED && (
          <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-[11px] font-semibold text-amber-700">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              Preview mode — the AI model isn't connected yet. Responses are placeholders
              until it's wired up.
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="mt-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lani-mist text-lani-green">
                <Sparkles size={24} />
              </div>
              <p className="mt-3 text-sm font-bold text-lani-navy">
                Your study assistant
              </p>
              <p className="mt-1 text-xs text-slate-500 leading-5">
                Ask anything about this course — concepts, summaries, or practice questions.
              </p>
              <div className="mt-5 grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:border-lani-green hover:bg-lani-mist/40 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-xs leading-6 ${
                  m.role === "user"
                    ? "bg-lani-green text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-700 rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-xs text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Thinking…
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-slate-200 p-3"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder="Ask about this course…"
              className="min-h-[42px] max-h-32 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-700 focus:border-lani-green focus:outline-none focus:ring-2 focus:ring-lani-green/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-lani-green text-white shadow disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-slate-400">
            AI can make mistakes. Verify important information.
          </p>
        </form>
      </div>
    </div>
  );
}
