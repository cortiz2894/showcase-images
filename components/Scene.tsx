"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { Group, TextureLoader } from "three";
import * as THREE from "three";
import { Effects } from "./Effects";
import PostProcessing from "./PostProcessing";
import { OrbitControls } from "@react-three/drei";

interface BlockProps {
  positionY: number;
  sectionIndex: number;
  blockIndex: number;
  radius: number;
  img: string;
}

const BLOCKS_PER_SECTION = 4;
const VERTICAL_SPACING = 5;

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

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += sectionIndex % 2 === 0 ? 0.001 : -0.001;
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

  // Mouse Events
  const mousePosition = useRef({ x: 0, y: 0 }); // Usamos una referencia para almacenar la posición del mouse
  const smoothMousePosition = useRef({ x: 0, y: 0 }); // Posición suavizada del mouse
  // Scroll Events
  const scrollPosition = useRef(0); // Almacena la posición objetivo del scroll
  const smoothScrollPosition = useRef(0);

  const [direction, setDirection] = useState(1);
  const totalImages = listImages.length;
  const numSections = Math.ceil(totalImages / BLOCKS_PER_SECTION);
  const totalHeight = numSections * VERTICAL_SPACING;
  const startY = -totalHeight / 1.8;
  const maxHeight = totalHeight / 2;
  const speed = 0.002;
  const smoothFactor = 0.05; // Factor de suavizado (ajustable)
  const scrollFactor = 0.05; // Factor de velocidad del scroll

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

  const handleMouseMove = (event: MouseEvent) => {
    // Actualizamos la posición del mouse en la referencia
    mousePosition.current.x = (event.clientX / window.innerWidth) * 1.5 - 1;
    mousePosition.current.y = -(event.clientY / window.innerHeight) * 1.5 + 1;
  };

  const handleScroll = () => {
    console.log(scrollPosition.current);
    // Actualizamos la posición objetivo del scroll
    scrollPosition.current = window.scrollY * scrollFactor;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useFrame(() => {
    if (groupRef.current && mousePosition.current) {
      // groupRef.current.position.y += direction * speed;

      // Suavizado: interpolamos hacia la posición objetivo del scroll
      smoothScrollPosition.current +=
        (scrollPosition.current - smoothScrollPosition.current) * smoothFactor;

      // Suavizado: interpolamos la posición suavizada hacia la posición objetivo
      smoothMousePosition.current.x +=
        (mousePosition.current.x - smoothMousePosition.current.x) *
        smoothFactor;
      smoothMousePosition.current.y +=
        (mousePosition.current.y - smoothMousePosition.current.y) *
        smoothFactor;

      // Aplicamos la posición suavizada para la rotación
      groupRef.current.rotation.x = (smoothMousePosition.current.y * 0.2) / 5;
      groupRef.current.rotation.y = smoothMousePosition.current.x * 0.2;

      groupRef.current.position.y = smoothScrollPosition.current;
    }
  });

  return <group ref={groupRef}>{blocks}</group>;
};

interface GallerySceneProps {
  avatars: string[];
}

export default function Scene({ avatars }: GallerySceneProps) {
  console.log("avatars gallery: ", avatars);
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
        {/* <OrbitControls /> */}
        <Gallery listImages={avatars} />
        {/* <Effects /> */}
        <PostProcessing />
      </Canvas>
    </div>
  );
}
