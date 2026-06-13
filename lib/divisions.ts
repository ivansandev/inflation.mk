// The 13 official ECOICOP v2 divisions that make up the headline CPI. Each key
// is a key into CpiData.yoy (lib/cpi-source.mjs); `icon` names a lucide-react
// glyph rendered left of the label. Display names live in messages/*.json under
// `divisions.<key>` so they translate per locale — the same convention as the
// high-level basket in lib/categories.ts.
//
// This list is independent of the calculator's 8-category basket: it breaks the
// official basket down into its raw divisions for the "inflation by category"
// view. Order here is only the source order; the view sorts tiles by their
// latest year-over-year change.

export interface Division {
  key: string;
  /** lucide-react icon name, rendered left of the label. */
  icon: string;
}

export const DIVISIONS: Division[] = [
  { key: "food", icon: "Apple" },
  { key: "alcohol_tobacco", icon: "Wine" },
  { key: "clothing", icon: "Shirt" },
  { key: "housing", icon: "House" },
  { key: "furnishings", icon: "Sofa" },
  { key: "health", icon: "HeartPulse" },
  { key: "transport", icon: "Car" },
  { key: "communications", icon: "Smartphone" },
  { key: "recreation", icon: "Ticket" },
  { key: "education", icon: "GraduationCap" },
  { key: "restaurants", icon: "UtensilsCrossed" },
  { key: "insurance_finance", icon: "Landmark" },
  { key: "personal_misc", icon: "Sparkles" },
];
