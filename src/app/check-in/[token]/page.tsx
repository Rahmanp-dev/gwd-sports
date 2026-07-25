export const dynamic = "force-dynamic";
import CheckInPage from "@/views/attendance/CheckInPage";

/**
 * The URL printed inside every batch QR code: /check-in/<token>.
 *
 * Deliberately NOT behind a route guard. A parent scanning at the gate must
 * reach a page that explains itself and offers a sign-in, not a redirect to a
 * login screen with no context — the scan would be wasted and they would give
 * up. The page handles the signed-out state itself; the API is what enforces
 * authentication.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CheckInPage token={token} />;
}
