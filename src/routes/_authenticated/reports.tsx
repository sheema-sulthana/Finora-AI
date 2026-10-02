import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import {
  EmptyState,
  GlassCard,
  PageHeader,
  Pill,
  ProgressBar,
  StatCard,
} from "@/components/app/ui";
import { CategoryBars, ReportPanel } from "@/components/app/analysis";
import { GlowButton } from "@/components/landing/GlowButton";
import { formatMoney, monthKey, monthLabel } from "@/lib/format";
import { buildFinanceContext } from "@/lib/ai-context";
import { generateReport, type AnalysisReport } from "@/lib/ai.functions";
import { useBills, useFinance, useGoals, useProfile, useReports } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/reports")({
  head: mkHead(
    "Reports & Analytics — Finora AI",
    "Weekly, monthly and yearly analytics on your income, expenses, categories, cash flow and savings.",
  ),
  component: () => (
    <AppLayout>
      <ReportsPage />
    </AppLayout>
  ),
});

type Period = "weekly" | "monthly" | "yearly";

function ReportsPage() {
  const { data: profile } = useProfile();
  const { data: bills = [] } = useBills();
  const { data: goals = [] } = useGoals();
  const { data: saved = [] } = useReports();
  const f = useFinance();
  const currency = profile?.currency ?? "INR";

  const [period, setPeriod] = useState<Period>("monthly");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const windowed = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (period === "weekly") start.setDate(now.getDate() - 7);
    else if (period === "monthly") start.setMonth(now.getMonth() - 1);
    else start.setFullYear(now.getFullYear() - 1);
    const iso = start.toISOString().slice(0, 10);
    const list = f.txns.filter((t) => t.txn_date >= iso);
    const income = list
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + Number(b.amount), 0);
    const expense = list
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + Number(b.amount), 0);
    const cats = new Map<string, number>();
    list
      .filter((t) => t.type === "expense")
      .forEach((t) => cats.set(t.category, (cats.get(t.category) ?? 0) + Number(t.amount)));
    return {
      count: list.length,
      income,
      expense,
      savings: income - expense,
      categories: [...cats.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    };
  }, [f.txns, period]);

  const yearly = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    f.txns.forEach((t) => {
      const k = monthKey(t.txn_date);
      const e = map.get(k) ?? { income: 0, expense: 0 };
      if (t.type === "income") e.income += Number(t.amount);
      else e.expense += Number(t.amount);
      map.set(k, e);
    });
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12);
  }, [f.txns]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const context = buildFinanceContext(f, profile, bills, goals);
      setReport(await generateReport({ data: { context, period } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the report");
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    const header = ["Month", "Income", "Expenses", "Net"];
    const lines = yearly.map(([k, v]) => [k, v.income, v.expense, v.income - v.expense].join(","));
    const url = URL.createObjectURL(
      new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "finora-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!f.txns.length) {
    return (
      <>
        <PageHeader
          title="Reports & Analytics"
          subtitle="Insights built from your own transactions."
        />
        <GlassCard>
          <EmptyState
            title="No data to report on yet"
            body="Upload a statement or add a transaction and your reports will build themselves."
          />
        </GlassCard>
      </>
    );
  }

  const max = Math.max(1, ...yearly.map(([, v]) => Math.max(v.income, v.expense)));

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Everything below is calculated from your own transactions."
        action={
          <div className="flex flex-wrap gap-2">
            <GlowButton variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" /> Excel/CSV
            </GlowButton>
            <GlowButton variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4" /> PDF
            </GlowButton>
            <GlowButton onClick={generate}>
              <Sparkles className="h-4 w-4" /> {busy ? "Analysing…" : "AI report"}
            </GlowButton>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
          <Pill key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p[0]!.toUpperCase() + p.slice(1)}
          </Pill>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Income" value={formatMoney(windowed.income, currency)} tone="success" />
        <StatCard
          label="Expenses"
          value={formatMoney(windowed.expense, currency)}
          tone="danger"
          delay={0.05}
        />
        <StatCard
          label="Net savings"
          value={formatMoney(windowed.savings, currency)}
          hint={`${windowed.count} transactions`}
          tone="accent"
          delay={0.1}
        />
        <StatCard label="Health score" value={`${f.healthScore}/100`} delay={0.15} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-medium">Income vs expenses</p>
          <div className="mt-6 flex h-56 items-stretch gap-2">
            {yearly.map(([k, v]) => (
              <div key={k} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div
                    className="w-1/2 rounded-t-lg bg-emerald-400/70"
                    style={{ height: `${(v.income / max) * 100}%`, minHeight: 3 }}
                    title={`Income ${formatMoney(v.income, currency)}`}
                  />
                  <div
                    className="w-1/2 rounded-t-lg bg-gradient-to-t from-primary/30 to-primary"
                    style={{ height: `${(v.expense / max) * 100}%`, minHeight: 3 }}
                    title={`Expenses ${formatMoney(v.expense, currency)}`}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{monthLabel(k)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <p className="text-sm font-medium">Category analysis</p>
          <div className="mt-4">
            <CategoryBars data={windowed.categories} currency={currency} />
          </div>
        </GlassCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-medium">Cash flow</p>
          <div className="mt-4 grid gap-3">
            {yearly.slice(-6).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>{monthLabel(k)}</span>
                  <span
                    className={v.income - v.expense >= 0 ? "text-emerald-400" : "text-rose-400"}
                  >
                    {formatMoney(v.income - v.expense, currency)}
                  </span>
                </div>
                <ProgressBar
                  value={Math.min(100, Math.abs((v.income - v.expense) / max) * 100)}
                  color={v.income - v.expense >= 0 ? "#34D399" : "#F43F5E"}
                />
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <p className="text-sm font-medium">Savings analysis</p>
          <p className="mt-3 text-sm text-muted-foreground">
            You saved {formatMoney(f.savings, currency)} this month, a {Math.round(f.savingsRate)}%
            savings rate. Predicted expenses next month: {formatMoney(f.predictedExpense, currency)}
            .
          </p>
          <div className="mt-4">
            <ProgressBar value={Math.max(0, Math.min(100, f.savingsRate))} color="#34D399" />
          </div>
        </GlassCard>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      {report && (
        <div className="mt-4">
          <ReportPanel report={report} currency={currency} />
        </div>
      )}

      {!!saved.length && (
        <GlassCard className="mt-4">
          <p className="text-sm font-medium">Saved AI reports</p>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
            {saved.slice(0, 5).map((r) => (
              <div key={r.id} className="rounded-2xl bg-foreground/[0.04] p-3">
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")} · {r.report_type}
                </p>
                <p className="mt-1 text-foreground/90">{r.summary}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </>
  );
}
