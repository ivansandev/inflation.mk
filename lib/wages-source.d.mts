// Type declarations for the plain-ESM data module lib/wages-source.mjs.

export interface WageData {
  /** Attribution string required by the source. */
  source: string;
  sourceUrl: string;
  /** Human-readable metric name, e.g. "Average monthly net wage per employee". */
  metric: string;
  /** ISO timestamp of when this data was fetched. */
  fetchedAt: string;
  /** Sorted list of month codes that have a year-over-year value. */
  months: string[];
  /** Latest month code present in the data, e.g. "2026M03". */
  latestMonth: string;
  /** Year-over-year growth of the average net wage, in percent, per month. */
  yoy: Record<string, number>;
  /** Average net wage level in denars, per month (all available months). */
  denars: Record<string, number>;
  /** Average net wage in denars for the latest month. */
  latestDenars: number;
}

export const WAGE_METRIC: string;
export const WAGE_SOURCE_URL: string;
export function fetchWages(): Promise<WageData>;
