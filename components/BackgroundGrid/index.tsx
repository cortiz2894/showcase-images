"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";
import { gridVertexShader, gridFragmentShader } from "./gridShader";

export default function BackgroundGrid() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  const {
    gridSize,
    subdivisions,
    majorLineWidth,
    minorLineWidth,
    dotSize,
    majorLineColor,
    minorLineColor,
    dotColor,
    majorLineOpacity,
    minorLineOpacity,
    dotOpacity,
    bgColor,
    bgOpacity,
    cylinderRadius,
    cylinderHeight,
    tileX,
    tileY,
    horizontalFade,
    horizontalFadeSoftness,
  } = useControls("Grid", {
    cylinderRadius: { value: 32, min: 10, max: 80, step: 1, label: "Radius" },
    cylinderHeight: { value: 90, min: 20, max: 200, step: 5, label: "Height" },
    gridSize: { value: 0.45, min: 0.05, max: 1.0, step: 0.01, label: "Cell Size" },
    subdivisions: { value: 2, min: 1, max: 6, step: 1, label: "Subdivisions" },
    tileX: { value: 17, min: 1, max: 40, step: 1, label: "Tile X" },
    tileY: { value: 5, min: 1, max: 40, step: 1, label: "Tile Y" },
    majorLineWidth: { value: 0.005, min: 0.0005, max: 0.01, step: 0.0005, label: "Major Line W" },
    minorLineWidth: { value: 0.004, min: 0.0005, max: 0.005, step: 0.0005, label: "Minor Line W" },
    dotSize: { value: 0.011, min: 0.001, max: 0.02, step: 0.001, label: "Dot Size" },
    majorLineColor: { value: "#6df4ce", label: "Major Color" },
    minorLineColor: { value: "#6df4ce", label: "Minor Color" },
    dotColor: { value: "#6df4ce", label: "Dot Color" },
    majorLineOpacity: { value: 0.46, min: 0, max: 1, step: 0.01, label: "Major Opacity" },
    minorLineOpacity: { value: 0.14, min: 0, max: 1, step: 0.01, label: "Minor Opacity" },
    dotOpacity: { value: 1, min: 0, max: 1, step: 0.01, label: "Dot Opacity" },
    horizontalFade: { value: 0.10, min: 0, max: 1, step: 0.05, label: "Horizontal Fade" },
    horizontalFadeSoftness: { value: 0.70, min: 0.01, max: 1, step: 0.05, label: "Horizontal Softness" },
    bgColor: { value: "#015a2e", label: "BG Color" },
    bgOpacity: { value: 0.51, min: 0, max: 1, step: 0.01, label: "BG Opacity" },
  });

  const uniforms = useMemo(
    () => ({
      uGridSize: { value: 0.45 },
      uSubdivisions: { value: 2.0 },
      uMajorLineWidth: { value: 0.005 },
      uMinorLineWidth: { value: 0.004 },
      uDotSize: { value: 0.011 },
      uMajorLineColor: { value: new THREE.Color("#ffffff") },
      uMinorLineColor: { value: new THREE.Color("#ffffff") },
      uDotColor: { value: new THREE.Color("#ffffff") },
      uMajorLineOpacity: { value: 0.08 },
      uMinorLineOpacity: { value: 0.02 },
      uDotOpacity: { value: 0.32 },
      uBgColor: { value: new THREE.Color("#000000") },
      uBgOpacity: { value: 0.37 },
      uTileX: { value: 17.0 },
      uTileY: { value: 5.0 },
      uHorizontalFade: { value: 0.6 },
      uHorizontalFadeSoftness: { value: 0.3 },
    }),
    []
  );

  useFrame(() => {
    if (!meshRef.current) return;

    // Follow camera position so grid doesn't react to camera pan
    meshRef.current.position.copy(camera.position);

    const mat = meshRef.current.material as THREE.ShaderMaterial;
    mat.uniforms.uGridSize.value = gridSize;
    mat.uniforms.uSubdivisions.value = subdivisions;
    mat.uniforms.uMajorLineWidth.value = majorLineWidth;
    mat.uniforms.uMinorLineWidth.value = minorLineWidth;
    mat.uniforms.uDotSize.value = dotSize;
    mat.uniforms.uMajorLineColor.value.set(majorLineColor);
    mat.uniforms.uMinorLineColor.value.set(minorLineColor);
    mat.uniforms.uDotColor.value.set(dotColor);
    mat.uniforms.uMajorLineOpacity.value = majorLineOpacity;
    mat.uniforms.uMinorLineOpacity.value = minorLineOpacity;
    mat.uniforms.uDotOpacity.value = dotOpacity;
    mat.uniforms.uBgColor.value.set(bgColor);
    mat.uniforms.uBgOpacity.value = bgOpacity;
    mat.uniforms.uTileX.value = tileX;
    mat.uniforms.uTileY.value = tileY;
    mat.uniforms.uHorizontalFade.value = horizontalFade;
    mat.uniforms.uHorizontalFadeSoftness.value = horizontalFadeSoftness;
  });

  return (
    <mesh ref={meshRef} renderOrder={-1}>
      <cylinderGeometry args={[cylinderRadius, cylinderRadius, cylinderHeight, 64, 1, true]} />
      <shaderMaterial
        vertexShader={gridVertexShader}
        fragmentShader={gridFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        transparent={true}
        depthWrite={false}
      />
    </mesh>
  );
}
