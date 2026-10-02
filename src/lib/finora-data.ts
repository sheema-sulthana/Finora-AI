import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Untyped view of the client for generic table helpers. */
const db = supabase as unknown as SupabaseClient;
import { monthKey } from "./format";

/* ---------------------------------- types --------------------------------- */

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  user_type: string | null;
  monthly_income: number;
  income_frequency: string;
  currency: string;
  income_source: string | null;
  financial_goals: string[];
  budget_preferences: Record<string, number>;
  notification_preferences: Record<string, boolean>;
  theme: string;
  language: string;
  onboarding_completed: boolean;
  health_score: number;
};

export type Txn = {
  id: string;
  user_id: string;
  account_id: string | null;
  merchant: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category: string;
  txn_date: string;
  payment_method: string;
  notes: string | null;
  status: string;
  source: string;
  created_at: string;
};

export type Account = {
  id: string;
  name: string;
  type: string;
  institution: string | null;
  balance: number;
  currency: string;
  color: string;
};

export type Budget = { id: string; month: string; category: string; amount: number };
export type Goal = {
  id: string;
  title: string;
  category: string;
  target_amount: number;
  saved_amount: number;
  target_date: string | null;
  monthly_contribution: number;
  status: string;
};
export type Bill = {
  id: string;
  name: string;
  kind: string;
  amount: number;
  category: string;
  due_day: number;
  next_due_date: string | null;
  autopay: boolean;
  active: boolean;
  last_paid_date: string | null;
};
export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};
export type TimelineEvent = {
  id: string;
  icon: string;
  title: string;
  description: string | null;
  event_date: string;
};
export type AiReport = {
  id: string;
  report_type: string;
  period: string | null;
  summary: string | null;
  insights: string[];
  suggestions: string[];
  predictions: Record<string, string | number>;
  comparison: Record<string, string | number>;
  health_score: number | null;
  created_at: string;
};

/* ---------------------------------- auth ---------------------------------- */

export function useUser() {
  return useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: 30_000,
  });
}

/* --------------------------------- queries -------------------------------- */

const table = <T>(name: string, order?: { col: string; asc?: boolean }) => ({
  queryKey: [name],
  queryFn: async () => {
    let q = db.from(name).select("*");
    if (order) q = q.order(order.col, { ascending: order.asc ?? false });
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as T[];
  },
});

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Profile | null;
    },
  });
}

export const useTransactions = () => useQuery(table<Txn>("transactions", { col: "txn_date" }));
export const useAccounts = () =>
  useQuery(table<Account>("accounts", { col: "created_at", asc: true }));
export const useBudgets = () => useQuery(table<Budget>("budgets", { col: "month" }));
export const useGoals = () => useQuery(table<Goal>("goals", { col: "created_at", asc: true }));
export const useBills = () => useQuery(table<Bill>("bills", { col: "due_day", asc: true }));
export const useNotifications = () =>
  useQuery(table<Notification>("notifications", { col: "created_at" }));
export const useTimeline = () =>
  useQuery(table<TimelineEvent>("timeline_events", { col: "event_date" }));
export const useReports = () => useQuery(table<AiReport>("ai_reports", { col: "created_at" }));

/* -------------------------------- realtime -------------------------------- */

const REALTIME_TABLES = [
  "transactions",
  "budgets",
  "goals",
  "bills",
  "accounts",
  "notifications",
  "timeline_events",
  "profiles",
];

export function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase.channel("finora-sync");
    REALTIME_TABLES.forEach((t) => {
      channel.on("postgres_changes", { event: "*", schema: "public", table: t }, () => {
        qc.invalidateQueries({ queryKey: [t === "profiles" ? "profile" : t] });
      });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}

/* -------------------------------- mutations ------------------------------- */

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useUpsert(name: string, invalidate?: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, unknown>) => {
      const payload = { ...row, user_id: await uid() };
      const { data, error } = await db.from(name).upsert(payload).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [name] });
      (invalidate ?? []).forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export function useUpdate(name: string, invalidate?: string[]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const user_id = await uid();

      const { data, error } = await db
        .from(name)
        .update(patch)
        .eq("id", id)
        .eq("user_id", user_id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Record not found or you do not have permission to update it");

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [name] });
      (invalidate ?? []).forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export function useUpsertMany(name: string, invalidate?: string[]) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rows: Record<string, unknown>[]) => {
      if (!rows.length) return [];

      const user_id = await uid();
      const payload = rows.map((row) => ({ ...row, user_id }));

      const { data, error } = await db.from(name).upsert(payload).select();

      if (error) throw error;
      return data ?? [];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [name] });
      (invalidate ?? []).forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
  });
}

