"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Headphones,
  Disc3,
  Radio,
  Sunrise,
  PartyPopper,
  Clock,
  Wand2,
  PenLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const suggestions = [
  {
    label: "Deep house session",
    icon: Headphones,
    prompt: "Deep house session for late night vibes",
  },
  {
    label: "Sunday morning vinyl",
    icon: Sunrise,
    prompt: "Relaxed Sunday morning vinyl selection",
  },
  {
    label: "Party warm-up set",
    icon: PartyPopper,
    prompt: "Party warm-up set to get the crowd moving",
  },
  {
    label: "Crate digging gems",
    icon: Disc3,
    prompt: "Hidden crate digging gems from my collection",
  },
  {
    label: "Late night radio",
    icon: Radio,
    prompt: "Late night radio mix for the after hours",
  },
];

const recentPlaylists = [
  {
    id: "1",
    title: "Late Night Deep House",
    trackCount: 18,
    duration: "1h 24m",
    genre: "Deep House",
    createdAt: "2 hours ago",
  },
  {
    id: "2",
    title: "Sunday Morning Jazz",
    trackCount: 12,
    duration: "52m",
    genre: "Jazz",
    createdAt: "Yesterday",
  },
  {
    id: "3",
    title: "Vinyl Classics Mix",
    trackCount: 24,
    duration: "2h 10m",
    genre: "Various",
    createdAt: "3 days ago",
  },
];

type CreatorMode = "ai" | "manual";

export default function HomePage() {
  const [mode, setMode] = useState<CreatorMode>("ai");
  const [prompt, setPrompt] = useState("");
  const [playlistName, setPlaylistName] = useState("");

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero prompt section */}
      <section
        className="flex flex-1 flex-col items-center justify-center py-16 md:py-24"
        aria-labelledby="hero-heading"
      >
        {/* Mode toggle */}
        <div className="relative mb-6 flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#141414]">
          <motion.div
            className="absolute inset-y-0.5 rounded-full bg-primary"
            initial={false}
            animate={{
              x: mode === "ai" ? 0 : "100%",
              width: "calc(50% - 2px)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{ left: 2 }}
          />
          <button
            type="button"
            onClick={() => setMode("ai")}
            className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              mode === "ai"
                ? "text-white"
                : "text-[#525252] hover:text-[#9ca3af]"
            }`}
          >
            <Wand2 className="h-3" aria-hidden="true" />
            AI
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`relative z-10 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              mode === "manual"
                ? "text-white"
                : "text-[#525252] hover:text-[#9ca3af]"
            }`}
          >
            <PenLine className="h-3" aria-hidden="true" />
            Manual
          </button>
        </div>

        {/* Animated heading */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={mode}
            id="hero-heading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mb-8 text-center font-heading text-3xl font-bold tracking-tight text-white md:text-5xl"
          >
            {mode === "ai" ? (
              <>
                What do you want
                <br />
                to listen to?
              </>
            ) : (
              <>
                Create your
                <br />
                playlist
              </>
            )}
          </motion.h1>
        </AnimatePresence>

        {/* Input section */}
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
              aria-label={
                mode === "ai"
                  ? "Create playlist with AI"
                  : "Create playlist manually"
              }
            >
              <div className="flex items-center gap-3 rounded-full border border-[#2a2a2a] bg-[#0a0a0a] py-2 pl-5 pr-2 transition-colors focus-within:border-[#404040]">
                {mode === "ai" ? (
                  <Search
                    className="h-5 w-5 shrink-0 text-[#525252]"
                    aria-hidden="true"
                  />
                ) : (
                  <PenLine
                    className="h-5 w-5 shrink-0 text-[#525252]"
                    aria-hidden="true"
                  />
                )}
                <Input
                  type="text"
                  value={mode === "ai" ? prompt : playlistName}
                  onChange={(e) =>
                    mode === "ai"
                      ? setPrompt(e.target.value)
                      : setPlaylistName(e.target.value)
                  }
                  placeholder={
                    mode === "ai"
                      ? "e.g., Late night drive through the city..."
                      : "My awesome playlist..."
                  }
                  className="h-auto flex-1 border-0 bg-transparent p-0 text-base text-white placeholder:text-[#525252] shadow-none focus-visible:ring-0 dark:bg-transparent"
                  aria-label={
                    mode === "ai" ? "Playlist prompt" : "Playlist name"
                  }
                />
                <Button
                  type="submit"
                  className="shrink-0 gap-2 rounded-full bg-primary px-5 text-white hover:bg-primary/90"
                >
                  Create
                  {mode === "ai" && (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Start with an idea */}
        <p
          className={`mt-6 text-xs font-medium uppercase tracking-widest transition-opacity duration-200 ${
            mode === "ai" ? "text-[#525252]" : "text-[#525252]/30"
          }`}
        >
          Start with an idea
        </p>

        {/* Suggestion chips */}
        <div
          className={`mt-3 flex flex-wrap items-center justify-center gap-2 transition-opacity duration-200 ${
            mode === "ai" ? "opacity-100" : "pointer-events-none opacity-30"
          }`}
        >
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setPrompt(s.prompt)}
              disabled={mode !== "ai"}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-transparent px-3.5 py-2 text-sm text-[#9ca3af] transition-colors hover:border-[#404040] hover:text-white disabled:cursor-not-allowed"
            >
              <s.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
      </section>

      {/* Recent playlists */}
      <section className="pb-12" aria-labelledby="recent-heading">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            <h2
              id="recent-heading"
              className="font-heading text-lg font-semibold text-white"
            >
              Recent playlists
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#525252] hover:text-white"
            asChild
          >
            <Link href="/playlists">View all</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {recentPlaylists.map((playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4 transition-colors hover:border-[#404040]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {playlist.title}
                </p>
                <p className="mt-0.5 text-xs text-[#525252]">
                  {playlist.trackCount} tracks
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <Badge
                  variant="secondary"
                  className="border-[#2a2a2a] bg-[#1a1a1a] text-[#9ca3af]"
                >
                  {playlist.genre}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-[#525252]">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {playlist.duration}
                </span>
              </div>
              <span className="text-xs text-[#525252]">
                {playlist.createdAt}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
