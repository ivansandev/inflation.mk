// Eight high-level, everyday spending categories, grouped into "essentials" and
// "quality of life", with the default personal basket (≈75% essentials / ≈25%
// quality of life).
//
// Each category aggregates one or more official ECOICOP v2 divisions (the
// `divisions` keys match CpiData in lib/cpi-source.mjs). A category's combined
// year-over-year change is the official-weight-weighted average of its divisions
// (see lib/inflation.ts), so the figures stay official while the basket reads
// like how people actually think about spending. Display names live in
// messages/*.json under `categories.<key>` so they translate per locale; `icon`
// names a lucide-react glyph rendered left of the label.

export type Bucket = "essential" | "quality";

/** Whether a category's spending is naturally felt per day (groceries, fares,
 *  coffee) or per month (rent, bills, subscriptions). Drives the денар caption unit. */
export type Cadence = "daily" | "monthly";

/** Days per month used to convert a monthly amount into a per-day figure. */
export const DAYS_PER_MONTH = 365 / 12;

export interface Category {
  key: string;
  /** ECOICOP division keys this category aggregates (keys into CpiData.yoy). */
  divisions: string[];
  /** lucide-react icon name, rendered left of the label. */
  icon: string;
  bucket: Bucket;
  /** Natural unit for showing this category's денар amount. */
  cadence: Cadence;
  /** Default share of the basket, in percent. Sums to 100 across all rows. */
  defaultWeight: number;
}

export const CATEGORIES: Category[] = [
  { key: "groceries", divisions: ["food"], icon: "ShoppingBasket", bucket: "essential", cadence: "daily", defaultWeight: 28 },
  { key: "housing", divisions: ["housing", "furnishings"], icon: "House", bucket: "essential", cadence: "monthly", defaultWeight: 21 },
  { key: "transport", divisions: ["transport"], icon: "Bus", bucket: "essential", cadence: "daily", defaultWeight: 9 },
  { key: "connectivity", divisions: ["communications"], icon: "Smartphone", bucket: "essential", cadence: "monthly", defaultWeight: 5 },
  { key: "health", divisions: ["health", "personal_misc", "insurance_finance", "education"], icon: "HeartPulse", bucket: "essential", cadence: "monthly", defaultWeight: 8 },
  { key: "clothing", divisions: ["clothing"], icon: "Shirt", bucket: "essential", cadence: "monthly", defaultWeight: 4 },
  { key: "eating_out", divisions: ["restaurants"], icon: "UtensilsCrossed", bucket: "quality", cadence: "daily", defaultWeight: 11 },
  { key: "leisure", divisions: ["recreation", "alcohol_tobacco"], icon: "PartyPopper", bucket: "quality", cadence: "monthly", defaultWeight: 14 },
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
