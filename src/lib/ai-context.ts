import { formatMoney, monthLabel } from "./format";
import type { Bill, Derived, Goal, Profile } from "./finora-data";

/** Builds a compact text snapshot of the user's real finances for the AI. */
export function buildFinanceContext(
  f: Derived & {
    txns: { merchant: string; amount: number; type: string; category: string; txn_date: string }[];
  },
  profile?: Profile | null,
  bills: Bill[] = [],
  goals: Goal[] = [],
) {
  const c = profile?.currency ?? "INR";
  if (!f.txns.length) return "The user has no transactions recorded yet.";

  return [
    `Currency: ${c}. Monthly income setting: ${formatMoney(profile?.monthly_income ?? 0, c)}.`,
    `All-time income ${formatMoney(f.income, c)}, expenses ${formatMoney(f.expenses, c)}, balance ${formatMoney(f.balance, c)}.`,
    `This month: income ${formatMoney(f.monthIncome, c)}, expenses ${formatMoney(f.monthExpense, c)}, savings ${formatMoney(f.savings, c)} (${Math.round(f.savingsRate)}% rate). Last month expenses ${formatMoney(f.prevExpense, c)}.`,
    `Financial health score: ${f.healthScore}/100 (${f.reasons.join("; ")}).`,
    `Category spend this month: ${f.categories.map((x) => `${x.name} ${formatMoney(x.value, c)}`).join(", ") || "none"}.`,
    `6-month expense trend: ${f.series.map((s) => `${monthLabel(s.key)} ${formatMoney(s.expense, c)}`).join(", ")}.`,
    `Budgets: ${f.budgetRows.map((b) => `${b.category} ${formatMoney(b.spent, c)}/${formatMoney(Number(b.amount), c)}`).join(", ") || "none set"}.`,
    `Goals: ${goals.map((g) => `${g.title} ${formatMoney(g.saved_amount, c)}/${formatMoney(g.target_amount, c)}`).join(", ") || "none"}.`,
    `Recurring bills: ${bills.map((b) => `${b.name} ${formatMoney(b.amount, c)} on day ${b.due_day}`).join(", ") || "none"}.`,
    `Recent transactions: ${f.txns
      .slice(0, 60)
      .map(
        (t) =>
          `${t.txn_date} ${t.merchant} ${t.type === "income" ? "+" : "-"}${t.amount} ${t.category}`,
      )
      .join("; ")}.`,
  ].join("\n");
}
