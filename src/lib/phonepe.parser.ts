export type PhonePeExtractedTxn = {
  merchant: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  payment_method: string;
  status: string;
};

const DATE_RE =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),\s+(\d{4})(?:\s+|$)/;
const TRANSACTION_RE =
  /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}\s+(.+?)\s+(DEBIT|CREDIT)\s+₹\s*([\d,]+(?:\.\d+)?)\s*$/;
const DETAIL_PREFIX_RE = /^(Paid to|Received from|Mobile recharged|Payment to)\s*/i;

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isPageNoise(value: string) {
  return (
    value === "" ||
    value === "DEBIT" ||
    value === "CREDIT" ||
    value.startsWith("UTR No.") ||
    value.startsWith("Paid by") ||
    value.startsWith("Credited to") ||
    value.startsWith("Jio Prepaid Reference ID") ||
    value.startsWith("BSNL Prepaid Reference ID") ||
    value.startsWith("Airtel Prepaid Reference ID") ||
    value.startsWith("Page ") ||
    value.startsWith("This is a system generated statement") ||
    value.startsWith("This is an automatically generated statement") ||
    value.startsWith("https://")
  );
}

function parseDate(value: string) {
  const match = value.match(DATE_RE);
  if (!match?.[1] || !match?.[2] || !match?.[3]) return "";

  const month = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  }[match[1]];

  if (!month) return "";

  return `${match[3]}-${String(month).padStart(2, "0")}-${String(Number(match[2])).padStart(
    2,
    "0",
  )}`;
}

function findTransactionId(lines: string[], start: number, end: number) {
  for (let i = start; i < end; i += 1) {
    const line = clean(lines[i] || "");

    if (line.startsWith("Transaction ID ")) {
      return clean(line.slice("Transaction ID ".length));
    }

    if (line === "Transaction ID") {
      return clean(lines[i + 1] || "");
    }
  }

  return "";
}

function extractMerchant(detail: string, continuationLines: string[]) {
  let merchant = clean(detail.replace(DETAIL_PREFIX_RE, ""));

  // Some PhonePe utility payments put the merchant/company name on the
  // following line(s), for example: "Paid to DEBIT ₹1,172" followed by
  // "SOUTHERN POWER DISTRIBUTION COMPANY OF ANDHRA PRADESH".
  if (!merchant || merchant.toUpperCase() === "DEBIT" || merchant.toUpperCase() === "CREDIT") {
    merchant = continuationLines
      .filter((line) => {
        const value = clean(line);
        return (
          value &&
          !isPageNoise(value) &&
          value !== "Transaction ID" &&
          !value.startsWith("Transaction ID") &&
          !/^\d{1,2}:\d{2} (AM|PM)$/i.test(value)
        );
      })
      .map(clean)
      .join(" ");
  }

  return clean(merchant);
}

/**
 * Detect the structured PhonePe statement format before using the parser.
 * This prevents unrelated PDFs from being parsed as PhonePe statements.
 */
export function looksLikePhonePeStatement(text: string) {
  const normalized = text.slice(0, 30_000);

  return (
    /Transaction Statement for/i.test(normalized) &&
    /Transaction ID/i.test(normalized) &&
    /UTR No\./i.test(normalized) &&
    /(Paid by|Credited to)/i.test(normalized)
  );
}

/**
 * Parse every transaction from a text-extracted PhonePe statement.
 * PhonePe's PDF is text based, so this does not depend on Gemini and can
 * handle long statements such as 90/180/365-day exports.
 */
export function parsePhonePeStatementText(text: string): PhonePeExtractedTxn[] {
  if (!looksLikePhonePeStatement(text)) return [];

  const lines = text.split(/\r?\n/).map((line) => clean(line));

  const transactions: PhonePeExtractedTxn[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] || "";
    const dateMatch = line.match(DATE_RE);

    if (!dateMatch) continue;

    const date = parseDate(line);
    if (!date) continue;

    // The transaction summary is normally on the same line as the date.
    // Keep the parser tolerant of a layout where the summary starts later.
    const transactionMatch = line.match(TRANSACTION_RE);
    if (!transactionMatch?.[1] || !transactionMatch?.[2] || !transactionMatch?.[3]) {
      continue;
    }

    const detail = transactionMatch[1];
    const type = transactionMatch[2];
    const amount = Number(transactionMatch[3].replace(/,/g, ""));

    if (!Number.isFinite(amount) || amount <= 0) continue;

    let end = i + 1;
    while (end < lines.length && !DATE_RE.test(lines[end] || "")) {
      end += 1;
    }

    const transactionId = findTransactionId(lines, i + 1, end);
    if (!transactionId) continue;

    const continuationLines = lines.slice(i + 1, end);
    const merchant = extractMerchant(detail, continuationLines);
    if (!merchant) continue;

    transactions.push({
      merchant,
      amount,
      type: type === "CREDIT" ? "income" : "expense",
      category: "Other",
      date,
      payment_method: "UPI",
      status: "completed",
    });

    // The next date is handled by the outer loop.
  }

  return transactions;
}
