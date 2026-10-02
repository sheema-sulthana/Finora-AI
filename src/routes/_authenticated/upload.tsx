import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  MoreVertical,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { AppLayout } from "@/components/app/AppLayout";
import { GlassCard, Modal } from "@/components/app/ui";
import { GlowButton } from "@/components/landing/GlowButton";
import { formatMoney } from "@/lib/format";
import { addTimelineEvent, useProfile, useTransactions, useUpsertMany } from "@/lib/finora-data";
import {
  analyzeStatement,
  createLocalReport,
  extractTransactionsFromCSV,
  type ExtractedTxn,
} from "@/lib/ai.functions";
import { readFileForAI, splitTextForAI, PIPELINE_STEPS } from "@/components/app/analysis";
import { mkHead } from "@/lib/seo";
import { canonicalMerchantName, canonicalMerchantCategory } from "@/lib/merchant";

export const Route = createFileRoute("/_authenticated/upload")({
  head: mkHead(
    "Upload Statement — Finora AI",
    "Upload statements, receipts and screenshots and let Finora AI extract transactions.",
  ),
  component: () => (
    <AppLayout>
      <UploadStatement />
    </AppLayout>
  ),
});

const MAX_TEXT_FILE_SIZE = 100 * 1024 * 1024;
const MAX_PDF_FILE_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_FILE_SIZE = 40 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".txt", ".jpg", ".jpeg", ".png"];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/csv",
  "image/jpeg",
  "image/png",
];

type UploadStatus = "processing" | "completed" | "failed";

type UploadRecord = {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  transactions: number;
  status: UploadStatus;
  imported: number;
  failedReason?: string;
};

function normalize(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(name: string) {
  const match = name.toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] || "";
}

function fileTypeLabel(name: string) {
  const ext = fileExtension(name);
  if (ext === ".pdf") return "PDF";
  if (ext === ".csv") return "CSV";
  if (ext === ".txt") return "TXT";
  return "Image";
}

function validateFile(file: File) {
  const ext = fileExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return "Unsupported file type. Use PDF, CSV, TXT, JPG or PNG.";
  }

  const maxSize =
    ext === ".pdf"
      ? MAX_PDF_FILE_SIZE
      : [".jpg", ".jpeg", ".png"].includes(ext)
        ? MAX_IMAGE_FILE_SIZE
        : MAX_TEXT_FILE_SIZE;

  if (file.size > maxSize) {
    if (ext === ".pdf") {
      return "PDF files can be up to 50 MB. Larger PDFs need to be split into smaller statements.";
    }
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      return "Images can be up to 40 MB. Please choose a smaller image.";
    }
    return "CSV/TXT files can be up to 100 MB. Please choose a smaller file.";
  }

  if (file.size === 0) {
    return "This file is empty.";
  }

  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
    return "The selected file type could not be verified.";
  }

  return "";
}

