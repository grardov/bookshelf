"use client";

import { useState, useEffect } from "react";

/**
 * Extract the dominant color from an image URL using the Canvas API.
 *
 * Draws the image to a tiny offscreen canvas (10x10) and computes the
 * average color, skipping near-black and near-white pixels for a more
 * representative result.
 *
 * @param imageUrl - URL of the image to extract from (must support CORS)
 * @returns `{ color, isLoading }` — color is an `rgb(r, g, b)` string or null
 */
export function useDominantColor(imageUrl: string | null | undefined) {
  const [color, setColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting derived state when input clears
      setColor(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;

      try {
        const canvas = document.createElement("canvas");
        const size = 10;
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const data = imageData.data;

        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip near-black and near-white pixels
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 235) continue;

          rTotal += r;
          gTotal += g;
          bTotal += b;
          count++;
        }

        if (count > 0) {
          const avgR = Math.round(rTotal / count);
          const avgG = Math.round(gTotal / count);
          const avgB = Math.round(bTotal / count);
          setColor(`rgb(${avgR}, ${avgG}, ${avgB})`);
        } else {
          // All pixels were near-black/white — use a muted fallback
          setColor(null);
        }
      } catch {
        setColor(null);
      }

      setIsLoading(false);
    };

    img.onerror = () => {
      if (cancelled) return;
      setColor(null);
      setIsLoading(false);
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return { color, isLoading };
}
