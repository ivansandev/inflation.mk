// The 13 ECOICOP v2 divisions, grouped into "essentials" and "quality of life",
// with the default personal basket (≈75% essentials / ≈25% quality of life).
//
// `key` matches the keys in CpiData (lib/cpi-source.mjs); `code` is the ECOICOP
// division number, shown as a small chip. Display names live in messages/*.json
// under `categories.<key>` so they translate per locale.

export type Bucket = "essential" | "quality";

/** Whether a category's spending is naturally felt per day (groceries, fares,
 *  coffee) or per month (rent, bills, insurance). Drives the денар caption unit. */
export type Cadence = "daily" | "monthly";

/** Days per month used to convert a monthly amount into a per-day figure. */
export const DAYS_PER_MONTH = 365 / 12;

export interface Category {
  key: string;
  code: number;
  bucket: Bucket;
  /** Natural unit for showing this category's денар amount. */
  cadence: Cadence;
  /** Default share of the basket, in percent. Sums to 100 across all rows. */
  defaultWeight: number;
}

export const CATEGORIES: Category[] = [
  { key: "food", code: 1, bucket: "essential", cadence: "daily", defaultWeight: 28 },
  { key: "alcohol_tobacco", code: 2, bucket: "quality", cadence: "daily", defaultWeight: 5 },
  { key: "clothing", code: 3, bucket: "essential", cadence: "monthly", defaultWeight: 4 },
  { key: "housing", code: 4, bucket: "essential", cadence: "monthly", defaultWeight: 18 },
  { key: "furnishings", code: 5, bucket: "essential", cadence: "monthly", defaultWeight: 3 },
  { key: "health", code: 6, bucket: "essential", cadence: "monthly", defaultWeight: 5 },
  { key: "transport", code: 7, bucket: "essential", cadence: "daily", defaultWeight: 9 },
  { key: "communications", code: 8, bucket: "essential", cadence: "monthly", defaultWeight: 5 },
  { key: "recreation", code: 9, bucket: "quality", cadence: "monthly", defaultWeight: 9 },
  { key: "education", code: 10, bucket: "essential", cadence: "monthly", defaultWeight: 1 },
  { key: "restaurants", code: 11, bucket: "quality", cadence: "daily", defaultWeight: 11 },
  { key: "insurance_finance", code: 12, bucket: "essential", cadence: "monthly", defaultWeight: 1 },
  { key: "personal_misc", code: 13, bucket: "essential", cadence: "monthly", defaultWeight: 1 },
];

export const CATEGORY_BY_KEY: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c]),
);

export const BUCKETS: Bucket[] = ["essential", "quality"];

export function categoriesIn(bucket: Bucket): Category[] {
  return CATEGORIES.filter((c) => c.bucket === bucket);
}

export type Weights = Record<string, number>;

export function defaultWeights(): Weights {
  return Object.fromEntries(CATEGORIES.map((c) => [c.key, c.defaultWeight]));
}
