import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server-side helper to require an access token (from cookies).
 * If missing, redirects to `redirectTo`.
 * Returns the token string when present.
 */
export function requireAuthServer(redirectTo = "/login"): string {
  const cookieStore = cookies();
  const tokenCookie =
    cookieStore.get("accessToken")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("session")?.value ||
    cookieStore.get("admin-token")?.value ||
    null;

  if (!tokenCookie) {
    redirect(redirectTo);
  }

  return tokenCookie as string;
}

/**
 * Server-side helper to optionally get admin info from cookies.
 * This only reads raw cookie values; to fully validate the token call your API.
 */
export function getTokenFromCookies(): string | null {
  const cookieStore = cookies();
  return (
    cookieStore.get("accessToken")?.value ||
    cookieStore.get("token")?.value ||
    cookieStore.get("session")?.value ||
    cookieStore.get("admin-token")?.value ||
    null
  );
}
