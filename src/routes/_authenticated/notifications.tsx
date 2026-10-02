import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Info,
  PiggyBank,
  ReceiptText,
  Sparkles,
  Target,
  TrendingUp,
  WalletCards,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import {
  useBills,
  useBudgets,
  useFinance,
  useGoals,
  useNotifications,
  useProfile,
  useReports,
  useTimeline,
  useTransactions,
} from "@/lib/finora-data";
import { formatMoney } from "@/lib/format";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: mkHead(
    "Notifications — Finora AI",
    "Financial alerts, reminders and recent activity from Finora AI.",
  ),
  component: () => (
    <AppLayout>
      <NotificationsPage />
    </AppLayout>
  ),
});

type AlertItem = {
  id: string;
  tone: "danger" | "warning" | "success" | "info" | "ai";
  icon: typeof Bell;
  title: string;
  body: string;
  action?: string;
  to?: string;
};

function NotificationsPage() {
  const { data: profile } = useProfile();
  const { data: bills = [] } = useBills();
  const { data: budgets = [] } = useBudgets();
  const { data: goals = [] } = useGoals();
  const { data: notifications = [] } = useNotifications();
  const { data: timeline = [] } = useTimeline();
  const { data: reports = [] } = useReports();
  const { txns, categories, monthExpense, monthIncome } = useFinance();
  const { data: transactions = [] } = useTransactions();

  const currency = profile?.currency || "INR";

  const alerts = useMemo<AlertItem[]>(() => {
    const money = (value: number) => formatMoney(Number(value) || 0, currency);
    const result: AlertItem[] = [];
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = todayKey.slice(0, 7);

    const getDueDate = (bill: (typeof bills)[number]) => {
      if (bill.next_due_date) {
        const date = new Date(bill.next_due_date);
        if (!Number.isNaN(date.getTime())) return date;
      }

      const day = Math.max(1, Math.min(31, Number(bill.due_day) || 1));
      let date = new Date(now.getFullYear(), now.getMonth(), day);
      if (date.getMonth() !== now.getMonth()) {
        date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
      if (date < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        date = new Date(now.getFullYear(), now.getMonth() + 1, day);
      }
      return date;
    };

    bills
      .filter((bill) => bill.active)
      .forEach((bill) => {
        const due = getDueDate(bill);
        const days = Math.ceil((due.getTime() - now.getTime()) / 86_400_000);
        const paidThisMonth = Boolean(
          bill.last_paid_date && bill.last_paid_date.slice(0, 7) === monthKey,
        );

        if (paidThisMonth) return;

        if (days < 0) {
          result.push({
            id: `bill-overdue-${bill.id}`,
            tone: "danger",
            icon: XCircle,
            title: `${bill.name} is overdue`,
            body: `${money(bill.amount)} · Payment was due ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`,
            action: "View bills",
            to: "/bills",
          });
        } else if (days <= 7) {
          result.push({
            id: `bill-due-${bill.id}`,
            tone: "warning",
            icon: CalendarClock,
            title: `${bill.name} payment due soon`,
            body: `${money(bill.amount)} · Due ${days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}.`,
            action: "View bill",
            to: "/bills",
          });
        }
      });

    const budgetMap = new Map<string, number>();
    budgets
      .filter((budget) => budget.month?.slice(0, 7) === monthKey)
      .forEach((budget) => {
        budgetMap.set(
          budget.category,
          (budgetMap.get(budget.category) ?? 0) + Number(budget.amount),
        );
      });

    categories.forEach((category) => {
      const budget = budgetMap.get(category.name) ?? 0;
      if (budget <= 0) return;
      const usage = (Number(category.value) / budget) * 100;

      if (usage >= 100) {
        result.push({
          id: `budget-over-${category.name}`,
          tone: "danger",
          icon: AlertTriangle,
          title: `${category.name} budget exceeded`,
          body: `${money(category.value)} spent against a ${money(budget)} budget.`,
          action: "Review budget",
          to: "/budget",
        });
      } else if (usage >= 80) {
        result.push({
          id: `budget-warning-${category.name}`,
          tone: "warning",
          icon: TrendingUp,
          title: `${category.name} budget is ${Math.round(usage)}% used`,
          body: `${money(category.value)} of ${money(budget)} has been used this month.`,
          action: "Review budget",
          to: "/budget",
        });
      }
    });

    goals.forEach((goal) => {
      const target = Number(goal.target_amount) || 0;
      const saved = Number(goal.saved_amount) || 0;
      if (target <= 0) return;
      const progress = Math.min(100, (saved / target) * 100);

      if (progress >= 100) {
        result.push({
          id: `goal-complete-${goal.id}`,
          tone: "success",
          icon: CheckCircle2,
          title: `${goal.title} goal reached`,
          body: `${money(saved)} saved against your ${money(target)} target.`,
          action: "View goal",
          to: "/goals",
        });
      } else if (progress >= 75) {
        result.push({
          id: `goal-progress-${goal.id}`,
          tone: "success",
          icon: Target,
          title: `${goal.title} is ${Math.round(progress)}% complete`,
          body: `${money(saved)} saved of ${money(target)}. You're getting close to the target.`,
          action: "View goal",
          to: "/goals",
        });
      }
    });

    if (monthIncome > 0 && monthExpense > monthIncome) {
      result.push({
        id: "cashflow-negative",
        tone: "danger",
        icon: CircleDollarSign,
        title: "Expenses are above income",
        body: `This month you have ${money(monthExpense)} in expenses against ${money(monthIncome)} in income.`,
        action: "View transactions",
        to: "/transactions",
      });
    }

    if (categories[0] && txns.length >= 5) {
      result.push({
        id: "top-category",
        tone: "info",
        icon: CreditCard,
        title: `${categories[0].name} is your top spending category`,
        body: `${money(categories[0].value)} has been spent here this month.`,
        action: "View transactions",
        to: "/transactions",
      });
    }

    const latestReport = reports[0];
    if (latestReport?.summary) {
      result.push({
        id: `ai-report-${latestReport.id}`,
        tone: "ai",
        icon: Sparkles,
        title: "New Finora AI insight",
        body: latestReport.summary,
        action: "View reports",
        to: "/reports",
      });
    }

    notifications
      .filter((item) => !item.read)
      .slice(0, 3)
      .forEach((item) => {
        result.push({
          id: `notification-${item.id}`,
          tone: "info",
          icon: Bell,
          title: item.title,
          body: item.body || "You have a new Finora notification.",
          ...(item.link ? { action: "Open", to: item.link } : {}),
        });
      });

    return result.slice(0, 8);
  }, [
    bills,
    budgets,
    goals,
    notifications,
    reports,
    categories,
    txns.length,
    monthExpense,
    monthIncome,
    currency,
  ]);

  const timelineItems = useMemo(
    () =>
      [...timeline]
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        .slice(0, 12),
    [timeline],
  );

  const recentTransactionCount = transactions.filter((transaction) => {
    const date = new Date(transaction.txn_date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= cutoff;
  }).length;

  return (
    <div className="space-y-5 pb-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Stay on top</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Important reminders and insights generated from your real financial activity.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <section className="rounded-[28px] border border-white/10 bg-card/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Alerts</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Bills, budgets, goals and spending activity.
              </p>
            </div>
            <div className="flex h-9 min-w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-semibold text-primary">
              {alerts.length}
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-background/20 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold">You're all caught up</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                No urgent bill, budget, goal or spending alerts were detected from your current
                data.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alert.icon;
                const tone =
                  alert.tone === "danger"
                    ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-300"
                    : alert.tone === "warning"
                      ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-300"
                      : alert.tone === "success"
                        ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-300"
                        : alert.tone === "ai"
                          ? "border-violet-400/20 bg-violet-400/[0.06] text-violet-300"
                          : "border-primary/20 bg-primary/[0.06] text-primary";

                const card = (
                  <div
                    className={`group rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.035] ${tone}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-black/10">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                          {alert.to && (
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{alert.body}</p>
                        {alert.action && (
                          <p className="mt-3 text-xs font-medium text-primary">{alert.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );

                return alert.to ? (
                  <Link
                    key={alert.id}
                    to={alert.to}
                    className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-2xl"
                  >
                    {card}
                  </Link>
                ) : (
                  <div key={alert.id}>{card}</div>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-white/10 bg-card/60 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">AI timeline</h2>
              <p className="mt-1 text-xs text-muted-foreground">Recent activity across Finora.</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/20 bg-violet-400/10 text-violet-300">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>

          {timelineItems.length === 0 ? (
            <div className="flex min-h-[330px] flex-col items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-background/20 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Bell className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold">Your timeline is ready</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Add a transaction, goal, bill or statement and Finora will record the activity here.
              </p>
            </div>
          ) : (
            <div className="relative max-h-[570px] overflow-y-auto pr-1">
              <div className="absolute bottom-2 left-5 top-2 w-px bg-gradient-to-b from-primary/30 via-white/10 to-transparent" />
              <div className="space-y-1">
                {timelineItems.map((item) => {
                  const date = new Date(item.event_date);
                  const validDate = !Number.isNaN(date.getTime());
                  return (
                    <div
                      key={item.id}
                      className="relative flex gap-4 rounded-2xl p-3 transition-colors hover:bg-white/[0.025]"
                    >
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-card text-base shadow-lg">
                        {item.icon || "•"}
                      </div>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {validDate
                            ? date.toLocaleString([], {
                                day: "numeric",
                                month: "short",
                                hour: "numeric",
                                minute: "2-digit",
                              })
                            : "Recent activity"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link
          to="/bills"
          className="group rounded-2xl border border-white/10 bg-card/50 p-4 transition-all hover:border-primary/20 hover:bg-card/70"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Bills</p>
              <p className="text-xs text-muted-foreground">Review upcoming payments</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link
          to="/budget"
          className="group rounded-2xl border border-white/10 bg-card/50 p-4 transition-all hover:border-primary/20 hover:bg-card/70"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <WalletCards className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Budget</p>
              <p className="text-xs text-muted-foreground">Check monthly limits</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
        <Link
          to="/goals"
          className="group rounded-2xl border border-white/10 bg-card/50 p-4 transition-all hover:border-primary/20 hover:bg-card/70"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Goals</p>
              <p className="text-xs text-muted-foreground">Track your savings</p>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {recentTransactionCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          {recentTransactionCount} transaction{recentTransactionCount === 1 ? "" : "s"} recorded in
          the last 7 days.
        </div>
      )}
    </div>
  );
}
