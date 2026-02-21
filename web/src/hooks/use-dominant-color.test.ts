import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDominantColor } from "./use-dominant-color";

describe("useDominantColor", () => {
  it("returns null color when imageUrl is null", () => {
    const { result } = renderHook(() => useDominantColor(null));

    expect(result.current.color).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("returns null color when imageUrl is undefined", () => {
    const { result } = renderHook(() => useDominantColor(undefined));

    expect(result.current.color).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("sets isLoading when given an image URL", () => {
    const { result } = renderHook(() =>
      useDominantColor("https://example.com/image.jpg"),
    );

    // Initially loading is set to true when an image URL is provided
    expect(result.current.isLoading).toBe(true);
  });

  it("resets color when imageUrl changes to null", () => {
    const { result, rerender } = renderHook(
      ({ url }: { url: string | null }) => useDominantColor(url),
      { initialProps: { url: "https://example.com/image.jpg" } },
    );

    rerender({ url: null });

    expect(result.current.color).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
