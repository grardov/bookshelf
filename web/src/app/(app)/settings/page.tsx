import Image from "next/image";
import { createMetadata } from "@/lib/metadata";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export const metadata = createMetadata({
  title: "Settings",
  description: "Manage your account, password, and Discogs connection",
  path: "/settings",
});

export default function SettingsPage() {
  return (
    <main className="flex-1 space-y-8 py-6">
      <AppHeader title="Settings" />

      {/* Email */}
      <section className="rounded-lg border border-[#2a2a2a] bg-[#141414]">
        <div className="p-6">
          <h2 className="font-heading text-lg font-semibold text-white">
            Email address
          </h2>
          <p className="mt-1 text-sm text-[#525252]">
            Update the email associated with your account
          </p>
          <form className="mt-4 max-w-sm space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#9ca3af]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                defaultValue="user@example.com"
                autoComplete="email"
                className="border-[#2a2a2a] bg-[#1a1a1a] text-white focus-visible:ring-primary"
              />
            </div>
          </form>
        </div>
        <div className="border-t border-[#2a2a2a] px-6 py-4">
          <Button size="sm">Save email</Button>
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
                <p className="text-xs text-[#525252]">Not connected</p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="border-[#2a2a2a] bg-[#0a0a0a] text-[#525252]"
            >
              Disconnected
            </Badge>
          </div>
        </div>
        <div className="border-t border-[#2a2a2a] px-6 py-4">
          <Button variant="outline" size="sm" className="border-[#2a2a2a]">
            Connect Discogs
          </Button>
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
