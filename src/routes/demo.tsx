import { useEffect, useRef, useState, type FormEvent } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";

import { AnimatePresence, motion } from "motion/react";

import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { AnimatedBackground } from "@/components/landing/AnimatedBackground";
import { Logo } from "@/components/landing/Logo";
import { GlowButton } from "@/components/landing/GlowButton";
import { GlassCard } from "@/components/app/ui";

import {
  Pipeline,
  PIPELINE_STEPS,
  ReportPanel,
  TxnTable,
  ExpenseCharts,
  readFileForAI,
  consumePendingDemoFile,
} from "@/components/app/analysis";

import {
  analyzeStatement,
  coachChat,
  type AnalysisReport,
  type ExtractedTxn,
} from "@/lib/ai.functions";

/* =========================================================
   ROUTE
   ========================================================= */

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      {
        title: "Try statement analysis — Finora AI",
      },
      {
        name: "description",
        content:
          "Upload a financial statement and see Finora AI extract transactions and provide spending insights.",
      },
    ],
  }),

  component: DemoPage,
});

/* =========================================================
   TYPES
   ========================================================= */

type DemoStage = "idle" | "working" | "results";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/* =========================================================
   CHAT BOX
   ========================================================= */

function AIChatBox({ rows, report }: { rows: ExtractedTxn[]; report: AnalysisReport | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I can answer questions about the transactions in your uploaded statement. Ask me about merchants, categories, dates, payments or spending patterns.",
    },
  ]);

  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  const sendMessage = async (event?: FormEvent, forcedQuestion?: string) => {
    event?.preventDefault();

    const text = (forcedQuestion ?? question).trim();

    if (!text || loading || !rows.length) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: text,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setQuestion("");
    setLoading(true);

    try {
      const transactionContext = rows
        .map(
          (row, index) =>
            `${index + 1}. Merchant: ${row.merchant} | Amount: ${row.amount} | Type: ${
              row.type
            } | Category: ${row.category} | Date: ${row.date} | Method: ${
              row.payment_method
            } | Status: ${row.status}`,
        )
        .join("\n");

      const reportContext = report
        ? `
AI ANALYSIS:
Summary: ${report.summary}

Insights:
${report.insights.join("\n")}

Suggestions:
${report.suggestions.join("\n")}
`
        : "";

      const context = `
UPLOADED FINANCIAL STATEMENT TRANSACTIONS:

${transactionContext}

${reportContext}

IMPORTANT:
Answer ONLY from the uploaded transaction data above.
Do not invent salary, savings, account balance, dates, merchants or amounts.
If the uploaded data does not contain the answer, clearly say that the uploaded statement does not contain enough information.
`;

      const result = await coachChat({
        data: {
          messages: updatedMessages,
          context,
        },
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply || "I couldn't find an answer from the uploaded statement.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error ? error.message : "Sorry, I couldn't answer that question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />

          <div>
            <p className="text-sm font-medium">Ask Finora AI</p>

            <p className="text-xs text-muted-foreground">
              Ask anything about this uploaded statement
            </p>
          </div>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground/[0.05] text-muted-foreground"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-foreground/[0.05] px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finora AI is thinking…
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={loading}
          placeholder="Ask about your transactions..."
          className="min-w-0 flex-1 rounded-xl border border-glass-border bg-background/50 px-4 py-3 text-sm outline-none transition focus:border-primary/50"
        />

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {/* QUICK QUESTIONS */}
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          "What categories did I spend on?",
          "Which merchant appears most often?",
          "What are my biggest transactions?",
          "Which expenses look recurring?",
        ].map((text) => (
          <button
            key={text}
            type="button"
            disabled={loading}
            onClick={() => {
              void sendMessage(undefined, text);
            }}
            className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
          >
            {text}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}

/* =========================================================
   MAIN PAGE
   ========================================================= */

function DemoPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<DemoStage>("idle");

  const [step, setStep] = useState(0);

  const [fileName, setFileName] = useState("");

  const [rows, setRows] = useState<ExtractedTxn[]>([]);

  const [report, setReport] = useState<AnalysisReport | null>(null);

  const [error, setError] = useState("");

  /* =========================================================
     ANALYSE FILE
     ========================================================= */

  const analyse = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError("Choose a file smaller than 20MB.");

      return;
    }

    setError("");
    setFileName(file.name);
    setStage("working");
    setStep(0);

    const timer = window.setInterval(
      () => setStep((value) => Math.min(PIPELINE_STEPS.length - 1, value + 1)),
      1200,
    );

    try {
      const payload = await readFileForAI(file);

      const result = await analyzeStatement({
        data: {
          ...payload,
          currency: "INR",
        },
      });

      setRows(result.transactions);

      setReport(result.report);

      setStep(PIPELINE_STEPS.length);

      setStage("results");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't analyse that file. Try another one.",
      );

      setStage("idle");
    } finally {
      window.clearInterval(timer);
    }
  };
  useEffect(() => {
    const file = consumePendingDemoFile();

    if (file) {
      void analyse(file);
    }
  }, []);
  /* =========================================================
     RESET
     ========================================================= */

  const reset = () => {
    setStage("idle");
    setRows([]);
    setReport(null);
    setFileName("");
    setError("");
    setStep(0);
  };

  /* =========================================================
     UI
     ========================================================= */

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background px-4 py-8 sm:px-6">
      <AnimatedBackground />

      <main className="relative z-10 mx-auto max-w-6xl">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/" aria-label="Finora AI home">
            <Logo />
          </Link>

          <div className="flex gap-2">
            {stage !== "idle" && (
              <GlowButton variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Start over
              </GlowButton>
            )}
          </div>
        </div>

        {/* BACK */}
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back home
        </Link>

        {/* TITLE */}
        <h1 className="mt-6 font-display text-3xl font-bold sm:text-5xl">
          <span className="text-gradient">Try AI statement analysis</span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Upload a PDF, CSV, receipt or screenshot. Finora AI will extract transactions, show
          spending patterns and provide useful insights.
        </p>

        <p className="mt-3 inline-flex items-center gap-2 text-xs text-accent">
          <ShieldCheck className="h-4 w-4" />
          Demo results are temporary and never added to any user account.
        </p>

        {/* CONTENT */}
        <AnimatePresence mode="wait">
          {/* =================================================
             IDLE
             ================================================= */}
          {stage === "idle" && (
            <motion.div
              key="idle"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="mt-8"
            >
              <GlassCard>
                <div
                  onClick={() => inputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();

                    const file = event.dataTransfer.files?.[0];

                    if (file) {
                      void analyse(file);
                    }
                  }}
                  className="grid cursor-pointer place-items-center rounded-3xl border border-dashed border-glass-border px-6 py-16 text-center transition-colors hover:border-primary/50"
                >
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                    }}
                    className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-primary/12 text-primary"
                  >
                    <UploadCloud className="h-7 w-7" />
                  </motion.div>

                  <p className="font-medium">Drop your statement here</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    or click to browse — PDF, CSV, PNG, JPG up to 20MB
                  </p>

                  <input
                    ref={inputRef}
                    hidden
                    type="file"
                    accept=".pdf,.csv,.txt,image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void analyse(file);
                      }

                      event.target.value = "";
                    }}
                  />
                </div>

                {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              </GlassCard>
            </motion.div>
          )}

          {/* =================================================
             WORKING
             ================================================= */}
          {stage === "working" && (
            <motion.div
              key="working"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mt-8"
            >
              <GlassCard>
                <p className="text-sm font-medium">Analysing {fileName}</p>

                <div className="mt-5">
                  <Pipeline step={step} />
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* =================================================
             RESULTS
             ================================================= */}
          {stage === "results" && (
            <motion.div
              key="results"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              className="mt-8 grid gap-4"
            >
              {/* TRANSACTIONS */}
              <GlassCard>
                <p className="text-sm font-medium">Expenses found in {fileName}</p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Temporary demo analysis — nothing has been imported.
                </p>

                <div className="mt-5">
                  <TxnTable rows={rows} currency="INR" />
                </div>
              </GlassCard>

              {/* CHARTS */}
              <ExpenseCharts rows={rows} currency="INR" />

              {/* AI REPORT */}
              {report && <ReportPanel report={report} currency="INR" />}

              {/* AI CHAT */}
              <AIChatBox rows={rows} report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
