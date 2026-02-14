import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { SortableTrackRow } from "./sortable-track-row";

function renderWithDndContext(ui: React.ReactElement) {
  return render(
    <DndContext>
      <SortableContext items={["track-1"]}>{ui}</SortableContext>
    </DndContext>
  );
}

describe("SortableTrackRow", () => {
  const defaultProps = {
    id: "track-1",
    title: "Test Track",
    artist: "Test Artist",
    duration: "5:42",
  };

  it("renders track information", () => {
    renderWithDndContext(<SortableTrackRow {...defaultProps} />);

    expect(screen.getByText("Test Track")).toBeInTheDocument();
    expect(screen.getByText("Test Artist")).toBeInTheDocument();
    expect(screen.getByText("5:42")).toBeInTheDocument();
  });

  it("renders drag handle with correct aria label", () => {
    renderWithDndContext(<SortableTrackRow {...defaultProps} />);

    expect(screen.getByLabelText("Drag to reorder")).toBeInTheDocument();
  });

  it("renders position when provided", () => {
    renderWithDndContext(<SortableTrackRow {...defaultProps} position={3} />);

    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("renders track position (vinyl position) when provided", () => {
    renderWithDndContext(
      <SortableTrackRow {...defaultProps} position={1} trackPosition="A1" />
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("01")).toBeInTheDocument();
  });

  it("renders cover image when coverUrl is provided", () => {
    renderWithDndContext(
      <SortableTrackRow
        {...defaultProps}
        coverUrl="https://example.com/cover.jpg"
      />
    );

    const img = screen.getByRole("img");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src");
  });

  it("renders menu items when provided", () => {
    const menuItems = [
      { label: "Remove", onClick: () => {} },
      { label: "View release", onClick: () => {} },
    ];

    renderWithDndContext(
      <SortableTrackRow {...defaultProps} menuItems={menuItems} />
    );

    // Menu trigger should be present
    expect(
      screen.getByLabelText(`More options for ${defaultProps.title}`)
    ).toBeInTheDocument();
  });
});
