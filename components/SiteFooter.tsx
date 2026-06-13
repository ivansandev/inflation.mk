import { getTranslations } from "next-intl/server";
import type { CpiData } from "@/lib/cpi-source.mjs";

// Shared footer for both views: source attribution (linking the official data)
// and the independence note.
export default async function SiteFooter({ data }: { data: CpiData }) {
  const t = await getTranslations();

  return (
    <footer className="border-t border-line py-8 text-xs text-faint">
      <p>
        {t.rich("footer.attribution", {
          link: (chunks) => (
            <a
              href={data.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-foreground"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      <p className="mt-1">{t("footer.note")}</p>
    </footer>
  );
}
