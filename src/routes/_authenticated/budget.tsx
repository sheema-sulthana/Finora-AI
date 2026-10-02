import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import {
  EmptyState,
  Field,
  GlassCard,
  Modal,
  PageHeader,
  ProgressBar,
  StatCard,
  inputClass,
} from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { CATEGORIES, categoryColor, formatMoney, monthKey, monthLabel } from "@/lib/format";
import { useFinance, useProfile, useRemove, useUpsert } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/budget")({
  head: mkHead(
    "Budget Planner — Finora AI",
    "Set monthly and category budgets and track progress against your real spending.",
  ),
  component: () => (
    <AppLayout>
      <BudgetPage />
    </AppLayout>
  ),
});

const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

function BudgetPage() {
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? "INR";
  const f = useFinance();
  const upsert = useUpsert("budgets");
  const remove = useRemove("budgets");

  const [form, setForm] = useState<{
    id?: string;
    category: string;
    amount: string;
    month: string;
  } | null>(null);

  const overspent = f.budgetRows.filter((b) => b.spent > Number(b.amount));
  const history = [...new Set(f.budgets.map((b) => monthKey(b.month)))]
    .sort()
    .reverse()
    .slice(0, 6)
    .map((k) => ({
      key: k,
      total: f.budgets
        .filter((b) => monthKey(b.month) === k)
        .reduce((a, b) => a + Number(b.amount), 0),
      spent: f.series.find((s) => s.key === k)?.expense ?? 0,
    }));

  const save = async () => {
    if (!form || !Number(form.amount)) return;
    const payload: Record<string, unknown> = {
      category: form.category,
      amount: Number(form.amount),
      month: form.month,
    };
    if (form.id) payload["id"] = form.id;
    await upsert.mutateAsync(payload);
    setForm(null);
  };

  return (
    <>
      <PageHeader
        title="Budget Planner"
        subtitle="Budgets are matched against your actual transactions in real time."
        action={
          <GlowButton
            onClick={() => setForm({ category: "Food", amount: "", month: firstOfMonth() })}
          >
            <Plus className="h-4 w-4" /> New budget
          </GlowButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly budget" value={formatMoney(f.budgetTotal, currency)} />
        <StatCard
          label="Spent this month"
          value={formatMoney(f.monthExpense, currency)}
          tone="danger"
          delay={0.05}
        />
        <StatCard
          label="Remaining"
          value={formatMoney(f.budgetRemaining, currency)}
          tone={f.budgetRemaining >= 0 ? "success" : "danger"}
          delay={0.1}
        />
      </div>

      {!!overspent.length && (
        <GlassCard className="mt-4 border-rose-500/30">
          <p className="flex items-center gap-2 text-sm font-medium text-rose-400">
            <AlertTriangle className="h-4 w-4" /> Budget alerts
          </p>
          <ul className="mt-3 grid gap-1.5 text-sm text-muted-foreground">
            {overspent.map((b) => (
              <li key={b.id}>
                {b.category} exceeded by {formatMoney(b.spent - Number(b.amount), currency)}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <GlassCard className="mt-4" delay={0.05}>
        <p className="text-sm font-medium">Category budgets · {monthLabel(f.thisKey)}</p>
        <div className="mt-4 grid gap-4">
          {f.budgetRows.map((b) => {
            const pct = (b.spent / Math.max(1, Number(b.amount))) * 100;
            return (
              <div key={b.id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: categoryColor(b.category) }}
                    />
                    {b.category}
                  </span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span>
                      {formatMoney(b.spent, currency)} / {formatMoney(Number(b.amount), currency)} ·{" "}
                      {Math.round(pct)}%
                    </span>
                    <button
                      aria-label="Edit budget"
                      onClick={() =>
                        setForm({
                          id: b.id,
                          category: b.category,
                          amount: String(b.amount),
                          month: b.month.slice(0, 10),
                        })
                      }
                      className="hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Delete budget"
                      onClick={() => remove.mutate(b.id)}
                      className="hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
                <ProgressBar
                  value={pct}
                  color={pct > 100 ? "#F43F5E" : categoryColor(b.category)}
                />
              </div>
            );
          })}
          {!f.budgetRows.length && (
            <EmptyState
              title="Create your first budget"
              body="Set a monthly limit per category and Finora will track it against your spending."
              action={
                <GlowButton
                  onClick={() => setForm({ category: "Food", amount: "", month: firstOfMonth() })}
                >
                  Create budget
                </GlowButton>
              }
            />
          )}
        </div>
      </GlassCard>

      {!!history.length && (
        <GlassCard className="mt-4" delay={0.1}>
          <p className="text-sm font-medium">Budget history</p>
          <div className="mt-4 grid gap-3">
            {history.map((h) => (
              <div key={h.key} className="flex items-center justify-between text-sm">
                <span>{monthLabel(h.key)}</span>
                <span className="text-muted-foreground">
                  {formatMoney(h.spent, currency)} spent of {formatMoney(h.total, currency)}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit budget" : "New budget"}
      >
        {form && (
          <div className="grid gap-3">
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
            <Field label="Monthly amount">
              <input
                type="number"
                className={inputClass}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
            <Field label="Month">
              <input
                type="date"
                className={inputClass}
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
              />
            </Field>
            <div className="mt-2 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <GlowButton onClick={save}>Save budget</GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
