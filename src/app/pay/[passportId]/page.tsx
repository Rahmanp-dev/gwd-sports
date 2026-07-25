export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import PayPage from "@/views/passport/PayPage";

/**
 * The URL behind "Pay here:" in every fee reminder: /pay/<passportId>.
 *
 * No route guard — the API route explains why that is safe. Not indexable: this
 * page names a child and an amount owed, and it exists for one recipient.
 */
export const metadata: Metadata = {
  title: "Pay academy fees",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ passportId: string }>;
}) {
  const { passportId } = await params;
  return <PayPage passportId={passportId} />;
}
