"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SyncButton } from "@/components/sync-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { updateDisplayName } from "@/lib/api/users";
import { initiateDiscogsAuth, disconnectDiscogs } from "@/lib/api/discogs";

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Discogs connection state
  const [isConnectingDiscogs, setIsConnectingDiscogs] = useState(false);
  const [isDisconnectingDiscogs, setIsDisconnectingDiscogs] = useState(false);
  const [discogsError, setDiscogsError] = useState<string | null>(null);
  const [discogsSuccess, setDiscogsSuccess] = useState(false);

  // Initialize display name from profile
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Check for success message from Discogs callback
  useEffect(() => {
    if (searchParams.get("discogs") === "connected") {
      setDiscogsSuccess(true);
      // Clear the query param
      router.replace("/settings", { scroll: false });
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => setDiscogsSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateDisplayName(displayName);
      await refreshProfile();
      setSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectDiscogs = async () => {
    setIsConnectingDiscogs(true);
    setDiscogsError(null);

    try {
      const callbackUrl = `${window.location.origin}/discogs/callback`;
      const { authorization_url, state } = await initiateDiscogsAuth(callbackUrl);

      // Store state in sessionStorage for callback
      sessionStorage.setItem("discogs_oauth_state", state);

      // Redirect to Discogs
      window.location.href = authorization_url;
    } catch (err) {
      setIsConnectingDiscogs(false);
      setDiscogsError(
        err instanceof Error ? err.message : "Failed to initiate Discogs connection"
      );
    }
  };

  const handleDisconnectDiscogs = async () => {
    if (!confirm("Are you sure you want to disconnect your Discogs account?")) {
      return;
    }

    setIsDisconnectingDiscogs(true);
    setDiscogsError(null);

    try {
      await disconnectDiscogs();
      await refreshProfile();
    } catch (err) {
      setDiscogsError(
        err instanceof Error ? err.message : "Failed to disconnect Discogs"
      );
    } finally {
      setIsDisconnectingDiscogs(false);
    }
  };

  const isDiscogsConnected = !!profile?.discogs_username;

  return (
    <main className="flex-1 space-y-8 py-6">
      <AppHeader title="Settings" />

      {/* Profile */}
      <section className="rounded-lg border border-[#2a2a2a] bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Profile
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Update your display name and profile information
          </p>
          <form onSubmit={handleUpdateProfile} className="mt-4 max-w-sm space-y-3">
            <div className="space-y-2">
              <Label htmlFor="display-name" className="text-[#9ca3af]">
                Display name
              </Label>
              <Input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={isLoading}
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            {success && (
              <p className="text-sm text-green-500">Profile updated successfully!</p>
            )}
          </form>
        </div>
        <div className="border-t border-[#2a2a2a] px-6 py-4">
          <Button
            size="sm"
            onClick={handleUpdateProfile}
            disabled={isLoading || !displayName.trim()}
          >
            {isLoading ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </section>

      {/* Email */}
      <section className="rounded-lg border border-[#2a2a2a] bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Email address
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Your email address (cannot be changed for now)
          </p>
          <div className="mt-4 max-w-sm space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#9ca3af]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="border-[#2a2a2a] bg-[#1a1a1a] text-[#525252] cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="rounded-lg border border-[#2a2a2a] bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Password
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Change your password to keep your account secure
          </p>
          <form className="mt-4 max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-[#9ca3af]">
                Current password
              </Label>
              <Input
                id="current-password"
                type="password"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                autoComplete="current-password"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
            <Separator className="bg-[#2a2a2a]" />
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-[#9ca3af]">
                New password
              </Label>
              <Input
                id="new-password"
                type="password"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                autoComplete="new-password"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-[#9ca3af]">
                Confirm new password
              </Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                autoComplete="new-password"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
          </form>
        </div>
        <div className="border-t border-[#2a2a2a] px-6 py-4">
          <Button size="sm">Update password</Button>
        </div>
      </section>

      {/* Discogs connection */}
      <section className="rounded-lg border border-[#2a2a2a] bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Discogs connection
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Connect your Discogs account to import your vinyl collection
          </p>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2a2a2a]">
                <Image
                  src="/discogs-white.svg"
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Discogs</p>
                <p className="text-xs text-[#525252]">
                  {isDiscogsConnected
                    ? `Connected as ${profile.discogs_username}`
                    : "Not connected"}
                </p>
              </div>
            </div>
            <Badge
              variant={isDiscogsConnected ? "default" : "secondary"}
              className={
                isDiscogsConnected
                  ? "bg-green-900/50 text-green-400 border-green-800"
                  : "border-[#2a2a2a] bg-[#0a0a0a] text-[#525252]"
              }
            >
              {isDiscogsConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
          {discogsError && (
            <p className="mt-2 text-sm text-red-500">{discogsError}</p>
          )}
          {discogsSuccess && (
            <p className="mt-2 text-sm text-green-500">
              Discogs account connected successfully!
            </p>
          )}
        </div>
        <div className="border-t border-[#2a2a2a] px-6 py-4">
          {isDiscogsConnected ? (
            <div className="flex items-center gap-3">
              <SyncButton
                onSyncComplete={() => {
                  setDiscogsSuccess(true);
                  setDiscogsError(null);
                  setTimeout(() => setDiscogsSuccess(false), 5000);
                }}
                onSyncError={(error) => setDiscogsError(error)}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-[#2a2a2a]"
                onClick={handleDisconnectDiscogs}
                disabled={isDisconnectingDiscogs}
              >
                {isDisconnectingDiscogs ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-[#2a2a2a]"
              onClick={handleConnectDiscogs}
              disabled={isConnectingDiscogs}
            >
              {isConnectingDiscogs ? "Connecting..." : "Connect Discogs"}
            </Button>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-lg border border-primary/30 bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-primary">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Permanently delete your account and all associated data
          </p>
        </div>
        <div className="border-t border-primary/30 px-6 py-4">
          <Button variant="destructive" size="sm">
            Delete account
          </Button>
        </div>
      </section>
    </main>
  );
}
