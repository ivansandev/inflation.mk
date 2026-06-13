import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-contained build for self-hosting (Docker / Node server).
  output: "standalone",
};

export default withNextIntl(nextConfig);
