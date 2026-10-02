import { useState } from "react";
import { Field, inputClass } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { CATEGORIES } from "@/lib/format";
import { useAccounts } from "@/lib/finora-data";

export type TxnDraft = {
  id?: string;
  merchant: string;
  amount: number | string;
  type: string;
  category: string;
  txn_date: string;
  payment_method: string;
  account_id?: string | null;
  notes?: string | null;
  status?: string;
};

export const emptyDraft = (): TxnDraft => ({
  merchant: "",
  amount: "",
  type: "expense",
  category: "Food",
  txn_date: new Date().toISOString().slice(0, 10),
  payment_method: "UPI",
  account_id: null,
  notes: "",
});

export const PAYMENT_METHODS = ["UPI", "Card", "Cash", "Net Banking", "Wallet", "Auto-debit"];

export function TxnForm({
  initial,
  onCancel,
  onSave,
  saving,
}: {
  initial: TxnDraft;
  onCancel: () => void;
  onSave: (draft: TxnDraft) => void | Promise<void>;
  saving?: boolean;
}) {
  const [form, setForm] = useState<TxnDraft>(initial);
  const { data: accounts = [] } = useAccounts();
  const set = (patch: Partial<TxnDraft>) => setForm((f) => ({ ...f, ...patch }));
  const valid = form.merchant.trim().length > 0 && Number(form.amount) > 0;

  return (
    <div className="grid gap-3">
      <Field label="Merchant / description">
        <input
          className={inputClass}
          value={form.merchant}
          onChange={(e) => set({ merchant: e.target.value })}
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
            onChange={(e) => set({ amount: e.target.value })}
          />
        </Field>
        <Field label="Type">
          <select
            className={inputClass}
            value={form.type}
            onChange={(e) => set({ type: e.target.value })}
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
            onChange={(e) => set({ category: e.target.value })}
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
            onChange={(e) => set({ txn_date: e.target.value })}
          />
        </Field>
        <Field label="Payment method">
          <select
            className={inputClass}
            value={form.payment_method}
            onChange={(e) => set({ payment_method: e.target.value })}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} className="bg-background">
                {m}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Account">
          <select
            className={inputClass}
            value={form.account_id ?? ""}
            onChange={(e) => set({ account_id: e.target.value || null })}
          >
            <option value="" className="bg-background">
              Unassigned
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-background">
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Notes">
        <input
          className={inputClass}
          value={form.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Optional"
        />
      </Field>
      <div className="mt-2 flex justify-end gap-3">
        <button onClick={onCancel} className="text-sm text-muted-foreground">
          Cancel
        </button>
        <GlowButton onClick={() => valid && onSave({ ...form, amount: Number(form.amount) })}>
          {saving ? "Saving…" : "Save transaction"}
        </GlowButton>
      </div>
    </div>
  );
}
