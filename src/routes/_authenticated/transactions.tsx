import { useMemo, useState, type SVGProps } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowUp,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  WalletCards,
  Utensils,
  ShoppingBasket,
  ShoppingBag,
  CarFront,
  Plane,
  Tv,
  CreditCard,
  Zap,
  Home,
  GraduationCap,
  HeartPulse,
  ReceiptText,
  Landmark,
  Store,
} from "lucide-react";
import { AppLayout } from "@/components/app/AppLayout";
import { EmptyState, GlassCard, Modal, inputClass } from "@/components/app/ui";
import { TxnForm, emptyDraft, type TxnDraft } from "@/components/app/TxnForm";
import { GlowButton } from "@/components/landing/GlowButton";
import { CATEGORIES, categoryColor, formatDate, formatMoney } from "@/lib/format";
import {
  addTimelineEvent,
  useAccounts,
  useProfile,
  useRemove,
  useTransactions,
  useUpsert,
  type Txn,
} from "@/lib/finora-data";
import { mkHead } from "@/lib/seo";
import { findMerchant, domainLogoUrl } from "@/lib/merchant";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: mkHead(
    "Transactions — Finora AI",
    "Track, search, filter, manage and export every transaction in your Finora AI account.",
  ),
  component: () => (
    <AppLayout>
      <Transactions />
    </AppLayout>
  ),
});

type SortKey = "txn_date" | "amount" | "merchant" | "category";
type ExportRange = "all" | "30" | "60" | "90" | "custom";

