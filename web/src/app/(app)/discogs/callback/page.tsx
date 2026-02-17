"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeDiscogsAuth } from "@/lib/api/discogs";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

function DiscogsCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const oauthVerifier = searchParams.get("oauth_verifier");
      const state = sessionStorage.getItem("discogs_oauth_state");

      // Clear stored state immediately
      sessionStorage.removeItem("discogs_oauth_state");

      if (!oauthVerifier) {
        setError("Authorization was denied or failed. Please try again.");
        return;
      }

      if (!state) {
        setError("OAuth session expired. Please try again.");
        return;
      }

      try {
        await completeDiscogsAuth(oauthVerifier, state);
        await refreshProfile();
        router.push("/settings?discogs=connected");
      } catch (err) {
        console.error("Discogs callback error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to connect Discogs account",
        );
      }
    };

    handleCallback();
  }, [searchParams, refreshProfile, router]);

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-white mb-2">
            Connection Failed
          </h1>
          <p className="text-[#525252] mb-4">{error}</p>
          <Button variant="outline" onClick={() => router.push("/settings")}>
            Back to Settings
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-[#525252]">Connecting your Discogs account...</p>
    </main>
  );
}

export default function DiscogsCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-[#525252]">
            Connecting your Discogs account...
          </p>
        </main>
      }
    >
      <DiscogsCallbackContent />
    </Suspense>
  );
}
