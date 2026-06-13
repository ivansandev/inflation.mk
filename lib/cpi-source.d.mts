// Type declarations for the plain-ESM data module lib/cpi-source.mjs.

/** Map of period label (e.g. "2026M05") to index value (100 = no change). */
export type Series = Record<string, number>;

export interface CpiData {
  /** Attribution string required by the source. */
  source: string;
  sourceUrl: string;
  /** "ECOICOP version 2". */
  classification: string;
  /** ISO timestamp of when this data was fetched. */
  fetchedAt: string;
  /** Sorted list of month codes, e.g. ["2015M01", ..., "2026M05"]. */
  months: string[];
  /** Latest month code present in the data, e.g. "2026M05". */
  latestMonth: string;
  /** Year-over-year index per category key (incl. "total"). */
  yoy: Record<string, Series>;
  /** Official CPI weights per category key, in percent (sum ≈ 100). */
  officialWeights: Record<string, number>;
  /** Year the official weights apply to. */
  officialWeightsYear: number;
}

export const SOURCE_NAME: string;
export const SOURCE_URL: string;
/** The 13 spendable category keys (excludes "total"), in canonical order. */
export const CATEGORY_KEYS: string[];
export function fetchCpi(): Promise<CpiData>;