function UploadStatement() {
  const { data: profile } = useProfile();
  const { data: existingTransactions = [] } = useTransactions();
  const transactionUpsertMany = useUpsertMany("transactions");
  const queryClient = useQueryClient();

  const currency = profile?.currency ?? "INR";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retryFilesRef = useRef(new Map<string, File>());

  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");

  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<UploadRecord | null>(null);
  const [menuUploadId, setMenuUploadId] = useState<string | null>(null);

  const [summaryRange, setSummaryRange] = useState<"month" | "all">("month");
  const [showAllUploads, setShowAllUploads] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("finora_statement_uploads");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUploads(parsed);
      }
    } catch {
      // Ignore stale local upload history.
    }
  }, []);

  const saveUploads = (next: UploadRecord[]) => {
    setUploads(next);
    localStorage.setItem("finora_statement_uploads", JSON.stringify(next));
  };

  const normalizeTransaction = (transaction: ExtractedTxn) => {
    const rawMerchant = String(transaction.merchant || "").trim();
    const amount = Math.abs(Number(transaction.amount));
    const type = transaction.type === "income" ? "income" : "expense";

    if (!rawMerchant || !Number.isFinite(amount) || amount <= 0) {
      return null;
    }

    const merchant = canonicalMerchantName(rawMerchant);
    const category = canonicalMerchantCategory(merchant, String(transaction.category || "Other"));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(transaction.date || ""))
      ? transaction.date
      : new Date().toISOString().slice(0, 10);

    return {
      merchant,
      amount,
      type,
      category,
      txn_date: date,
      payment_method: transaction.payment_method || "Unknown",
      status: transaction.status || "completed",
    };
  };

  const processFiles = async (files: File[]) => {
    if (!files.length || processing) return;

    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (validation) {
        validationErrors.push(`${file.name}: ${validation}`);
      } else {
        validFiles.push(file);
      }
    }

    if (validationErrors.length) {
      setError(validationErrors.join(" "));
    } else {
      setError("");
    }

    if (!validFiles.length) return;

    setProcessing(true);
    setStep(0);

    let workingUploads = [...uploads];
    const workingExisting = new Set(
      existingTransactions.map(
        (transaction) =>
          `${normalize(transaction.merchant)}|${Number(transaction.amount).toFixed(2)}|${transaction.txn_date}|${transaction.type}`,
      ),
    );

    let totalExtracted = 0;
    let totalImported = 0;
    let totalSkipped = 0;
    let successCount = 0;
    let failureCount = 0;
    let lastReport = null as unknown;

    try {
      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index]!;
        const uploadId = uid();
        const uploadedAt = new Date().toISOString();

        const processingRecord: UploadRecord = {
          id: uploadId,
          name: file.name,
          size: file.size,
          type: fileTypeLabel(file.name),
          uploadedAt,
          transactions: 0,
          status: "processing",
          imported: 0,
        };

        workingUploads = [
          processingRecord,
          ...workingUploads.filter((item) => item.id !== uploadId),
        ];
        saveUploads(workingUploads);
        retryFilesRef.current.set(uploadId, file);

        try {
          const payload = await readFileForAI(file);

          setStep(0);

          const isTextFile =
            file.name.toLowerCase().endsWith(".csv") || file.name.toLowerCase().endsWith(".txt");

          let result: {
            transactions: ExtractedTxn[];
            report: ReturnType<typeof createLocalReport>;
          } | null = null;

          const textPayload = payload.text;

          if (isTextFile && textPayload) {
            const isCsv = file.name.toLowerCase().endsWith(".csv");

            /*
             * CSV is deterministic data, so parse it locally first. This is
             * critical for large statements: a 100 MB CSV should not become
             * hundreds of Gemini requests just to identify rows that already
             * have clear date/amount/debit/credit columns.
             *
             * The splitter repeats the CSV header on every chunk, allowing the
             * existing parser to process large files without sending the full
             * document to Gemini.
             */
            if (isCsv) {
              const chunks = splitTextForAI(textPayload, 750_000);
              const localTransactions: ExtractedTxn[] = [];

              for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
                const progress = Math.floor(
                  (chunkIndex / Math.max(1, chunks.length)) * (PIPELINE_STEPS.length - 1),
                );
                setStep(progress);

                localTransactions.push(...extractTransactionsFromCSV(chunks[chunkIndex]!));
              }

              const uniqueTransactions: ExtractedTxn[] = [];
              const seen = new Set<string>();

              for (const transaction of localTransactions) {
                const key = `${normalize(transaction.merchant)}|${Number(transaction.amount).toFixed(2)}|${transaction.date}|${transaction.type}`;

                if (seen.has(key)) continue;
                seen.add(key);
                uniqueTransactions.push(transaction);
              }

              if (uniqueTransactions.length > 0) {
                result = {
                  transactions: uniqueTransactions,
                  report: createLocalReport(uniqueTransactions),
                };
              } else {
                /*
                 * Some CSV exports are irregular and have no recognizable
                 * column structure. Only those files fall back to Gemini.
                 */
                const chunks = splitTextForAI(textPayload, 120_000);
                const allTransactions: ExtractedTxn[] = [];

                for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
                  const chunkResult = await analyzeStatement({
                    data: {
                      filename: payload.filename,
                      mimeType: payload.mimeType,
                      text: chunks[chunkIndex]!,
                      currency,
                      generateReport: false,
                    },
                  });

                  if (Array.isArray(chunkResult.transactions)) {
                    allTransactions.push(...chunkResult.transactions);
                  }
                }

                const seen = new Set<string>();
                const uniqueTransactions = allTransactions.filter((transaction) => {
                  const key = `${normalize(transaction.merchant)}|${Number(transaction.amount).toFixed(2)}|${transaction.date}|${transaction.type}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });

                result = {
                  transactions: uniqueTransactions,
                  report: createLocalReport(uniqueTransactions),
                };
              }
            } else if (textPayload) {
              /* TXT files are less structured, so use Gemini in chunks. */
              const chunks = splitTextForAI(textPayload, 120_000);
              const allTransactions: ExtractedTxn[] = [];

              for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
                const progress = Math.floor(
                  (chunkIndex / Math.max(1, chunks.length)) * (PIPELINE_STEPS.length - 1),
                );
                setStep(progress);

                const chunkResult = await analyzeStatement({
                  data: {
                    filename: payload.filename,
                    mimeType: payload.mimeType,
                    text: chunks[chunkIndex]!,
                    currency,
                    generateReport: false,
                  },
                });

                if (Array.isArray(chunkResult.transactions)) {
                  allTransactions.push(...chunkResult.transactions);
                }
              }

              const seen = new Set<string>();
              const uniqueTransactions = allTransactions.filter((transaction) => {
                const key = `${normalize(transaction.merchant)}|${Number(transaction.amount).toFixed(2)}|${transaction.date}|${transaction.type}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              result = {
                transactions: uniqueTransactions,
                report: createLocalReport(uniqueTransactions),
              };
            }
          } else {
            result = await analyzeStatement({
              data: {
                ...payload,
                currency,
                generateReport: true,
              },
            });
          }

          if (!result) {
            throw new Error("The file was read, but no extraction result was produced.");
          }

          setStep(PIPELINE_STEPS.length);

          const extracted = Array.isArray(result.transactions) ? result.transactions : [];

          totalExtracted += extracted.length;

          if (!extracted.length) {
            throw new Error("No transactions could be detected in this statement.");
          }

          let importedForFile = 0;
          let skippedForFile = 0;

          const rowsToInsert: Record<string, unknown>[] = [];

          for (const transaction of extracted) {
            const normalized = normalizeTransaction(transaction);

            if (!normalized) {
              skippedForFile += 1;
              continue;
            }

            const signature = `${normalize(normalized.merchant)}|${normalized.amount.toFixed(2)}|${normalized.txn_date}|${normalized.type}`;

            if (workingExisting.has(signature)) {
              skippedForFile += 1;
              continue;
            }

            workingExisting.add(signature);
            rowsToInsert.push({
              merchant: normalized.merchant,
              amount: normalized.amount,
              type: normalized.type,
              category: normalized.category,
              txn_date: normalized.txn_date,
              payment_method: normalized.payment_method,
              status: normalized.status,
              account_id: null,
              notes: `Imported from ${file.name}`,
              source: "statement-ai",
            });
          }

          const INSERT_BATCH_SIZE = 500;

          for (let start = 0; start < rowsToInsert.length; start += INSERT_BATCH_SIZE) {
            const batch = rowsToInsert.slice(start, start + INSERT_BATCH_SIZE);

            await transactionUpsertMany.mutateAsync(batch);
            importedForFile += batch.length;
          }

          totalImported += importedForFile;
          totalSkipped += skippedForFile;
          successCount += 1;
          lastReport = result.report;

          localStorage.setItem("finora_latest_ai_report", JSON.stringify(result.report));
          localStorage.setItem("finora_latest_ai_file", file.name);

          const completedRecord: UploadRecord = {
            ...processingRecord,
            transactions: extracted.length,
            status: "completed",
            imported: importedForFile,
          };

          workingUploads = [
            completedRecord,
            ...workingUploads.filter((item) => item.id !== uploadId),
          ];
          saveUploads(workingUploads);
        } catch (fileError) {
          failureCount += 1;

          const message =
            fileError instanceof Error ? fileError.message : "Statement extraction failed.";

          const failedRecord: UploadRecord = {
            ...processingRecord,
            status: "failed",
            failedReason: message,
          };

          workingUploads = [failedRecord, ...workingUploads.filter((item) => item.id !== uploadId)];
          saveUploads(workingUploads);
        }
      }

      if (successCount > 0) {
        await addTimelineEvent(
          "✨",
          "Statement imported by Finora AI",
          `${totalImported} transaction${totalImported === 1 ? "" : "s"} added to Transactions${totalSkipped ? ` · ${totalSkipped} duplicate/invalid row${totalSkipped === 1 ? "" : "s"} skipped` : ""}`,
        );

        if (failureCount > 0) {
          setError(
            `${totalImported} transaction${totalImported === 1 ? "" : "s"} imported successfully. ${failureCount} file${failureCount === 1 ? "" : "s"} could not be processed. Check Recent Uploads and retry if needed.`,
          );
        } else {
          setError("");
        }
      } else {
        throw new Error(
          "No transactions were imported. Check the failed upload details and try again.",
        );
      }

      if (lastReport) {
        localStorage.setItem("finora_latest_ai_report", JSON.stringify(lastReport));
      }

      /*
       * Force the active dashboard/transactions queries to refresh after the
       * final import. useUpsertMany already invalidates each batch, but this
       * final refetch makes the post-upload state deterministic even when a
       * large file was imported in many batches.
       */
      await queryClient.refetchQueries({
        queryKey: ["transactions"],
        type: "active",
      });

      void totalExtracted;
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Statement processing failed. Please try again.",
      );
    } finally {
      setProcessing(false);
      setStep(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const retryUpload = async (record: UploadRecord) => {
    const file = retryFilesRef.current.get(record.id);

    if (!file) {
      setError(
        "This upload was created in an earlier session. Please choose the original file again.",
      );
      return;
    }

    setMenuUploadId(null);
    await processFiles([file]);
  };

  const deleteUpload = (id: string) => {
    saveUploads(uploads.filter((upload) => upload.id !== id));
    retryFilesRef.current.delete(id);
    setMenuUploadId(null);
  };

  const visibleUploads = useMemo(
    () => (showAllUploads ? uploads : uploads.slice(0, 5)),
    [uploads, showAllUploads],
  );

  const summary = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    const relevant =
      summaryRange === "all"
        ? uploads
        : uploads.filter((upload) => upload.uploadedAt.slice(0, 7) === currentMonth);

    const totalUploaded = relevant.length;
    const extracted = relevant.reduce((sum, item) => sum + item.transactions, 0);
    const imported = relevant.reduce((sum, item) => sum + item.imported, 0);
    const failed = relevant.filter((item) => item.status === "failed").length;
    const successRate = extracted ? Math.round((imported / extracted) * 100) : 0;

    return {
      totalUploaded,
      extracted,
      imported,
      failed,
      successRate,
    };
  }, [uploads, summaryRange]);

  const chooseFiles = () => fileInputRef.current?.click();

  return (
    <div className="space-y-4 pb-8">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.txt,image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={(event) => {
          void processFiles(Array.from(event.target.files || []));
        }}
      />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
            Financial data import
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Upload Statement
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Upload your bank statements or receipts and let Finora AI extract your transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-glass-border bg-foreground/[0.03] px-4 text-sm font-medium transition hover:bg-foreground/[0.07]"
        >
          <CircleHelp className="h-4 w-4" />
          How it works?
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <GlassCard className="!rounded-[20px] !p-4 sm:!p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  void processFiles(Array.from(event.dataTransfer.files));
                }}
                className={`flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center transition ${
                  dragging
                    ? "border-primary bg-primary/10"
                    : "border-white/10 bg-foreground/[0.02] hover:border-primary/40 hover:bg-primary/[0.03]"
                }`}
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <UploadCloud className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-lg font-semibold">Drag & drop your files here</h2>
                <p className="mt-1 text-sm text-muted-foreground">or</p>

                <GlowButton className="mt-4" onClick={chooseFiles} disabled={processing}>
                  <FolderOpen className="h-4 w-4" />
                  {processing ? "Processing…" : "Choose Files"}
                </GlowButton>

                <p className="mt-4 text-xs text-muted-foreground">
                  Supported formats: PDF, CSV, TXT, JPG, PNG · PDF up to 50MB · CSV/TXT up to 100MB
                </p>
                <p className="mt-2 text-xs text-emerald-400/80">
                  Transactions are extracted and added to Transactions automatically.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold">Supported File Types</p>

                <div className="mt-3 space-y-2">
                  <SupportedType
                    icon={<FileText className="h-5 w-5" />}
                    title="PDF Statement"
                    body="Bank statements in PDF format"
                  />
                  <SupportedType
                    icon={<FileSpreadsheet className="h-5 w-5" />}
                    title="CSV / TXT"
                    body="Exported transaction history"
                  />
                  <SupportedType
                    icon={<FileImage className="h-5 w-5" />}
                    title="Receipt"
                    body="Images of receipts"
                  />
                  <SupportedType
                    icon={<FileImage className="h-5 w-5" />}
                    title="Screenshot"
                    body="Screenshots of transactions"
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {processing && (
            <GlassCard className="!rounded-[20px] !p-5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-display font-semibold">Finora AI is processing your statement</p>
              </div>

              <div className="mt-5 grid gap-3">
                {PIPELINE_STEPS.map((label, index) => {
                  const active = index === step;
                  const done = index < step;

                  return (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                          done
                            ? "bg-emerald-400/15 text-emerald-400"
                            : active
                              ? "bg-primary/15 text-primary"
                              : "bg-foreground/10 text-muted-foreground"
                        }`}
                      >
                        {done ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <span className={active ? "font-medium" : "text-muted-foreground"}>
                        {label}
                      </span>
                      {active && <span className="text-xs text-primary">working…</span>}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          <GlassCard className="!rounded-[20px] !p-4 sm:!p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-semibold">Our AI will automatically:</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "Extract transactions",
                    "Detect merchant",
                    "Identify amount & date",
                    "Categorize automatically",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="!overflow-visible !rounded-[20px] !p-0">
            <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">Recent Uploads</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your latest statement and receipt imports.
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{uploads.length} total</span>
              </div>
            </div>

            {visibleUploads.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3 font-medium sm:px-5">File Name</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Upload Date</th>
                      <th className="px-3 py-3 font-medium">Transactions</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleUploads.map((upload) => (
                      <tr key={upload.id} className="border-t border-white/[0.06]">
                        <td className="px-4 py-3 sm:px-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                              <FileText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="max-w-[250px] truncate font-medium">{upload.name}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {formatBytes(upload.size)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{upload.type}</td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {new Date(upload.uploadedAt).toLocaleDateString("en-IN")}
                          <span className="block mt-0.5">
                            {new Date(upload.uploadedAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="px-3 py-3">{upload.transactions || "—"}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={upload.status} />
                          {upload.failedReason && (
                            <p className="mt-1 max-w-[150px] text-[10px] text-rose-300">
                              {upload.failedReason}
                            </p>
                          )}
                        </td>
                        <td className="relative px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSelectedUpload(upload)}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                              title="View upload"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {upload.status === "failed" && (
                              <button
                                type="button"
                                onClick={() => void retryUpload(upload)}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-rose-400/20 text-rose-300 hover:bg-rose-400/10"
                                title="Retry upload"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setMenuUploadId((id) => (id === upload.id ? null : upload.id))
                              }
                              className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                              title="More actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>

                          {menuUploadId === upload.id && (
                            <div className="absolute right-3 top-12 z-30 w-40 rounded-xl border border-white/10 bg-background p-1.5 shadow-2xl">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUpload(upload);
                                  setMenuUploadId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-foreground/10"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View details
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteUpload(upload.id)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-300 hover:bg-rose-400/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Remove history
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No statements uploaded yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload a bank statement, receipt or screenshot to get started.
                </p>
              </div>
            )}

            {uploads.length > 5 && (
              <div className="border-t border-white/[0.06] px-5 py-3 text-center">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setShowAllUploads((value) => !value)}
                >
                  {showAllUploads ? "Show recent uploads" : "View all uploads"}
                </button>
              </div>
            )}
          </GlassCard>
        </div>

        <aside className="grid content-start gap-4">
          <GlassCard className="!rounded-[20px] !p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <p className="font-display font-semibold">AI Extraction Tips</p>
            </div>

            <div className="mt-4 space-y-3">
              <Tip
                icon={<FileText className="h-4 w-4" />}
                title="Upload clear statements"
                body="Clear files give better extraction results."
              />
              <Tip
                icon={<FileText className="h-4 w-4" />}
                title="Include all pages"
                body="Don't miss transactions hidden on later pages."
              />
              <Tip
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Supported formats"
                body="PDF, CSV, TXT, images and screenshots."
              />
              <Tip
                icon={<Eye className="h-4 w-4" />}
                title="Automatic import"
                body="Valid transactions are added to Transactions automatically."
              />
            </div>
          </GlassCard>

          <GlassCard className="!rounded-[20px] !p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-display font-semibold">Extraction Summary</p>
              </div>

              <select
                value={summaryRange}
                onChange={(event) => setSummaryRange(event.target.value as "month" | "all")}
                className="rounded-lg border border-white/[0.08] bg-background px-2 py-1 text-[11px] text-muted-foreground outline-none"
              >
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="mt-5 divide-y divide-white/[0.06]">
              <SummaryRow label="Total Uploaded" value={summary.totalUploaded} />
              <SummaryRow label="Transactions Extracted" value={summary.extracted} />
              <SummaryRow label="Successfully Imported" value={summary.imported} positive />
              <SummaryRow label="Failed" value={summary.failed} danger />
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full border-[6px] border-emerald-400/20">
                <div className="text-lg font-bold">{summary.successRate}%</div>
              </div>
              <div>
                <p className="text-sm font-semibold">Success Rate</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {summaryRange === "month" ? "This month" : "All uploaded files"}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="!rounded-[20px] !p-4">
            <div className="flex items-center gap-2">
              <CircleHelp className="h-4 w-4 text-primary" />
              <p className="font-display font-semibold">Need Help?</p>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Learn how to upload statements and get the best extraction results from Finora AI.
            </p>

            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-xl border border-primary/30 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              View Guide
            </button>
          </GlassCard>
        </aside>
      </div>

      <Modal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        title="How Finora AI statement upload works"
      >
        <div className="space-y-4 text-sm">
          <GuideStep
            number="1"
            title="Upload"
            body="PDF up to 50MB · CSV/TXT up to 100MB · images up to 40MB."
          />
          <GuideStep
            number="2"
            title="AI extraction"
            body="Finora AI extracts only transactions that are actually present in the uploaded document."
          />
          <GuideStep
            number="3"
            title="Merchant recognition"
            body="AI identifies the merchant. The merchant database then supplies the correct known merchant logo. Unknown merchants use a category icon instead."
          />
          <GuideStep
            number="4"
            title="Review"
            body="Finora AI imports valid transactions automatically and skips duplicates already in your financial history."
          />
          <GuideStep
            number="5"
            title="Import"
            body="Imported transactions are immediately added to Transactions and become available to Dashboard, Reports, Budgets and other modules."
          />
        </div>
      </Modal>

      <Modal open={!!selectedUpload} onClose={() => setSelectedUpload(null)} title="Upload details">
        {selectedUpload && (
          <div className="space-y-3">
            <DetailRow label="File" value={selectedUpload.name} />
            <DetailRow label="Type" value={selectedUpload.type} />
            <DetailRow label="Size" value={formatBytes(selectedUpload.size)} />
            <DetailRow
              label="Uploaded"
              value={new Date(selectedUpload.uploadedAt).toLocaleString("en-IN")}
            />
            <DetailRow label="Transactions extracted" value={String(selectedUpload.transactions)} />
            <DetailRow label="Imported" value={String(selectedUpload.imported)} />
            <div className="rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3">
              <p className="text-[11px] text-muted-foreground">Status</p>
              <div className="mt-2">
                <StatusBadge status={selectedUpload.status} />
              </div>
            </div>
            {selectedUpload.failedReason && (
              <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-3 text-xs text-rose-300">
                {selectedUpload.failedReason}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function SupportedType({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-foreground/[0.02] px-3 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function Tip({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-foreground/[0.05] text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  positive,
  danger,
}: {
  label: string;
  value: number;
  positive?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          positive
            ? "font-semibold text-emerald-400"
            : danger
              ? "font-semibold text-rose-400"
              : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: UploadStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
        <Clock3 className="h-3.5 w-3.5" />
        Processing
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-400/10 px-2.5 py-1 text-[11px] font-medium text-rose-300">
      <AlertCircle className="h-3.5 w-3.5" />
      Failed
    </span>
  );
}

function GuideStep({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
        {number}
      </span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-foreground/[0.02] px-3 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm">{value}</p>
    </div>
  );
}
