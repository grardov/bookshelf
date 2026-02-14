"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { TrackRow, type TrackRowProps } from "@/components/track-row";

export type SortableTrackRowProps = TrackRowProps;

export function SortableTrackRow({ id, ...props }: SortableTrackRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/sortable relative flex items-center ${
        isDragging ? "z-50 opacity-80" : ""
      }`}
    >
      {/* Drag handle - always visible */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#525252] transition-colors hover:text-white cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="w-full">
        <TrackRow id={id} {...props} />
      </div>
    </div>
  );
}
