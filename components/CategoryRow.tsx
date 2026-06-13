"use client";

import { useTranslations } from "next-intl";
import { DAYS_PER_MONTH, type Cadence } from "@/lib/categories";
import { formatMoney, formatPercent, formatSignedPercent } from "@/lib/format";

const SLIDER_STEPS = 100;
// Each slider runs from 0× (100% below the average) up to 5× the category's
// average default. 1× — the average itself — therefore sits a fifth of the way
// along the track.
const MAX_MULTIPLE = 5;
const AVERAGE_POSITION = SLIDER_STEPS / MAX_MULTIPLE; // 20

export default function CategoryRow({
  code,
  name,
  weight,
  defaultWeight,
  share,
  yoy,
  official,
  cadence,
  budget,
  locale,
  ariaLabel,
  onChange,
}: {
  code: number;
  name: string;
  weight: number;
  defaultWeight: number;
  share: number;
  yoy: number | null;
  official: number;
  cadence: Cadence;
  budget: number;
  locale: string;
  ariaLabel: string;
  onChange: (weight: number) => void;
}) {
  const t = useTranslations();

  // Colour the YoY badge by how this category compares to the headline rate:
  // notably above → "up" (red), notably below → "down" (green), else neutral.
  let yoyColor = "text-muted";
  if (yoy != null) {
    const diff = yoy - official;
    if (diff > 0.75) yoyColor = "text-up";
    else if (diff < -0.75) yoyColor = "text-down";
  }

  const shareText = formatPercent(share, locale, share < 9.95 ? 1 : 0);
  const yoyText = yoy == null ? "—" : formatSignedPercent(yoy, locale);

  // Money is purely derived: this category's share of the monthly budget. Shown
  // in the category's natural unit (per day for everyday spending, per month
  // otherwise), with the alternate cadence as a fainter secondary line.
  const monthly = (share / 100) * budget;
  const daily = monthly / DAYS_PER_MONTH;
  const monthlyText = formatMoney(Math.round(monthly / 100) * 100, locale);
  const dailyText = formatMoney(Math.round(daily / 10) * 10, locale);
  const currency = t("basket.currency");
  const perDay = t("basket.perDay");
  const perMonth = t("basket.perMonth");

  const primary =
    cadence === "daily"
      ? `≈ ${dailyText} ${currency} ${perDay}`
      : `≈ ${monthlyText} ${currency} ${perMonth}`;
  const secondary =
    cadence === "daily" ? `${monthlyText} ${currency} ${perMonth}` : null;

  // Map the stored weight onto the 0..100 track: 1× (the average) lands at
  // AVERAGE_POSITION, 5× at the far right. Weights above 5× pin at the end.
  const position =
    defaultWeight > 0
      ? Math.min(
          Math.round((weight / defaultWeight) * AVERAGE_POSITION),
          SLIDER_STEPS,
        )
      : weight > 0
        ? SLIDER_STEPS
        : 0;
  const handlePosition = (pos: number) =>
    onChange(defaultWeight > 0 ? (defaultWeight * pos) / AVERAGE_POSITION : pos);

  return (
    <div className="py-3 sm:grid sm:grid-cols-[2.1rem_minmax(0,1fr)_9.5rem_3.2rem] sm:items-center sm:gap-x-4">
      <span className="num hidden text-[0.7rem] text-faint sm:block">
        {String(code).padStart(2, "0")}
      </span>

      {/* Name + YoY badge; on mobile the share sits to the right on the same line. */}
      <div className="flex items-baseline justify-between gap-3 sm:block sm:justify-start">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm text-foreground">{name}</span>
          <span className={`num shrink-0 text-xs ${yoyColor}`}>{yoyText}</span>
        </div>
        <span className="num shrink-0 text-sm text-foreground sm:hidden">
          {shareText}
        </span>
      </div>

      <div className="mt-2.5 sm:mt-0">
        <div className="relative flex items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 h-2.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-faint"
            style={{ left: `${AVERAGE_POSITION}%` }}
          />
          <input
            type="range"
            className="slider w-full"
            min={0}
            max={SLIDER_STEPS}
            step={1}
            value={position}
            aria-label={ariaLabel}
            aria-valuetext={shareText}
            onChange={(e) => handlePosition(Number(e.target.value))}
          />
        </div>
        {share > 0 && (
          <div className="num mt-1.5 flex flex-col gap-px text-[0.7rem] leading-tight text-faint">
            <span>{primary}</span>
            {secondary && <span className="opacity-60">{secondary}</span>}
          </div>
        )}
      </div>

      <span className="num hidden text-right text-sm text-foreground sm:block">
        {shareText}
      </span>
    </div>
  );
}
