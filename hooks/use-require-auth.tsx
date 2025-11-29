"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminData = Record<string, unknown> | null;

/**
 * Client hook to require auth on client components/pages.
 * - It looks for an `accessToken` in `localStorage` or document cookies.
 * - If `validate` is true (default) it will call `/api/me` to fetch admin data.
 * - If no token or validation fails it will redirect to `redirectTo`.
 *
 * Usage:
 * const { admin, loading } = useRequireAuth();
 */
export default function useRequireAuth(options?: {
  redirectTo?: string;
  validate?: boolean;
  meEndpoint?: string;
}) {
  const {
    redirectTo = "/login",
    validate = true,
    meEndpoint = "/api/me",
  } = options || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<AdminData>(null);

  useEffect(() => {
    async function check() {
      try {
        // 1) find token (localStorage preferred)
        let token: string | null = null;
        try {
          token = window.localStorage?.getItem("accessToken") || null;
        } catch (_) {
          token = null;
        }

        // fallback to cookies
        if (!token) {
          const match = document.cookie.match(
            /(?:^|; )(?:accessToken|token|admin-token)=([^;]+)/
          );
          token = match ? decodeURIComponent(match[1]) : null;
        }

        if (!token) {
          router.replace(redirectTo);
          return;
        }

        if (!validate) {
          setAdmin({ token });
          return;
        }

        // 2) validate token by calling `meEndpoint`
        const res = await fetch(meEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          // invalid token
          router.replace(redirectTo);
          return;
        }

        const data = await res.json();
        setAdmin(data || { token });
      } catch (err) {
        router.replace(redirectTo);
      } finally {
        setLoading(false);
      }
    }

    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { admin, loading } as { admin: AdminData; loading: boolean };
}
