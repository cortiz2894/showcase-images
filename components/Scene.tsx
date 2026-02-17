"use client";

import { useState, useCallback, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import PostProcessing from "./PostProcessing";
import CameraController from "./CameraController";
import CylindricalGallery, { CylindricalGalleryHandle } from "./CylindricalGallery";
import BackgroundGrid from "./BackgroundGrid";
import { useVirtualScroll } from "./CylindricalGallery/useVirtualScroll";
import PresetSelector from "./PresetSelector";
import WireframeTorus from "./WireframeTorus";
import { Leva } from "leva";

const LEVA_THEME = {
  colors: {
    elevation1: '#0a0a0a',
    elevation2: '#141414',
    elevation3: '#1e1e1e',
    accent1: '#f5f2ed',
    accent2: '#3a3836',
    accent3: '#3a3836',
    highlight1: '#f5f2ed',
    highlight2: 'rgba(245,242,237,0.6)',
    highlight3: 'rgba(245,242,237,0.3)',
    vivid1: '#f5f2ed',
  },
  fonts: {
    mono: "'IBM Plex Mono', monospace",
    sans: "'IBM Plex Mono', monospace",
  },
  sizes: {
    titleBarHeight: '28px',
  },
  fontSizes: {
    root: '10px',
  },
  borderWidths: {
    root: '1px',
    input: '1px',
    focus: '1px',
    hover: '1px',
    active: '1px',
    folder: '1px',
  },
  radii: {
    xs: '1px',
    sm: '2px',
    lg: '2px',
  },
}

interface GallerySceneProps {
  avatars: string[];
}

function SceneContent({
  avatars,
  preset,
  shapeVisible,
  debugMode,
  galleryRef,
}: GallerySceneProps & {
  preset: string;
  shapeVisible: boolean;
  debugMode: string;
  galleryRef: React.Ref<CylindricalGalleryHandle>;
}) {
  const { scrollOffset, scrollVelocity, frictionRef, update } = useVirtualScroll(0.95);
  const isDebug = debugMode !== "none";

  return (
    <>
      {!isDebug && <BackgroundGrid />}
      <CameraController scrollVelocity={scrollVelocity} />
      {!isDebug && shapeVisible && <WireframeTorus scrollVelocity={scrollVelocity} />}
      <CylindricalGallery
        ref={galleryRef}
        images={avatars}
        scrollVelocity={scrollVelocity}
        scrollOffset={scrollOffset}
        frictionRef={frictionRef}
        updateScroll={update}
        preset={preset}
        debugMode={debugMode}
      />
      {!isDebug && <PostProcessing preset={preset} />}
    </>
  );
}

export default function Scene({ avatars }: GallerySceneProps) {
  const [preset, setPreset] = useState("greenScifi");
  const [shapeVisible, setShapeVisible] = useState(true);
  const [levaHidden, setLevaHidden] = useState(true);
  const [debugMode, setDebugMode] = useState("none");
  const galleryRef = useRef<CylindricalGalleryHandle>(null);

  const toggleShape = useCallback(() => setShapeVisible((v) => !v), []);
  const toggleLeva = useCallback(() => setLevaHidden((v) => !v), []);

  const handleDebugChange = useCallback((mode: string) => {
    setDebugMode((prev) => (prev === mode ? "none" : mode));
  }, []);

  const handleAtlasDownload = useCallback(() => {
    galleryRef.current?.downloadAtlas();
  }, []);

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
        <SceneContent
          avatars={avatars}
          preset={preset}
          shapeVisible={shapeVisible}
          debugMode={debugMode}
          galleryRef={galleryRef}
        />
      </Canvas>
      <Leva hidden={levaHidden} theme={LEVA_THEME} />
      <PresetSelector
        active={preset}
        onChange={setPreset}
        shapeVisible={shapeVisible}
        onToggleShape={toggleShape}
        levaHidden={levaHidden}
        onToggleLeva={toggleLeva}
        debugMode={debugMode}
        onDebugChange={handleDebugChange}
        onAtlasDownload={handleAtlasDownload}
      />
    </div>
  );
}
