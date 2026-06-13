// Personal inflation = weighted average of each category's year-over-year
// index, using the user's basket weights.
//
//   personalRate% = ( Σ(wᵢ · indexᵢ) / Σ(wᵢ) ) − 100
//
// where indexᵢ is the official "same month previous year" index (100 = no
// change) and wᵢ is the user's weight. Categories with no data for the chosen
// month are dropped from both sums. Each category's contribution to the rate is
// (wᵢ / Σw) · (indexᵢ − 100); contributions sum to the personal rate.

import type { CpiData } from "@/lib/cpi-source.mjs";
import { CATEGORIES, type Weights } from "@/lib/categories";

export interface CategoryResult {
  key: string;
  /** Raw weight the user set. */
  weight: number;
  /** Normalised share of the basket, in percent (Σ over categories with data). */
  share: number;
  /** Year-over-year change for this category, in percent, or null if missing. */
  yoy: number | null;
  /** Percentage points this category contributes to the personal rate. */
  contribution: number;
}

export interface InflationResult {
  /** Personal inflation rate, in percent. */
  rate: number;
  /** Official headline CPI for the same month, in percent. */
  official: number;
  /** rate − official, in percentage points. */
  vsOfficial: number;
  rows: CategoryResult[];
  month: string;
}

function yoyPercent(data: CpiData, key: string, month: string): number | null {
  const idx = data.yoy[key]?.[month];
  return idx == null ? null : idx - 100;
}

export function computeInflation(
  data: CpiData,
  weights: Weights,
  month: string = data.latestMonth,
): InflationResult {
  let weightSum = 0;
  for (const c of CATEGORIES) {
    const w = weights[c.key] ?? 0;
    if (w > 0 && data.yoy[c.key]?.[month] != null) weightSum += w;
  }

  let rate = 0;
  const rows: CategoryResult[] = CATEGORIES.map((c) => {
    const weight = weights[c.key] ?? 0;
    const yoy = yoyPercent(data, c.key, month);
    const usable = weight > 0 && yoy != null;
    const share = usable && weightSum > 0 ? (weight / weightSum) * 100 : 0;
    const contribution = usable ? (weight / weightSum) * yoy! : 0;
    rate += contribution;
    return { key: c.key, weight, share, yoy, contribution };
  });

  const official = yoyPercent(data, "total", month) ?? 0;
  return {
    rate,
    official,
    vsOfficial: rate - official,
    rows,
    month,
  };
}

export function bucketShare(
  result: InflationResult,
  bucketKeys: Set<string>,
): number {
  return result.rows
    .filter((r) => bucketKeys.has(r.key))
    .reduce((sum, r) => sum + r.share, 0);
}

/** "2026M05" → { year: 2026, month: 5 } (1-based). */
export function parseMonth(code: string): { year: number; month: number } {
  const [y, m] = code.split("M");
  return { year: Number(y), month: Number(m) };
}
