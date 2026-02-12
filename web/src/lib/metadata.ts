import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://bookshelf.app";

interface CreateMetadataOptions {
  title: string;
  description: string;
  path?: string;
}

export function createMetadata({
  title,
  description,
  path = "/",
}: CreateMetadataOptions): Metadata {
  const url = `${BASE_URL}${path}`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Bookshelf`,
      description,
      url,
      siteName: "Bookshelf",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Bookshelf`,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}
