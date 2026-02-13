import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface PlaylistCardProps {
  id: string;
  title: string;
  trackCount: number;
  duration: string;
  genre?: string;
  createdAt: string;
}

export function PlaylistCard({
  id,
  title,
  trackCount,
  duration,
  genre,
  createdAt,
}: PlaylistCardProps) {
  return (
    <Link
      href={`/playlists/${id}`}
      className="flex items-center gap-4 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4 transition-colors hover:border-[#404040]"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <p className="mt-0.5 text-xs text-[#525252]">{trackCount} tracks</p>
      </div>
      <div className="hidden items-center gap-3 sm:flex">
        {genre && (
          <Badge
            variant="secondary"
            className="border-[#2a2a2a] bg-[#1a1a1a] text-[#9ca3af]"
          >
            {genre}
          </Badge>
        )}
        <span className="flex items-center gap-1 text-xs text-[#525252]">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {duration}
        </span>
      </div>
      <span className="text-xs text-[#525252]">{createdAt}</span>
    </Link>
  );
}
