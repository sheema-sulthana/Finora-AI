import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CreditCard,
  Droplets,
  Flame,
  GraduationCap,
  Home,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Tv,
  Utensils,
  Wifi,
  Zap,
} from "lucide-react";
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
import { CATEGORIES, formatMoney } from "@/lib/format";
import {
  addNotification,
  addTimelineEvent,
  insertTransactions,
  useBills,
  useProfile,
  useRemove,
  useUpsert,
} from "@/lib/finora-data";
import { domainLogoUrl, findMerchant, normalizeMerchantText } from "@/lib/merchant";
import { mkHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/bills")({
  head: mkHead(
    "Bills & Subscriptions — Finora AI",
    "Track recurring bills and subscriptions with due dates, autopay and paid status.",
  ),
  component: () => (
    <AppLayout>
      <BillsPage />
    </AppLayout>
  ),
});

type Form = {
  id?: string;
  name: string;
  kind: string;
  amount: string;
  category: string;
  due_day: string;
  autopay: boolean;
};

const daysUntil = (day: number) => {
  const today = new Date();
  const next = new Date(today.getFullYear(), today.getMonth(), day);
  if (next < today) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / 86_400_000);
};

function categoryIconFor(name: string, category: string) {
  const nameValue = normalizeMerchantText(name);
  const categoryValue = normalizeMerchantText(category);
  const value = `${nameValue} ${categoryValue}`;

  // Specific bill types get a meaningful icon when no real brand logo exists.
  if (value.includes("electric") || value.includes("electricity") || value.includes("power")) {
    return Zap;
  }
  if (value.includes("water")) return Droplets;
  if (value.includes("internet") || value.includes("wifi") || value.includes("broadband")) {
    return Wifi;
  }
  if (value.includes("gas")) return Flame;
  if (value.includes("education") || value.includes("college") || value.includes("school")) {
    return GraduationCap;
  }
  if (value.includes("insurance")) return ShieldCheck;
  if (value.includes("loan") || value.includes("emi") || value.includes("finance")) {
    return Landmark;
  }
  if (value.includes("rent") || value.includes("home")) return Home;
  if (value.includes("subscription") || value.includes("entertainment")) return Tv;
  if (value.includes("shopping")) return ShoppingBag;
  if (value.includes("food")) return Utensils;
  if (value.includes("recharge") || value.includes("utility")) return Zap;
  if (value.includes("payment")) return CreditCard;
  if (value.includes("bill")) return ReceiptText;

  return ReceiptText;
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
  const Icon = categoryIconFor(name, fallbackCategory);
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

function BillsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { data: bills = [] } = useBills();
  const upsert = useUpsert("bills");
  const remove = useRemove("bills");
  const currency = profile?.currency ?? "INR";
  const [form, setForm] = useState<Form | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const blank = (kind: string): Form => ({
    name: "",
    kind,
    amount: "",
    category: kind === "subscription" ? "Subscriptions" : "Bills",
    due_day: "1",
    autopay: false,
  });

  const save = async () => {
    if (!form || !form.name.trim() || !Number(form.amount)) return;

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      kind: form.kind,
      amount: Number(form.amount),
      category: form.category,
      due_day: Math.max(1, Math.min(31, Number(form.due_day) || 1)),
      autopay: form.autopay,
      active: true,
    };

    if (form.id) payload["id"] = form.id;

    await upsert.mutateAsync(payload);
    setForm(null);
  };

  const markPaid = async (
    id: string,
    name: string,
    amount: number,
    category: string,
  ) => {
    if (payingId) return;

    const bill = bills.find((item) => item.id === id);
    if (!bill) {
      setPaymentError("The selected bill could not be found.");
      return;
    }

    const paidDate = bill.last_paid_date
      ? new Date(`${bill.last_paid_date}T00:00:00`)
      : null;
    const now = new Date();
    const alreadyPaidThisMonth = Boolean(
      paidDate &&
        paidDate.getMonth() === now.getMonth() &&
        paidDate.getFullYear() === now.getFullYear(),
    );

    if (alreadyPaidThisMonth) return;

    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setPayingId(id);
    setPaymentError(null);

    try {
      // Keep the existing bill row intact. useUpsert() can insert when a
      // partial object is supplied, so include every required bill field.
      await upsert.mutateAsync({
        id: bill.id,
        name: bill.name || name,
        kind: bill.kind || "bill",
        amount: Number(bill.amount ?? amount),
        category: bill.category || category || "Bills",
        due_day: Number(bill.due_day) || 1,
        next_due_date: bill.next_due_date ?? null,
        autopay: Boolean(bill.autopay),
        active: bill.active !== false,
        last_paid_date: today,
      });

      // Update the visible bill immediately.
      queryClient.setQueryData(
        ["bills"],
        (current: typeof bills | undefined) =>
          (current ?? []).map((item) =>
            item.id === id ? { ...item, last_paid_date: today } : item,
          ),
      );

      // Create the expense transaction only after the bill was persisted.
      await insertTransactions([
        {
          merchant: bill.name || name,
          amount: Number(bill.amount ?? amount),
          type: "expense",
          category: bill.category || category || "Bills",
          txn_date: today,
          payment_method: "Auto-debit",
          status: "completed",
          account_id: null,
          notes: `Bill payment for ${bill.name || name}`,
          source: "bill",
        },
      ]);

      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.refetchQueries({
        queryKey: ["transactions"],
        type: "active",
      });

      // These are secondary. A notification/timeline failure must not undo
      // the successful bill payment or transaction.
      try {
        await addTimelineEvent(
          "🧾",
          `Paid ${bill.name || name}`,
          formatMoney(Number(bill.amount ?? amount), currency),
        );
      } catch (error) {
        console.error("Timeline update failed:", error);
      }

      try {
        await addNotification(
          "bill",
          `${bill.name || name} marked as paid`,
          formatMoney(Number(bill.amount ?? amount), currency),
        );
      } catch (error) {
        console.error("Notification update failed:", error);
      }

      await queryClient.invalidateQueries({ queryKey: ["timeline_events"] });
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      console.error("Failed to mark bill as paid:", error);
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Unable to mark this bill as paid.",
      );
      await queryClient.invalidateQueries({ queryKey: ["bills"] });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } finally {
      setPayingId(null);
    }
  };

  const monthlyTotal = bills.reduce((a, b) => a + Number(b.amount), 0);
  const subs = bills.filter((b) => b.kind === "subscription");

  return (
    <>
      <PageHeader
        title="Bills & Subscriptions"
        subtitle="Recurring payments you add — with reminders and paid status."
        action={
          <div className="flex flex-wrap gap-2">
            <GlowButton variant="outline" onClick={() => setForm(blank("subscription"))}>
              <Plus className="h-4 w-4" /> Subscription
            </GlowButton>
            <GlowButton onClick={() => setForm(blank("bill"))}>
              <Plus className="h-4 w-4" /> Bill
            </GlowButton>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Monthly recurring" value={formatMoney(monthlyTotal, currency)} />
        <StatCard
          label="Subscriptions"
          value={formatMoney(
            subs.reduce((a, b) => a + Number(b.amount), 0),
            currency,
          )}
          delay={0.05}
        />
        <StatCard label="Active items" value={String(bills.length)} delay={0.1} />
      </div>

      <GlassCard className="mt-4" delay={0.05}>
        <p className="text-sm font-medium">Upcoming</p>

        {paymentError && (
          <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/[0.07] px-4 py-3 text-xs text-red-300">
            <p className="font-semibold">Payment could not be completed.</p>
            <p className="mt-1 break-words text-red-300/80">
              {paymentError}
            </p>
          </div>
        )}

        <div className="mt-4 grid gap-2">
          {[...bills]
            .sort((a, b) => daysUntil(a.due_day) - daysUntil(b.due_day))
            .map((b) => {
              const days = daysUntil(b.due_day);
              const paidThisMonth =
                Boolean(b.last_paid_date) &&
                new Date(b.last_paid_date as string).getMonth() === new Date().getMonth() &&
                new Date(b.last_paid_date as string).getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={b.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
                    paidThisMonth
                      ? "bg-emerald-500/[0.07] ring-1 ring-emerald-400/10"
                      : "bg-foreground/[0.04]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <BrandIcon name={b.name} category={b.category} size="sm" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{b.name}</p>
                        {b.autopay && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                            autopay
                          </span>
                        )}
                      </div>

                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Day {b.due_day} · {days === 0 ? "due today" : `in ${days} days`} ·{" "}
                        {b.category}
                      </p>

                      {paidThisMonth && b.last_paid_date && (
                        <p className="mt-1 text-[10px] text-emerald-400">
                          Paid on{" "}
                          {new Date(b.last_paid_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatMoney(Number(b.amount), currency)}</span>

                    {paidThisMonth ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-400">
                        <Check className="h-3.5 w-3.5" /> Paid
                      </span>
                    ) : (
                      <button
                        onClick={() => void markPaid(b.id, b.name, Number(b.amount), b.category)}
                        disabled={payingId === b.id}
                        className="rounded-full border border-glass-border px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {payingId === b.id ? "Saving..." : "Mark paid"}
                      </button>
                    )}

                    <button
                      aria-label="Edit bill"
                      onClick={() =>
                        setForm({
                          id: b.id,
                          name: b.name,
                          kind: b.kind,
                          amount: String(b.amount),
                          category: b.category,
                          due_day: String(b.due_day),
                          autopay: b.autopay,
                        })
                      }
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>

                    <button
                      aria-label="Delete bill"
                      onClick={() => remove.mutate(b.id)}
                      className="text-muted-foreground transition hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

          {!bills.length && (
            <EmptyState
              title="No bills or subscriptions yet"
              body="Add electricity, internet, EMI, Netflix or anything else that repeats."
              action={<GlowButton onClick={() => setForm(blank("bill"))}>Add bill</GlowButton>}
            />
          )}
        </div>
      </GlassCard>

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={
          form?.id ? "Edit item" : form?.kind === "subscription" ? "New subscription" : "New bill"
        }
      >
        {form && (
          <div className="grid gap-3">
            <Field label="Name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={form.kind === "subscription" ? "Netflix" : "Electricity"}
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

              <Field label="Due day of month">
                <input
                  type="number"
                  min="1"
                  max="31"
                  className={inputClass}
                  value={form.due_day}
                  onChange={(e) => setForm({ ...form, due_day: e.target.value })}
                />
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

              <Field label="Type">
                <select
                  className={inputClass}
                  value={form.kind}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  <option value="bill" className="bg-background">
                    Bill
                  </option>
                  <option value="subscription" className="bg-background">
                    Subscription
                  </option>
                </select>
              </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.autopay}
                onChange={(e) => setForm({ ...form, autopay: e.target.checked })}
              />
              Autopay enabled
            </label>

            <div className="mt-2 flex justify-end gap-3">
              <button onClick={() => setForm(null)} className="text-sm text-muted-foreground">
                Cancel
              </button>
              <GlowButton onClick={() => void save()} disabled={upsert.isPending}>
                {upsert.isPending ? "Saving..." : "Save"}
              </GlowButton>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
