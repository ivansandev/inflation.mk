import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCpi } from "@/lib/pxweb";
import { formatDate, monthLabel } from "@/lib/format";
import Calculator from "@/components/Calculator";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const { data, live } = await getCpi();

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 sm:px-8">
      <SiteHeader active="home" />

      <main id="top" className="flex-1 py-10 sm:py-16">
        <p className="mb-10 max-w-xl text-balance text-base leading-relaxed text-muted sm:text-lg">
          {t("hero.subtitle")}
        </p>

        <Calculator data={data} locale={locale} />

        <section
          id="methodology"
          className="mt-24 max-w-2xl scroll-mt-20 border-t border-line pt-10"
        >
          <h2 className="text-lg font-semibold tracking-tight">
            {t("methodology.title")}
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <p>{t("methodology.body1")}</p>
            <p>{t("methodology.body2")}</p>
            <p>{t("methodology.body3")}</p>
          </div>
          <dl className="num mt-6 grid grid-cols-1 gap-x-8 gap-y-2 text-xs text-faint sm:grid-cols-2">
            <div className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt>{t("methodology.classificationLabel")}</dt>
              <dd className="text-foreground">{data.classification}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt>{t("methodology.weightsLabel")}</dt>
              <dd className="text-foreground">{data.officialWeightsYear}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt>{t("methodology.updatedLabel")}</dt>
              <dd className="text-foreground">
                {monthLabel(data.latestMonth, t)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line py-1.5">
              <dt>{t("methodology.dataLabel")}</dt>
              <dd className="text-foreground">
                {(live ? t("footer.live") : t("footer.cached")) +
                  " · " +
                  formatDate(data.fetchedAt, locale)}
              </dd>
            </div>
          </dl>
        </section>
      </main>

      <SiteFooter data={data} />
    </div>
  );
}
