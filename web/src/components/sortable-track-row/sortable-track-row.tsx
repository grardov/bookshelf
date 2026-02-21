"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TrackRow, type TrackRowProps } from "@/components/track-row";

export interface SortableTrackRowProps extends TrackRowProps {
  /** Show a drop indicator line above this row */
  isDropIndicatorAbove?: boolean;
  /** Show a drop indicator line below this row */
  isDropIndicatorBelow?: boolean;
}

export function SortableTrackRow({
  id,
  isDropIndicatorAbove,
  isDropIndicatorBelow,
  ...props
}: SortableTrackRowProps) {
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
    <TrackRow
      id={id}
      {...props}
      isDragging={isDragging}
      isDropIndicatorAbove={isDropIndicatorAbove}
      isDropIndicatorBelow={isDropIndicatorBelow}
      dragListeners={listeners}
      dragAttributes={attributes}
      dragRef={setNodeRef}
      dragStyle={style}
    />
  );
}
