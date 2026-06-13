import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCpi } from "@/lib/pxweb";
import { getWages, wageSeries } from "@/lib/wages";
import { formatMoney, monthLabel } from "@/lib/format";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import InflationChart from "@/components/InflationChart";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("breakdownTitle") };
}

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const { data } = await getCpi();
  const { data: wages } = await getWages();
  const wages5y = wageSeries(wages, data);

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 sm:px-8">
      <SiteHeader active="categories" />

      <main className="flex-1 py-10 sm:py-16">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("breakdown.title")}
        </h1>
        <p className="mt-3 max-w-xl text-balance text-sm leading-relaxed text-muted sm:text-base">
          {t("breakdown.intro")}
        </p>

        <section className="mt-12">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("wages.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {t("wages.subtitle")}
          </p>
          <InflationChart
            series={wages5y}
            locale={locale}
            seriesLabel={t("wages.seriesLabel")}
            officialLabel={t("hero.officialLabel")}
          />
          <p className="num mt-3 text-xs text-faint">
            {t("wages.latest", {
              amount: formatMoney(wages.latestDenars, locale),
              currency: t("basket.currency"),
              month: monthLabel(wages.latestMonth, t),
            })}
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("breakdown.gridTitle")}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {t("breakdown.subtitle")}
          </p>
          <div className="mt-8">
            <CategoryBreakdown data={data} locale={locale} />
          </div>
        </section>
      </main>

      <SiteFooter data={data} />
    </div>
  );
}
