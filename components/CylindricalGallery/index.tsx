"use client";

import { useRef, useMemo, useEffect, useImperativeHandle, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "./cylinderShader";
import { useTextureAtlas } from "./useTextureAtlas";
import {
  RADIUS,
  PLANE_WIDTH,
  PLANE_HEIGHT,
  PLANE_SEGMENTS_X,
  PLANE_SEGMENTS_Y,
  NUM_INSTANCES,
  IMAGES_PER_TURN,
  SPIRAL_STEP,
} from "./constants";
import { PRESETS } from "../PresetSelector/presets";

interface CylindricalGalleryProps {
  images: string[];
  scrollVelocity: React.MutableRefObject<number>;
  scrollOffset: React.MutableRefObject<number>;
  frictionRef: React.MutableRefObject<number>;
  updateScroll: () => void;
  preset: string;
  debugMode: string;
}

export interface CylindricalGalleryHandle {
  downloadAtlas: () => void;
}

const CylindricalGallery = forwardRef<CylindricalGalleryHandle, CylindricalGalleryProps>(function CylindricalGallery({
  images,
  scrollVelocity,
  scrollOffset,
  frictionRef,
  updateScroll,
  preset,
  debugMode,
}, ref) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { atlas, cols, rows, uniqueCount, indexMap, atlasCanvasRef } =
    useTextureAtlas(images);

  useImperativeHandle(ref, () => ({
    downloadAtlas() {
      const canvas = atlasCanvasRef.current;
      if (!canvas) return;
      let dataUrl: string;
      if (canvas instanceof HTMLCanvasElement) {
        dataUrl = canvas.toDataURL("image/png");
      } else {
        // OffscreenCanvas: convert via blob synchronously is not possible,
        // so we draw it onto a regular canvas
        const tmp = document.createElement("canvas");
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        const ctx = tmp.getContext("2d")!;
        ctx.drawImage(canvas as unknown as ImageBitmap, 0, 0);
        dataUrl = tmp.toDataURL("image/png");
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "texture-atlas.png";
      a.click();
    },
  }), [atlasCanvasRef]);

  // Leva controls
  const { imageScale, radius, spiralStep, imagesPerTurn, curvature } =
    useControls("Gallery", {
      imageScale: { value: 0.83, min: 0.3, max: 2, step: 0.01, label: "Image Size" },
      radius: { value: RADIUS, min: 1, max: 10, step: 0.1, label: "Radius" },
      spiralStep: { value: SPIRAL_STEP, min: 0.3, max: 5, step: 0.05, label: "Spiral Step" },
      imagesPerTurn: { value: IMAGES_PER_TURN, min: 2, max: 10, step: 1, label: "Images / Turn" },
      curvature: { value: 1.5, min: 0.5, max: 4, step: 0.05, label: "Curvature" },
    });

  const { autoRotateSpeed, scrollRotateForce, maxRotationSpeed, rotationSmoothing, scrollAdvanceSpeed, momentum } =
    useControls("Motion", {
      momentum: { value: 0.87, min: 0.5, max: 0.99, step: 0.01, label: "Momentum" },
      scrollAdvanceSpeed: { value: 0.17, min: 0, max: 2, step: 0.01, label: "Scroll Advance Speed" },
      autoRotateSpeed: { value: 0.002, min: 0, max: 0.02, step: 0.0005, label: "Auto-rotate Speed" },
      scrollRotateForce: { value: 1.75, min: 0, max: 5, step: 0.05, label: "Scroll Rotate Force" },
      maxRotationSpeed: { value: 0.15, min: 0.005, max: 0.2, step: 0.005, label: "Max Rotation Speed" },
      rotationSmoothing: { value: 0.09, min: 0.005, max: 0.2, step: 0.005, label: "Rotation Smoothing" },
    });

  const { squeezeMax, squeezeWidth, chromaticAberration, opacity, emission, saturation, brightness, scanLines, scanLineSpeed, scanLineDensity, distanceFadeStart, distanceFadeEnd, flickerIntensity, flickerSpeed } =
    useControls("Effects", {
      squeezeMax: { value: 0.50, min: 0, max: 0.8, step: 0.01, label: "Squeeze Intensity" },
      squeezeWidth: { value: 7.5, min: 1, max: 15, step: 0.5, label: "Squeeze Width" },
      chromaticAberration: { value: 0.02, min: 0, max: 0.15, step: 0.005, label: "Chromatic Aberration" },
      opacity: { value: 1, min: 0, max: 1, step: 0.01, label: "Opacity" },
      emission: { value: 0.65, min: 0, max: 3, step: 0.05, label: "Emission" },
      saturation: { value: 1.50, min: 0, max: 3, step: 0.05, label: "Saturation" },
      brightness: { value: 1.15, min: 0.2, max: 3, step: 0.05, label: "Brightness" },
      scanLines: { value: 0.6, min: 0, max: 1, step: 0.05, label: "Scan Lines" },
      scanLineSpeed: { value: 3.9, min: 0, max: 5, step: 0.1, label: "Scan Speed" },
      scanLineDensity: { value: 25, min: 5, max: 100, step: 1, label: "Scan Density" },
      distanceFadeStart: { value: 3, min: 0, max: 20, step: 0.5, label: "Fade Start" },
      distanceFadeEnd: { value: 8, min: 1, max: 30, step: 0.5, label: "Fade End" },
      flickerIntensity: { value: 0.18, min: 0, max: 1, step: 0.01, label: "Flicker" },
      flickerSpeed: { value: 5.0, min: 0.1, max: 5, step: 0.1, label: "Flicker Speed" },
    });

  const [{ borderWidth, borderColor, borderEmission, borderRadius, borderOffset }, setBorder] =
    useControls("Border", () => ({
      borderWidth: { value: 0.005, min: 0.005, max: 0.1, step: 0.005, label: "Width" },
      borderColor: { value: "#ffffff", label: "Color" },
      borderEmission: { value: 0, min: 0, max: 5, step: 0.1, label: "Glow" },
      borderRadius: { value: 0.0, min: 0, max: 0.25, step: 0.005, label: "Radius" },
      borderOffset: { value: 0.00, min: -0.1, max: 0.1, step: 0.005, label: "Offset" },
    }));

  const { cornerSize, cornerWidth, cornerOffset } =
    useControls("Corners", {
      cornerSize: { value: 0.06, min: 0.00, max: 0.4, step: 0.01, label: "Size" },
      cornerWidth: { value: 0.005, min: 0.005, max: 0.08, step: 0.005, label: "Width" },
      cornerOffset: { value: 0.03, min: -0.1, max: 0.15, step: 0.005, label: "Offset" },
    });

  const DITHER_MODE_MAP: Record<string, number> = {
    "Static (Flat)": 0, "Halftone": 1, "Inv Halftone": 2, "Rotation": 3,
    "Stretch V": 4, "Stretch H": 5, "Checkerboard": 6, "Glitch": 8,
    "Melt": 9, "Edge Detect": 10, "Quantize": 12, "Noise": 13, "Threshold": 15,
  };

  const DITHER_SHAPE_MAP: Record<string, number> = {
    "Circle": 0, "Square": 1, "Diamond": 2, "Hexagon": 3,
    "Rect V": 4, "Rect H": 5, "Diagonal": 6, "Octagon": 7,
    "Star": 8, "Hollow Rect": 9, "Plus": 10,
  };

  const [{ ditherEnabled, ditherCellSize, ditherGap, ditherContrast, ditherMode, ditherShape, ditherBaseScale, ditherIntensity, ditherBgColor, ditherUseColor, ditherFgColor }, setDither] =
    useControls("Dither", () => ({
      ditherEnabled: { value: true, label: "Enabled" },
      ditherCellSize: { value: 2, min: 0, max: 10, step: 1, label: "Cell Size" },
      ditherGap: { value: 2.75, min: 0, max: 20, step: 0.25, label: "Gap" },
      ditherContrast: { value: 0.0, min: -1, max: 1, step: 0.01, label: "Contrast" },
      ditherMode: { value: "Inv Halftone", options: Object.keys(DITHER_MODE_MAP), label: "Mode" },
      ditherShape: { value: "Circle", options: Object.keys(DITHER_SHAPE_MAP), label: "Shape" },
      ditherBaseScale: { value: 0.76, min: 0.1, max: 5.0, step: 0.01, label: "Base Scale" },
      ditherIntensity: { value: 2.61, min: 0, max: 5.0, step: 0.01, label: "Intensity" },
      ditherBgColor: { value: "#111111", label: "BG Color" },
      ditherUseColor: { value: true, label: "Use Image Color" },
      ditherFgColor: { value: "#ffffff", label: "FG Color" },
    }));

  useEffect(() => {
    const p = PRESETS[preset];
    if (p) {
      setBorder(p.border);
      setDither(p.dither);
    }
  }, [preset, setBorder, setDither]);

  // Global rotation state
  const rotation = useRef(0);
  const rotationSpeed = useRef(0.001);
  const smoothSqueeze = useRef(0);
  const lastScrollDirection = useRef(1);

  // Refs for dynamic instance attributes
  const angleOffsetsRef = useRef(new Float32Array(NUM_INSTANCES));
  const positionYsRef = useRef(new Float32Array(NUM_INSTANCES));

  // Static: texture indices
  const textureIndices = useMemo(() => {
    const arr = new Float32Array(NUM_INSTANCES);
    for (let i = 0; i < NUM_INSTANCES; i++) {
      arr[i] = indexMap[i] ?? 0;
    }
    return arr;
  }, [indexMap]);

  // Recompute spiral layout when Leva values change
  const totalHeight = NUM_INSTANCES * spiralStep;

  useMemo(() => {
    const startY = -(totalHeight / 2);
    for (let i = 0; i < NUM_INSTANCES; i++) {
      // Each image is evenly spaced around the cylinder in a helix
      angleOffsetsRef.current[i] = i * ((Math.PI * 2) / imagesPerTurn);
      positionYsRef.current[i] = startY + i * spiralStep;
    }
  }, [spiralStep, imagesPerTurn, totalHeight]);

  // Shader uniforms (created once, updated per-frame)
  const uniforms = useMemo(
    () => ({
      uDebugMode: { value: 0 },
      uRadius: { value: radius },
      uScrollOffset: { value: 0 },
      uTotalHeight: { value: totalHeight },
      uTime: { value: 0 },
      uScale: { value: 1 },
      uCurvature: { value: 1.5 },
      uRotation: { value: 0 },
      uSqueezeAmount: { value: 0 },
      uSqueezeWidth: { value: 12.0 },
      uChromaticAberration: { value: 0.01 },
      uOpacity: { value: 0.73 },
      uEmission: { value: 0.3 },
      uSaturation: { value: 1.1 },
      uBrightness: { value: 1.55 },
      uScanLines: { value: 0.25 },
      uScanLineSpeed: { value: 2.6 },
      uScanLineDensity: { value: 25.0 },
      uDistanceFadeStart: { value: 3.0 },
      uDistanceFadeEnd: { value: 8.0 },
      uFlickerIntensity: { value: 0.18 },
      uFlickerSpeed: { value: 5.0 },
      uAtlas: { value: atlas },
      uAtlasCols: { value: cols },
      uAtlasRows: { value: rows },
      uUniqueCount: { value: uniqueCount },
      uBorderWidth: { value: 0.01 },
      uBorderColor: { value: new THREE.Color("#ffffff") },
      uBorderEmission: { value: 1.2 },
      uBorderRadius: { value: 0.0 },
      uBorderOffset: { value: 0.0 },
      uCornerSize: { value: 0.06 },
      uCornerWidth: { value: 0.01 },
      uCornerOffset: { value: 0.03 },
      // Dither
      uDitherEnabled: { value: 0 },
      uDitherCellSize: { value: 5.0 },
      uDitherGap: { value: 3.5 },
      uDitherContrast: { value: 0.0 },
      uDitherMode: { value: 12 },
      uDitherShape: { value: 1 },
      uDitherBaseScale: { value: 0.6 },
      uDitherIntensity: { value: 2.61 },
      uDitherBgColor: { value: new THREE.Color("#111111") },
      uDitherFgColor: { value: new THREE.Color("#ffffff") },
      uDitherUseColor: { value: 1 },
      uDitherAspect: { value: PLANE_WIDTH / PLANE_HEIGHT },
    }),
    [atlas, cols, rows, uniqueCount, radius, totalHeight]
  );

  // Set identity instance matrices (positioning is done in the shader)
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Matrix4();
    for (let i = 0; i < NUM_INSTANCES; i++) {
      dummy.identity();
      meshRef.current.setMatrixAt(i, dummy);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Sync momentum Leva value to scroll physics
    frictionRef.current = momentum;

    updateScroll();

    const material = meshRef.current.material as THREE.ShaderMaterial;
    const geometry = meshRef.current.geometry;

    // Debug mode
    const debugModeMap: Record<string, number> = { none: 0, colors: 1, depth: 2, flat: 3 };
    material.uniforms.uDebugMode.value = debugModeMap[debugMode] ?? 0;
    // material.wireframe = debugMode === "wireframe";
    const isDebug = debugMode !== "none";

    // Update uniforms
    material.uniforms.uScale.value = imageScale;
    material.uniforms.uCurvature.value = curvature;
    material.uniforms.uRadius.value = radius;
    material.uniforms.uTotalHeight.value = totalHeight;
    material.uniforms.uTime.value = state.clock.elapsedTime;

    // Scroll advance: scroll velocity drives vertical movement
    material.uniforms.uScrollOffset.value = scrollOffset.current * scrollAdvanceSpeed;

    // Track last scroll direction for auto-rotate continuity
    const vel = scrollVelocity.current;
    if (Math.abs(vel) > 0.001) {
      lastScrollDirection.current = vel > 0 ? 1 : -1;
    }

    // Global rotation: auto-rotate follows last scroll direction + scroll boost
    const scrollContribution = vel * scrollRotateForce;
    const idleSpeed = autoRotateSpeed * lastScrollDirection.current;
    const targetSpeed = idleSpeed + scrollContribution;
    const clampedSpeed = THREE.MathUtils.clamp(targetSpeed, -maxRotationSpeed, maxRotationSpeed);

    rotationSpeed.current += (clampedSpeed - rotationSpeed.current) * rotationSmoothing;
    rotation.current += rotationSpeed.current * delta * 60;

    material.uniforms.uRotation.value = rotation.current;

    // Effects — disabled in debug modes
    if (isDebug) {
      material.uniforms.uSqueezeAmount.value = 0;
      material.uniforms.uSqueezeWidth.value = squeezeWidth;
      material.uniforms.uChromaticAberration.value = 0;
      material.uniforms.uOpacity.value = 1;
      material.uniforms.uEmission.value = 0;
      material.uniforms.uSaturation.value = 1;
      material.uniforms.uBrightness.value = 1;
      material.uniforms.uScanLines.value = 0;
      material.uniforms.uScanLineSpeed.value = 0;
      material.uniforms.uScanLineDensity.value = 0;
      material.uniforms.uDistanceFadeStart.value = 999;
      material.uniforms.uDistanceFadeEnd.value = 999;
      material.uniforms.uFlickerIntensity.value = 0;
      material.uniforms.uFlickerSpeed.value = 0;
      // Border — off
      material.uniforms.uBorderWidth.value = 0;
      material.uniforms.uBorderEmission.value = 0;
      material.uniforms.uBorderRadius.value = 0;
      material.uniforms.uBorderOffset.value = 0;
      // Corners — off
      material.uniforms.uCornerSize.value = 0;
      material.uniforms.uCornerWidth.value = 0;
      material.uniforms.uCornerOffset.value = 0;
      // Dither — off
      material.uniforms.uDitherEnabled.value = 0;
    } else {
      const targetSqueeze = Math.min(Math.abs(vel) * 3, 1.0) * squeezeMax;
      smoothSqueeze.current += (targetSqueeze - smoothSqueeze.current) * 0.08;
      material.uniforms.uSqueezeAmount.value = smoothSqueeze.current;
      material.uniforms.uSqueezeWidth.value = squeezeWidth;
      material.uniforms.uChromaticAberration.value = chromaticAberration;
      material.uniforms.uOpacity.value = opacity;
      material.uniforms.uEmission.value = emission;
      material.uniforms.uSaturation.value = saturation;
      material.uniforms.uBrightness.value = brightness;
      material.uniforms.uScanLines.value = scanLines;
      material.uniforms.uScanLineSpeed.value = scanLineSpeed;
      material.uniforms.uScanLineDensity.value = scanLineDensity;
      material.uniforms.uDistanceFadeStart.value = distanceFadeStart;
      material.uniforms.uDistanceFadeEnd.value = distanceFadeEnd;
      material.uniforms.uFlickerIntensity.value = flickerIntensity;
      material.uniforms.uFlickerSpeed.value = flickerSpeed;
      // Border
      material.uniforms.uBorderWidth.value = borderWidth;
      material.uniforms.uBorderColor.value.set(borderColor);
      material.uniforms.uBorderEmission.value = borderEmission;
      material.uniforms.uBorderRadius.value = borderRadius;
      material.uniforms.uBorderOffset.value = borderOffset;
      // Corners
      material.uniforms.uCornerSize.value = cornerSize;
      material.uniforms.uCornerWidth.value = cornerWidth;
      material.uniforms.uCornerOffset.value = cornerOffset;
      // Dither
      material.uniforms.uDitherEnabled.value = ditherEnabled ? 1 : 0;
      material.uniforms.uDitherCellSize.value = ditherCellSize;
      material.uniforms.uDitherGap.value = ditherGap;
      material.uniforms.uDitherContrast.value = ditherContrast;
      material.uniforms.uDitherMode.value = DITHER_MODE_MAP[ditherMode] ?? 0;
      material.uniforms.uDitherShape.value = DITHER_SHAPE_MAP[ditherShape] ?? 0;
      material.uniforms.uDitherBaseScale.value = ditherBaseScale;
      material.uniforms.uDitherIntensity.value = ditherIntensity;
      material.uniforms.uDitherBgColor.value.set(ditherBgColor);
      material.uniforms.uDitherFgColor.value.set(ditherFgColor);
      material.uniforms.uDitherUseColor.value = ditherUseColor ? 1 : 0;
    }

    // Update dynamic instance buffer attributes
    const angleAttr = geometry.getAttribute("aAngleOffset") as THREE.InstancedBufferAttribute;
    const posYAttr = geometry.getAttribute("aPositionY") as THREE.InstancedBufferAttribute;
    if (angleAttr && posYAttr) {
      angleAttr.array = angleOffsetsRef.current;
      angleAttr.needsUpdate = true;
      posYAttr.array = positionYsRef.current;
      posYAttr.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, NUM_INSTANCES]}
      frustumCulled={false}
    >
      <planeGeometry
        args={[PLANE_WIDTH, PLANE_HEIGHT, PLANE_SEGMENTS_X, PLANE_SEGMENTS_Y]}
      >
        <instancedBufferAttribute
          attach="attributes-aAngleOffset"
          args={[angleOffsetsRef.current, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aPositionY"
          args={[positionYsRef.current, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aTextureIndex"
          args={[textureIndices, 1]}
        />
      </planeGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.DoubleSide}
        transparent={true}
      />
    </instancedMesh>
  );
});

export default CylindricalGallery;
