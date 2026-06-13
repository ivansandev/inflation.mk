import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCpi } from "@/lib/pxweb";
import CategoryBreakdown from "@/components/CategoryBreakdown";
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

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-5 sm:px-8">
      <SiteHeader active="categories" />

      <main className="flex-1 py-10 sm:py-16">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("breakdown.title")}
        </h1>
        <p className="mt-3 max-w-xl text-balance text-sm leading-relaxed text-muted sm:text-base">
          {t("breakdown.subtitle")}
        </p>

        <div className="mt-10">
          <CategoryBreakdown data={data} locale={locale} />
        </div>
      </main>

      <SiteFooter data={data} />
    </div>
  );
}
