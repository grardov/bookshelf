import Image from "next/image";
import { Disc3 } from "lucide-react";

export interface SearchResultRowProps {
  id: number;
  title: string;
  year: number | null;
  coverImage: string | null;
  format: string | null;
  label: string | null;
  active?: boolean;
  dataIndex?: number;
  onClick: () => void;
}

export function SearchResultRow({
  id,
  title,
  year,
  coverImage,
  format,
  label,
  active,
  dataIndex,
  onClick,
}: SearchResultRowProps) {
  return (
    <button
      type="button"
      role="option"
      id={`search-option-${id}`}
      aria-selected={active}
      data-index={dataIndex}
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors hover:border-[#2a2a2a] hover:bg-[#141414] ${active ? "border-[#2a2a2a] bg-[#141414]" : ""}`}
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[#1a1a1a]">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            width={48}
            height={48}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Disc3 className="h-5 w-5 text-[#2a2a2a]" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{title}</p>
        <div className="flex items-center gap-1.5 text-xs text-[#525252]">
          {year && <span>{year}</span>}
          {year && format && <span>&middot;</span>}
          {format && <span className="truncate">{format}</span>}
          {(year || format) && label && <span>&middot;</span>}
          {label && <span className="truncate">{label}</span>}
        </div>
      </div>
    </button>
  );
}
