"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import PostProcessing from "./PostProcessing";

interface BlockProps {
  positionY: number;
  sectionIndex: number;
  blockIndex: number;
  radius: number;
  img: string;
}

const BLOCKS_PER_SECTION = 4;
const VERTICAL_SPACING = 5;
const MAX_ROTATION_SPEED = 0.08;

function createCurvedPlane(
  width: number,
  height: number,
  radius: number,
  segments: number
) {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  const segmentsX = segments * 4;
  const segmentsY = Math.floor(height * 12);
  const theta = width / (radius * 1.5);

  for (let y = 0; y <= segmentsY; y++) {
    const yPos = (y / segmentsY - 0.5) * height;
    for (let x = 0; x <= segmentsX; x++) {
      const xAngle = (x / segmentsX - 0.5) * theta;
      const xPos = Math.sin(xAngle) * radius;
      const zPos = Math.cos(xAngle) * radius;
      vertices.push(xPos, yPos, zPos);

      const u = x / segmentsX;
      const v = y / segmentsY;
      uvs.push(u, v);
    }
  }

  for (let y = 0; y < segmentsY; y++) {
    for (let x = 0; x < segmentsX; x++) {
      const a = x + (segmentsX + 1) * y;
      const b = x + (segmentsX + 1) * (y + 1);
      const c = x + 1 + (segmentsX + 1) * (y + 1);
      const d = x + 1 + (segmentsX + 1) * y;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

const Block = ({
  positionY,
  sectionIndex,
  blockIndex,
  radius,
  img,
}: BlockProps) => {
  const texture = useLoader(TextureLoader, img);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  const groupRef = useRef<THREE.Group | null>(null);

  const angle = ((Math.PI * 2) / BLOCKS_PER_SECTION) * blockIndex;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  const baseAngle = ((Math.PI * 2) / 4) * blockIndex;
  const randomAngleOffset = (Math.random() * 2 - 1) * 0.3;
  const rotationY = baseAngle + randomAngleOffset;

  const dynamicRadius = sectionIndex % 2 === 0 ? radius * 1 : radius * 0.8;
  const blockGeometry = createCurvedPlane(6, 2.7, dynamicRadius, 10);

  const lastScrollY = useRef(0);
  const rotationSpeed = useRef(0);
  const baseSpeed = sectionIndex % 2 === 0 ? 0.001 : -0.001;

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;

      const scrollForce = Math.abs(scrollDelta) / 100;
      const direction = scrollDelta > 0 ? 1 : -1;

      // rotationSpeed.current = baseSpeed + direction * scrollForce * 0.5;

      rotationSpeed.current = Math.min(
        Math.max(
          baseSpeed + direction * scrollForce * 0.5,
          -MAX_ROTATION_SPEED
        ),
        MAX_ROTATION_SPEED
      );

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [baseSpeed]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Aplica la rotación
      groupRef.current.rotation.y += rotationSpeed.current * delta * 90;

      // Reduce gradualmente la velocidad de rotación hacia la velocidad base
      rotationSpeed.current += (baseSpeed - rotationSpeed.current) * 0.07;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh
        position={[x, positionY, z]}
        rotation={[0, rotationY, 0]}
        geometry={blockGeometry}
      >
        <meshBasicMaterial map={texture} side={2} />
      </mesh>
    </group>
  );
};

interface GalleryProps {
  listImages: string[];
}

const Gallery = ({ listImages }: GalleryProps) => {
  const groupRef = useRef<THREE.Group | null>(null);

  // Scroll Events
  const scrollPosition = useRef(0);
  const smoothScrollPosition = useRef(0);

  const totalImages = listImages.length;
  const numSections = Math.ceil(totalImages / BLOCKS_PER_SECTION);
  const totalHeight = numSections * VERTICAL_SPACING;
  const startY = -totalHeight / 1.8;
  const smoothFactor = 0.1;
  const scrollFactor = 0.043;

  const blocks = listImages.map((img, index) => {
    const sectionIndex = Math.floor(index / BLOCKS_PER_SECTION);
    const blockIndex = index % BLOCKS_PER_SECTION;
    const positionY = startY + sectionIndex * VERTICAL_SPACING;

    return (
      <Block
        key={index}
        positionY={positionY}
        sectionIndex={sectionIndex}
        blockIndex={blockIndex}
        radius={4}
        img={img}
      />
    );
  });

  const handleScroll = () => {
    scrollPosition.current = window.scrollY * scrollFactor;
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      smoothScrollPosition.current +=
        (scrollPosition.current - smoothScrollPosition.current) * smoothFactor;

      groupRef.current.position.y = smoothScrollPosition.current / 5;
    }
  });

  return <group ref={groupRef}>{blocks}</group>;
};

interface GallerySceneProps {
  avatars: string[];
}

function CameraController() {
  const { camera } = useThree();
  const mousePosition = useRef({ x: 0, y: 0 });
  const smoothMousePosition = useRef({ x: 0, y: 0 });
  const smoothFactor = 0.3;
  const initialZoom = 12;
  const maxZoomOut = 17;
  const zoomSpeed = 0.05;
  const zoomDecay = 0.1;

  const targetZoom = useRef(initialZoom);
  const currentZoom = useRef(initialZoom);
  const lastScrollY = useRef(0);
  const scrollVelocity = useRef(0);

  useFrame(() => {
    smoothMousePosition.current.x +=
      (mousePosition.current.x - smoothMousePosition.current.x) * smoothFactor;
    smoothMousePosition.current.y +=
      (mousePosition.current.y - smoothMousePosition.current.y) * smoothFactor;

    camera.position.x = smoothMousePosition.current.x * 2;
    camera.position.y = smoothMousePosition.current.y * 0.9;

    targetZoom.current += scrollVelocity.current * zoomSpeed;
    targetZoom.current = THREE.MathUtils.clamp(
      targetZoom.current,
      initialZoom,
      maxZoomOut
    );

    currentZoom.current += (targetZoom.current - currentZoom.current) * 0.1;
    camera.position.z = currentZoom.current;

    targetZoom.current = THREE.MathUtils.lerp(
      targetZoom.current,
      initialZoom,
      1 - zoomDecay
    );

    scrollVelocity.current *= 0.9;

    camera.lookAt(0, 0, 0);
  });

  const handleMouseMove = (event: MouseEvent) => {
    mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
    mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    scrollVelocity.current = Math.abs(currentScrollY - lastScrollY.current);
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return null;
}

export default function Scene({ avatars }: GallerySceneProps) {
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
        <CameraController />
        <Gallery listImages={avatars} />
        <PostProcessing />
      </Canvas>
    </div>
  );
}
