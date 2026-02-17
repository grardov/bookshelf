import { describe, it, expect } from "vitest";
import { createMetadata } from "./metadata";

describe("createMetadata", () => {
  it("creates metadata with required fields", () => {
    const metadata = createMetadata({
      title: "Collection",
      description: "Browse your vinyl collection",
    });

    expect(metadata.title).toBe("Collection");
    expect(metadata.description).toBe("Browse your vinyl collection");
  });

  it("generates OpenGraph metadata", () => {
    const metadata = createMetadata({
      title: "Collection",
      description: "Browse your vinyl collection",
    });

    expect(metadata.openGraph).toEqual({
      title: "Collection | Bookshelf",
      description: "Browse your vinyl collection",
      url: expect.stringContaining("/"),
      siteName: "Bookshelf",
      type: "website",
    });
  });

  it("generates Twitter metadata", () => {
    const metadata = createMetadata({
      title: "Playlists",
      description: "Manage your playlists",
    });

    expect(metadata.twitter).toEqual({
      card: "summary_large_image",
      title: "Playlists | Bookshelf",
      description: "Manage your playlists",
    });
  });

  it("uses default path when not specified", () => {
    const metadata = createMetadata({
      title: "Home",
      description: "Welcome",
    });

    expect(metadata.alternates?.canonical).toContain("/");
  });

  it("appends custom path to base URL", () => {
    const metadata = createMetadata({
      title: "Settings",
      description: "App settings",
      path: "/settings",
    });

    expect(metadata.alternates?.canonical).toContain("/settings");
    expect(metadata.openGraph).toHaveProperty(
      "url",
      expect.stringContaining("/settings")
    );
  });
});
