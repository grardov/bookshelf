"use client";

import Image from "next/image";
import { Play, MoreHorizontal, Disc3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TrackRowProps {
  id: string;
  position?: number;
  title: string;
  artist: string;
  album?: string;
  duration: string;
  bpm?: number;
  coverUrl?: string;
  onPlay?: (id: string) => void;
  menuItems?: { label: string; onClick: () => void; destructive?: boolean }[];
}

export function TrackRow({
  id,
  position,
  title,
  artist,
  album,
  duration,
  bpm,
  coverUrl,
  onPlay,
  menuItems,
}: TrackRowProps) {
  const hasMenu = menuItems && menuItems.length > 0;

  return (
    <li className="group flex items-center gap-4 rounded-md px-3 py-2.5 transition-colors hover:bg-[#141414]">
      {/* Position / Play button */}
      {position !== undefined && (
        <span className="w-8 text-center text-sm text-[#525252]">
          <span className="group-hover:hidden">
            {String(position).padStart(2, "0")}
          </span>
          <button
            type="button"
            onClick={() => onPlay?.(id)}
            className="hidden group-hover:block"
            aria-label={`Play ${title}`}
          >
            <Play
              className="mx-auto h-4 w-4 text-primary"
              aria-hidden="true"
            />
          </button>
        </span>
      )}

      {/* Cover */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-[#1a1a1a]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={album ? `Cover for ${album}` : `Cover for ${title}`}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[#525252]"
            aria-label={album ? `Cover for ${album}` : `Cover for ${title}`}
          >
            <Disc3 className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="truncate text-xs text-[#525252]">{artist}</p>
      </div>

      {/* Album (desktop only) */}
      {album && (
        <span className="hidden w-40 truncate text-sm text-[#525252] md:block">
          {album}
        </span>
      )}

      {/* BPM (desktop only) */}
      {bpm !== undefined && (
        <span className="hidden w-14 text-center text-sm text-[#525252] md:block">
          {bpm}
        </span>
      )}

      {/* Duration */}
      <span className="w-14 text-right text-sm text-[#525252]">{duration}</span>

      {/* Actions menu */}
      <div className="w-10">
        {hasMenu && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#525252] opacity-0 hover:text-white group-hover:opacity-100"
                aria-label={`More options for ${title}`}
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {menuItems.map((item) => (
                <DropdownMenuItem
                  key={item.label}
                  onClick={item.onClick}
                  className={item.destructive ? "text-destructive" : undefined}
                >
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}

export interface TrackListHeaderProps {
  showAlbum?: boolean;
  showBpm?: boolean;
}

export function TrackListHeader({
  showAlbum = true,
  showBpm = true,
}: TrackListHeaderProps) {
  return (
    <>
      <div
        className="hidden items-center gap-4 px-3 py-2 text-xs font-medium uppercase tracking-wide text-[#525252] md:flex"
        aria-hidden="true"
      >
        <span className="w-8 text-center">#</span>
        <span className="w-10" />
        <span className="flex-1">Title</span>
        {showAlbum && <span className="w-40">Album</span>}
        {showBpm && <span className="w-14 text-center">BPM</span>}
        <span className="w-14 text-right">
          <svg
            className="ml-auto h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
            <polyline points="12 6 12 12 16 14" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="w-10" />
      </div>
    </>
  );
}
