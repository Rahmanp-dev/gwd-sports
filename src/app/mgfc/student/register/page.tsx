import { redirect } from "next/navigation";

/**
 * Moved to /portal/register.
 *
 * Every academy's coaches and students used to land on /mgfc/* — the slug of
 * one specific demo academy (Master Grid FC). The data underneath was always
 * correctly scoped to the signed-in user's own academy, so nothing leaked, but
 * a paying customer's staff saw a competitor's name in their address bar.
 *
 * Kept as a permanent redirect rather than deleted: these URLs are in people's
 * browser history and in already-sent messages.
 */
export default function Page() {
  redirect("/portal/student/register");
}
