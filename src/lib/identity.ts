const STORAGE_KEY      = "tmw_operator_token";
const FINGERPRINT_KEY  = "tmw_device_fp";
const DISPLAY_NAME_KEY = "tmw_display_name";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function generateFingerprint(): Promise<string> {
  const s = [navigator.userAgent, navigator.language, screen.colorDepth,
    screen.width + "x" + screen.height, new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency ?? 0].join("|");
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("").slice(0,32);
  } catch {
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
    return Math.abs(h).toString(16).padStart(32,"0");
  }
}

export interface OperatorIdentity { token: string; fingerprint: string; createdAt: string; }

export async function getOrCreateIdentity(): Promise<OperatorIdentity> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const p = JSON.parse(stored) as OperatorIdentity;
      if (p.token && p.fingerprint) return p;
    } catch { /* regenerate */ }
  }
  const [token, fingerprint] = await Promise.all([Promise.resolve(generateUUID()), generateFingerprint()]);
  const identity: OperatorIdentity = { token, fingerprint, createdAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  return identity;
}

export function getIdentitySync(): OperatorIdentity | null {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) as OperatorIdentity : null;
  } catch { return null; }
}

export function getDisplayName(): string {
  try {
    const saved = localStorage.getItem(DISPLAY_NAME_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch { /* ignore */ }
  const id = getIdentitySync();
  return id?.token ? "User-" + id.token.slice(0,6).toUpperCase() : "Traveller";
}

export function setDisplayName(name: string): boolean {
  const t = name.trim();
  if (!t || t.length > 40) return false;
  try { localStorage.setItem(DISPLAY_NAME_KEY, t); return true; }
  catch { return false; }
}

export function isListingOwner(tok?: string | null): boolean {
  if (!tok) return false;
  const id = getIdentitySync();
  return id?.token === tok;
}

export async function withOperatorToken<T extends Record<string, unknown>>(
  payload: T
): Promise<T & { operator_token: string; device_fingerprint: string }> {
  const id = await getOrCreateIdentity();
  return { ...payload, operator_token: id.token, device_fingerprint: id.fingerprint };
}

export function clearIdentity(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(FINGERPRINT_KEY);
}
