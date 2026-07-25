export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import ReceiptPage from "@/views/payments/ReceiptPage";

/**
 * A parent's printable receipt: /receipt/<paymentId>.
 *
 * Authenticated — unlike the passport and payment links, this one names an
 * amount already paid by a specific family, and there is no onboarding reason
 * to make it open. The API enforces that only the payer or an admin of the
 * receiving academy can read it.
 */
export const metadata: Metadata = {
  title: "Payment receipt",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  return <ReceiptPage paymentId={paymentId} />;
}
