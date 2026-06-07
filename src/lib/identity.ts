/**
 * Anonymous Identity System
 * ─────────────────────────
 * Generates and persists a cryptographically secure token per device.
 * No account, no login. Operators own their listings as long as they
 * use the same device/browser — the token is the key.
 */

const STORAGE_KEY = "tmw_operator_token";
const FINGERPRINT_KEY = "tmw_device_fp";

/** Generate a UUID v4 using Web Crypto API */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Generate a lightweight device fingerprint (non-PII) */
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0,
  ].join("|");

  try {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(components)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    // If SubtleCrypto unavailable, return a simple hash
    let hash = 0;
    for (let i = 0; i < components.length; i++) {
      hash = (hash << 5) - hash + components.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(32, "0");
  }
}

export interface OperatorIdentity {
  token: string;
  fingerprint: string;
  createdAt: string;
}

/**
 * Get or create the operator's anonymous identity.
 * Always returns the same token for a given device/browser.
 */
export async function getOrCreateIdentity(): Promise<OperatorIdentity> {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    try {
      const parsed = JSON.parse(stored) as OperatorIdentity;
      if (parsed.token && parsed.fingerprint) {
        return parsed;
      }
    } catch {
      // Corrupted — regenerate
    }
  }

  const [token, fingerprint] = await Promise.all([
    Promise.resolve(generateUUID()),
    generateFingerprint(),
  ]);

  const identity: OperatorIdentity = {
    token,
    fingerprint,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);

  return identity;
}

/**
 * Get identity synchronously (returns null if not yet generated).
 * Use getOrCreateIdentity() for guaranteed result.
 */
export function getIdentitySync(): OperatorIdentity | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as OperatorIdentity;
  } catch {
    return null;
  }
}

/**
 * Check if the current device owns a listing by its operator_token.
 */
export function isListingOwner(listingOperatorToken: string | null | undefined): boolean {
  if (!listingOperatorToken) return false;
  const identity = getIdentitySync();
  if (!identity) return false;
  return identity.token === listingOperatorToken;
}

/**
 * Attach the operator token to a payload before sending to DB.
 * Use this when creating or updating listings.
 */
export async function withOperatorToken<T extends Record<string, unknown>>(
  payload: T
): Promise<T & { operator_token: string; device_fingerprint: string }> {
  const identity = await getOrCreateIdentity();
  return {
    ...payload,
    operator_token: identity.token,
    device_fingerprint: identity.fingerprint,
  };
}

/**
 * Clear the stored identity (use with caution — loses listing ownership).
 */
export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FINGERPRINT_KEY);
}
