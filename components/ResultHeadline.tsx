"use client";

import { useTranslations } from "next-intl";
import { formatNumber, formatSignedPercent, monthLabel } from "@/lib/format";

export default function ResultHeadline({
  rate,
  official,
  vsOfficial,
  month,
  locale,
}: {
  rate: number;
  official: number;
  vsOfficial: number;
  month: string;
  locale: string;
}) {
  const t = useTranslations();
  const asOfMonth = monthLabel(month, t);

  const pp = formatNumber(Math.abs(vsOfficial), locale);
  let vsText = t("hero.vsEqual");
  let vsColor = "text-muted";
  if (vsOfficial > 0.05) {
    vsText = t("hero.vsHigher", { pp });
    vsColor = "text-up";
  } else if (vsOfficial < -0.05) {
    vsText = t("hero.vsLower", { pp });
    vsColor = "text-down";
  }

  // Comparison meter: scale both bars against a shared, slightly padded max.
  const scaleMax = Math.max(rate, official, 1) * 1.15;
  const personalPct = Math.max(0, (rate / scaleMax) * 100);
  const officialPct = Math.max(0, (official / scaleMax) * 100);

  return (
    <div className="fade-up">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
        {t("hero.eyebrow")}
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-x-5 gap-y-1">
        <span className="text-6xl font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground sm:text-7xl">
          {formatSignedPercent(rate, locale)}
        </span>
        <span className="pb-1 text-sm text-faint">{t("hero.asOf", { month: asOfMonth })}</span>
      </div>

      <p className={`mt-3 text-sm font-medium ${vsColor}`}>{vsText}</p>

      <div className="mt-6 max-w-md space-y-2">
        <Bar
          label={t("hero.eyebrow")}
          value={formatSignedPercent(rate, locale)}
          pct={personalPct}
          strong
        />
        <Bar
          label={t("hero.officialLabel")}
          value={formatSignedPercent(official, locale)}
          pct={officialPct}
        />
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  pct,
  strong = false,
}: {
  label: string;
  value: string;
  pct: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-muted sm:w-36">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${
            strong ? "bg-foreground" : "bg-line-strong"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="num w-14 shrink-0 text-right text-xs text-foreground">{value}</span>
    </div>
  );
}
