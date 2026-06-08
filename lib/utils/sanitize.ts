// Sanitasi data hasil crawling sebelum disimpan ke database

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    // Hanya izinkan http dan https
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeText(text: string, maxLength = 5000): string {
  return text
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeShortText(text: string): string {
  return sanitizeText(text, 500);
}

export function sanitizeArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item): item is string => typeof item === "string")
    .map((s) => sanitizeShortText(s))
    .filter(Boolean);
}
