// Converts a 2-letter ISO country code (what the backend actually
// returns on FeedUser/PartyRoom) into its flag emoji via the Unicode
// regional-indicator trick — no flag image assets needed.
export function countryCodeToFlag(code: string | null | undefined): string {
  if (!code || code.length !== 2) return '🏳️';
  const points = [...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...points);
}
