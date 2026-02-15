import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader, CanvasTexture, LinearFilter, ClampToEdgeWrapping } from "three";

interface AtlasMetadata {
  atlas: CanvasTexture;
  cols: number;
  rows: number;
  uniqueCount: number;
  /** Maps original image index to atlas tile index */
  indexMap: number[];
}

export function useTextureAtlas(images: string[]): AtlasMetadata {
  // Deduplicate images
  const uniqueImages = useMemo(() => Array.from(new Set(images)), [images]);

  // Build index map: for each image in the original array, which atlas tile?
  const indexMap = useMemo(() => {
    return images.map((img) => uniqueImages.indexOf(img));
  }, [images, uniqueImages]);

  // Load unique textures
  const textures = useLoader(TextureLoader, uniqueImages);

  const { atlas, cols, rows } = useMemo(() => {
    const count = uniqueImages.length;
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);

    // Each tile size — use the first texture's natural dimensions
    const tileW = textures[0]?.image?.width || 512;
    const tileH = textures[0]?.image?.height || 512;
    const padding = 2;

    const canvasW = cols * (tileW + padding);
    const canvasH = rows * (tileH + padding);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(canvasW, canvasH)
        : document.createElement("canvas");

    if ("width" in canvas) {
      canvas.width = canvasW;
      canvas.height = canvasH;
    }

    const ctx = canvas.getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D;

    if (ctx) {
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = col * (tileW + padding);
        const y = row * (tileH + padding);
        const img = textures[i]?.image;
        if (img) {
          ctx.drawImage(img, x, y, tileW, tileH);
        }
      }
    }

    const atlasTexture = new CanvasTexture(canvas as HTMLCanvasElement);
    atlasTexture.minFilter = LinearFilter;
    atlasTexture.magFilter = LinearFilter;
    atlasTexture.wrapS = ClampToEdgeWrapping;
    atlasTexture.wrapT = ClampToEdgeWrapping;
    atlasTexture.needsUpdate = true;

    return { atlas: atlasTexture, cols, rows };
  }, [textures, uniqueImages]);

  return { atlas, cols, rows, uniqueCount: uniqueImages.length, indexMap };
}
