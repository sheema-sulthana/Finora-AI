export type MerchantDefinition = {
  name: string;
  category: string;
  domain: string;
  aliases: string[];
};

/**
 * Shared merchant catalogue used by upload, transactions and dashboard.
 *
 * AI extracts the merchant name from the statement. We then deterministically
 * map that name to a known brand/domain. Unknown merchants fall back to their
 * transaction category instead of receiving a random logo.
 */
export const MERCHANT_DATABASE: MerchantDefinition[] = [
  {
    name: "Swiggy",
    category: "Food",
    domain: "swiggy.com",
    aliases: ["swiggy", "swiggy food", "swiggy instamart"],
  },
  { name: "Zomato", category: "Food", domain: "zomato.com", aliases: ["zomato"] },
  {
    name: "McDonald's",
    category: "Food",
    domain: "mcdonalds.com",
    aliases: ["mcdonald", "mcdonalds", "mcd"],
  },
  { name: "Domino's", category: "Food", domain: "dominos.co.in", aliases: ["domino", "dominos"] },
  { name: "KFC", category: "Food", domain: "kfc.co.in", aliases: ["kfc"] },
  { name: "Starbucks", category: "Food", domain: "starbucks.in", aliases: ["starbucks"] },

  {
    name: "Blinkit",
    category: "Groceries",
    domain: "blinkit.com",
    aliases: ["blinkit", "grofers"],
  },
  { name: "Zepto", category: "Groceries", domain: "zepto.com", aliases: ["zepto"] },
  {
    name: "BigBasket",
    category: "Groceries",
    domain: "bigbasket.com",
    aliases: ["bigbasket", "big basket"],
  },
  {
    name: "JioMart",
    category: "Groceries",
    domain: "jiomart.com",
    aliases: ["jiomart", "jio mart"],
  },
  { name: "Swiggy Instamart", category: "Groceries", domain: "swiggy.com", aliases: ["instamart"] },
  { name: "Dunzo", category: "Groceries", domain: "dunzo.com", aliases: ["dunzo"] },

  {
    name: "Amazon",
    category: "Shopping",
    domain: "amazon.in",
    aliases: ["amazon", "amazon india", "amazon.in"],
  },
  { name: "Flipkart", category: "Shopping", domain: "flipkart.com", aliases: ["flipkart"] },
  { name: "Myntra", category: "Shopping", domain: "myntra.com", aliases: ["myntra"] },
  { name: "AJIO", category: "Shopping", domain: "ajio.com", aliases: ["ajio"] },
  { name: "Nykaa", category: "Shopping", domain: "nykaa.com", aliases: ["nykaa"] },
  { name: "Meesho", category: "Shopping", domain: "meesho.com", aliases: ["meesho"] },
  {
    name: "Apple",
    category: "Shopping",
    domain: "apple.com",
    aliases: ["apple", "apple india", "itunes", "app store"],
  },

  { name: "Uber", category: "Transport", domain: "uber.com", aliases: ["uber", "uber india"] },
  { name: "Ola", category: "Transport", domain: "olacabs.com", aliases: ["ola", "ola cabs"] },
  { name: "Rapido", category: "Transport", domain: "rapido.bike", aliases: ["rapido"] },

  { name: "IRCTC", category: "Travel", domain: "irctc.co.in", aliases: ["irctc"] },
  { name: "IndiGo", category: "Travel", domain: "goindigo.in", aliases: ["indigo", "6e"] },
  {
    name: "Air India",
    category: "Travel",
    domain: "airindia.com",
    aliases: ["air india", "airindia"],
  },
  {
    name: "MakeMyTrip",
    category: "Travel",
    domain: "makemytrip.com",
    aliases: ["makemytrip", "make my trip", "mmt"],
  },
  { name: "Cleartrip", category: "Travel", domain: "cleartrip.com", aliases: ["cleartrip"] },

  { name: "Netflix", category: "Subscription", domain: "netflix.com", aliases: ["netflix"] },
  { name: "Spotify", category: "Subscription", domain: "spotify.com", aliases: ["spotify"] },
  {
    name: "YouTube",
    category: "Subscription",
    domain: "youtube.com",
    aliases: ["youtube", "youtube premium"],
  },
  {
    name: "Prime Video",
    category: "Subscription",
    domain: "primevideo.com",
    aliases: ["prime video", "amazon prime video"],
  },
  {
    name: "JioHotstar",
    category: "Subscription",
    domain: "hotstar.com",
    aliases: ["hotstar", "jiohotstar"],
  },
  { name: "ZEE5", category: "Subscription", domain: "zee5.com", aliases: ["zee5", "zee 5"] },
  {
    name: "Sony LIV",
    category: "Subscription",
    domain: "sonyliv.com",
    aliases: ["sony liv", "sonyliv"],
  },
  {
    name: "JioCinema",
    category: "Subscription",
    domain: "jiocinema.com",
    aliases: ["jiocinema", "jio cinema"],
  },
  {
    name: "Microsoft",
    category: "Subscription",
    domain: "microsoft.com",
    aliases: ["microsoft", "microsoft 365", "office 365"],
  },
  {
    name: "Adobe",
    category: "Subscription",
    domain: "adobe.com",
    aliases: ["adobe", "adobe creative cloud"],
  },

  {
    name: "PhonePe",
    category: "Payments",
    domain: "phonepe.com",
    aliases: ["phonepe", "phone pe"],
  },
  {
    name: "Google Pay",
    category: "Payments",
    domain: "pay.google.com",
    aliases: ["google pay", "gpay", "googlepay"],
  },
  { name: "Paytm", category: "Payments", domain: "paytm.com", aliases: ["paytm"] },
  { name: "CRED", category: "Payments", domain: "cred.club", aliases: ["cred"] },
  {
    name: "MobiKwik",
    category: "Payments",
    domain: "mobikwik.com",
    aliases: ["mobikwik", "mobi kwik"],
  },
  { name: "Freecharge", category: "Payments", domain: "freecharge.in", aliases: ["freecharge"] },
  {
    name: "BharatPe",
    category: "Payments",
    domain: "bharatpe.com",
    aliases: ["bharatpe", "bharat pe"],
  },
  { name: "Razorpay", category: "Payments", domain: "razorpay.com", aliases: ["razorpay"] },
  { name: "Google", category: "Payments", domain: "google.com", aliases: ["google"] },

  {
    name: "Airtel",
    category: "Recharge/Utilities",
    domain: "airtel.in",
    aliases: ["airtel", "airtel india"],
  },
  {
    name: "Jio",
    category: "Recharge/Utilities",
    domain: "jio.com",
    aliases: ["jio", "reliance jio"],
  },
  {
    name: "Vi",
    category: "Recharge/Utilities",
    domain: "myvi.in",
    aliases: ["vodafone idea", "vi india", "vi"],
  },

  {
    name: "BookMyShow",
    category: "Entertainment",
    domain: "bookmyshow.com",
    aliases: ["bookmyshow", "book my show"],
  },
  { name: "LinkedIn", category: "Other", domain: "linkedin.com", aliases: ["linkedin"] },
  {
    name: "Cult.fit",
    category: "Healthcare",
    domain: "cult.fit",
    aliases: ["cult fit", "cult.fit", "cultfit"],
  },
  { name: "Practo", category: "Healthcare", domain: "practo.com", aliases: ["practo"] },
];

