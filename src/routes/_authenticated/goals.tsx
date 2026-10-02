import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { EmptyState, Field, GlassCard, Modal, PageHeader, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { formatDate, formatMoney } from "@/lib/format";
import {
  addTimelineEvent,
  useFinance,
  useProfile,
  useRemove,
  useUpdate,
  useUpsert,
} from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/goals")({
  head: mkHead(
    "Goals — Finora AI",
    "Track savings goals like an emergency fund, laptop or vacation with live progress and completion estimates.",
  ),
  component: () => (
    <AppLayout>
      <GoalsPage />
    </AppLayout>
  ),
});

const GOAL_CATEGORIES = [
  "Emergency Fund",
  "Laptop",
  "Vacation",
  "Education",
  "Bike",
  "House",
  "Custom",
];

type GoalForm = {
  id?: string;
  title: string;
  category: string;
  target_amount: string;
  saved_amount: string;
  monthly_contribution: string;
  target_date: string;
};

function GoalsPage() {
  const { data: profile } = useProfile();
  const currency = profile?.currency ?? "INR";
  const f = useFinance();
  const upsert = useUpsert("goals");
  const update = useUpdate("goals");
  const remove = useRemove("goals");

  const [form, setForm] = useState<GoalForm | null>(null);
  const [topUp, setTopUp] = useState<{
    id: string;
    title: string;
    saved: number;
    amount: string;
  } | null>(null);

  const blank = (): GoalForm => ({
    title: "",
    category: "Emergency Fund",
    target_amount: "",
    saved_amount: "0",
    monthly_contribution: "",
    target_date: "",
  });

  const save = async () => {
    if (!form || !form.title || !Number(form.target_amount)) return;
    const payload: Record<string, unknown> = {
      title: form.title,
      category: form.category,
      target_amount: Number(form.target_amount),
      saved_amount: Number(form.saved_amount) || 0,
      monthly_contribution: Number(form.monthly_contribution) || 0,
      target_date: form.target_date || null,
      status: "active",
    };
    if (form.id) payload["id"] = form.id;
    await upsert.mutateAsync(payload);
    setForm(null);
  };

  const addSavings = async () => {
    if (!topUp) return;

    const amount = Number(topUp.amount);

    if (!Number.isFinite(amount) || amount <= 0) return;

    const currentSaved = Number(topUp.saved) || 0;
    const nextSaved = currentSaved + amount;

    try {
      await update.mutateAsync({
        id: topUp.id,
        patch: { saved_amount: nextSaved },
      });

      await addTimelineEvent("🎯", `Added to ${topUp.title}`, formatMoney(amount, currency));

      setTopUp(null);
    } catch (error) {
      console.error("Failed to add savings:", error);
    }
  };

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="Every goal here is yours — progress updates as you add savings."
        action={
          <GlowButton onClick={() => setForm(blank())}>
            <Plus className="h-4 w-4" /> New goal
          </GlowButton>
        }
      />

      {!f.goalProgress.length ? (
        <GlassCard>
          <EmptyState
            icon={<Target className="h-6 w-6" />}
            title="Create your first financial goal"
            body="Emergency fund, a new laptop, a trip — set a target and Finora tracks the rest."
            action={<GlowButton onClick={() => setForm(blank())}>Create goal</GlowButton>}
          />
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {f.goalProgress.map((g, i) => (
            <GlassCard key={g.id} delay={i * 0.04} className="card-hover">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">{g.category}</p>
                </div>
                <div className="flex gap-1 text-muted-foreground">
                  <button
                    aria-label="Edit goal"
                    onClick={() =>
                      setForm({
                        id: g.id,
                        title: g.title,
                        category: g.category,
                        target_amount: String(g.target_amount),
                        saved_amount: String(g.saved_amount),
                        monthly_contribution: String(g.monthly_contribution),
                        target_date: g.target_date ?? "",
                      })
                    }
                    className="grid h-8 w-8 place-items-center rounded-xl hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete goal"
                    onClick={() => remove.mutate(g.id)}
                    className="grid h-8 w-8 place-items-center rounded-xl hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {formatMoney(g.saved_amount, currency)} of{" "}
                    {formatMoney(g.target_amount, currency)}
                  </span>
                  <span>{Math.round(g.pct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_12px_hsl(var(--primary)/0.35)] transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(g.pct) || 0))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {g.monthsLeft !== null
                    ? `≈ ${g.monthsLeft} month${g.monthsLeft === 1 ? "" : "s"} to go at ${formatMoney(g.monthly_contribution, currency)}/mo`
                    : "Set a monthly contribution to estimate completion"}
                  {g.target_date ? ` · target ${formatDate(g.target_date)}` : ""}
                </span>
                <GlowButton
                  variant="outline"
                  onClick={() =>
                    setTopUp({ id: g.id, title: g.title, saved: g.saved_amount, amount: "" })
                  }
                >
                  Add savings
                </GlowButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit goal" : "New goal"}
      >
        {form && (
          <div className="grid gap-3">
            <Field label="Title">
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="New laptop"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Category">
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {GOAL_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-background">
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Target amount">
                <input
                  type="number"
                  className={inputClass}
                  value={form.target_amount}
                  onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
                />
              </Field>
              <Field label="Already saved">
                <input
                  type="number"
                  className={inputClass}
                  value={form.saved_amount}
                  onChange={(e) => setForm({ ...form, saved_amount: e.target.value })}
                />
              </Field>
              <Field label="Monthly contribution">
                <input
                  type="number"
                  className={inputClass}
                  value={form.monthly_contribution}
                  onChange={(e) => setForm({ ...form, monthly_contribution: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Target date">
              <input
                type="date"
                className={inputClass}
                value={form.target_date}
                onChange={(e) => setForm({ ...form, target_date: e.target.value })}
              />
            </Field>
            <div className="mt-2 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <GlowButton onClick={save}>Save goal</GlowButton>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!topUp}
        onClose={() => setTopUp(null)}
        title={`Add savings — ${topUp?.title ?? ""}`}
      >
        {topUp && (
          <div className="grid gap-3">
            <Field label="Amount to add">
              <input
                type="number"
                className={inputClass}
                value={topUp.amount}
                onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })}
              />
            </Field>
            <div className="mt-2 flex justify-end gap-3">
              <button onClick={() => setTopUp(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <GlowButton onClick={addSavings} disabled={update.isPending}>
                {update.isPending ? "Adding..." : "Add"}
              </GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
