import { NextResponse } from "next/server";
import { getCpi } from "@/lib/pxweb";

// Cached proxy over the official PXWeb API: normalized JSON for any client,
// with the same 24h revalidation as the rest of the app.
export const revalidate = 86400;

export async function GET() {
  const { data, live } = await getCpi();
  return NextResponse.json(
    { live, ...data },
    {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
