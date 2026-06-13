import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

// Shared top bar for both views. The brand links home; a single contextual link
// points at the other view (so navigation stays one tap away on mobile too,
// where there's no room for a full nav). The "how it works" anchor only makes
// sense on the home page and is desktop-only.
export default async function SiteHeader({
  active,
}: {
  active: "home" | "categories";
}) {
  const t = await getTranslations();

  return (
    <header className="flex items-center justify-between py-6">
      <Link
        href="/"
        className="text-base font-semibold tracking-tight"
        aria-label="inflation.mk"
      >
        inflation<span className="text-faint">.mk</span>
      </Link>
      <div className="flex items-center gap-3 sm:gap-4">
        <nav className="flex items-center gap-3 sm:gap-4">
          {active === "home" ? (
            <>
              <a
                href="#methodology"
                className="hidden text-sm text-muted transition-colors hover:text-foreground sm:inline"
              >
                {t("header.nav")}
              </a>
              <Link
                href="/categories"
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {t("header.byCategory")}
              </Link>
            </>
          ) : (
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t("header.calculator")}
            </Link>
          )}
        </nav>
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
    </header>
  );
}