const MERCHANTS_SORTED = [...MERCHANT_DATABASE].sort(
  (a, b) =>
    Math.max(...b.aliases.map((alias) => alias.length)) -
    Math.max(...a.aliases.map((alias) => alias.length)),
);

export function normalizeMerchantText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMerchant(value?: string): MerchantDefinition | null {
  const candidate = normalizeMerchantText(value || "");
  if (!candidate) return null;

  for (const merchant of MERCHANTS_SORTED) {
    for (const alias of merchant.aliases) {
      const normalizedAlias = normalizeMerchantText(alias);
      if (
        candidate === normalizedAlias ||
        candidate.includes(` ${normalizedAlias} `) ||
        candidate.startsWith(`${normalizedAlias} `) ||
        candidate.endsWith(` ${normalizedAlias}`)
      ) {
        return merchant;
      }
    }
  }

  return null;
}

export function canonicalMerchantName(value: string): string {
  return findMerchant(value)?.name || value.trim();
}

export function canonicalMerchantCategory(merchant: string, category?: string): string {
  return findMerchant(merchant)?.category || String(category || "Other").trim() || "Other";
}

export function domainLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function merchantLogoUrl(merchant: string): string | null {
  const known = findMerchant(merchant);
  return known ? domainLogoUrl(known.domain) : null;
}
