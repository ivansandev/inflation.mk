import { defineRouting } from "next-intl/routing";

export const locales = ["mk", "en", "sq"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "mk",
  // Macedonian (default) is served at "/", English at "/en", Albanian at "/sq".
  localePrefix: "as-needed",
});
