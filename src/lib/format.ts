export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
];

export function currencySymbol(code?: string | null) {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "₹";
}

export function formatMoney(value: number, code?: string | null) {
  const v = Math.round(Number(value) || 0);
  return `${currencySymbol(code)}${v.toLocaleString("en-IN")}`;
}

export function formatDate(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function monthKey(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, 1).toLocaleDateString("en-IN", { month: "short" });
}

export const CATEGORIES = [
  "Food",
  "Shopping",
  "Transport",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Subscriptions",
  "Rent",
  "Savings",
  "Income",
  "Other",
];

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#F59E0B",
  Shopping: "#EC4899",
  Transport: "#3B82F6",
  Bills: "#8B5CF6",
  Entertainment: "#22D3EE",
  Healthcare: "#EF4444",
  Education: "#10B981",
  Subscriptions: "#A78BFA",
  Rent: "#F97316",
  Savings: "#34D399",
  Income: "#4ADE80",
  Other: "#94A3B8",
};

export function categoryColor(c: string) {
  return CATEGORY_COLORS[c] ?? "#94A3B8";
}
