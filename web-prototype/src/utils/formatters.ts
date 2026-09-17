export function formatCompactNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return value.toLocaleString();
}

export function formatCoins(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString();
}

export function countryCodeToFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function getWealthLevelGradient(level: number): string {
  if (level >= 50) return 'from-amber-400 via-orange-500 to-red-600';
  if (level >= 30) return 'from-purple-500 via-pink-500 to-rose-500';
  if (level >= 15) return 'from-blue-500 via-indigo-500 to-purple-600';
  return 'from-emerald-400 to-teal-600';
}

export function getCharmLevelGradient(level: number): string {
  if (level >= 50) return 'from-pink-500 via-rose-500 to-red-500';
  if (level >= 30) return 'from-fuchsia-500 via-pink-500 to-amber-400';
  if (level >= 15) return 'from-violet-500 to-pink-500';
  return 'from-sky-400 to-indigo-500';
}
