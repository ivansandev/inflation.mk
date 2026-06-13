// Refreshes the bundled offline fallback (data/cpi-snapshot.json) from the
// official State Statistical Office (MakStat) PXWeb API.
//
//   node scripts/make-snapshot.mjs
//
// The bundled snapshot is what the site serves if the live API is ever
// unreachable. Source: State Statistical Office of the Republic of North Macedonia.
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fetchCpi } from "../lib/cpi-source.mjs";

const out = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "cpi-snapshot.json",
);

const snap = await fetchCpi();
await writeFile(out, JSON.stringify(snap, null, 2) + "\n");

const t = snap.yoy.total[snap.latestMonth];
console.log(
  `Wrote ${out}\n` +
    `  classification: ${snap.classification}\n` +
    `  latest month:   ${snap.latestMonth}  (TOTAL YoY index ${t} → ${(t - 100).toFixed(1)}%)\n` +
    `  official weights ${snap.officialWeightsYear}: ` +
    Object.entries(snap.officialWeights)
      .map(([k, v]) => `${k} ${v}`)
      .join(", "),
);
