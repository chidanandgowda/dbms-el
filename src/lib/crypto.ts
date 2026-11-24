/**
 * Cryptographic utility functions for file hashing and trigram similarity
 */

export async function computeSHA256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  let buffer: ArrayBuffer;
  if (typeof data === 'string') {
    buffer = new TextEncoder().encode(data).buffer as ArrayBuffer;
  } else if (data instanceof Uint8Array) {
    buffer = data.buffer as ArrayBuffer;
  } else {
    buffer = data;
  }

  // Use Web Crypto API (supported in modern browsers and Node 18+)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node fallback if Web Crypto is not globally on crypto
  const nodeCrypto = await import('crypto');
  const hash = nodeCrypto.createHash('sha256');
  if (typeof data === 'string') {
    hash.update(data);
  } else {
    hash.update(Buffer.from(buffer));
  }
  return hash.digest('hex');
}

/**
 * Trigram extraction for fuzzy string similarity (matches pg_trgm behavior)
 */
function getTrigrams(str: string): Set<string> {
  const padded = `  ${str.toLowerCase()} `;
  const trigrams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }
  return trigrams;
}

/**
 * Computes trigram similarity between two strings (0.0 to 1.0)
 * Replicates PostgreSQL pg_trgm similarity() function
 */
export function calculateTrigramSimilarity(str1: string, str2: string): number {
  const tri1 = getTrigrams(str1);
  const tri2 = getTrigrams(str2);

  if (tri1.size === 0 && tri2.size === 0) return 1.0;
  if (tri1.size === 0 || tri2.size === 0) return 0.0;

  let intersection = 0;
  for (const t of tri1) {
    if (tri2.has(t)) {
      intersection++;
    }
  }

  const union = tri1.size + tri2.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Normalizes a manuscript title by lowercasing and collapsing whitespace
 * Replicates fn_normalize_paper_title() in schema.sql
 */
export function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}
