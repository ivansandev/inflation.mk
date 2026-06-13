"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";

const SHORT: Record<Locale, string> = { mk: "МК", en: "EN", sq: "SQ" };

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      // Preserve the current path while changing locale.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className="inline-flex items-center rounded-full border border-line-strong p-0.5"
      role="group"
      aria-label="Language"
      data-pending={isPending ? "" : undefined}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchTo(l)}
            aria-current={active ? "true" : undefined}
            className={`num rounded-full px-2.5 py-1 text-xs tracking-wide transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {SHORT[l]}
          </button>
        );
      })}
    </div>
  );
}
