import Image from "next/image";
import { Disc3, Trash2 } from "lucide-react";

export interface ReleaseCardProps {
  id: string;
  title: string;
  artist: string;
  year?: string;
  genre?: string;
  format?: "vinyl" | "cd" | "cassette";
  coverUrl?: string;
  onDelete?: (id: string) => void;
}

export function ReleaseCard({
  id,
  title,
  artist,
  year,
  genre,
  format = "vinyl",
  coverUrl,
  onDelete,
}: ReleaseCardProps) {
  return (
    <article className="group relative flex flex-col rounded-lg border border-[#2a2a2a] bg-[#141414] p-3 transition-colors hover:border-[#404040]">
      {/* Album art */}
      <div className="mb-3 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-[#1a1a1a]">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${title} by ${artist}`}
            width={200}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <Disc3 className="h-10 w-10 text-[#2a2a2a]" aria-hidden="true" />
        )}
      </div>

      {/* Album info */}
      <div className="flex-1">
        <h3 className="truncate text-sm font-medium text-white">{title}</h3>
        <p className="truncate text-xs text-[#9ca3af]">{artist}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[#525252]">
          {year && <span>{year}</span>}
          {year && genre && <span>&middot;</span>}
          {genre && <span>{genre}</span>}
        </div>
        <span className="mt-1.5 inline-block rounded-full border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-0.5 text-[10px] capitalize text-[#9ca3af]">
          {format}
        </span>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#0a0a0a]/80 text-[#525252] opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
          aria-label={`Delete ${title}`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </article>
  );
}
