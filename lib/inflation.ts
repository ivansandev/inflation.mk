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

// Combined year-over-year change for a high-level category: the official-weight-
// weighted average of its constituent ECOICOP divisions (the same way a
// statistical office rolls sub-indices up into a group, so it stays official).
// Divisions with no data for the month are dropped; returns null if none remain.
// Falls back to a simple average if official weights are somehow all zero.
function categoryYoy(
  data: CpiData,
  divisions: string[],
  month: string,
): number | null {
  let weightSum = 0;
  let weighted = 0;
  let plainSum = 0;
  let count = 0;
  for (const div of divisions) {
    const yoy = yoyPercent(data, div, month);
    if (yoy == null) continue;
    const w = data.officialWeights[div] ?? 0;
    weightSum += w;
    weighted += w * yoy;
    plainSum += yoy;
    count += 1;
  }
  if (count === 0) return null;
  return weightSum > 0 ? weighted / weightSum : plainSum / count;
}

// Weighted-average personal rate for a single month — the same formula as
// computeInflation, without building per-category rows. Used by inflationSeries
// so the chart line and the headline can never compute the rate differently.
function personalRate(data: CpiData, weights: Weights, month: string): number {
  let weightSum = 0;
  let weighted = 0;
  for (const c of CATEGORIES) {
    const w = weights[c.key] ?? 0;
    if (w <= 0) continue;
    const yoy = categoryYoy(data, c.divisions, month);
    if (yoy == null) continue;
    weightSum += w;
    weighted += w * yoy;
  }
  return weightSum > 0 ? weighted / weightSum : 0;
}

export function computeInflation(
  data: CpiData,
  weights: Weights,
  month: string = data.latestMonth,
): InflationResult {
  const yoyByKey = new Map<string, number | null>(
    CATEGORIES.map((c) => [c.key, categoryYoy(data, c.divisions, month)]),
  );

  let weightSum = 0;
  for (const c of CATEGORIES) {
    const w = weights[c.key] ?? 0;
    if (w > 0 && yoyByKey.get(c.key) != null) weightSum += w;
  }

  let rate = 0;
  const rows: CategoryResult[] = CATEGORIES.map((c) => {
    const weight = weights[c.key] ?? 0;
    const yoy = yoyByKey.get(c.key) ?? null;
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

export interface SeriesPoint {
  /** Month code, e.g. "2026M05". */
  month: string;
  /** Personal rate that month, in percent (current basket × that month's prices). */
  personal: number;
  /** Official headline CPI that month, in percent. */
  official: number;
}

/**
 * Personal vs official year-over-year rate for each month, for plotting a time
 * series. The personal line applies the user's *current* basket to each past
 * month, so it answers "how would my basket have tracked the official rate?".
 *
 * Defaults to the trailing 10 years (120 months) ending at the latest month.
 * Months with no official total are skipped.
 */
export function inflationSeries(
  data: CpiData,
  weights: Weights,
  months: string[] = data.months.slice(-120),
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const month of months) {
    const official = yoyPercent(data, "total", month);
    if (official == null) continue;
    points.push({ month, personal: personalRate(data, weights, month), official });
  }
  return points;
}

export interface DivisionPoint {
  /** Month code, e.g. "2026M05". */
  month: string;
  /** This division's year-over-year change that month, in percent. */
  value: number;
  /** Official headline CPI that month, in percent. */
  official: number;
}

/**
 * Year-over-year change for a single official ECOICOP division each month,
 * alongside the headline rate, for plotting a per-category time series. Unlike
 * inflationSeries this is independent of the user's basket — it reads the raw
 * official division index directly.
 *
 * Defaults to the trailing 5 years (60 months) ending at the latest month.
 * Months where either the division or the headline total is missing are skipped.
 */
export function divisionSeries(
  data: CpiData,
  division: string,
  months: string[] = data.months.slice(-60),
): DivisionPoint[] {
  const points: DivisionPoint[] = [];
  for (const month of months) {
    const value = yoyPercent(data, division, month);
    const official = yoyPercent(data, "total", month);
    if (value == null || official == null) continue;
    points.push({ month, value, official });
  }
  return points;
}

/** "2026M05" → { year: 2026, month: 5 } (1-based). */
export function parseMonth(code: string): { year: number; month: number } {
  const [y, m] = code.split("M");
  return { year: Number(y), month: Number(m) };
}
