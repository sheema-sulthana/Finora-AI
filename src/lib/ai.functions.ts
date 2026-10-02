import { createServerFn } from "@tanstack/react-start";

import {
  callGateway,
  coachSystemPrompt,
  EXTRACTION_SYSTEM,
  parseJson,
  type ContentBlock,
  type GwMessage,
} from "./ai.server";
import { extractPhonePeTransactionsFromPdf } from "./phonepe.server";

/* =========================================================
   TYPES
   ========================================================= */

export type ExtractedTxn = {
  merchant: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  payment_method: string;
  status: string;
};

export type AnalysisReport = {
  summary: string;
  insights: string[];
  suggestions: string[];
  comparison: Record<string, string | number>;
  predictions: Record<string, string | number>;
  health_score: number;
  health_reasons: string[];
};

export type AnalysisResult = {
  transactions: ExtractedTxn[];
  report: AnalysisReport;
};

type AnalyzeInput = {
  filename: string;
  mimeType: string;
  dataUrl?: string;
  text?: string;
  currency?: string;
  generateReport?: boolean;
};

type ChatInput = {
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  context: string;
};

/* =========================================================
   EMPTY REPORT
   ========================================================= */

const emptyReport: AnalysisReport = {
  summary: "No financial transactions were detected in this file.",

  insights: [],

  suggestions: [],

  comparison: {},

  predictions: {},

  health_score: 0,

  health_reasons: [],
};

/* =========================================================
   CSV HELPERS
   ========================================================= */

function parseCSVLine(line: string): string[] {
  const result: string[] = [];

  let current = "";

  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }

      continue;
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim());

      current = "";

      continue;
    }

    current += char;
  }

  result.push(current.trim());

  return result;
}

function parseCSV(text: string): string[][] {
  return text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCSVLine);
}

/* =========================================================
   HEADER HELPERS
   ========================================================= */

function normalizeHeader(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[\s_\-()./]+/g, "");
}

function findColumn(headers: string[], names: string[]): number {
  const normalized = headers.map(normalizeHeader);

  // Prefer exact matches first. This prevents a short alias such as
  // "date" from accidentally matching the wrong column.
  for (const name of names) {
    const target = normalizeHeader(name);
    if (!target) continue;

    const exact = normalized.findIndex((header) => header.length > 0 && header === target);

    if (exact !== -1) return exact;
  }

  // Then allow safe partial matches, but NEVER match an empty header.
  for (const name of names) {
    const target = normalizeHeader(name);
    if (!target) continue;

    const partial = normalized.findIndex(
      (header) => header.length > 0 && (header.includes(target) || target.includes(header)),
    );

    if (partial !== -1) return partial;
  }

  return -1;
}

/* =========================================================
   DATE / TIME SAFETY
   ========================================================= */

function isDateLike(value: string): boolean {
  const raw = String(value || "").trim();
  if (!raw) return false;

  return (
    /^(?:\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}[-/]\d{1,2}[-/]\d{4})$/.test(raw) ||
    /^(?:\d{1,2}\s+)?[A-Za-z]{3,12}\s+\d{1,2},?\s+\d{4}$/.test(raw) ||
    /^\d{1,2},?\s+[A-Za-z]{3,12}\s+\d{4}$/.test(raw) ||
    /^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?$/i.test(raw) ||
    /(?:\d{1,2}\s+[A-Za-z]{3,12},?\s+\d{4})\s*[–-]\s*(?:\d{1,2}\s+[A-Za-z]{3,12},?\s+\d{4})/i.test(
      raw,
    ) ||
    /\d{1,2}\s*[–-]\s*\d{1,2}\s+[A-Za-z]{3,12},?\s+\d{4}/i.test(raw)
  );
}

