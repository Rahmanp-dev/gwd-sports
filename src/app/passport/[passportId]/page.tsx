export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import PassportPage from "@/views/passport/PassportPage";

/**
 * The URL in every welcome message, weekly digest and achievement notification:
 * /passport/<id>.
 *
 * No route guard, deliberately — see the API route for why. A parent arriving
 * from WhatsApp has no account, and a login wall here would make the welcome
 * message's central promise a dead end.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ passportId: string }>;
}): Promise<Metadata> {
  const { passportId } = await params;
  return {
    title: `Sports Passport · ${passportId.toUpperCase()}`,
    description:
      "A permanent record of a young athlete's training, attendance and progress.",
    // The link gets forwarded into family group chats, so it will be unfurled
    // by WhatsApp. No student name in the preview: a chat thumbnail is seen by
    // everyone in the group before anyone chooses to open it.
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ passportId: string }>;
}) {
  const { passportId } = await params;
  return <PassportPage passportId={passportId} />;
}
