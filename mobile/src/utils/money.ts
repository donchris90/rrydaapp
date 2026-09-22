// Formats an amount held in a currency's minor unit (kobo, cents) for display.
// The local locale gives the local symbol (₦440.00 rather than "NGN 440.00");
// if the device lacks that locale it falls back to a plain format.
const LOCALE_FOR: Record<string, string> = { NGN: 'en-NG', GHS: 'en-GH', KES: 'en-KE', ZAR: 'en-ZA' };

export function formatMinor(minor: number | null | undefined, currency: string | null | undefined): string {
  const code = currency || 'NGN';
  const major = Number(minor ?? 0) / 100;
  try {
    return new Intl.NumberFormat(LOCALE_FOR[code] ?? 'en-US', { style: 'currency', currency: code }).format(major);
  } catch {
    return `${code} ${major.toFixed(2)}`;
  }
}
