import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // Server-side check for an auth cookie. Adjust cookie names as needed.
  const cookieStore = await cookies();
  const tokenCookie =
    cookieStore.get("token") ||
    cookieStore.get("session") ||
    cookieStore.get("next-auth.session-token") ||
    cookieStore.get("admin-token");

  if (tokenCookie) {
    // If a token cookie exists, assume user is authenticated and send to dashboard
    redirect("/dashboard");
  } else {
    // Otherwise redirect to login
    redirect("/login");
  }
}
