// Deterministic, ICU-independent formatting.
//
// Number and month formatting must produce identical output on the server
// (Node, full ICU) and in the browser (which may ship reduced ICU data lacking
// Macedonian/Albanian). Relying on Intl for these locales risks a hydration
// mismatch, so we format numbers by hand and read month names from messages.

const COMMA_DECIMAL = new Set(["mk", "sq"]);

function decimalSeparator(locale: string): string {
  return COMMA_DECIMAL.has(locale) ? "," : ".";
}

function fixed(value: number, locale: string, digits: number): string {
  const s = value.toFixed(digits);
  return digits > 0 ? s.replace(".", decimalSeparator(locale)) : s;
}

/** Signed percent, e.g. "+4.9%" / "+4,9%" / "-1,2%". */
export function formatSignedPercent(
  value: number,
  locale: string,
  digits = 1,
): string {
  const sign = value > 0.00005 ? "+" : value < -0.00005 ? "-" : "";
  return `${sign}${fixed(Math.abs(value), locale, digits)}%`;
}

/** Money with thousands grouping, e.g. "11,200" / "11.200" / "7.200".
 *  Deterministic (no Intl): integer part is grouped by hand so server and
 *  client render the same string. Locale picks the separators — mk/sq use
 *  "." for thousands and "," for decimals; en uses "," and ".". */
export function formatMoney(value: number, locale: string, digits = 0): string {
  const comma = COMMA_DECIMAL.has(locale);
  const thousands = comma ? "." : ",";
  const negative = value < 0;
  const [intPart, fracPart] = Math.abs(value).toFixed(digits).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  const decimal = digits > 0 ? (comma ? "," : ".") + fracPart : "";
  return `${negative ? "-" : ""}${grouped}${decimal}`;
}

/** Unsigned percent, e.g. "28%" / "5.0%" / "5,0%". */
export function formatPercent(
  value: number,
  locale: string,
  digits = 0,
): string {
  return `${fixed(value, locale, digits)}%`;
}

/** Plain number with fixed decimals (e.g. percentage-point deltas). */
export function formatNumber(
  value: number,
  locale: string,
  digits = 1,
): string {
  return fixed(value, locale, digits);
}

/** "2026M05" → "May 2026" / "мај 2026" / "maj 2026", using translated month
 *  names so the result is identical on server and client. `t` is a next-intl
 *  translator (from useTranslations / getTranslations). */
export function monthLabel(
  code: string,
  t: (key: string) => string,
): string {
  const [year, month] = code.split("M").map(Number);
  return `${t(`months.${month}`)} ${year}`;
}

/** ISO date → localized short date. Server-only (never re-rendered on the
 *  client), so Intl is safe here. */
export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
