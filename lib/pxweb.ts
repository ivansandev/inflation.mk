// Runtime access to CPI data.
//
// Fetches live from the official MakStat PXWeb API, cached for 24h so we hit the
// official server gently and stay fast. If the live API is ever unreachable, we
// fall back to the bundled snapshot (data/cpi-snapshot.json) so the site never
// hard-fails. The snapshot is refreshed with `node scripts/make-snapshot.mjs`.

import { unstable_cache } from "next/cache";
import { fetchCpi, type CpiData } from "@/lib/cpi-source.mjs";
import snapshot from "@/data/cpi-snapshot.json";

export type { CpiData };

const REVALIDATE_SECONDS = 60 * 60 * 24; // 24h

const getCachedLive = unstable_cache(() => fetchCpi(), ["cpi-ecoicop-v2"], {
  revalidate: REVALIDATE_SECONDS,
  tags: ["cpi"],
});

export interface CpiResult {
  data: CpiData;
  /** true if served from the live API, false if from the bundled snapshot. */
  live: boolean;
}

export async function getCpi(): Promise<CpiResult> {
  try {
    return { data: await getCachedLive(), live: true };
  } catch (err) {
    console.error("[cpi] live fetch failed, using bundled snapshot:", err);
    return { data: snapshot as unknown as CpiData, live: false };
  }
}
