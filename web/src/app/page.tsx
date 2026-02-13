import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#0a0a0a] px-4">
      <div className="text-center">
        <h1 className="font-heading text-5xl font-bold italic text-white md:text-7xl">
          Bookshelf.
        </h1>
        <p className="mt-4 text-lg text-[#525252]">
          Your Discogs collection, remixed into playlists
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/signup">Get started</Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="rounded-full px-8 text-[#9ca3af] hover:text-white"
        >
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
}
