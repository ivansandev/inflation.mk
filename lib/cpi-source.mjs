// Single source of truth for fetching Consumer Price Index data from the
// official State Statistical Office (MakStat) PXWeb API.
//
// Used by both the Next.js runtime (lib/pxweb.ts) and the snapshot refresher
// (scripts/make-snapshot.mjs). Framework-agnostic: plain fetch + transforms,
// no Next.js imports.
//
// Classification: ECOICOP version 2 (the office's current classification,
// aligned with UN COICOP 2018), 13 divisions.
//
// Source: State Statistical Office of the Republic of North Macedonia.

const BASE =
  "https://makstat.stat.gov.mk/PXWeb/api/v1/en/MakStat/Ceni/IndeksTrosZivot/TrosociZivot";
// Consumer Price Index by ECOICOP v2, by months (index numbers).
const T_INDEX = `${BASE}/121_CeniTr_Mk_IndTroZi_ecoicop_ml.px`;
// Official weight structure of the CPI by ECOICOP v2, by years.
const T_WEIGHTS = `${BASE}/132_CeniTr_Mk_Ponderi_ml.px`;

export const SOURCE_NAME =
  "State Statistical Office of the Republic of North Macedonia";
export const SOURCE_URL =
  "https://makstat.stat.gov.mk/PXWeb/pxweb/en/MakStat/MakStat__Ceni__IndeksTrosZivot__TrosociZivot/";

// ECOICOP v2 division number (1..13) -> stable app key. 0 = grand total.
const DIV_KEY = {
  0: "total",
  1: "food",
  2: "alcohol_tobacco",
  3: "clothing",
  4: "housing",
  5: "furnishings",
  6: "health",
  7: "transport",
  8: "communications",
  9: "recreation",
  10: "education",
  11: "restaurants",
  12: "insurance_finance",
  13: "personal_misc",
};

// The 13 spendable categories (everything except the grand total), in order.
export const CATEGORY_KEYS = Object.values(DIV_KEY).filter((k) => k !== "total");

// "0 Total" -> 0 ; "01 Food..." -> 1 ; "13 Personal..." -> 13 ; "TOTAL" -> 0.
// Sub-items like "01.1 Food" and aggregates like "91 Non durable goods" return
// a number that is simply not in DIV_KEY, so they are ignored by callers.
function leadingDivision(text) {
  const t = String(text).trim();
  if (/^total$/i.test(t)) return 0;
  const m = t.match(/^(\d{1,2})(?:\s|$)/);
  return m ? parseInt(m[1], 10) : null;
}

async function getJson(url, opts) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`PXWeb ${res.status} ${url}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// Decode helpers for a json-stat2 dataset.
function decode(ds) {
  const ids = ds.id;
  const size = ds.size;
  const posToCode = ids.map((id) => {
    const out = {};
    for (const [code, pos] of Object.entries(ds.dimension[id].category.index)) {
      out[pos] = code;
    }
    return out;
  });
  const labels = ids.map((id) => ds.dimension[id].category.label);
  const strides = new Array(ids.length);
  strides[ids.length - 1] = 1;
  for (let i = ids.length - 2; i >= 0; i--) strides[i] = strides[i + 1] * size[i + 1];
  return { ids, size, strides, posToCode, labels };
}

function findVar(meta, predicate) {
  const v = meta.variables.find(predicate);
  if (!v) throw new Error("PXWeb: expected variable not found");
  return v;
}

// Year-over-year index per division: 100 = no change, 105.2 = +5.2%.
async function fetchIndex() {
  const meta = await getJson(T_INDEX);
  const vCoicop = findVar(meta, (v) => v.code.includes("COICOP"));
  const vMonth = findVar(meta, (v) => v.text.toLowerCase().startsWith("month"));
  const vBase = findVar(meta, (v) => v.text.toLowerCase().includes("base"));
  const yoyPos = vBase.valueTexts.findIndex((t) =>
    /same month of the previous year/i.test(t),
  );
  if (yoyPos < 0) throw new Error("PXWeb: year-over-year base period not found");

  const body = {
    query: [
      { code: vCoicop.code, selection: { filter: "all", values: ["*"] } },
      { code: vMonth.code, selection: { filter: "all", values: ["*"] } },
      { code: vBase.code, selection: { filter: "item", values: [vBase.values[yoyPos]] } },
    ],
    response: { format: "json-stat2" },
  };
  const ds = await getJson(T_INDEX, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const { ids, size, strides, posToCode, labels } = decode(ds);
  const dc = ids.indexOf(vCoicop.code);
  const dm = ids.indexOf(vMonth.code);

  const yoy = {};
  for (const k of Object.values(DIV_KEY)) yoy[k] = {};
  ds.value.forEach((val, flat) => {
    if (val == null) return;
    const idx = ids.map((_, d) => Math.floor(flat / strides[d]) % size[d]);
    const div = leadingDivision(labels[dc][posToCode[dc][idx[dc]]]);
    const key = DIV_KEY[div];
    if (!key) return;
    const month = labels[dm][posToCode[dm][idx[dm]]]; // e.g. "2026M05"
    yoy[key][month] = val;
  });

  const months = Object.keys(yoy.total).sort();
  return { yoy, months, latestMonth: months[months.length - 1] };
}

// Official CPI weights (latest published year), normalized to percent (sum 100).
async function fetchWeights() {
  const meta = await getJson(T_WEIGHTS);
  const vProd = findVar(meta, (v) => v.text.toLowerCase().startsWith("product"));
  const vYear = findVar(meta, (v) => v.text.toLowerCase().startsWith("year"));

  const body = {
    query: [
      { code: vProd.code, selection: { filter: "all", values: ["*"] } },
      { code: vYear.code, selection: { filter: "all", values: ["*"] } },
    ],
    response: { format: "json-stat2" },
  };
  const ds = await getJson(T_WEIGHTS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const { ids, size, strides, posToCode, labels } = decode(ds);
  const dp = ids.indexOf(vProd.code);
  const dy = ids.indexOf(vYear.code);

  const byYear = {};
  ds.value.forEach((val, flat) => {
    if (val == null) return;
    const idx = ids.map((_, d) => Math.floor(flat / strides[d]) % size[d]);
    const div = leadingDivision(labels[dp][posToCode[dp][idx[dp]]]);
    const key = DIV_KEY[div];
    if (!key) return;
    const year = labels[dy][posToCode[dy][idx[dy]]];
    (byYear[year] ||= {})[key] = val;
  });

  const years = Object.keys(byYear)
    .filter((y) => byYear[y].total != null)
    .sort();
  const year = years[years.length - 1];
  const raw = byYear[year];
  const total = raw.total;
  const officialWeights = {};
  for (const key of CATEGORY_KEYS) {
    if (raw[key] != null) officialWeights[key] = +((raw[key] / total) * 100).toFixed(2);
  }
  return { officialWeights, officialWeightsYear: Number(year) };
}

export async function fetchCpi() {
  const [index, weights] = await Promise.all([fetchIndex(), fetchWeights()]);
  return {
    source: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    classification: "ECOICOP version 2",
    fetchedAt: new Date().toISOString(),
    months: index.months,
    latestMonth: index.latestMonth,
    yoy: index.yoy,
    officialWeights: weights.officialWeights,
    officialWeightsYear: weights.officialWeightsYear,
  };
}
