import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  FileUp,
  MoreVertical,
  Laptop,
  Car,
  Bike,
  Plane,
  GraduationCap,
  Home,
  Heart,
  ShieldCheck,
  Plus,
  PiggyBank,
  Sparkles,
  WalletCards,
  UploadCloud,
  Store,
  Utensils,
  ShoppingBasket,
  ShoppingBag,
  Tv,
  Zap,
  ReceiptText,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { EmptyState, Field, GlassCard, Modal, ProgressBar, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { CATEGORIES, categoryColor, formatDate, formatMoney, monthLabel } from "@/lib/format";
import {
  addTimelineEvent,
  useBills,
  useFinance,
  useProfile,
  useReports,
  useUpsert,
} from "@/lib/finora-data";
import type { AnalysisReport } from "@/lib/ai.functions";
import { mkHead } from "@/lib/seo";
import { domainLogoUrl, findMerchant, normalizeMerchantText } from "@/lib/merchant";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: mkHead(
    "Dashboard — Finora AI",
    "Your financial health, spending, budgets, goals and AI insights in one place.",
  ),
  component: () => (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  ),
});

function QuickAdd({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false);
  const upsert = useUpsert("transactions");
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    type: "expense",
    category: "Food",
    txn_date: new Date().toISOString().slice(0, 10),
    payment_method: "UPI",
  });

  const save = async () => {
    if (!form.merchant.trim() || !Number(form.amount)) return;
    await upsert.mutateAsync({
      ...form,
      merchant: form.merchant.trim(),
      amount: Number(form.amount),
      source: "manual",
    });
    await addTimelineEvent(
      "💳",
      `Added ${form.merchant.trim()}`,
      `${formatMoney(Number(form.amount), currency)} · ${form.category}`,
    );
    setOpen(false);
    setForm({ ...form, merchant: "", amount: "" });
  };

  return (
    <>
      <GlowButton onClick={() => setOpen(true)} className="px-5">
        <Plus className="h-4 w-4" /> Quick add
      </GlowButton>
      <Modal open={open} onClose={() => setOpen(false)} title="Add transaction">
        <div className="grid gap-3">
          <Field label="Merchant">
            <input
              className={inputClass}
              value={form.merchant}
              onChange={(e) => setForm({ ...form, merchant: e.target.value })}
              placeholder="Swiggy"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Amount">
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Type">
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="expense" className="bg-background">
                  Expense
                </option>
                <option value="income" className="bg-background">
                  Income
                </option>
              </select>
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-background">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputClass}
                value={form.txn_date}
                onChange={(e) => setForm({ ...form, txn_date: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <GlowButton onClick={save} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save"}
            </GlowButton>
          </div>
        </div>
      </Modal>
    </>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  tone: "blue" | "green" | "pink" | "purple";
  delay?: number;
}) {
  const tones = {
    blue: "bg-blue-500/15 text-blue-400 ring-blue-400/10",
    green: "bg-emerald-400/15 text-emerald-400 ring-emerald-400/10",
    pink: "bg-rose-400/15 text-rose-400 ring-rose-400/10",
    purple: "bg-violet-500/15 text-violet-300 ring-violet-400/10",
  };

  return (
    <GlassCard delay={delay} className="card-hover !rounded-[22px] !p-4 sm:!p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{label}</p>
          <p className="mt-2 truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs">
              <ArrowUpRight className="h-3 w-3 text-emerald-400" /> {hint}
            </p>
          )}
        </div>
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ring-1 ${tones[tone]}`}
        >
          {icon}
        </span>
      </div>
    </GlassCard>
  );
}

function SpendingChart({
  series,
  currency,
}: {
  series: { key: string; expense: number; income: number }[];
  currency: string;
}) {
  const max = Math.max(1, ...series.map((item) => item.expense));
  const selected = series[series.length - 1];

  return (
    <GlassCard className="h-full !rounded-[22px] !p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold">Monthly Spending Overview</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Your expense trend over the last 6 months
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-glass-border bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground">
          This Month <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="relative mt-5 h-[250px]">
        <div className="pointer-events-none absolute inset-x-0 top-2 bottom-7 flex flex-col justify-between">
          {[80, 60, 40, 20, 0].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <span className="w-7 text-right text-[10px] text-muted-foreground">
                {n === 0 ? "₹0" : `₹${n}K`}
              </span>
              <div className="h-px flex-1 bg-foreground/[0.07]" />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-9 top-3 bottom-5 flex items-end justify-between gap-2 sm:gap-4">
          {series.map((item, index) => {
            const height = Math.max(8, (item.expense / max) * 82);
            const active = index === series.length - 1;
            return (
              <div
                key={item.key}
                className="group relative flex h-full flex-1 flex-col items-center justify-end"
              >
                {active && selected && (
                  <div className="absolute bottom-[calc(82%+8px)] rounded-lg border border-primary/40 bg-background px-2 py-1 text-[10px] text-foreground shadow-lg">
                    {formatMoney(selected.expense, currency)}
                  </div>
                )}
                <div
                  title={formatMoney(item.expense, currency)}
                  className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${active ? "bg-gradient-to-t from-primary/70 via-violet-500 to-primary" : "bg-gradient-to-t from-primary/35 to-primary/80 group-hover:from-primary/60"}`}
                  style={{ height: `${height}%` }}
                />
                <span className="mt-2 text-[10px] text-muted-foreground">
                  {monthLabel(item.key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}

function CategoryDonut({
  data,
  currency,
}: {
  data: { name: string; value: number; delta: number | null }[];
  currency: string;
}) {
  const top = data.filter((item) => item.value > 0).slice(0, 6);
  const total = top.reduce((sum, item) => sum + item.value, 0);
  let cursor = 0;
  const segments = top.map((item) => {
    const start = cursor;
    cursor += total ? (item.value / total) * 100 : 0;
    return `${categoryColor(item.name)} ${start}% ${cursor}%`;
  });
  const background = segments.length
    ? `conic-gradient(${segments.join(",")})`
    : "conic-gradient(rgba(255,255,255,.10) 0 100%)";

  return (
    <GlassCard className="h-full !rounded-[22px] !p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-semibold">Expense by Category</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Where your money is going in the active month
          </p>
        </div>
        <Link to="/reports" className="text-xs text-primary hover:underline">
          View report
        </Link>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
          style={{ background }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-background/95 text-center ring-1 ring-white/5">
            <span className="font-display text-lg font-bold">{formatMoney(total, currency)}</span>
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2.5">
          {top.map((item) => {
            const pct = total ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: categoryColor(item.name) }}
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
                <span className="font-medium">{formatMoney(item.value, currency)}</span>
                <span className="w-7 text-right text-muted-foreground">{pct}%</span>
              </div>
            );
          })}
          {!top.length && (
            <p className="text-xs text-muted-foreground">
              No expenses recorded in the active month.
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function HealthGauge({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const circumference = Math.PI * 80;
  const dash = (safeScore / 100) * circumference;
  const label =
    safeScore >= 80
      ? "Excellent"
      : safeScore >= 65
        ? "Good"
        : safeScore >= 45
          ? "Fair"
          : "Needs attention";

  return (
    <div className="relative mx-auto mt-2 w-full max-w-[220px]">
      <svg viewBox="0 0 200 120" className="w-full overflow-visible">
        <defs>
          <linearGradient id="finora-health" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef476f" />
            <stop offset="55%" stopColor="#ffd166" />
            <stop offset="100%" stopColor="#57cc99" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="rgba(255,255,255,.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#finora-health)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="font-display text-4xl font-bold">{safeScore}</div>
        <div className="text-xs text-muted-foreground">/ 100</div>
        <div className="mt-1 text-sm font-medium text-emerald-400">{label} 👍</div>
      </div>
    </div>
  );
}

function categoryIconFor(category: string) {
  const value = normalizeMerchantText(category);

  if (value.includes("food") || value.includes("dining")) return Utensils;
  if (value.includes("grocery")) return ShoppingBasket;
  if (value.includes("shopping")) return ShoppingBag;
  if (value.includes("transport")) return Car;
  if (value.includes("travel")) return Plane;
  if (value.includes("subscription") || value.includes("entertainment")) return Tv;
  if (value.includes("payment")) return WalletCards;
  if (value.includes("recharge") || value.includes("utility") || value.includes("electric"))
    return Zap;
  if (value.includes("rent") || value.includes("home")) return Home;
  if (value.includes("education")) return GraduationCap;
  if (value.includes("health")) return Heart;
  if (value.includes("bill")) return ReceiptText;

  return Store;
}

function BrandIcon({
  name,
  category,
  size = "md",
}: {
  name: string;
  category?: string;
  size?: "sm" | "md";
}) {
  const merchant = findMerchant(name);
  const fallbackCategory = category || merchant?.category || "Other";
  const Icon = categoryIconFor(fallbackCategory);
  const [logoFailed, setLogoFailed] = useState(false);
  const dimensions = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  return (
    <span
      title={merchant ? `${merchant.name} · ${merchant.category}` : `${name} · ${fallbackCategory}`}
      className={`relative grid ${dimensions} shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/[0.07] text-muted-foreground ring-1 ring-white/10`}
    >
      {merchant && !logoFailed ? (
        <img
          src={domainLogoUrl(merchant.domain)}
          alt={`${merchant.name} logo`}
          className="h-[70%] w-[70%] rounded-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      )}
    </span>
  );
}

function categoryBrandName(
  category: string,
  transactions: { merchant: string; category?: string; type: string }[],
) {
  const value = normalizeMerchantText(category);
  const matching = transactions.find(
    (t) =>
      t.type === "expense" &&
      normalizeMerchantText(String(t.category || "")) === value &&
      Boolean(findMerchant(String(t.merchant || ""))),
  );

  if (matching?.merchant) return matching.merchant;
  if (value.includes("food") || value.includes("dining")) return "Swiggy";
  if (value.includes("transport")) return "Uber";
  if (value.includes("shopping")) return "Amazon";
  if (value.includes("entertainment") || value.includes("subscription")) return "Netflix";
  if (value.includes("bill") || value.includes("utility")) return "Airtel";
  return category;
}

function CategoryIcon({
  category,
  merchantName,
  size = "md",
}: {
  category: string;
  merchantName?: string;
  size?: "sm" | "md";
}) {
  return <BrandIcon name={merchantName || category} category={category} size={size} />;
}

function GoalIcon({ title }: { title: string }) {
  const value = title.toLowerCase();
  const Icon =
    value.includes("laptop") || value.includes("computer")
      ? Laptop
      : value.includes("car")
        ? Car
        : value.includes("bike")
          ? Bike
          : value.includes("vacation") || value.includes("travel")
            ? Plane
            : value.includes("education")
              ? GraduationCap
              : value.includes("home")
                ? Home
                : value.includes("wedding")
                  ? Heart
                  : value.includes("emergency") || value.includes("insurance")
                    ? ShieldCheck
                    : null;

  if (!Icon) return <BrandIcon name={title} />;

  return (
    <span
      title={title}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground/[0.07] text-primary ring-1 ring-white/10"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: bills = [] } = useBills();
  const { data: reports = [] } = useReports();
  const f = useFinance();
  const currency = profile?.currency ?? "INR";
  const latestReport = reports[0];
  const recent = f.txns.slice(0, 5);
  const budgetRows = f.budgetRows.slice(0, 3);
  const goals = f.goalProgress.slice(0, 1);
  const upcomingBills = bills.slice(0, 3);

  const [liveReport, setLiveReport] = useState<import("@/lib/ai.functions").AnalysisReport | null>(
    null,
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("finora_latest_ai_report");
      if (saved) setLiveReport(JSON.parse(saved) as AnalysisReport);
    } catch {
      // Ignore stale local AI report data.
    }
  }, []);

  const expenseChange =
    f.expenseDelta === null
      ? "No comparison yet"
      : `${Math.abs(Math.round(f.expenseDelta))}% vs last month`;
  const expenseArrow = f.expenseDelta !== null && f.expenseDelta < 0 ? "↓" : "↑";
  const aiText =
    liveReport?.summary ||
    latestReport?.summary ||
    (f.categories[0]
      ? `You spent ${formatMoney(f.categories[0].value, currency)} on ${f.categories[0].name.toLowerCase()} this month. Review your top category and keep your savings rate in focus.`
      : "Upload a statement to unlock personalised spending insights and AI-powered recommendations.");
  const healthScore =
    liveReport?.health_score && liveReport.health_score > 0
      ? liveReport.health_score
      : f.healthScore;
  const healthReason =
    liveReport?.health_reasons?.[0] ||
    f.reasons[0] ||
    "Add transactions, budgets or goals to build your score.";
  const goal = goals[0];

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Your financial overview
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Good morning, {(profile?.full_name || "there").split(" ")[0]}!{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here's what's happening with your finances today.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/upload"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 text-sm font-medium text-primary transition hover:bg-primary/10"
          >
            <FileUp className="h-4 w-4" />
            Upload Statement
          </Link>
          <QuickAdd currency={currency} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Balance"
          value={formatMoney(f.balance, currency)}
          hint="All time income − expenses"
          icon={<WalletCards className="h-5 w-5" />}
          tone="blue"
        />
        <MetricCard
          label="Income"
          value={formatMoney(f.monthIncome, currency)}
          hint={f.usingLatestStatementMonth ? f.activeMonth : "This month"}
          icon={<ArrowDownLeft className="h-5 w-5" />}
          tone="green"
          delay={0.04}
        />
        <MetricCard
          label="Expenses"
          value={formatMoney(f.monthExpense, currency)}
          hint={`${expenseArrow} ${expenseChange}${f.usingLatestStatementMonth ? ` · ${f.activeMonth}` : ""}`}
          icon={<ArrowDownRight className="h-5 w-5" />}
          tone="pink"
          delay={0.08}
        />
        <MetricCard
          label="Savings"
          value={formatMoney(f.savings, currency)}
          hint={`${Math.round(f.savingsRate)}% savings rate${f.usingLatestStatementMonth ? ` · ${f.activeMonth}` : ""}`}
          icon={<PiggyBank className="h-5 w-5" />}
          tone="purple"
          delay={0.12}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <SpendingChart series={f.series} currency={currency} />
        </div>
        <div className="xl:col-span-4">
          <CategoryDonut data={f.categoryDelta} currency={currency} />
        </div>
        <GlassCard className="xl:col-span-3 !rounded-[22px] !p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-display text-sm font-semibold">Financial Health Score</p>
              <p className="mt-1 text-xs text-muted-foreground">Based on your recent activity</p>
            </div>
            <button
              className="rounded-lg p-1 text-muted-foreground hover:bg-foreground/[0.05]"
              aria-label="More health options"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
          <HealthGauge score={healthScore} />
          <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
            {healthReason}
          </p>
          <Link
            to="/reports"
            className="mt-4 flex h-10 items-center justify-center rounded-xl border border-glass-border bg-foreground/[0.03] text-xs font-medium text-primary transition hover:bg-primary/10"
          >
            View Insights <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <GlassCard className="xl:col-span-5 !rounded-[22px] !p-5">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Recent Transactions</p>
            <Link to="/transactions" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-white/[0.06]">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <BrandIcon name={t.merchant} category={t.category} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.merchant}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t.category} · {formatDate(t.txn_date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                >
                  {t.type === "income" ? "+" : "−"}
                  {formatMoney(Number(t.amount), currency)}
                </span>
              </div>
            ))}
            {!recent.length && (
              <EmptyState
                title="No transactions yet"
                body="Upload a statement or add one manually to get started."
              />
            )}
          </div>
          {!!recent.length && (
            <Link
              to="/transactions"
              className="mt-4 flex items-center justify-center gap-1 border-t border-white/[0.06] pt-4 text-xs font-medium text-primary"
            >
              View All Transactions <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </GlassCard>

        <div className="grid gap-4 xl:col-span-4">
          <GlassCard className="!rounded-[22px] !p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Budget Progress</p>
              <Link to="/budget" className="text-xs text-primary">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-4">
              {budgetRows.map((b) => {
                const pct = Math.min(100, (b.spent / Math.max(1, Number(b.amount))) * 100);
                return (
                  <div key={b.id}>
                    <div className="mb-1.5 flex items-center gap-3 text-xs">
                      <CategoryIcon
                        category={b.category}
                        merchantName={categoryBrandName(b.category, f.txns)}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1 truncate">{b.category}</span>
                      <span className="text-muted-foreground">
                        {formatMoney(b.spent, currency)} / {formatMoney(Number(b.amount), currency)}
                      </span>
                    </div>
                    <ProgressBar
                      value={pct}
                      color={b.spent > Number(b.amount) ? "#F43F5E" : categoryColor(b.category)}
                      height={7}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {Math.round(pct)}% used
                    </p>
                  </div>
                );
              })}
              {!budgetRows.length && (
                <p className="text-xs text-muted-foreground">No budgets set for this month.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="!rounded-[22px] !p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Goal Progress</p>
              <Link to="/goals" className="text-xs text-primary">
                View all
              </Link>
            </div>
            {goal ? (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <GoalIcon title={goal.title} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{goal.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatMoney(goal.saved_amount, currency)} of{" "}
                        {formatMoney(goal.target_amount, currency)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 bg-gradient-to-r from-primary via-blue-400 to-violet-500 bg-clip-text text-sm font-bold text-transparent">
                    {Math.round(Math.min(100, Math.max(0, goal.pct)))}%
                  </span>
                </div>
                <div className="mt-4 h-[7px] w-full overflow-hidden rounded-full bg-foreground/[0.08]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-blue-400 to-violet-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, goal.pct))}%`,
                    }}
                  />
                </div>
                {goal.target_date && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Target: {formatDate(goal.target_date)}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                Create a savings goal to track progress here.
              </p>
            )}
          </GlassCard>
        </div>

        <div className="grid gap-4 xl:col-span-3">
          <GlassCard className="!rounded-[22px] !p-5">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Upcoming Bills</p>
              <Link to="/bills" className="text-xs text-primary">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex items-center gap-3">
                  <BrandIcon name={bill.name} category={bill.category} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{bill.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /> Due day {bill.due_day}
                    </p>
                  </div>
                  <span className="text-xs font-semibold">
                    {formatMoney(Number(bill.amount), currency)}
                  </span>
                </div>
              ))}
              {!upcomingBills.length && (
                <p className="text-xs text-muted-foreground">No bills tracked.</p>
              )}
            </div>
          </GlassCard>

          <GlassCard className="!rounded-[22px] !p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-2 font-display text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-secondary" /> AI Summary
              </p>
              <span className="rounded-full bg-secondary/10 px-2 py-1 text-[9px] font-semibold text-secondary">
                AI
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{aiText}</p>
            {liveReport?.insights?.[0] && (
              <p className="mt-2 text-[11px] text-primary">✦ {liveReport.insights[0]}</p>
            )}
            <Link
              to="/coach"
              className="mt-4 flex h-10 items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
            >
              Ask AI Coach
            </Link>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="!rounded-[22px] !p-4 sm:!p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-sm font-semibold">
                Upload your statements to get AI-powered insights
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Finora AI extracts transactions, categorises spending and refreshes this dashboard
                automatically.
              </p>
            </div>
          </div>
          <Link
            to="/upload"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 text-xs font-semibold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
          >
            <UploadCloud className="h-4 w-4" />
            Upload Statement
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