function categoryIconFor(category: string) {
  const value = String(category || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

  if (value.includes("food")) return Utensils;
  if (value.includes("grocery")) return ShoppingBasket;
  if (value.includes("shopping")) return ShoppingBag;
  if (value.includes("transport")) return CarFront;
  if (value.includes("travel")) return Plane;
  if (value.includes("subscription") || value.includes("entertainment")) return Tv;
  if (value.includes("payment")) return CreditCard;
  if (value.includes("recharge") || value.includes("utility")) return Zap;
  if (value.includes("rent") || value.includes("home")) return Home;
  if (value.includes("education")) return GraduationCap;
  if (value.includes("health")) return HeartPulse;
  if (value.includes("bill")) return ReceiptText;
  if (value.includes("income") || value.includes("salary")) return Landmark;
  return Store;
}

function MerchantIcon({
  name,
  category,
  size = "md",
}: {
  name: string;
  category?: string;
  size?: "sm" | "md";
}) {
  const merchant = findMerchant(name);
  const dimension = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const fallback = merchant?.category || category || "Other";

  return (
    <MerchantLogoWithFallback
      name={merchant?.name || name}
      category={fallback}
      {...(merchant?.domain ? { domain: merchant.domain } : {})}
      dimension={dimension}
    />
  );
}

function MerchantLogoWithFallback({
  name,
  category,
  domain,
  dimension,
}: {
  name: string;
  category: string;
  domain?: string;
  dimension: string;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const Icon = categoryIconFor(category);

  return (
    <span
      title={`${name} · ${category}`}
      className={`relative grid ${dimension} shrink-0 place-items-center overflow-hidden rounded-full bg-foreground/[0.07] text-muted-foreground ring-1 ring-white/10`}
    >
      {domain && !logoFailed ? (
        <img
          src={domainLogoUrl(domain)}
          alt={`${name} logo`}
          className="h-[70%] w-[70%] rounded-full object-contain"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </span>
  );
}

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRangeDates(range: ExportRange, customFrom: string, customTo: string) {
  if (range === "custom") return { from: customFrom || "", to: customTo || "" };
  if (range === "all") return { from: "", to: "" };

  const days = Number(range);
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  const iso = (date: Date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  };
  return { from: iso(from), to: iso(to) };
}

function Transactions() {
  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: txns = [], isLoading } = useTransactions();
  const upsert = useUpsert("transactions");
  const remove = useRemove("transactions");
  const currency = profile?.currency ?? "INR";

  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "txn_date", asc: false });
  const [editing, setEditing] = useState<TxnDraft | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Txn | null>(null);
  const [selected, setSelected] = useState<Txn | null>(null);
  const [page, setPage] = useState(1);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportRange, setExportRange] = useState<ExportRange>("all");
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  const rows = useMemo(() => {
    const filtered = txns.filter((t) => {
      if (type !== "all" && t.type !== type) return false;
      if (category !== "all" && t.category !== category) return false;
      if (from && t.txn_date < from) return false;
      if (to && t.txn_date > to) return false;
      if (q) {
        const s = q.toLowerCase().trim();
        if (
          !t.merchant.toLowerCase().includes(s) &&
          !t.category.toLowerCase().includes(s) &&
          !(t.notes ?? "").toLowerCase().includes(s) &&
          !(t.payment_method ?? "").toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const av = sort.key === "amount" ? Number(a.amount) : String(a[sort.key]);
      const bv = sort.key === "amount" ? Number(b.amount) : String(b[sort.key]);
      if (typeof av === "number" && typeof bv === "number") return sort.asc ? av - bv : bv - av;
      return sort.asc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [txns, q, type, category, from, to, sort]);

  const totals = useMemo(
    () =>
      txns.reduce(
        (acc, t) => {
          if (t.type === "income") acc.income += Number(t.amount);
          else if (t.type === "expense") acc.expense += Number(t.amount);
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [txns],
  );

  const netSavings = totals.income - totals.expense;
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const accountName = (id: string | null) => {
    if (!id) return "Not assigned";
    return accounts.find((account) => account.id === id)?.name || "Account";
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const categorySpend = useMemo(() => {
    const map = new Map<string, number>();
    txns.forEach((t) => {
      if (t.type !== "expense" || t.txn_date.slice(0, 7) !== currentMonth) return;
      map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [txns, currentMonth]);

  const categoryTotal = categorySpend.reduce((sum, item) => sum + item.value, 0);
  let categoryCursor = 0;
  const donutStops = categorySpend.map((item) => {
    const start = categoryCursor;
    categoryCursor += categoryTotal ? (item.value / categoryTotal) * 100 : 0;
    return `${categoryColor(item.name)} ${start}% ${categoryCursor}%`;
  });
  const donutBackground = donutStops.length
    ? `conic-gradient(${donutStops.join(",")})`
    : "conic-gradient(rgba(255,255,255,.08) 0 100%)";

  const selectedTransaction = selected || visibleRows[0] || rows[0] || null;

  const resetPaging = () => setPage(1);

  const handleSearch = (value: string) => {
    setQ(value);
    resetPaging();
  };

  const handleType = (value: "all" | "income" | "expense") => {
    setType(value);
    resetPaging();
  };

  const handleCategory = (value: string) => {
    setCategory(value);
    resetPaging();
  };

  const handleFrom = (value: string) => {
    setFrom(value);
    resetPaging();
  };

  const handleTo = (value: string) => {
    setTo(value);
    resetPaging();
  };

  const exportRows = () => {
    const { from: rangeFrom, to: rangeTo } = getRangeDates(exportRange, exportFrom, exportTo);
    return txns
      .filter((t) => {
        if (rangeFrom && t.txn_date < rangeFrom) return false;
        if (rangeTo && t.txn_date > rangeTo) return false;
        return true;
      })
      .sort((a, b) => String(b.txn_date).localeCompare(String(a.txn_date)));
  };

  const rangeLabel = () => {
    const { from: rangeFrom, to: rangeTo } = getRangeDates(exportRange, exportFrom, exportTo);
    if (!rangeFrom && !rangeTo) return "All history";
    if (!rangeFrom || !rangeTo) return "Custom range";
    return `${formatDate(rangeFrom)} – ${formatDate(rangeTo)}`;
  };

  const exportCsv = () => {
    const data = exportRows();
    const header = [
      "Date",
      "Merchant",
      "Type",
      "Category",
      "Amount",
      "Payment method",
      "Account",
      "Status",
      "Notes",
    ];
    const lines = data.map((t) =>
      [
        t.txn_date,
        t.merchant,
        t.type,
        t.category,
        t.amount,
        t.payment_method,
        accountName(t.account_id),
        t.status,
        t.notes ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const safeLabel = rangeLabel()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
    download(
      `finora-transactions-${safeLabel || "history"}.csv`,
      [header.join(","), ...lines].join("\n"),
      "text/csv;charset=utf-8",
    );
    setExportOpen(false);
  };

  const exportPdf = () => {
    const data = exportRows();
    const w = window.open("", "_blank");
    if (!w) return;

    const totalIncome = data
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = data
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);

    const rowsHtml = data
      .map((t) => {
        const merchant = findMerchant(t.merchant);
        const merchantLabel = merchant ? `${merchant.name}` : t.merchant;
        return `<tr>
          <td>${escapeHtml(formatDate(t.txn_date))}</td>
          <td><strong>${escapeHtml(merchantLabel)}</strong><div class="muted">${escapeHtml(t.payment_method)}</div></td>
          <td>${escapeHtml(t.category)}</td>
          <td class="${t.type === "income" ? "income" : "expense"}">${t.type === "income" ? "+" : "−"}${escapeHtml(formatMoney(Number(t.amount), currency))}</td>
          <td>${escapeHtml(accountName(t.account_id))}</td>
        </tr>`;
      })
      .join("");

    w.document
      .write(`<!doctype html><html><head><meta charset="utf-8"/><title>Finora AI — Transaction History</title>
      <style>
        *{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;padding:32px;color:#111827;background:#fff}
        .header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;border-bottom:2px solid #e5e7eb;padding-bottom:18px}
        h1{margin:0;font-size:24px}.sub{margin-top:5px;color:#6b7280;font-size:12px}.stats{display:flex;gap:18px;margin:20px 0}.stat{border:1px solid #e5e7eb;border-radius:12px;padding:12px 15px;min-width:150px}.label{font-size:10px;color:#6b7280;text-transform:uppercase}.value{font-size:17px;font-weight:700;margin-top:4px}
        table{width:100%;border-collapse:collapse;font-size:11px;margin-top:18px}th{text-align:left;background:#f3f4f6;color:#374151;font-size:10px;text-transform:uppercase}th,td{padding:9px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top}.muted{font-size:9px;color:#9ca3af;margin-top:2px}.income{color:#059669;font-weight:700}.expense{color:#e11d48;font-weight:700}.footer{margin-top:20px;color:#6b7280;font-size:10px}
        @media print{body{padding:18px}.no-print{display:none}.header{break-inside:avoid}.stats{break-inside:avoid}}
      </style></head><body>
      <div class="header"><div><h1>Finora AI — Transaction History</h1><div class="sub">${escapeHtml(rangeLabel())}</div></div><div class="sub">Generated ${escapeHtml(new Date().toLocaleString("en-IN"))}</div></div>
      <div class="stats">
        <div class="stat"><div class="label">Transactions</div><div class="value">${data.length}</div></div>
        <div class="stat"><div class="label">Income</div><div class="value">${escapeHtml(formatMoney(totalIncome, currency))}</div></div>
        <div class="stat"><div class="label">Expenses</div><div class="value">${escapeHtml(formatMoney(totalExpense, currency))}</div></div>
        <div class="stat"><div class="label">Net</div><div class="value">${escapeHtml(formatMoney(totalIncome - totalExpense, currency))}</div></div>
      </div>
      <table><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th><th>Account</th></tr></thead><tbody>${rowsHtml || `<tr><td colspan="5">No transactions found for this period.</td></tr>`}</tbody></table>
      <div class="footer">Finora AI · Exported from Transactions</div>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    w.document.close();
    setExportOpen(false);
  };

  const save = async (draft: TxnDraft) => {
    const payload: Record<string, unknown> = {
      merchant: draft.merchant,
      amount: Number(draft.amount),
      type: draft.type,
      category: draft.category,
      txn_date: draft.txn_date,
      payment_method: draft.payment_method,
      account_id: draft.account_id ?? null,
      notes: draft.notes || null,
      source: draft.id ? "manual" : "manual",
    };
    if (draft.id) payload["id"] = draft.id;
    await upsert.mutateAsync(payload);
    await addTimelineEvent(
      draft.id ? "✏️" : "💳",
      `${draft.id ? "Updated" : "Added"} ${draft.merchant}`,
      `${formatMoney(Number(draft.amount), currency)} · ${draft.category}`,
    );
    setEditing(null);
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Financial activity
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your income and expenses. Keep your financial life organized.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setExportOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-glass-border bg-foreground/[0.03] px-4 text-sm font-medium transition hover:bg-foreground/[0.07]"
          >
            <Download className="h-4 w-4" /> Export
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <GlowButton onClick={() => setEditing(emptyDraft())}>
            <Plus className="h-4 w-4" /> Add Transaction
          </GlowButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="!rounded-[18px] !p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 text-primary">
              <WalletCards className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="mt-1 text-xl font-bold">{txns.length}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-400">
              <ArrowDownLeft className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Income</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(totals.income, currency)}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-400/15 text-rose-400">
              <ArrowUpRight className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(totals.expense, currency)}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="!rounded-[18px] !p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-blue-500/15 text-blue-400">
              <PiggyBankIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">Net Savings</p>
              <p className="mt-1 text-xl font-bold">{formatMoney(netSavings, currency)}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <GlassCard className="!rounded-[20px] !p-4 sm:!p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
            <div className="flex gap-5 text-sm">
              {(["all", "income", "expense"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleType(tab)}
                  className={`relative pb-2 font-medium transition ${type === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {tab === "all" ? "All Transactions" : tab === "income" ? "Income" : "Expenses"}
                  {type === tab && (
                    <span className="absolute inset-x-0 -bottom-[13px] h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{rows.length} matching</span>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className={`${inputClass} pl-10`}
                placeholder="Search transactions, merchants, or categories..."
                value={q}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <select
              className={`${inputClass} xl:w-40`}
              value={category}
              onChange={(e) => handleCategory(e.target.value)}
            >
              <option value="all" className="bg-background">
                All Categories
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-background">
                  {c}
                </option>
              ))}
            </select>
            <input
              aria-label="From date"
              type="date"
              className={`${inputClass} xl:w-40`}
              value={from}
              onChange={(e) => handleFrom(e.target.value)}
            />
            <input
              aria-label="To date"
              type="date"
              className={`${inputClass} xl:w-40`}
              value={to}
              onChange={(e) => handleTo(e.target.value)}
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            {isLoading ? (
              <p className="py-14 text-center text-sm text-muted-foreground">
                Loading transactions…
              </p>
            ) : !txns.length ? (
              <EmptyState
                title="No transactions yet"
                body="Upload a statement or add your first transaction to get started."
                action={
                  <GlowButton onClick={() => setEditing(emptyDraft())}>Add transaction</GlowButton>
                }
              />
            ) : (
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium"> </th>
                    {(
                      [
                        ["txn_date", "Date"],
                        ["merchant", "Merchant"],
                        ["category", "Category"],
                        ["amount", "Amount"],
                      ] as [SortKey, string][]
                    ).map(([key, label]) => (
                      <th key={key} className="pb-3 pr-4 font-medium">
                        <button
                          className="inline-flex items-center gap-1 hover:text-foreground"
                          onClick={() =>
                            setSort((s) => ({ key, asc: s.key === key ? !s.asc : true }))
                          }
                        >
                          {label}
                          {sort.key === key ? (
                            sort.asc ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : (
                              <ArrowDown className="h-3 w-3" />
                            )
                          ) : null}
                        </button>
                      </th>
                    ))}
                    <th className="pb-3 pr-4 font-medium">Account</th>
                    <th className="pb-3 pr-4 font-medium">Type</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((t) => {
                    const known = findMerchant(t.merchant);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelected(t)}
                        className={`cursor-pointer border-t border-white/[0.06] transition hover:bg-white/[0.025] ${selectedTransaction?.id === t.id ? "bg-primary/[0.035]" : ""}`}
                      >
                        <td className="py-3 pr-2">
                          <MerchantIcon name={t.merchant} category={t.category} />
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                          {formatDate(t.txn_date)}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="min-w-[150px]">
                            <p className="font-medium">{known?.name || t.merchant}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {known ? known.category : t.category}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs"
                            style={{
                              background: `${categoryColor(t.category)}22`,
                              color: categoryColor(t.category),
                            }}
                          >
                            {t.category}
                          </span>
                        </td>
                        <td
                          className={`py-3 pr-4 font-semibold ${t.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                        >
                          {t.type === "income" ? "+" : t.type === "expense" ? "−" : ""}
                          {formatMoney(Number(t.amount), currency)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {accountName(t.account_id)}
                        </td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">
                          {t.type === "income"
                            ? "Income"
                            : t.type === "expense"
                              ? "Expense"
                              : "Transfer"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              aria-label="Edit transaction"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing({
                                  id: t.id,
                                  merchant: t.merchant,
                                  amount: Number(t.amount),
                                  type: t.type,
                                  category: t.category,
                                  txn_date: t.txn_date,
                                  payment_method: t.payment_method,
                                  account_id: t.account_id,
                                  notes: t.notes,
                                });
                              }}
                              className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              aria-label="Delete transaction"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(t);
                              }}
                              className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!!rows.length && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, rows.length)}{" "}
                of {rows.length} transactions
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-muted-foreground disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs ${safePage === n ? "bg-primary text-white" : "border border-white/[0.08] text-muted-foreground hover:text-foreground"}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={safePage === pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-muted-foreground disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        <div className="grid gap-4 content-start">
          <GlassCard className="!rounded-[20px] !p-4">
            {selectedTransaction ? (
              <>
                <div className="flex items-start gap-3">
                  <MerchantIcon
                    name={selectedTransaction.merchant}
                    category={selectedTransaction.category}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-display font-semibold">
                          {findMerchant(selectedTransaction.merchant)?.name ||
                            selectedTransaction.merchant}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {selectedTransaction.category}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold ${selectedTransaction.type === "income" ? "text-emerald-400" : "text-rose-400"}`}
                      >
                        {selectedTransaction.type === "income" ? "+" : "−"}
                        {formatMoney(Number(selectedTransaction.amount), currency)}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatDate(selectedTransaction.txn_date)} ·{" "}
                      {selectedTransaction.payment_method}
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Category</p>
                    <div className="mt-1 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-2 text-sm">
                      {selectedTransaction.category}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Account</p>
                    <div className="mt-1 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-2 text-sm">
                      {accountName(selectedTransaction.account_id)}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Description</p>
                    <div className="mt-1 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-2 text-sm text-muted-foreground">
                      {selectedTransaction.notes || "No description added."}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setEditing({
                      id: selectedTransaction.id,
                      merchant: selectedTransaction.merchant,
                      amount: Number(selectedTransaction.amount),
                      type: selectedTransaction.type,
                      category: selectedTransaction.category,
                      txn_date: selectedTransaction.txn_date,
                      payment_method: selectedTransaction.payment_method,
                      account_id: selectedTransaction.account_id,
                      notes: selectedTransaction.notes,
                    })
                  }
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-glass-border text-xs font-medium text-primary transition hover:bg-primary/10"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit transaction
                </button>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Select a transaction to view its details.
              </p>
            )}
          </GlassCard>

          <GlassCard className="!rounded-[20px] !p-4">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Spending by Category</p>
              <span className="text-xs text-muted-foreground">This Month</span>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div
                className="relative grid h-32 w-32 shrink-0 place-items-center rounded-full"
                style={{ background: donutBackground }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-background/95 text-center ring-1 ring-white/5">
                  <span className="text-sm font-bold">{formatMoney(categoryTotal, currency)}</span>
                  <span className="text-[9px] text-muted-foreground">Total</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {categorySpend.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: categoryColor(item.name) }}
                    />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="font-medium">{formatMoney(item.value, currency)}</span>
                  </div>
                ))}
                {!categorySpend.length && (
                  <p className="text-xs text-muted-foreground">No expenses this month.</p>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="!rounded-[20px] !p-4">
            <p className="font-display text-sm font-semibold">Quick Actions</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/reports"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3 text-xs font-medium transition hover:bg-foreground/[0.06]"
              >
                <FileText className="h-4 w-4 text-primary" /> View Reports
              </Link>
              <Link
                to="/budget"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3 text-xs font-medium transition hover:bg-foreground/[0.06]"
              >
                <WalletCards className="h-4 w-4 text-emerald-400" /> Set Budget
              </Link>
              <Link
                to="/goals"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3 text-xs font-medium transition hover:bg-foreground/[0.06]"
              >
                <Sparkles className="h-4 w-4 text-blue-400" /> Add Goal
              </Link>
              <Link
                to="/coach"
                className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3 text-xs font-medium transition hover:bg-foreground/[0.06]"
              >
                <Sparkles className="h-4 w-4 text-violet-400" /> Ask AI Coach
              </Link>
            </div>
          </GlassCard>
        </div>
      </div>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export transaction history"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Choose date range</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Export all transactions within the selected period.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {(["all", "30", "60", "90", "custom"] as ExportRange[]).map((value) => (
              <button
                key={value}
                onClick={() => setExportRange(value)}
                className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${exportRange === value ? "border-primary bg-primary/10 text-primary" : "border-white/[0.08] text-muted-foreground hover:text-foreground"}`}
              >
                {value === "all" ? "All" : value === "custom" ? "Custom" : `${value} days`}
              </button>
            ))}
          </div>
          {exportRange === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-muted-foreground">
                From
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={exportFrom}
                  onChange={(e) => setExportFrom(e.target.value)}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                To
                <input
                  type="date"
                  className={`${inputClass} mt-1`}
                  value={exportTo}
                  onChange={(e) => setExportTo(e.target.value)}
                />
              </label>
            </div>
          )}
          <div className="rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3 text-xs text-muted-foreground">
            <span className="text-foreground">Selected:</span> {rangeLabel()} ·{" "}
            {exportRows().length} transaction(s)
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              onClick={() => setExportOpen(false)}
              className="rounded-xl px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <GlowButton variant="outline" onClick={exportCsv}>
              <FileDown className="h-4 w-4" /> Download CSV
            </GlowButton>
            <GlowButton onClick={exportPdf}>
              <FileText className="h-4 w-4" /> Download PDF
            </GlowButton>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit transaction" : "Add transaction"}
      >
        {editing && (
          <TxnForm
            initial={editing}
            saving={upsert.isPending}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete transaction"
      >
        <p className="text-sm text-muted-foreground">
          Delete “{confirmDelete?.merchant}”? Your dashboard, budgets and reports will recalculate
          instantly.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={() => setConfirmDelete(null)} className="text-sm text-muted-foreground">
            Cancel
          </button>
          <GlowButton
            onClick={async () => {
              if (confirmDelete) await remove.mutateAsync(confirmDelete.id);
              setConfirmDelete(null);
              if (selected?.id === confirmDelete?.id) setSelected(null);
            }}
          >
            Delete
          </GlowButton>
        </div>
      </Modal>
    </div>
  );
}

function PiggyBankIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M19 8.5c.7.9 1 2 1 3.2 0 3.2-2.9 5.8-6.5 5.8H9l-2.3 2.2v-3.1C5.1 15.7 4 13.9 4 11.7 4 8.6 6.9 6 10.5 6H15c1.2 0 2.4.3 3.4.8" />
      <path d="M15 6V4h2v2" />
      <path d="M8 10h.01M18 11h.01" />
      <path d="M20 9h1.5v4H20" />
    </svg>
  );
}
