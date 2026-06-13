// Runtime access to average net wage data.
//
// Fetches live from the official MakStat PXWeb API, cached for 24h, with a
// fallback to the bundled snapshot (data/wages-snapshot.json) so the site never
// hard-fails. The snapshot is refreshed with `node scripts/make-snapshot.mjs`.
// Mirrors lib/pxweb.ts (CPI).

import { unstable_cache } from "next/cache";
import { fetchWages, type WageData } from "@/lib/wages-source.mjs";
import type { CpiData } from "@/lib/cpi-source.mjs";
import type { SeriesPoint } from "@/lib/inflation";
import snapshot from "@/data/wages-snapshot.json";

export type { WageData };

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

const getCachedLive = unstable_cache(() => fetchWages(), ["wages-net"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["wages"],
});

export interface WageResult {
  data: WageData;
  /** true if served from the live API, false if from the bundled snapshot. */
  live: boolean;
}

export async function getWages(): Promise<WageResult> {
  try {
    return { data: await getCachedLive(), live: true };
  } catch (err) {
    console.error("[wages] live fetch failed, using bundled snapshot:", err);
    return { data: snapshot as unknown as WageData, live: false };
  }
}

/**
 * Net-wage year-over-year growth paired with the official headline CPI for each
 * month, shaped as SeriesPoint (personal = wage growth, official = CPI) so it
 * can drive the same chart as the calculator. When the wage line sits above the
 * CPI line, pay outpaced prices (real wages rose).
 *
 * Defaults to the trailing 5 years (60 months). Months missing either the wage
 * figure or the CPI total are skipped.
 */
export function wageSeries(
  wages: WageData,
  cpi: CpiData,
  count = 60,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  for (const month of wages.months.slice(-count)) {
    const wage = wages.yoy[month];
    const cpiIdx = cpi.yoy.total?.[month];
    if (wage == null || cpiIdx == null) continue;
    points.push({ month, personal: wage, official: cpiIdx - 100 });
  }
  return points;
}
