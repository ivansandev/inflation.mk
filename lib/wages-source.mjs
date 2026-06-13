// Single source of truth for fetching average net wage data from the official
// State Statistical Office (MakStat) PXWeb API.
//
// Used by both the Next.js runtime (lib/wages.ts) and the snapshot refresher
// (scripts/make-snapshot.mjs). Framework-agnostic: plain fetch + transforms,
// no Next.js imports.
//
// Metric: average monthly NET wage per employee, all sectors (the "Total" row),
// by months. The table reports denar levels, so we derive the year-over-year
// percentage change ourselves (this month vs the same month a year earlier).
//
// Source: State Statistical Office of the Republic of North Macedonia.

import { SOURCE_NAME } from "./cpi-source.mjs";

const BASE =
  "https://makstat.stat.gov.mk/PXWeb/api/v1/en/MakStat/PazarNaTrud/Plati/MesecnaBrutoNeto";
// Average paid net wage per employee, by sectors of activity, by months (denars).
const T_NET = `${BASE}/175_PazTrud_Mk_neto_ml.px`;

export const WAGE_METRIC = "Average monthly net wage per employee";
export const WAGE_SOURCE_URL =
  "https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__PazarNaTrud__Plati__MesecnaBrutoNeto/";

async function getJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PXWeb ${res.status} ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

function findVar(meta, predicate) {
  const v = meta.variables.find(predicate);
  if (!v) throw new Error("PXWeb: expected variable not found");
  return v;
}

export async function fetchWages() {
  const meta = await getJson(T_NET);
  const vSector = findVar(
    meta,
    (v) => v.code === "Sector" || v.text.toLowerCase().startsWith("sector"),
  );
  const vMonth = findVar(meta, (v) => v.text.toLowerCase().startsWith("month"));
  // The "Total average monthly net wage" row (all sectors combined).
  const totalPos = vSector.valueTexts.findIndex((t) => /^total/i.test(t.trim()));
  if (totalPos < 0) throw new Error("PXWeb: total net wage row not found");
  const totalCode = vSector.values[totalPos];

  const body = {
    query: [
      { code: vSector.code, selection: { filter: "item", values: [totalCode] } },
      { code: vMonth.code, selection: { filter: "all", values: ["*"] } },
    ],
    response: { format: "json-stat2" },
  };
  const ds = await getJson(T_NET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // One sector selected, so the value array is one entry per month in the Month
  // dimension's index order. Map each month label → denar level.
  const monthDim = ds.dimension[vMonth.code];
  const index = monthDim.category.index;
  const labels = monthDim.category.label || {};
  const denars = {};
  for (const [code, pos] of Object.entries(index)) {
    const v = ds.value[pos];
    if (v == null) continue;
    denars[labels[code] || code] = v; // e.g. "2026M03"
  }

  // Year-over-year % from levels: this month vs the same month a year earlier.
  const yoy = {};
  for (const m of Object.keys(denars)) {
    const [y, mm] = m.split("M");
    const prev = `${Number(y) - 1}M${mm}`;
    if (denars[prev] != null) {
      yoy[m] = +((denars[m] / denars[prev] - 1) * 100).toFixed(2);
    }
  }

  const months = Object.keys(yoy).sort();
  const latestMonth = months[months.length - 1];
  return {
    source: SOURCE_NAME,
    sourceUrl: WAGE_SOURCE_URL,
    metric: WAGE_METRIC,
    fetchedAt: new Date().toISOString(),
    months,
    latestMonth,
    yoy,
    denars,
    latestDenars: denars[latestMonth],
  };
}
