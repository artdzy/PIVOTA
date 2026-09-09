import mammoth from "mammoth";
import natural from "natural";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * PDF/DOCX'ten düz metin çıkarır. JPEG gibi görsel formatlar için OCR
 * desteklenmiyor — null döner ve çağıran taraf skoru "manuel inceleme" olarak işaretler.
 */
export async function extractResumeText(
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    if (mimeType === "application/pdf") {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    if (mimeType === DOCX_MIME || mimeType === "application/msword") {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * CV metnini ilan gereksinimleriyle karşılaştırıp 0-100 arası bir uyum skoru üretir.
 * Yöntem: anahtar kelime kesişim oranı (%70) + natural'ın TF-IDF ağırlıklı terim
 * skorlarının normalize edilmiş hali (%30). Harici bir AI servisi/API key gerektirmez.
 */
export function scoreResumeAgainstJob(
  resumeText: string,
  requirements: string[],
): number {
  if (!resumeText.trim() || requirements.length === 0) return 40;

  const resumeLower = resumeText.toLowerCase();
  const hits = requirements.filter((req) =>
    resumeLower.includes(req.toLowerCase()),
  ).length;
  const overlapRatio = hits / requirements.length;

  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  tfidf.addDocument(resumeLower);

  let tfidfScoreSum = 0;
  requirements.forEach((term) => {
    tfidfScoreSum += tfidf.tfidf(term.toLowerCase(), 0);
  });
  const tfidfNormalized = Math.min(1, tfidfScoreSum / (requirements.length * 4 || 1));

  const combined = overlapRatio * 0.7 + tfidfNormalized * 0.3;
  return Math.round(Math.min(100, Math.max(5, combined * 100)));
}

export const PLACEHOLDER_SCORE_NO_OCR = -1;