function findHeaderRow(rows: string[][]): number {
  const headerWords = [
    "date",
    "transaction date",
    "merchant",
    "merchant name",
    "description",
    "narration",
    "details",
    "amount",
    "debit",
    "credit",
    "type",
    "payment method",
    "method",
    "mode",
    "status",
  ];

  let bestIndex = -1;
  let bestScore = 0;

  const limit = Math.min(rows.length, 30);

  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const cells = row.map((cell) => normalizeHeader(cell));
    let score = 0;

    for (const word of headerWords) {
      const target = normalizeHeader(word);
      if (cells.some((cell) => cell && (cell === target || cell.includes(target)))) {
        score += 1;
      }
    }

    // A real transaction header normally contains at least two useful fields.
    if (score >= 2 && score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

/* =========================================================
   DATE
   ========================================================= */

function normalizeDate(value: string): string {
  const raw = String(value || "").trim();

  if (!raw) {
    return new Date().toISOString().slice(0, 10);
  }

  let match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

  if (match?.[1] && match?.[2] && match?.[3]) {
    return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  }

  match = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);

  if (match?.[1] && match?.[2] && match?.[3]) {
    return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

/* =========================================================
   AMOUNT
   ========================================================= */

function parseAmount(value: string): number {
  if (!value) {
    return 0;
  }

  const cleaned = String(value)
    .replace(/[₹$€£,\s]/g, "")
    .replace(/[^\d.-]/g, "");

  const amount = Number.parseFloat(cleaned);

  return Number.isFinite(amount) ? Math.abs(amount) : 0;
}

/* =========================================================
   CATEGORY
   ========================================================= */

function detectCategory(merchant: string): string {
  const value = merchant.toLowerCase();

  if (/swiggy|zomato|restaurant|food|cafe|coffee|pizza|domino|kfc|mcdonald/.test(value)) {
    return "Food";
  }

  if (/amazon|flipkart|myntra|shopping|mall|store|retail/.test(value)) {
    return "Shopping";
  }

  if (/uber|ola|rapido|metro|bus|transport|fuel|petrol|diesel/.test(value)) {
    return "Transport";
  }

  if (/electricity|water|gas|bill|recharge|mobile|airtel|jio|bsnl/.test(value)) {
    return "Bills";
  }

  if (/netflix|spotify|prime|youtube|movie|cinema|game/.test(value)) {
    return "Entertainment";
  }

  if (/hospital|pharmacy|medical|doctor|health/.test(value)) {
    return "Healthcare";
  }

  if (/school|college|course|education|udemy|coursera/.test(value)) {
    return "Education";
  }

  if (/rent|landlord|housing/.test(value)) {
    return "Rent";
  }

  if (/travel|flight|airlines|hotel|booking/.test(value)) {
    return "Travel";
  }

  return "Other";
}

/* =========================================================
   TRANSACTION TYPE
   ========================================================= */

function detectType(text: string): "income" | "expense" {
  const value = text.toLowerCase();

  if (/credit|credited|received|refund|cashback|deposit|income|received from/.test(value)) {
    return "income";
  }

  return "expense";
}

/* =========================================================
   MERCHANT CLEANUP
   ========================================================= */

function cleanMerchant(value: string): string {
  const merchant = String(value || "")
    .trim()
    .replace(/^(paid to|sent to|payment to|received from|transfer to|upi payment to)\s*/i, "")
    .trim();

  return (merchant || "Unknown").slice(0, 120);
}

/* =========================================================
   CSV EXTRACTION
   ========================================================= */

export function extractTransactionsFromCSV(text: string): ExtractedTxn[] {
  const rows = parseCSV(text);

  if (rows.length < 2) {
    return [];
  }

  const headerRowIndex = findHeaderRow(rows);

  if (headerRowIndex === -1) {
    return [];
  }

  const headers = rows[headerRowIndex] ?? [];
  const dataRows = rows.slice(headerRowIndex + 1);

  const dateIndex = findColumn(headers, [
    "date",
    "transaction date",
    "transactiondate",
    "txn date",
    "txndate",
  ]);

  const merchantIndex = findColumn(headers, [
    "merchant",
    "merchant name",
    "merchantname",
    "description",
    "transaction details",
    "transactiondetails",
    "details",
    "narration",
    "remarks",
    "payee",
  ]);

  const amountIndex = findColumn(headers, [
    "amount",
    "transaction amount",
    "transactionamount",
    "txn amount",
    "value",
  ]);

  const debitIndex = findColumn(headers, [
    "debit",
    "debit amount",
    "debitamount",
    "withdrawal",
    "withdrawal amount",
    "paid",
    "spent",
  ]);

  const creditIndex = findColumn(headers, [
    "credit",
    "credit amount",
    "creditamount",
    "deposit",
    "received",
    "income",
  ]);

  const typeIndex = findColumn(headers, [
    "type",
    "transaction type",
    "transactiontype",
    "txn type",
    "dr cr",
    "drcr",
  ]);

  const categoryIndex = findColumn(headers, ["category", "expense category"]);

  const methodIndex = findColumn(headers, [
    "payment method",
    "paymentmethod",
    "method",
    "mode",
    "payment mode",
    "paymentmode",
  ]);

  const statusIndex = findColumn(headers, ["status", "transaction status", "transactionstatus"]);

  const transactions: ExtractedTxn[] = [];

  for (const row of dataRows) {
    if (!row?.length) {
      continue;
    }

    let merchant = merchantIndex >= 0 ? row[merchantIndex] : "";

    let typeText = typeIndex >= 0 ? row[typeIndex] || "" : "";

    let amount = 0;
    let amountText = "";

    if (amountIndex >= 0) {
      amountText = String(row[amountIndex] || "");
      amount = parseAmount(amountText);
      if (/^-/.test(amountText.trim())) {
        typeText += " debit";
      } else if (/^\+/.test(amountText.trim())) {
        typeText += " credit";
      }
    }

    if (debitIndex >= 0) {
      const debitValue = row[debitIndex] ?? "";

      if (parseAmount(debitValue) > 0) {
        amount = parseAmount(debitValue);
        typeText += " debit";
      }
    }

    if (creditIndex >= 0) {
      const creditValue = row[creditIndex] ?? "";

      if (parseAmount(creditValue) > 0) {
        amount = parseAmount(creditValue);
        typeText += " credit";
      }
    }

    if (amount <= 0) {
      continue;
    }

    if (!merchant) {
      const candidate = row.find(
        (value, index) =>
          index !== dateIndex &&
          index !== amountIndex &&
          index !== debitIndex &&
          index !== creditIndex &&
          index !== typeIndex &&
          index !== categoryIndex &&
          index !== methodIndex &&
          index !== statusIndex &&
          value &&
          /[a-zA-Z]/.test(value),
      );

      merchant = candidate || "Unknown";
    }

    merchant = cleanMerchant(merchant);

    const type = detectType(`${typeText} ${merchant}`);

    const date =
      dateIndex >= 0 ? normalizeDate(row[dateIndex] ?? "") : new Date().toISOString().slice(0, 10);

    const category =
      categoryIndex >= 0 && row[categoryIndex]?.trim()
        ? row[categoryIndex].trim()
        : detectCategory(merchant);

    const payment_method =
      methodIndex >= 0 && row[methodIndex]?.trim() ? row[methodIndex].trim() : "Unknown";

    const status =
      statusIndex >= 0 && row[statusIndex]?.trim() ? row[statusIndex].trim() : "completed";

    transactions.push({
      merchant,
      amount,
      type,
      category,
      date,
      payment_method,
      status,
    });
  }

  return transactions;
}

/* =========================================================
   LOCAL REPORT
   ========================================================= */

export function createLocalReport(transactions: ExtractedTxn[]): AnalysisReport {
  if (!transactions.length) {
    return emptyReport;
  }

  const expenses = transactions.filter((t) => t.type === "expense");

  const categoryTotals = new Map<string, number>();

  const merchantTotals = new Map<string, number>();

  for (const transaction of expenses) {
    categoryTotals.set(
      transaction.category,
      (categoryTotals.get(transaction.category) || 0) + transaction.amount,
    );

    merchantTotals.set(
      transaction.merchant,
      (merchantTotals.get(transaction.merchant) || 0) + transaction.amount,
    );
  }

  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const topMerchant = [...merchantTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const averageExpense = expenses.length ? totalExpenses / expenses.length : 0;

  return {
    summary: expenses.length
      ? `${transactions.length} transactions were detected in the uploaded document, including ${expenses.length} expense transactions.`
      : `${transactions.length} transactions were detected in the uploaded document.`,

    insights: [
      ...(expenses.length ? [`${expenses.length} expense transaction(s) were detected.`] : []),

      ...(topCategory
        ? [`Highest spending category: ${topCategory[0]} (₹${topCategory[1].toFixed(2)}).`]
        : []),

      ...(topMerchant
        ? [`Highest spending merchant: ${topMerchant[0]} (₹${topMerchant[1].toFixed(2)}).`]
        : []),
    ],

    suggestions: [
      ...(topCategory
        ? [
            `Review your ${topCategory[0].toLowerCase()} spending and look for unnecessary purchases.`,
          ]
        : []),

      ...(averageExpense
        ? [`Average expense transaction: approximately ₹${averageExpense.toFixed(2)}.`]
        : []),
    ],

    comparison: {
      total_transactions: transactions.length,

      expense_transactions: expenses.length,
    },

    predictions: {},

    health_score: 0,

    health_reasons: [
      "This analysis is based only on transactions detected in the uploaded document.",
    ],
  };
}

/* =========================================================
   TRANSACTION NORMALIZATION
   Keep CSV and PDF results consistent.
   ========================================================= */
function normalizePaymentMethod(value: string, merchant: string, filename = ""): string {
  const cleanValue = String(value || "").trim();
  const raw = `${cleanValue} ${merchant} ${filename}`.toLowerCase();
  const suspicious =
    !cleanValue || isDateLike(cleanValue) || /^(unknown|null|undefined|n\/a|-)$/i.test(cleanValue);

  if (/upi|phonepe|gpay|google pay|paytm|bhim|@ok|@ybl|@ibl|@axl|@paytm/.test(raw)) {
    return "UPI";
  }
  if (/credit card|debit card|card payment|visa|mastercard|rupay/.test(raw)) {
    return "Card";
  }
  if (/cash|cash withdrawal/.test(raw)) {
    return "Cash";
  }
  if (/net banking|netbanking|internet banking/.test(raw)) {
    return "Net Banking";
  }
  if (/bank transfer|neft|rtgs|imps/.test(raw)) {
    return "Bank Transfer";
  }
  if (/wallet/.test(raw)) {
    return "Wallet";
  }

  // PhonePe statements are UPI statements. If extraction put a date/time or
  // another header value into the method field, replace it with UPI.
  if (/phonepe/.test(filename.toLowerCase()) && suspicious) {
    return "UPI";
  }

  return cleanValue || "Unknown";
}

function normalizeStatus(value: string): string {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return "Completed";
  if (/success|successful|completed|complete|paid|settled|done/.test(raw)) return "Completed";
  if (/pending|processing|initiated/.test(raw)) return "Pending";
  if (/failed|failure|declined|cancelled|canceled|reversed/.test(raw)) return "Failed";
  return String(value).trim();
}

function normalizeCategory(value: string, merchant: string): string {
  const category = String(value || "").trim();
  if (category && category.toLowerCase() !== "unknown") return category;
  return detectCategory(merchant);
}

function normalizeTransactions(transactions: ExtractedTxn[], filename = ""): ExtractedTxn[] {
  return transactions
    .map((transaction) => {
      const merchant = cleanMerchant(String(transaction.merchant || "Unknown"));
      const method = normalizePaymentMethod(
        String(transaction.payment_method || ""),
        merchant,
        filename,
      );
      const category = normalizeCategory(String(transaction.category || ""), merchant);

      const type: ExtractedTxn["type"] = transaction.type === "income" ? "income" : "expense";

      return {
        merchant,
        amount: Math.abs(Number(transaction.amount) || 0),
        type,
        category,
        date: normalizeDate(String(transaction.date || "")),
        payment_method: method,
        status: normalizeStatus(String(transaction.status || "")),
      };
    })
    .filter((transaction) => transaction.amount > 0);
}

/* =========================================================
   ANALYZE STATEMENT
   ========================================================= */

export const analyzeStatement = createServerFn({
  method: "POST",
})
  .validator((input: AnalyzeInput) => {
    if (!input?.filename) {
      throw new Error("A file is required.");
    }

    if (!input.text && !input.dataUrl) {
      throw new Error("File content is missing.");
    }

    return input;
  })
  .handler(async ({ data }): Promise<AnalysisResult> => {
    const currency = data.currency ?? "INR";

    /* =================================================
           CSV / TXT

           IMPORTANT:
           CSV files must go through the same transaction-extraction
           quality path as PDFs. PhonePe/statement CSV exports can contain
           extra rows, summary rows, separate debit/credit columns, and
           different column names. The old code guessed columns locally and
           could turn dates/times into merchants and classify every row as
           income. That also broke charts and AI chat because both depend on
           the normalized transaction list.
           ================================================= */

    if (data.text) {
      let transactions: ExtractedTxn[] = [];

      /*
       * First ask the AI to extract the CSV itself. This is intentionally
       * similar to the PDF path: the raw document is the source of truth,
       * not a guessed column mapping.
       */
      try {
        const csvText = data.text;

        const extractionRaw = await callGateway(
          [
            {
              role: "system",
              content: `
You are Finora AI's financial CSV extraction engine.

Read the COMPLETE CSV text supplied by the user and extract EVERY REAL
financial transaction. The CSV may be exported from PhonePe or another
bank/payment application and may contain extra headers, summary rows,
date ranges, times, balances, or different column names.

Do NOT assume the first row is the transaction header.
Do NOT treat a date, date range, time, column heading, total, balance,
opening balance, closing balance, or summary as a transaction.
Do NOT use a date or time as the merchant.
Do NOT invent transactions.
Do NOT invent salary, savings, or account balance.

For every real transaction return:
- merchant
- amount
- type: "income" or "expense"
- category
- date in YYYY-MM-DD
- payment_method
- status

TRANSACTION TYPE RULES:
- money paid, sent, debited, withdrawn, spent = expense
- money received, credited, deposited, refunded, cashback = income
- If the CSV has Debit/Credit columns, use those columns as the strongest
  evidence for the type.
- A positive number does NOT automatically mean income.
- Preserve the actual amount from the transaction row.

PAYMENT METHOD RULES:
- PhonePe / UPI / UPI ID / @ok / @ybl / @ibl / @axl / @paytm = UPI
- card / debit card / credit card / Visa / Mastercard / RuPay = Card
- cash / cash withdrawal = Cash
- NEFT / RTGS / IMPS / bank transfer = Bank Transfer
- net banking / internet banking = Net Banking
- wallet = Wallet
- Otherwise use Unknown.

CATEGORY RULES:
Use an existing category in the CSV when it is trustworthy. Otherwise
categorize from the merchant/transaction context using categories such as
Food, Shopping, Bills, Transport, Entertainment, Healthcare, Education,
Rent, Travel, and Other.

STATUS RULES:
completed/success/paid/settled = Completed
pending/processing/initiated = Pending
failed/declined/cancelled/reversed = Failed
If the CSV does not provide status, use Completed.

IMPORTANT QUALITY RULE:
The final transaction list must contain the actual transaction rows, not
rows created from the CSV's report/summary/header area. If there are 45 real
transactions, return 45 transactions.

Return ONLY this JSON object:
{
  "transactions": [
    {
      "merchant": "actual merchant",
      "amount": 100,
      "type": "expense",
      "category": "Food",
      "date": "2026-08-19",
      "payment_method": "UPI",
      "status": "Completed"
    }
  ]
}
`,
            },
            {
              role: "user",
              content: `Filename: ${data.filename}\nCurrency: ${currency}\n\nRAW CSV:\n${csvText}`,
            },
          ],
          undefined,
          {
            temperature: 0,
            maxTokens: 12000,
          },
        );

        const parsed = parseJson<unknown>(extractionRaw, null);

        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { transactions?: unknown }).transactions)
        ) {
          transactions = normalizeTransactions(
            (parsed as { transactions: ExtractedTxn[] }).transactions,
            data.filename,
          );
        }
      } catch (error) {
        console.warn("AI CSV extraction failed; falling back to local CSV parser.", error);
      }

      /*
       * Safe fallback. If the AI cannot parse the CSV, keep the existing
       * local parser so the upload still works instead of failing.
       */
      if (!transactions.length) {
        transactions = normalizeTransactions(extractTransactionsFromCSV(data.text), data.filename);
      }

      if (!transactions.length) {
        return {
          transactions: [],
          report: {
            ...emptyReport,
            summary: "The CSV was opened successfully, but no transaction rows could be detected.",
          },
        };
      }

      /*
       * Always build a local report first. This guarantees charts and
       * basic financial totals are based on the same normalized rows.
       */
      let report = createLocalReport(transactions);

      /*
       * Then generate the same quality of AI report used by the PDF flow.
       * The AI receives the corrected transaction list, not the broken
       * raw column guesses from the old CSV parser.
       */
      if (data.generateReport !== false) {
        try {
          const context = transactions
            .map(
              (t, index) =>
                `${index + 1}. Date: ${t.date} | Merchant: ${t.merchant} | Amount: ₹${t.amount} | Type: ${t.type} | Category: ${t.category} | Method: ${t.payment_method} | Status: ${t.status}`,
            )
            .join("\n");

          const raw = await callGateway(
            [
              {
                role: "system",
                content: `
You are Finora AI.

Analyze ONLY the normalized transactions provided below.

Do not create transactions.
Do not change transaction amounts, dates, merchants, types, categories,
payment methods, or statuses.
Do not invent salary, savings, balances, or financial information.

Use the exact transaction data to produce useful insights about spending,
income, merchants, categories, largest/smallest transactions, and patterns.

Return ONLY JSON:
{
  "summary": "",
  "insights": [],
  "suggestions": [],
  "comparison": {},
  "predictions": {},
  "health_score": 0,
  "health_reasons": []
}
`,
              },
              {
                role: "user",
                content: `Currency: ${currency}\n\nNormalized transactions:\n${context}`,
              },
            ],
            undefined,
            {
              temperature: 0.15,
              maxTokens: 4096,
            },
          );

          const aiReport = parseJson<AnalysisReport>(raw, report);

          report = {
            summary:
              typeof aiReport.summary === "string" && aiReport.summary.trim()
                ? aiReport.summary
                : report.summary,

            insights: Array.isArray(aiReport.insights)
              ? aiReport.insights.filter((x) => typeof x === "string").slice(0, 10)
              : report.insights,

            suggestions: Array.isArray(aiReport.suggestions)
              ? aiReport.suggestions.filter((x) => typeof x === "string").slice(0, 10)
              : report.suggestions,

            comparison:
              aiReport.comparison && typeof aiReport.comparison === "object"
                ? aiReport.comparison
                : report.comparison,

            predictions:
              aiReport.predictions && typeof aiReport.predictions === "object"
                ? aiReport.predictions
                : report.predictions,

            health_score:
              typeof aiReport.health_score === "number"
                ? aiReport.health_score
                : report.health_score,

            health_reasons: Array.isArray(aiReport.health_reasons)
              ? aiReport.health_reasons.filter((x) => typeof x === "string").slice(0, 10)
              : report.health_reasons,
          };
        } catch (error) {
          console.warn("AI CSV report generation failed; using local report.", error);
        }
      }

      return {
        transactions,
        report,
      };
    }

    /* =================================================
           PDF / IMAGE
           ================================================= */

    if (data.dataUrl) {
      /*
       * PhonePe statements are structured, text-based PDFs. Do not send
       * a long 90/180/365-day PhonePe statement to Gemini as one giant
       * JSON-generation request. That makes extraction depend on model
       * output limits and can truncate long transaction lists.
       *
       * Instead, parse the PDF locally on the server and use Gemini only
       * for formats that do not have a deterministic parser. This makes
       * long PhonePe statements independent of Gemini response length.
       */
      if (data.mimeType === "application/pdf") {
        try {
          const phonePeTransactions = await extractPhonePeTransactionsFromPdf(data.dataUrl);

          if (phonePeTransactions.length > 0) {
            const normalizedTransactions = normalizeTransactions(
              phonePeTransactions,
              data.filename,
            );

            return {
              transactions: normalizedTransactions,
              report: createLocalReport(normalizedTransactions),
            };
          }
        } catch (phonePeError) {
          console.warn(
            "Local PhonePe PDF extraction failed; falling back to Gemini.",
            phonePeError,
          );
        }
      }
      /*
       * IMPORTANT:
       * Do not force responseMimeType = application/json here.
       * Multimodal PDF extraction is more reliable when Gemini is
       * allowed to return normal text containing JSON, which we then
       * parse with parseJson().
       */

      const blocks: ContentBlock[] = [
        {
          type: "text",
          text: `
Read the uploaded financial statement carefully.

Filename: ${data.filename}
File type: ${data.mimeType}
Currency: ${currency}

Extract EVERY real transaction visible in the document.

For each transaction return:
- merchant
- amount
- type: "income" or "expense"
- category
- date
- payment_method
- status

STRICT RULES:
- Do not invent anything.
- Do not treat headers, page titles, date ranges, balances, totals,
  opening balances or closing balances as transactions.
- Do not treat a time such as "5:09 PM" as a merchant.
- Do not treat a date as a merchant.
- Do not treat a date range as a transaction.
- Do not invent salary.
- Do not infer salary from a credit/deposit.
- Do not invent savings or account balance.
- Preserve the exact transaction amounts visible in the document.
- Dates should be YYYY-MM-DD.
- Amount must be positive.
- If the merchant is unclear, use "Unknown".
- Determine payment_method from visible transaction details whenever possible.
- For PhonePe/UPI transactions, use "UPI" when the document identifies a UPI payment, PhonePe payment, UPI ID, or UPI transfer.
- Do not use "Unknown" for payment_method when the document provides enough evidence to identify UPI, card, cash, bank transfer, net banking, or wallet.
- Determine type from the transaction row/sign/credit-debit wording: money sent/paid/debited/withdrawn is "expense"; money received/credited/deposited/refunded is "income".
- If the status is unclear, use "completed".
- If the category is unclear, use "Other".

Return ONLY JSON in this exact shape:

{
  "transactions": [
    {
      "merchant": "actual merchant",
      "amount": 100,
      "type": "expense",
      "category": "Other",
      "date": "2026-08-19",
      "payment_method": "UPI",
      "status": "completed"
    }
  ],
  "report": {
    "summary": "",
    "insights": [],
    "suggestions": [],
    "comparison": {},
    "predictions": {},
    "health_score": 0,
    "health_reasons": []
  }
}

If there are 50 transactions, return all 50.
Do not return an empty transactions array when transactions are visible.
`,
        },
      ];

      if (data.mimeType.startsWith("image/")) {
        blocks.push({
          type: "image_url",
          image_url: {
            url: data.dataUrl,
          },
        });
      } else {
        blocks.push({
          type: "file",
          file: {
            filename: data.filename,
            file_data: data.dataUrl,
          },
        });
      }

      const messages: GwMessage[] = [
        {
          role: "system",
          content: EXTRACTION_SYSTEM,
        },
        {
          role: "user",
          content: blocks,
        },
      ];

      /*
       * FIRST ATTEMPT
       *
       * Deliberately do NOT use responseMimeType here. This is the
       * important fix for PDF/statement extraction.
       */
      let raw = await callGateway(messages, undefined, {
        temperature: 0.05,
        maxTokens: 12000,
      });

      let parsed = parseJson<AnalysisResult>(raw, {
        transactions: [],
        report: emptyReport,
      });

      /*
       * SECOND ATTEMPT
       *
       * If Gemini returned empty/invalid structured output, retry with
       * a much simpler transaction-array request. This prevents the UI
       * from silently showing "No transactions" when the PDF was actually
       * readable.
       */
      if (!Array.isArray(parsed.transactions) || parsed.transactions.length === 0) {
        raw = await callGateway(
          [
            {
              role: "system",
              content: `
You extract financial transactions from uploaded statements.

Read the attached document and extract every visible transaction.

Return ONLY a JSON array.

Each item MUST have:
{
  "merchant": "string",
  "amount": 0,
  "type": "income" or "expense",
  "category": "Other",
  "date": "YYYY-MM-DD",
  "payment_method": "Unknown",
  "status": "completed"
}

Rules:
- Ignore headers and page titles.
- Ignore date ranges.
- Ignore opening/closing balances and summary totals.
- Never use a date or time as merchant.
- Never invent salary.
- Never infer salary from deposits.
- Never invent transactions.
- Amount must be positive.
- Extract actual transactions only.
`,
            },
            {
              role: "user",
              content: blocks,
            },
          ],
          undefined,
          {
            temperature: 0,
            maxTokens: 12000,
          },
        );

        const retryParsed = parseJson<unknown>(raw, []);

        if (Array.isArray(retryParsed)) {
          parsed = {
            transactions: retryParsed as ExtractedTxn[],
            report: emptyReport,
          };
        } else if (
          retryParsed &&
          typeof retryParsed === "object" &&
          Array.isArray((retryParsed as { transactions?: unknown }).transactions)
        ) {
          parsed = retryParsed as AnalysisResult;
        }
      }

      const transactions = (parsed.transactions ?? [])
        .filter((transaction) => {
          if (!transaction) return false;

          const merchant = String(transaction.merchant ?? "").trim();
          const amount = Number(transaction.amount);

          if (!merchant || !Number.isFinite(amount) || amount <= 0) {
            return false;
          }

          /*
           * Final safety filter:
           * never allow dates/times/date-ranges to become merchants.
           */
          if (isDateLike(merchant)) return false;

          if (/^\d{1,2}\s*[-–]\s*\d{1,2}\s+\w+\s+\d{4}$/i.test(merchant)) {
            return false;
          }

          return true;
        })
        .map((transaction) => {
          const merchant = cleanMerchant(String(transaction.merchant));

          const amount = Math.abs(Number(transaction.amount));

          const type = transaction.type === "income" ? ("income" as const) : ("expense" as const);

          const category = String(transaction.category || "").trim() || detectCategory(merchant);

          const date =
            typeof transaction.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(transaction.date)
              ? transaction.date
              : normalizeDate(String(transaction.date || ""));

          return {
            merchant: merchant.slice(0, 120),
            amount,
            type,
            category,
            date,
            payment_method: String(transaction.payment_method || "").trim() || "Unknown",
            status: String(transaction.status || "").trim() || "completed",
          };
        });

      let normalizedTransactions = normalizeTransactions(transactions, data.filename);

      /*
       * PDF reconciliation: multimodal extraction can occasionally read
       * the amounts/merchants correctly but miss the debit/credit sign or
       * the payment-method column. Only run this second pass when the
       * result looks suspicious, so normal PDFs stay fast.
       */
      const unknownMethods = normalizedTransactions.filter(
        (transaction) => transaction.payment_method === "Unknown",
      ).length;
      const expenseCount = normalizedTransactions.filter(
        (transaction) => transaction.type === "expense",
      ).length;
      const needsPdfRepair =
        normalizedTransactions.length > 0 &&
        (unknownMethods > normalizedTransactions.length / 3 || expenseCount === 0);

      if (needsPdfRepair) {
        try {
          const transactionSnapshot = normalizedTransactions
            .map((transaction, index) => `${index + 1}. ${JSON.stringify(transaction)}`)
            .join("\n");

          const repairRaw = await callGateway(
            [
              {
                role: "system",
                content: `
You are Finora AI's transaction verification engine.

The attached financial statement is the source of truth.
The JSON below was extracted from it and may contain wrong metadata.

Correct ONLY these fields when the document provides evidence:
- type: expense for money paid/sent/debited/withdrawn; income for money received/credited/deposited/refunded
- payment_method: UPI, Card, Cash, Net Banking, Bank Transfer, Wallet, or Unknown
- category: use the merchant/transaction context and the allowed categories
- status: Completed, Pending, Failed

IMPORTANT:
- Preserve the merchant, amount and date unless the attached document clearly proves they are wrong.
- Never invent a transaction.
- For PhonePe/UPI payments, identify UPI from PhonePe branding, UPI IDs, or UPI payment wording.
- Return ONLY a JSON array.

CURRENT EXTRACTION:
${transactionSnapshot}
`,
              },
              {
                role: "user",
                content: blocks,
              },
            ],
            undefined,
            {
              temperature: 0,
              maxTokens: 12000,
            },
          );

          const repaired = parseJson<unknown>(repairRaw, null);
          if (Array.isArray(repaired)) {
            normalizedTransactions = normalizeTransactions(
              repaired as ExtractedTxn[],
              data.filename,
            );
          }
        } catch (repairError) {
          console.warn("PDF metadata reconciliation failed; using first extraction.", repairError);
        }
      }

      /*
       * Always create a safe local report from the actual extracted
       * transactions. This guarantees the report never invents salary,
       * savings or balance information.
       */
      let report = createLocalReport(normalizedTransactions);

      /*
       * If Gemini returned a useful report, keep its wording, but only
       * when transactions were actually extracted.
       */
      if (normalizedTransactions.length > 0 && parsed.report && typeof parsed.report === "object") {
        report = {
          summary:
            typeof parsed.report.summary === "string" && parsed.report.summary.trim()
              ? parsed.report.summary
              : report.summary,

          insights: Array.isArray(parsed.report.insights)
            ? parsed.report.insights.filter((value) => typeof value === "string").slice(0, 10)
            : report.insights,

          suggestions: Array.isArray(parsed.report.suggestions)
            ? parsed.report.suggestions.filter((value) => typeof value === "string").slice(0, 10)
            : report.suggestions,

          comparison:
            parsed.report.comparison && typeof parsed.report.comparison === "object"
              ? parsed.report.comparison
              : report.comparison,

          predictions: {},

          health_score: 0,

          health_reasons: Array.isArray(parsed.report.health_reasons)
            ? parsed.report.health_reasons.filter((value) => typeof value === "string").slice(0, 10)
            : report.health_reasons,
        };
      }

      return {
        transactions: normalizedTransactions,
        report,
      };
    }

    throw new Error("Unsupported file.");
  });

/* =========================================================
   AI REPORT GENERATION
   ========================================================= */

type GenerateReportInput = {
  context: string;
  period: "weekly" | "monthly" | "yearly";
};

export const generateReport = createServerFn({
  method: "POST",
})
  .validator((input: GenerateReportInput) => {
    if (!input?.context?.trim()) {
      throw new Error("Financial context is missing.");
    }

    if (!["weekly", "monthly", "yearly"].includes(input.period)) {
      throw new Error("Invalid report period.");
    }

    return input;
  })
  .handler(async ({ data }): Promise<AnalysisReport> => {
    const periodLabel =
      data.period === "weekly"
        ? "the last 7 days"
        : data.period === "monthly"
          ? "the last month"
          : "the last 12 months";

    const systemPrompt = `
You are Finora AI's financial reporting engine.

Generate a factual financial report from the supplied transaction context.
The report period is ${periodLabel}.

Rules:
- Use ONLY information present in the supplied context.
- Do not invent income, expenses, balances, predictions, or transactions.
- Keep all observations concise and useful.
- Return ONLY valid JSON.
- health_score must be an integer from 0 to 100.
- comparison and predictions must contain only simple string or number values.
- If there is not enough evidence for a prediction, leave predictions as {}.

Required JSON shape:
{
  "summary": "string",
  "insights": ["string"],
  "suggestions": ["string"],
  "comparison": {"key": "string or number"},
  "predictions": {"key": "string or number"},
  "health_score": 0,
  "health_reasons": ["string"]
}
`;

    try {
      const raw = await callGateway(
        [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: data.context.slice(0, 100000),
          },
        ],
        undefined,
        {
          temperature: 0.2,
          maxTokens: 4096,
          responseMimeType: "application/json",
        },
      );

      const parsed = parseJson<Partial<AnalysisReport>>(raw, {});

      const healthScore = Number(parsed.health_score);

      return {
        summary:
          typeof parsed.summary === "string" && parsed.summary.trim()
            ? parsed.summary.trim()
            : "Financial report generated from the available transaction data.",
        insights: Array.isArray(parsed.insights)
          ? parsed.insights
              .filter((value): value is string => typeof value === "string")
              .slice(0, 10)
          : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
              .filter((value): value is string => typeof value === "string")
              .slice(0, 10)
          : [],
        comparison:
          parsed.comparison && typeof parsed.comparison === "object" ? parsed.comparison : {},
        predictions:
          parsed.predictions && typeof parsed.predictions === "object" ? parsed.predictions : {},
        health_score: Number.isFinite(healthScore)
          ? Math.max(0, Math.min(100, Math.round(healthScore)))
          : 0,
        health_reasons: Array.isArray(parsed.health_reasons)
          ? parsed.health_reasons
              .filter((value): value is string => typeof value === "string")
              .slice(0, 10)
          : [],
      };
    } catch (error) {
      console.error("Finora AI report generation failed:", error);

      // Keep Reports usable even when Gemini is temporarily unavailable.
      // The page can still show its transaction-derived charts and stats.
      return {
        summary: `Report generation is temporarily unavailable. Your ${data.period} transaction statistics are still available below.`,
        insights: [],
        suggestions: [],
        comparison: {},
        predictions: {},
        health_score: 0,
        health_reasons: [
          "The report was generated from your transaction data; AI narrative generation was unavailable.",
        ],
      };
    }
  });

/* =========================================================
   AI CHAT
   ========================================================= */

export const coachChat = createServerFn({
  method: "POST",
})
  .validator((input: ChatInput) => {
    if (!input?.messages?.length) {
      throw new Error("A question is required.");
    }

    if (!input.context) {
      throw new Error("Financial context is missing.");
    }

    return input;
  })
  .handler(
    async ({
      data,
    }): Promise<{
      reply: string;
    }> => {
      const conversation = data.messages
        .slice(-12)
        .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
        .join("\n\n");

      try {
        const reply = await callGateway(
          [
            {
              role: "system",
              content: coachSystemPrompt(data.context.slice(0, 100000)),
            },

            {
              role: "user",
              content: conversation,
            },
          ],
          undefined,
          {
            temperature: 0.3,
            maxTokens: 2048,
            responseMimeType: "text/plain",
          },
        );

        return {
          reply: reply.trim() || "I couldn't generate an answer.",
        };
      } catch (error) {
        console.error("Finora AI chat failed:", error);

        return {
          reply: "The AI service is temporarily unavailable. Please try again.",
        };
      }
    },
  );
