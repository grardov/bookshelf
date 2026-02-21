"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Disc3 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDrag } from "@use-gesture/react";
import { Button } from "@/components/ui/button";
import type { PlaylistWithTracks } from "@/lib/api/playlists";

interface PlayViewProps {
  playlist: PlaylistWithTracks;
}

export function PlayView({ playlist }: PlayViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const tracks = playlist.tracks;
  const currentTrack = tracks[currentIndex];
  const nextTrack = tracks[currentIndex + 1] ?? null;

  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < tracks.length - 1;

  const goToPrev = () => {
    if (canGoPrev) setCurrentIndex((i) => i - 1);
  };

  const goToNext = () => {
    if (canGoNext) setCurrentIndex((i) => i + 1);
  };

  const bind = useDrag(
    ({ swipe: [swipeX], tap }) => {
      if (tap) return;
      if (swipeX === -1) goToNext();
      if (swipeX === 1) goToPrev();
    },
    { swipe: { distance: 50 } },
  );

  return (
    <div className="flex min-h-svh flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#9ca3af] hover:text-white"
            onClick={() => window.close()}
            aria-label="Close player"
          >
            <X className="h-5 w-5" />
          </Button>
          <h1 className="max-w-50 truncate text-sm font-medium text-white md:max-w-100">
            {playlist.name}
          </h1>
        </div>
        <span className="text-sm text-[#9ca3af]">
          {currentIndex + 1} of {tracks.length}
        </span>
      </header>

      {/* Main content */}
      <main
        {...bind()}
        className="flex flex-1 flex-col md:flex-row md:items-center md:gap-8 md:px-8 lg:gap-16 lg:px-16"
        style={{ touchAction: "pan-y" }}
      >
        {/* Cover art — left on desktop, top on mobile */}
        <div className="relative flex items-center justify-center px-8 py-4 md:w-[45%] md:px-0 md:py-0 lg:w-[50%]">
          {/* Blurred glow behind cover */}
          <AnimatePresence mode="wait">
            {currentTrack.cover_image_url && (
              <motion.img
                key={`glow-${currentIndex}`}
                src={currentTrack.cover_image_url}
                alt=""
                aria-hidden="true"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="pointer-events-none absolute aspect-square w-full max-w-70 scale-125 rounded-full object-cover blur-3xl md:max-w-100"
              />
            )}
          </AnimatePresence>

          {/* Actual cover */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`cover-${currentIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="relative aspect-square w-full max-w-70 overflow-hidden rounded-lg shadow-2xl shadow-black/50 md:max-w-100"
            >
              {currentTrack.cover_image_url ? (
                <Image
                  src={currentTrack.cover_image_url}
                  alt={
                    currentTrack.release_title
                      ? `Cover for ${currentTrack.release_title}`
                      : `Cover for ${currentTrack.title}`
                  }
                  width={400}
                  height={400}
                  className="h-full w-full object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a] text-[#525252]">
                  <Disc3 className="h-20 w-20" aria-hidden="true" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Track info + controls — right on desktop, bottom on mobile */}
        <div className="flex flex-1 flex-col px-6 pb-4 md:w-[55%] md:px-0 md:pb-0 lg:w-[50%]">
          {/* Now Playing */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`info-${currentIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              <p className="text-xs font-medium uppercase tracking-wider text-[#9ca3af]">
                Now Playing
              </p>
              <h2 className="font-heading text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                {currentTrack.title}
              </h2>
              <p className="text-lg text-[#9ca3af] md:text-xl">
                {currentTrack.artist}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-sm text-[#525252]">
                {currentTrack.position && (
                  <span>
                    Side{" "}
                    <span className="font-medium text-[#9ca3af]">
                      {currentTrack.position}
                    </span>
                  </span>
                )}
                {currentTrack.release_title && (
                  <span className="truncate">{currentTrack.release_title}</span>
                )}
                {currentTrack.duration && <span>{currentTrack.duration}</span>}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          <div className="mt-8 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] disabled:opacity-30"
              disabled={!canGoPrev}
              onClick={goToPrev}
              aria-label="Previous track"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full border-[#2a2a2a] bg-transparent text-white hover:bg-[#1a1a1a] disabled:opacity-30"
              disabled={!canGoNext}
              onClick={goToNext}
              aria-label="Next track"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          {/* Next Up */}
          <div className="mt-8 md:pb-8">
            {nextTrack ? (
              <div className="rounded-lg bg-white/5 p-4">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[#525252]">
                  Next Up
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-[#1a1a1a]">
                    {nextTrack.cover_image_url ? (
                      <Image
                        src={nextTrack.cover_image_url}
                        alt={
                          nextTrack.release_title
                            ? `Cover for ${nextTrack.release_title}`
                            : `Cover for ${nextTrack.title}`
                        }
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#525252]">
                        <Disc3 className="h-5 w-5" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {nextTrack.title}
                    </p>
                    <p className="truncate text-xs text-[#9ca3af]">
                      {nextTrack.artist}
                      {nextTrack.position && ` \u00B7 ${nextTrack.position}`}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-white/5 p-4">
                <p className="text-sm text-[#525252]">End of playlist</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
