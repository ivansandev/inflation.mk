import { defineRouting } from "next-intl/routing";

export const locales = ["mk", "en", "sq"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "mk",
  // Macedonian (default) is served at "/", English at "/en", Albanian at "/sq".
  localePrefix: "as-needed",
  // Always land on Macedonian; don't auto-redirect by browser Accept-Language.
  // Visitors switch language explicitly via the language switcher.
  localeDetection: false,
});
