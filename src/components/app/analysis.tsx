import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Lightbulb, Send, Sparkles, TrendingUp } from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { categoryColor, formatDate, formatMoney } from "@/lib/format";

import { GlassCard, ProgressBar } from "@/components/app/ui";

import { coachChat, type AnalysisReport, type ExtractedTxn } from "@/lib/ai.functions";
export function splitTextForAI(text: string, maxChars = 120_000): string[] {
  if (!text || text.length <= maxChars) return [text];

  const lines = text.split(/\r?\n/);
  if (lines.length <= 1) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChars) {
      chunks.push(text.slice(i, i + maxChars));
    }
    return chunks;
  }

  const header = lines[0] ?? "";
  const chunks: string[] = [];
  let current = header;

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (!line.trim()) continue;

    if (current !== header && current.length + line.length + 1 > maxChars) {
      chunks.push(current);
      current = header;
    }

    current += `\n${line}`;
  }

  if (current !== header) chunks.push(current);
  return chunks;
}

let pendingDemoFile: File | null = null;

export function setPendingDemoFile(file: File) {
  pendingDemoFile = file;
}

export function consumePendingDemoFile(): File | null {
  const file = pendingDemoFile;
  pendingDemoFile = null;
  return file;
}
/* =========================================================
   FILE READER
   ========================================================= */

async function compressImageForAI(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not decode the image."));
      element.src = objectUrl;
    });

    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));

    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare the image for AI analysis.");
    }

    context.drawImage(image, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function readFileForAI(file: File) {
  const isText =
    file.type.startsWith("text/") ||
    file.name.toLowerCase().endsWith(".csv") ||
    file.name.toLowerCase().endsWith(".txt");

  if (isText) {
    return {
      filename: file.name,
      mimeType: file.type || "text/csv",
      text: await file.text(),
    };
  }

  /*
   * Screenshots and receipts often come from phones as very large PNG/JPEG
   * files. Downscaling them before the server request dramatically reduces
   * browser memory, request size and Gemini processing time while preserving
   * enough resolution for statement/receipt text.
   */
  if (file.type.startsWith("image/") && file.size > 4 * 1024 * 1024) {
    return {
      filename: file.name,
      mimeType: "image/jpeg",
      dataUrl: await compressImageForAI(file),
    };
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file."));

    reader.readAsDataURL(file);
  });

  return {
    filename: file.name,
    mimeType: file.type || "application/pdf",
    dataUrl,
  };
}

/* =========================================================
   PIPELINE
   ========================================================= */

export const PIPELINE_STEPS = [
  "Reading document",
  "Extracting transactions",
  "Detecting merchants & amounts",
  "Auto-categorising",
  "Generating AI report",
];

