/**
 * 32-character unambiguous charset:
 * - 8 numeric digits: 2-9 (0 and 1 excluded to prevent confusion with O, I, L)
 * - 24 uppercase letters: A-Z (excluding I and O)
 * Each character represents exactly 5 bits of cryptographic entropy (2^5 = 32).
 */
export const SECURE_CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const PROJECT_CODE_PREFIX = 'SRX';
export const CODE_CHUNK_LENGTH = 4;
export const TOTAL_RANDOM_CHARS = 8; // 2 chunks of 4 = 8 chars = 40 bits of entropy

/**
 * Retrieves cryptographically secure random bytes from available CSPRNG sources.
 * Strictly never relies on insecure pseudo-random generators.
 */
function getSecureRandomBytes(byteCount: number): Uint8Array {
  // 1. Standard Web / DOM / Global Crypto API (available in modern browsers, Expo web, Node 19+)
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === 'function'
  ) {
    const array = new Uint8Array(byteCount);
    globalThis.crypto.getRandomValues(array);
    return array;
  }

  // 2. Try expo-crypto if available in mobile runtime
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Crypto = require('expo-crypto');
    if (Crypto && typeof Crypto.getRandomValues === 'function') {
      const array = new Uint8Array(byteCount);
      Crypto.getRandomValues(array);
      return array;
    }
    if (Crypto && typeof Crypto.getRandomBytes === 'function') {
      return new Uint8Array(Crypto.getRandomBytes(byteCount));
    }
  } catch {
    // Fall through to Node.js crypto
  }

  // 3. Node.js crypto module (used in test runners and backend scripts)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return new Uint8Array(nodeCrypto.randomBytes(byteCount));
    }
  } catch {
    // Node crypto not available
  }

  throw new Error('Cryptographically secure PRNG is not available in current environment');
}

/**
 * Generates a high-entropy, human-friendly Servex project code.
 * Example format: SRX-7B9K-2M4P
 * 
 * Cryptographic Characteristics:
 * - 8 characters drawn from 32-character unambiguous alphabet.
 * - Entropy: 32^8 = 1,099,511,627,776 states (~40 bits).
 * - Generated strictly via CSPRNG (zero insecure random generators).
 */
export function generateSecureProjectCode(): string {
  const bytes = getSecureRandomBytes(TOTAL_RANDOM_CHARS);
  let randomChars = '';

  for (let i = 0; i < TOTAL_RANDOM_CHARS; i++) {
    const index = bytes[i] % 32;
    randomChars += SECURE_CODE_CHARSET[index];
  }

  const chunk1 = randomChars.slice(0, 4);
  const chunk2 = randomChars.slice(4, 8);

  return `${PROJECT_CODE_PREFIX}-${chunk1}-${chunk2}`;
}

/**
 * Normalizes user-entered project codes by trimming whitespace,
 * converting to uppercase, and ensuring consistent format.
 */
export function normalizeProjectCode(rawCode: string): string {
  if (!rawCode) return '';
  return rawCode.trim().toUpperCase();
}

/**
 * Validates whether a project code meets modern high-entropy standards.
 * Supports legacy codes (e.g. CLT-8842) for backward compatibility while
 * identifying secure high-entropy codes.
 */
export function isValidProjectCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const normalized = normalizeProjectCode(code);

  // Modern high-entropy Servex format: SRX-XXXX-XXXX (8 Crockford characters)
  const modernPattern = /^SRX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  if (modernPattern.test(normalized)) {
    return true;
  }

  // Legacy format support for existing database records: CLT-#### or CLT-TEST-...
  const legacyPattern = /^CLT-[A-Z0-9-]+$/;
  return legacyPattern.test(normalized);
}

/**
 * Returns estimated entropy bits for audit verification.
 */
export function calculateCodeEntropyBits(code: string): number {
  if (!code) return 0;
  const normalized = normalizeProjectCode(code);

  // Modern SRX-XXXX-XXXX
  if (/^SRX-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(normalized)) {
    return 40; // 8 chars * log2(32) = 40 bits
  }

  // Legacy 4-digit numeric code: CLT-####
  if (/^CLT-\d{4}$/.test(normalized)) {
    return Math.round(Math.log2(9000)); // ~13.1 bits
  }

  return 13;
}
