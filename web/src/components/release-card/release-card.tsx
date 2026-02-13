import Image from "next/image";
import Link from "next/link";
import { Disc3 } from "lucide-react";

export interface ReleaseCardProps {
  id: string;
  title: string;
  artist: string;
  year?: number | string | null;
  genre?: string;
  format?: string;
  coverUrl?: string | null;
}

export function ReleaseCard({
  id,
  title,
  artist,
  year,
  genre,
  format,
  coverUrl,
}: ReleaseCardProps) {
  return (
    <Link href={`/collection/${id}`} className="block">
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
            unoptimized
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
        {format && (
          <span className="mt-1.5 inline-block rounded-full border border-[#2a2a2a] bg-[#0a0a0a] px-2 py-0.5 text-[10px] text-[#9ca3af]">
            {format}
          </span>
        )}
      </div>
      </article>
    </Link>
  );
}