export function Pipeline({ step }: { step: number }) {
  return (
    <div className="grid gap-3">
      {PIPELINE_STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "active" : "idle";

        return (
          <div key={label} className="flex items-center gap-3 text-sm">
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-[11px] ${
                state === "done"
                  ? "bg-emerald-400/20 text-emerald-400"
                  : state === "active"
                    ? "bg-primary/20 text-primary"
                    : "bg-foreground/10 text-muted-foreground"
              }`}
            >
              {state === "done" ? "✓" : i + 1}
            </span>

            <span className={state === "idle" ? "text-muted-foreground" : ""}>{label}</span>

            {state === "active" && (
              <motion.span
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.4,
                }}
                className="text-xs text-primary"
              >
                working…
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   TRANSACTION TABLE
   ========================================================= */

type Row = ExtractedTxn & {
  id?: string;
};

export function TxnTable({
  rows,
  currency,
  actions,
}: {
  rows: Row[];
  currency?: string;
  actions?: (row: Row, index: number) => React.ReactNode;
}) {
  const [sort, setSort] = useState<{
    key: keyof Row;
    asc: boolean;
  }>({
    key: "date",
    asc: false,
  });

  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.key] as string | number;

    const bv = b[sort.key] as string | number;

    if (typeof av === "number" && typeof bv === "number") {
      return sort.asc ? av - bv : bv - av;
    }

    return sort.asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
  });

  const head: {
    key: keyof Row;
    label: string;
  }[] = [
    {
      key: "merchant",
      label: "Merchant",
    },
    {
      key: "date",
      label: "Date",
    },
    {
      key: "amount",
      label: "Amount",
    },
    {
      key: "category",
      label: "Category",
    },
    {
      key: "payment_method",
      label: "Method",
    },
    {
      key: "status",
      label: "Status",
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            {head.map((h) => (
              <th key={String(h.key)} className="pb-3 pr-4 font-medium">
                <button
                  onClick={() =>
                    setSort((s) => ({
                      key: h.key,
                      asc: s.key === h.key ? !s.asc : true,
                    }))
                  }
                  className="transition-colors hover:text-foreground"
                >
                  {h.label}

                  {sort.key === h.key ? (sort.asc ? " ↑" : " ↓") : ""}
                </button>
              </th>
            ))}

            {actions && <th />}
          </tr>
        </thead>

        <tbody>
          {sorted.map((r, i) => (
            <tr key={r.id ?? `${r.merchant}-${i}`} className="border-t border-glass-border">
              <td className="py-3 pr-4 font-medium">{r.merchant}</td>

              <td className="py-3 pr-4 text-muted-foreground">{formatDate(r.date)}</td>

              <td
                className={`py-3 pr-4 font-medium ${
                  r.type === "income" ? "text-emerald-400" : "text-foreground"
                }`}
              >
                {r.type === "income" ? "+" : "−"}

                {formatMoney(r.amount, currency)}
              </td>

              <td className="py-3 pr-4">
                <span
                  className="rounded-full px-2.5 py-1 text-xs"
                  style={{
                    background: `${categoryColor(r.category)}22`,
                    color: categoryColor(r.category),
                  }}
                >
                  {r.category}
                </span>
              </td>

              <td className="py-3 pr-4 text-muted-foreground">{r.payment_method}</td>

              <td className="py-3 pr-4 text-muted-foreground">{r.status}</td>

              {actions && <td className="py-3 text-right">{actions(r, i)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      {!rows.length && (
        <p className="py-10 text-center text-sm text-muted-foreground">No transactions to show.</p>
      )}
    </div>
  );
}

/* =========================================================
   CATEGORY BARS
   ========================================================= */

export function CategoryBars({
  data,
  currency,
}: {
  data: {
    name: string;
    value: number;
  }[];
  currency?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="grid gap-3.5">
      {data.slice(0, 8).map((c, i) => (
        <div key={c.name}>
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background: categoryColor(c.name),
                }}
              />

              {c.name}
            </span>

            <span className="text-muted-foreground">{formatMoney(c.value, currency)}</span>
          </div>

          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: i * 0.05,
            }}
          >
            <ProgressBar value={(c.value / max) * 100} color={categoryColor(c.name)} />
          </motion.div>
        </div>
      ))}

      {!data.length && <p className="text-sm text-muted-foreground">No spending data yet.</p>}
    </div>
  );
}

/* =========================================================
   CHARTS
   ========================================================= */

export function ExpenseCharts({
  rows,
  currency = "INR",
}: {
  rows: ExtractedTxn[];
  currency?: string;
}) {
  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();

    rows
      .filter((row) => row.type === "expense")
      .forEach((row) => {
        const category = row.category?.trim() || "Other";
        totals.set(category, (totals.get(category) || 0) + Math.abs(row.amount));
      });

    return [...totals.entries()]
      .map(([name, value]) => ({
        name,
        value: Number(value.toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  if (!rows.length || !categoryData.length) {
    return (
      <GlassCard>
        <p className="text-sm font-medium">Spending analysis</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No expense transactions were detected in the uploaded file.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="grid gap-4">
      {/* 1. EXPENSE PICTOGRAPH */}
      <GlassCard>
        <div className="mb-4">
          <p className="text-sm font-medium">Spending by category</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Hover over a section to see the category and exact amount.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.9fr)]">
          <div className="h-[320px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={72}
                  outerRadius={118}
                  paddingAngle={3}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={categoryColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatMoney(Number(value), currency)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid content-center gap-2.5">
            {categoryData.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-xl border border-glass-border px-4 py-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: categoryColor(entry.name) }}
                  />
                  <span className="truncate">{entry.name}</span>
                </span>
                <span className="ml-3 shrink-0 text-sm font-medium">
                  {formatMoney(entry.value, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* 2. WHERE THE USER SPENT THE MOST */}
      <GlassCard>
        <div className="mb-4">
          <p className="text-sm font-medium">Where you spent the most</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Categories are ordered from highest to lowest spending.
          </p>
        </div>

        <div className="h-[360px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData.slice(0, 10)}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 20, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                type="number"
                tick={{ fontSize: 11 }}
                tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
              />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [formatMoney(Number(value), currency), "Spent"]} />
              <Bar dataKey="value" radius={[0, 7, 7, 0]}>
                {categoryData.slice(0, 10).map((entry) => (
                  <Cell key={entry.name} fill={categoryColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

/* =========================================================
   AI REPORT
   ========================================================= */

export function ReportPanel({ report, currency }: { report: AnalysisReport; currency?: string }) {
  return (
    <div className="grid gap-4">
      <GlassCard>
        <p className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-secondary" />
          AI financial summary
        </p>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>
      </GlassCard>

      {!!report.insights?.length && (
        <GlassCard>
          <p className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-primary" />
            Insights
          </p>

          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {report.insights.map((text) => (
              <li key={text} className="flex gap-2">
                <span className="text-primary">•</span>

                {text}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      {!!report.suggestions?.length && (
        <GlassCard>
          <p className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="h-4 w-4 text-accent" />
            Saving suggestions
          </p>

          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {report.suggestions.map((text) => (
              <li key={text} className="flex gap-2">
                <span className="text-accent">→</span>

                {text}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

/* =========================================================
   AI CHAT
   ========================================================= */

export function AIChatBox({ rows }: { rows: ExtractedTxn[] }) {
  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  const context = useMemo(
    () =>
      rows
        .map(
          (row, index) =>
            `${index + 1}. Date: ${row.date} | Merchant: ${row.merchant} | Amount: ₹${row.amount} | Type: ${row.type} | Category: ${row.category} | Method: ${row.payment_method} | Status: ${row.status}`,
        )
        .join("\n"),
    [rows],
  );

  const askQuestion = async () => {
    const value = question.trim();

    if (!value || loading || !rows.length) {
      return;
    }

    const userMessage = {
      role: "user" as const,
      content: value,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);

    setQuestion("");

    setLoading(true);

    try {
      const result = await coachChat({
        data: {
          messages: nextMessages,
          context,
        },
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: result.reply,
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I couldn't answer that right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Which category did I spend the most on?",
    "Which merchant appears most often?",
    "What are my biggest transactions?",
    "Which expenses look recurring?",
  ];

  return (
    <GlassCard>
      <div className="mb-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Ask Finora AI
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          Ask questions about this uploaded statement.
        </p>
      </div>

      <div className="max-h-[350px] space-y-3 overflow-y-auto">
        {!messages.length && (
          <div className="rounded-2xl bg-foreground/[0.04] p-4 text-sm text-muted-foreground">
            Hi! I can answer questions about the transactions in your uploaded statement.
            <br />
            <span className="mt-2 block">
              I will only use the information found in your uploaded file.
            </span>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-auto max-w-[85%] rounded-2xl bg-primary/20 p-3 text-sm"
                : "max-w-[90%] rounded-2xl bg-foreground/[0.04] p-3 text-sm text-muted-foreground"
            }
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void askQuestion();
            }
          }}
          placeholder="Ask about your transactions..."
          disabled={loading}
          className="min-w-0 flex-1 rounded-2xl border border-glass-border bg-background/40 px-4 py-3 text-sm outline-none transition focus:border-primary"
        />

        <button
          type="button"
          onClick={() => void askQuestion()}
          disabled={loading || !question.trim()}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setQuestion(suggestion)}
            className="rounded-full border border-glass-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {loading && <p className="mt-3 text-xs text-muted-foreground">Finora AI is thinking…</p>}
    </GlassCard>
  );
}
