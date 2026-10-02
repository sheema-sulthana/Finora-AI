import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Send, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { GlassCard, PageHeader, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { buildFinanceContext } from "@/lib/ai-context";
import { coachChat } from "@/lib/ai.functions";
import { useBills, useFinance, useGoals, useProfile } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/coach")({
  head: mkHead(
    "AI Financial Coach — Finora AI",
    "Ask questions about your own spending, budgets and goals and get personalised guidance.",
  ),
  component: () => (
    <AppLayout>
      <CoachPage />
    </AppLayout>
  ),
});

const PROMPTS = [
  "Where am I spending the most?",
  "How can I save ₹5,000 this month?",
  "Why did my expenses increase?",
  "Which category should I reduce?",
  "Can I afford a laptop next year?",
  "Why is my financial health score low?",
];

type Msg = { role: "user" | "assistant"; content: string };

function CoachPage() {
  const { data: profile } = useProfile();
  const { data: bills = [] } = useBills();
  const { data: goals = [] } = useGoals();
  const f = useFinance();
  const endRef = useRef<HTMLDivElement>(null);

  const hasData = f.txns.length > 0;
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: hasData
        ? "Hi! I've read your transactions, budgets and goals. Ask me anything about your money."
        : "Upload your first statement or add a transaction and I'll start analysing your finances.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const context = buildFinanceContext(f, profile, bills, goals);
      const { reply } = await coachChat({
        data: { messages: next.filter((m) => m.role !== "assistant" || m !== next[0]), context },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    }
  };

  return (
    <>
      <PageHeader
        title="AI Financial Coach"
        subtitle="Answers grounded in your own transactions, budgets and goals."
      />

      <GlassCard className="flex h-[62vh] min-h-[420px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-secondary/15 text-secondary">
                  <Sparkles className="h-4 w-4" />
                </span>
              )}
              <div
                className={`max-w-[78%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary/15 text-foreground"
                    : "bg-foreground/[0.05] text-muted-foreground"
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
          {busy && (
            <motion.p
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="text-xs text-muted-foreground"
            >
              Finora is thinking…
            </motion.p>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {p}
            </button>
          ))}
        </div>

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            className={inputClass}
            placeholder="Ask about your spending, budgets or goals…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <GlowButton type="submit">
            <Send className="h-4 w-4" />
          </GlowButton>
        </form>
      </GlassCard>
    </>
  );
}
