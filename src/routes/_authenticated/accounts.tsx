import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import {
  EmptyState,
  Field,
  GlassCard,
  Modal,
  PageHeader,
  StatCard,
  inputClass,
} from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { formatDate, formatMoney } from "@/lib/format";
import { useAccounts, useProfile, useRemove, useTransactions, useUpsert } from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: mkHead(
    "Accounts — Finora AI",
    "Create and manage your own cash, wallet, bank and credit card accounts and see their history.",
  ),
  component: () => (
    <AppLayout>
      <AccountsPage />
    </AppLayout>
  ),
});

const TYPES = ["bank", "cash", "wallet", "credit card", "savings"];
const COLORS = ["#3B82F6", "#8B5CF6", "#22D3EE", "#34D399", "#F59E0B", "#EC4899"];

type Form = {
  id?: string;
  name: string;
  type: string;
  institution: string;
  balance: string;
  color: string;
};

function AccountsPage() {
  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: txns = [] } = useTransactions();
  const upsert = useUpsert("accounts");
  const remove = useRemove("accounts");
  const currency = profile?.currency ?? "INR";

  const [form, setForm] = useState<Form | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const blank = (): Form => ({
    name: "",
    type: "bank",
    institution: "",
    balance: "0",
    color: COLORS[0]!,
  });

  const save = async () => {
    if (!form || !form.name.trim()) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      type: form.type,
      institution: form.institution || null,
      balance: Number(form.balance) || 0,
      color: form.color,
      currency,
    };
    if (form.id) payload["id"] = form.id;
    await upsert.mutateAsync(payload);
    setForm(null);
  };

  const total = accounts.reduce((a, b) => a + Number(b.balance), 0);

  return (
    <>
      <PageHeader
        title="Accounts"
        subtitle="Only the accounts you create — nothing is added automatically."
        action={
          <GlowButton onClick={() => setForm(blank())}>
            <Plus className="h-4 w-4" /> New account
          </GlowButton>
        }
      />

      <StatCard
        label="Total across accounts"
        value={formatMoney(total, currency)}
        icon={<Wallet className="h-5 w-5" />}
      />

      {!accounts.length ? (
        <GlassCard className="mt-4">
          <EmptyState
            title="No accounts yet"
            body="Add Cash, a wallet, or your bank accounts to organise transactions."
            action={<GlowButton onClick={() => setForm(blank())}>Add account</GlowButton>}
          />
        </GlassCard>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {accounts.map((a, i) => {
            const history = txns.filter((t) => t.account_id === a.id);
            return (
              <GlassCard key={a.id} delay={i * 0.04} className="card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-10 w-10 place-items-center rounded-2xl"
                      style={{ background: `${a.color}22`, color: a.color }}
                    >
                      <Wallet className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-medium">{a.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {a.type}
                        {a.institution ? ` · ${a.institution}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 text-muted-foreground">
                    <button
                      aria-label="Edit account"
                      onClick={() =>
                        setForm({
                          id: a.id,
                          name: a.name,
                          type: a.type,
                          institution: a.institution ?? "",
                          balance: String(a.balance),
                          color: a.color,
                        })
                      }
                      className="grid h-8 w-8 place-items-center rounded-xl hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Delete account"
                      onClick={() => remove.mutate(a.id)}
                      className="grid h-8 w-8 place-items-center rounded-xl hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 font-display text-2xl font-bold">
                  {formatMoney(Number(a.balance), currency)}
                </p>

                <button
                  onClick={() => setOpen(open === a.id ? null : a.id)}
                  className="mt-3 text-xs text-primary"
                >
                  {open === a.id ? "Hide" : "View"} history ({history.length})
                </button>

                {open === a.id && (
                  <div className="mt-3 grid gap-2">
                    {history.slice(0, 8).map((t) => (
                      <div
                        key={t.id}
                        className="flex justify-between text-xs text-muted-foreground"
                      >
                        <span>
                          {t.merchant} · {formatDate(t.txn_date)}
                        </span>
                        <span className={t.type === "income" ? "text-emerald-400" : ""}>
                          {t.type === "income" ? "+" : "−"}
                          {formatMoney(Number(t.amount), currency)}
                        </span>
                      </div>
                    ))}
                    {!history.length && (
                      <p className="text-xs text-muted-foreground">
                        No transactions on this account yet.
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.id ? "Edit account" : "New account"}
      >
        {form && (
          <div className="grid gap-3">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="HDFC Savings"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Type">
                <select
                  className={inputClass}
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t} className="bg-background capitalize">
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Institution">
                <input
                  className={inputClass}
                  value={form.institution}
                  onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  placeholder="HDFC Bank"
                />
              </Field>
            </div>
            <Field label="Current balance">
              <input
                type="number"
                className={inputClass}
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
              />
            </Field>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Colour ${c}`}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`h-7 w-7 rounded-full transition-transform ${form.color === c ? "scale-110 ring-2 ring-foreground/40" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <GlowButton onClick={save}>Save account</GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
