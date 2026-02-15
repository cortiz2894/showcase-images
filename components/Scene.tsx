"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import PostProcessing from "./PostProcessing";
import CameraController from "./CameraController";
import CylindricalGallery from "./CylindricalGallery";
import BackgroundGrid from "./BackgroundGrid";
import { useVirtualScroll } from "./CylindricalGallery/useVirtualScroll";
import PresetSelector from "./PresetSelector";

interface GallerySceneProps {
  avatars: string[];
}

function SceneContent({ avatars, preset }: GallerySceneProps & { preset: string }) {
  const { scrollOffset, scrollVelocity, frictionRef, update } = useVirtualScroll(0.95);

  return (
    <>
      <BackgroundGrid />
      <CameraController scrollVelocity={scrollVelocity} />
      <CylindricalGallery
        images={avatars}
        scrollVelocity={scrollVelocity}
        scrollOffset={scrollOffset}
        frictionRef={frictionRef}
        updateScroll={update}
        preset={preset}
      />
      <PostProcessing preset={preset} />
    </>
  );
}

export default function Scene({ avatars }: GallerySceneProps) {
  const [preset, setPreset] = useState("default");

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <Canvas camera={{ fov: 75, position: [0, 0, 12], rotation: [0, 0, 0] }}>
        <SceneContent avatars={avatars} preset={preset} />
      </Canvas>
      <PresetSelector active={preset} onChange={setPreset} />
    </div>
  );
}
