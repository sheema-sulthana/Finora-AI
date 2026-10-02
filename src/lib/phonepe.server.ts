import { parsePhonePeStatementText, type PhonePeExtractedTxn } from "./phonepe.parser";

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (!match) throw new Error("Invalid PDF data URL.");

  return {
    mimeType: match[1]!,
    data: match[2]!,
  };
}

/**
 * Extract text from a PDF on the server. pdf-parse uses PDF.js internally and
 * is intentionally loaded only inside the server-side execution path so the
 * browser bundle does not contain the PDF parser.
 */
export async function extractPhonePeTransactionsFromPdf(
  dataUrl: string,
): Promise<PhonePeExtractedTxn[]> {
  const parsed = parseDataUrl(dataUrl);

  if (parsed.mimeType !== "application/pdf") return [];

  const { PDFParse } = await import("pdf-parse");
  const buffer = Buffer.from(parsed.data, "base64");
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return parsePhonePeStatementText(result.text || "");
  } finally {
    await parser.destroy();
  }
}
