/**
 * Timezone utilities — all date logic anchored to Australia/Sydney
 */

export const SYDNEY_TZ = 'Australia/Sydney';

/** Returns YYYY-MM-DD string in Sydney timezone */
export function toSydneyDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: SYDNEY_TZ });
}

/**
 * Returns the start of today as a UTC Date, anchored to Sydney midnight.
 * e.g. at 14:42 AEDT (UTC+11), returns the Date equivalent of 13:00 UTC the previous day.
 */
export function getSydneyDayStart(date: Date = new Date()): Date {
  // sv-SE locale gives ISO-like "YYYY-MM-DD HH:MM:SS" format
  const sydneyTimeStr = date.toLocaleString('sv-SE', { timeZone: SYDNEY_TZ });
  // Treat that string as if it were UTC to extract the Sydney offset
  const sydneyAsIfUTC = new Date(sydneyTimeStr.replace(' ', 'T') + 'Z');
  const offsetMs = sydneyAsIfUTC.getTime() - date.getTime();
  // Get today's date string in Sydney
  const sydneyDateStr = toSydneyDateStr(date);
  // Parse Sydney midnight as UTC, then subtract the offset
  const sydneyMidnightUTC = new Date(sydneyDateStr + 'T00:00:00Z');
  return new Date(sydneyMidnightUTC.getTime() - offsetMs);
}
