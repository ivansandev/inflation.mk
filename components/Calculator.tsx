"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { CpiData } from "@/lib/cpi-source.mjs";
import {
  BUCKETS,
  CATEGORIES,
  categoriesIn,
  defaultWeights,
  type Bucket,
  type Weights,
} from "@/lib/categories";
import { bucketShare, computeInflation, inflationSeries } from "@/lib/inflation";
import { formatMoney, formatPercent } from "@/lib/format";
import CategoryRow from "@/components/CategoryRow";
import InflationChart from "@/components/InflationChart";
import ResultHeadline from "@/components/ResultHeadline";

function officialWeightsToBasket(data: CpiData): Weights {
  return Object.fromEntries(
    CATEGORIES.map((c) => [
      c.key,
      c.divisions.reduce((sum, div) => sum + (data.officialWeights[div] ?? 0), 0),
    ]),
  );
}

export default function Calculator({
  data,
  locale,
}: {
  data: CpiData;
  locale: string;
}) {
  const t = useTranslations();
  const [weights, setWeights] = useState<Weights>(defaultWeights);
  // Total monthly spending in денари. Display-only: it scales the per-category
  // amounts but never feeds into the inflation calculation.
  const [budget, setBudget] = useState(40000);

  const result = useMemo(
    () => computeInflation(data, weights),
    [data, weights],
  );

  const series = useMemo(
    () => inflationSeries(data, weights),
    [data, weights],
  );

  const shareByBucket = useMemo(() => {
    const shares: Record<Bucket, number> = { essential: 0, quality: 0 };
    for (const b of BUCKETS) {
      const keys = new Set(categoriesIn(b).map((c) => c.key));
      shares[b] = bucketShare(result, keys);
    }
    return shares;
  }, [result]);

  const setWeight = (key: string, value: number) =>
    setWeights((w) => ({ ...w, [key]: value }));

  return (
    <div>
      <ResultHeadline
        rate={result.rate}
        official={result.official}
        vsOfficial={result.vsOfficial}
        month={result.month}
        locale={locale}
      />

      <section className="mt-14">
        <h2 className="text-lg font-semibold tracking-tight">
          {t("chart.title")}
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted">
          {t("chart.subtitle")}
        </p>
        <InflationChart series={series} locale={locale} />
      </section>

      <div className="mt-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("basket.title")}
            </h2>
            <p className="mt-1 max-w-md text-sm text-muted">
              {t("basket.hint")}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setWeights(defaultWeights())}
              className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              {t("basket.reset")}
            </button>
            <button
              type="button"
              onClick={() => setWeights(officialWeightsToBasket(data))}
              className="rounded-full border border-line-strong px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-foreground hover:text-foreground"
            >
              {t("basket.useOfficial")}
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <label htmlFor="budget" className="text-sm text-muted">
            {t("basket.budgetLabel")}
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-line-strong px-3 py-1.5 focus-within:border-foreground">
            <input
              id="budget"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              value={budget}
              aria-label={t("basket.amountAria")}
              onChange={(e) =>
                setBudget(
                  Number.isNaN(e.target.valueAsNumber)
                    ? 0
                    : Math.max(0, Math.round(e.target.valueAsNumber)),
                )
              }
              className="num w-24 bg-transparent text-sm text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-xs text-faint">{t("basket.currency")}</span>
          </div>
          <span className="text-xs text-faint">{t("basket.perMonth")}</span>
        </div>

        <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {BUCKETS.map((bucket) => (
            <section key={bucket}>
              <header className="flex items-end justify-between border-b border-line-strong pb-2">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {t(`buckets.${bucket}`)}
                  </h3>
                  <p className="mt-0.5 text-xs text-faint">
                    {t(`buckets.${bucket}Desc`)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="num text-sm font-semibold text-foreground">
                    {formatPercent(shareByBucket[bucket], locale)}
                  </span>
                  <p className="text-[0.7rem] text-faint">
                    {t("buckets.shareSuffix")}
                  </p>
                  <p className="num mt-0.5 text-[0.7rem] text-muted">
                    {"≈ "}
                    {formatMoney(
                      (shareByBucket[bucket] / 100) * budget,
                      locale,
                    )}{" "}
                    {t("basket.currency")} {t("basket.perMonth")}
                  </p>
                </div>
              </header>

              <div className="divide-y divide-line">
                {categoriesIn(bucket).map((c) => {
                  const row = result.rows.find((r) => r.key === c.key)!;
                  const name = t(`categories.${c.key}`);
                  return (
                    <CategoryRow
                      key={c.key}
                      icon={c.icon}
                      name={name}
                      weight={weights[c.key] ?? 0}
                      defaultWeight={c.defaultWeight}
                      share={row.share}
                      yoy={row.yoy}
                      official={result.official}
                      cadence={c.cadence}
                      budget={budget}
                      locale={locale}
                      ariaLabel={t("basket.weightAria", { category: name })}
                      onChange={(v) => setWeight(c.key, v)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
