import { createClient } from "@/lib/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_CORE_API_URL || "http://localhost:8000";

/**
 * Make an authenticated API request to the core backend.
 *
 * Automatically retries once on 401 responses by refreshing the session,
 * which handles stale/expired access tokens returned by getSession().
 *
 * @param endpoint - API endpoint path (e.g., "/api/users/me")
 * @param options - Fetch request options
 * @returns Promise resolving to response data
 * @throws Error if request fails or user not authenticated
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const makeRequest = (token: string) =>
    fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

  let response = await makeRequest(session.access_token);

  // On 401, force a session refresh and retry once
  if (response.status === 401) {
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();

    if (!refreshedSession) {
      throw new Error("Session expired. Please log in again.");
    }

    response = await makeRequest(refreshedSession.access_token);
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  // Handle 204 No Content responses (e.g., DELETE operations)
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
