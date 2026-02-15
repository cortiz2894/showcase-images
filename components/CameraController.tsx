"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

interface CameraControllerProps {
  scrollVelocity: React.MutableRefObject<number>;
}

export default function CameraController({
  scrollVelocity,
}: CameraControllerProps) {
  const { camera } = useThree();

  const {
    panIntensityX,
    panIntensityY,
    smoothing,
    initialZoom,
    maxZoomOut,
    zoomSpeed,
    zoomDecay,
    lookAtX,
    lookAtY,
    lookAtZ,
  } = useControls("Camera", {
    panIntensityX: { value: 0.8, min: 0, max: 6, step: 0.1, label: "Pan X Intensity" },
    panIntensityY: { value: 1.2, min: 0, max: 4, step: 0.1, label: "Pan Y Intensity" },
    smoothing: { value: 0.06, min: 0.01, max: 1, step: 0.01, label: "Smoothing" },
    initialZoom: { value: 11.0, min: 5, max: 25, step: 0.5, label: "Base Zoom" },
    maxZoomOut: { value: 28.5, min: 5, max: 30, step: 0.5, label: "Max Zoom Out" },
    zoomSpeed: { value: 0.05, min: 0, max: 0.3, step: 0.005, label: "Zoom Speed" },
    zoomDecay: { value: 0.1, min: 0.01, max: 0.5, step: 0.01, label: "Zoom Decay" },
    lookAtX: { value: 0, min: -5, max: 5, step: 0.1, label: "Look At X" },
    lookAtY: { value: 0.1, min: -5, max: 5, step: 0.1, label: "Look At Y" },
    lookAtZ: { value: 0, min: -5, max: 5, step: 0.1, label: "Look At Z" },
  });

  const mousePosition = useRef({ x: 0, y: 0 });
  const smoothMousePosition = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(initialZoom);
  const currentZoom = useRef(initialZoom);

  useFrame(() => {
    smoothMousePosition.current.x +=
      (mousePosition.current.x - smoothMousePosition.current.x) * smoothing;
    smoothMousePosition.current.y +=
      (mousePosition.current.y - smoothMousePosition.current.y) * smoothing;

    camera.position.x = smoothMousePosition.current.x * panIntensityX;
    camera.position.y = smoothMousePosition.current.y * panIntensityY;

    const absVelocity = Math.abs(scrollVelocity.current);
    targetZoom.current += absVelocity * zoomSpeed;
    targetZoom.current = THREE.MathUtils.clamp(
      targetZoom.current,
      initialZoom,
      maxZoomOut
    );

    currentZoom.current +=
      (targetZoom.current - currentZoom.current) * 0.1;
    camera.position.z = currentZoom.current;

    targetZoom.current = THREE.MathUtils.lerp(
      targetZoom.current,
      initialZoom,
      1 - zoomDecay
    );

    camera.lookAt(lookAtX, lookAtY, lookAtZ);
  });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x =
        (event.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y =
        -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return null;
}
