import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON!,
    {
      auth: {
        // Disable navigator.locks to prevent cross-tab lock contention.
        // The default exclusive lock blocks all auth operations (getSession,
        // token refresh) across tabs when any single tab holds the lock.
        // This is safe because @supabase/ssr uses cookie-based storage and
        // session refresh is handled server-side by the Next.js middleware.
        lock: async (
          _name: string,
          _acquireTimeout: number,
          fn: () => Promise<unknown>,
        ) => {
          return await fn();
        },
      },
    },
  );
}