export function useRemove(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from(name).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [name] }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Profile>) => {
      const id = await uid();
      const { error } = await db.from("profiles").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export async function addTimelineEvent(icon: string, title: string, description?: string) {
  await db
    .from("timeline_events")
    .insert({ user_id: await uid(), icon, title, description: description ?? null });
}

export async function addNotification(kind: string, title: string, body?: string) {
  await db.from("notifications").insert({ user_id: await uid(), kind, title, body: body ?? null });
}

export async function insertTransactions(rows: Partial<Txn>[]) {
  const user_id = await uid();
  const { error } = await db.from("transactions").insert(rows.map((r) => ({ ...r, user_id })));
  if (error) throw error;
}

/* --------------------------- derived calculations -------------------------- */

export type Derived = ReturnType<typeof computeFinance>;

export function computeFinance(txns: Txn[], budgets: Budget[], goals: Goal[]) {
  const now = new Date();
  const currentKey = monthKey(now);

  const byMonth = new Map<string, Txn[]>();
  txns.forEach((t) => {
    const k = monthKey(t.txn_date);
    byMonth.set(k, [...(byMonth.get(k) ?? []), t]);
  });

  /*
   * The dashboard should reflect the latest financial data the user has
   * actually uploaded. If the latest statement is from August while the
   * current calendar month is September, showing September as the active
   * month makes the dashboard appear empty even though transactions exist.
   *
   * The latest transaction month is therefore the active month whenever
   * transaction data is available. If there are no transactions yet, we
   * fall back to the current calendar month.
   */
  const latestTxnDate = txns
    .map((t) => t.txn_date)
    .filter(Boolean)
    .sort()
    .at(-1);

  const thisKey = latestTxnDate ? monthKey(latestTxnDate) : currentKey;

  const activeDate = latestTxnDate ? new Date(latestTxnDate) : now;

  const prevKey = monthKey(new Date(activeDate.getFullYear(), activeDate.getMonth() - 1, 1));

  const sum = (list: Txn[], type: Txn["type"]) =>
    list.filter((t) => t.type === type).reduce((a, b) => a + Number(b.amount), 0);

  const income = sum(txns, "income");
  const expenses = sum(txns, "expense");
  const balance = income - expenses;

  const cur = byMonth.get(thisKey) ?? [];
  const prev = byMonth.get(prevKey) ?? [];
  const monthIncome = sum(cur, "income");
  const monthExpense = sum(cur, "expense");
  const prevExpense = sum(prev, "expense");
  const savings = monthIncome - monthExpense;
  const savingsRate = monthIncome > 0 ? (savings / monthIncome) * 100 : 0;

  const catTotals = (list: Txn[]) => {
    const m = new Map<string, number>();
    list
      .filter((t) => t.type === "expense")
      .forEach((t) => m.set(t.category, (m.get(t.category) ?? 0) + Number(t.amount)));
    return m;
  };
  const categories = [...catTotals(cur).entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  const prevCategories = catTotals(prev);

  const categoryDelta = categories.map((c) => {
    const before = prevCategories.get(c.name) ?? 0;
    return { ...c, delta: before ? ((c.value - before) / before) * 100 : null };
  });

  const series = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(activeDate.getFullYear(), activeDate.getMonth() - (5 - i), 1);
    const k = monthKey(d);
    const list = byMonth.get(k) ?? [];
    return { key: k, expense: sum(list, "expense"), income: sum(list, "income") };
  });

  const budgetThisMonth = budgets.filter((b) => monthKey(b.month) === thisKey);
  const budgetTotal = budgetThisMonth.reduce((a, b) => a + Number(b.amount), 0);
  const budgetRows = budgetThisMonth.map((b) => ({
    ...b,
    spent: categories.find((c) => c.name === b.category)?.value ?? 0,
  }));
  const budgetRemaining = budgetTotal - monthExpense;

  const goalProgress = goals.map((g) => ({
    ...g,
    pct: g.target_amount > 0 ? Math.min(100, (g.saved_amount / g.target_amount) * 100) : 0,
    monthsLeft:
      g.monthly_contribution > 0
        ? Math.ceil((g.target_amount - g.saved_amount) / g.monthly_contribution)
        : null,
  }));

  // Financial health score
  let score = txns.length || budgetTotal || goals.length ? 50 : 0;
  score += Math.max(-20, Math.min(30, savingsRate * 0.6));
  if (budgetTotal > 0) score += monthExpense <= budgetTotal ? 12 : -12;
  if (txns.length > 10) score += 5;
  const overBudget = budgetRows.filter((b) => b.spent > Number(b.amount)).length;
  score -= overBudget * 4;
  if (goalProgress.some((g) => g.pct > 25)) score += 6;
  if (prevExpense && monthExpense < prevExpense) score += 5;
  const healthScore = score === 0 ? 0 : Math.max(5, Math.min(100, Math.round(score)));

  const reasons: string[] = [];
  if (txns.length)
    reasons.push(savingsRate >= 20 ? "Strong savings rate" : "Savings rate needs work");
  if (budgetTotal > 0)
    reasons.push(monthExpense <= budgetTotal ? "Spending within budget" : "Budget exceeded");
  if (categories[0]) reasons.push(`High ${categories[0].name.toLowerCase()} spending`);
  if (goalProgress.length) reasons.push("Active savings goals");

  return {
    income,
    expenses,
    balance,
    monthIncome,
    monthExpense,
    prevExpense,
    savings,
    savingsRate,
    categories,
    categoryDelta,
    series,
    budgetRows,
    budgetTotal,
    budgetRemaining,
    goalProgress,
    healthScore,
    reasons,
    thisKey,
    prevKey,
    activeMonth: activeDate.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    usingLatestStatementMonth: Boolean(latestTxnDate) && thisKey !== currentKey,
    expenseDelta: prevExpense ? ((monthExpense - prevExpense) / prevExpense) * 100 : null,
    predictedExpense: Math.round(
      series.slice(-3).reduce((a, b) => a + b.expense, 0) /
        Math.max(1, series.slice(-3).filter((s) => s.expense).length || 1),
    ),
  };
}

export function useFinance() {
  const txns = useTransactions();
  const budgets = useBudgets();
  const goals = useGoals();
  const derived = useMemo(
    () => computeFinance(txns.data ?? [], budgets.data ?? [], goals.data ?? []),
    [txns.data, budgets.data, goals.data],
  );
  return {
    ...derived,
    txns: txns.data ?? [],
    budgets: budgets.data ?? [],
    goals: goals.data ?? [],
    loading: txns.isLoading || budgets.isLoading || goals.isLoading,
  };
}

export async function signOutEverywhere() {
  await supabase.auth.signOut();
}
