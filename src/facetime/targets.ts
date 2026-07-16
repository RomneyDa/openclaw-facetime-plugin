export type FaceTimeTarget = {
  address: string;
  accountId?: string;
  raw: string;
};

const ACCOUNT_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u;
const PHONE_RE = /^\+?[1-9]\d{6,14}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function normalizeFaceTimeAddress(value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    if (!EMAIL_RE.test(trimmed)) {
      throw new Error("Invalid FaceTime email address");
    }
    return trimmed.toLowerCase();
  }
  const phone = trimmed.replace(/[\s().-]/gu, "");
  if (!PHONE_RE.test(phone)) {
    throw new Error("Invalid FaceTime target; use an Apple Account email or phone number");
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
}

export function parseFaceTimeTarget(rawTarget: string, defaultAccountId?: string): FaceTimeTarget {
  const raw = rawTarget.trim();
  const target = raw.startsWith("facetime:") ? raw.slice("facetime:".length) : raw;
  const separator = target.indexOf(":");
  if (separator > 0) {
    const possibleAccount = target.slice(0, separator);
    const address = target.slice(separator + 1);
    if (ACCOUNT_RE.test(possibleAccount)) {
      return { address: normalizeFaceTimeAddress(address), accountId: possibleAccount, raw };
    }
  }
  return { address: normalizeFaceTimeAddress(target), accountId: defaultAccountId, raw };
}

export function formatFaceTimeTarget(target: FaceTimeTarget): string {
  return target.accountId
    ? `facetime:${target.accountId}:${target.address}`
    : `facetime:${target.address}`;
}
