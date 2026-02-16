import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

interface WireframeTorusProps {
  scrollVelocity: React.MutableRefObject<number>;
}

const SHAPE_OPTIONS = [
  // "Brain", 
  "Torus", "TorusKnot", "Cube"];

function useBuiltinGeometry(shape: string) {
  return useMemo(() => {
    switch (shape) {
      case "Torus":
        return new THREE.TorusGeometry(1, 0.35, 16, 32);
      case "TorusKnot":
        return new THREE.TorusKnotGeometry(0.8, 0.25, 50, 16);
      case "Cube":
        return new THREE.BoxGeometry(1.6, 1.6, 1.6);
      default:
        return null;
    }
  }, [shape]);
}

export default function WireframeTorus({ scrollVelocity }: WireframeTorusProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const rotationY = useRef(0);
  const rotationSpeed = useRef(0.001);
  const lastScrollDirection = useRef(1);
  const smoothScale = useRef(1);

  const gltf = useGLTF("/glb/brain-low.glb");
  const brainGeometry = useMemo(() => {
    const node = (gltf.nodes as Record<string, THREE.Mesh>).Brain;
    return node?.geometry ?? null;
  }, [gltf]);

  const {
    enabled, shape,
    torusScale, color,
    autoRotateSpeed, scrollRotateForce, maxRotationSpeed, rotationSmoothing,
    scaleReact, scaleSmoothing, opacity, singleSide,
    tiltX, tiltZ,
  } = useControls("Torus", {
    enabled: { value: true, label: "Enable" },
    shape: { value: "Torus", options: SHAPE_OPTIONS, label: "Shape" },
    torusScale: { value: 2.3, min: 0.1, max: 10, step: 0.1, label: "Scale" },
    color: { value: "#6df4ce", label: "Color" },
    autoRotateSpeed: { value: 0.004, min: 0, max: 0.02, step: 0.0005, label: "Auto Rotate" },
    scrollRotateForce: { value: 1.75, min: 0, max: 5, step: 0.05, label: "Scroll Rotate" },
    maxRotationSpeed: { value: 0.15, min: 0.005, max: 0.3, step: 0.005, label: "Max Rot Speed" },
    rotationSmoothing: { value: 0.09, min: 0.005, max: 0.2, step: 0.005, label: "Rot Smoothing" },
    tiltX: { value: -0.50, min: -Math.PI, max: Math.PI, step: 0.01, label: "Tilt X" },
    tiltZ: { value: -1.95, min: -Math.PI, max: Math.PI, step: 0.01, label: "Tilt Z" },
    scaleReact: { value: 0.02, min: 0, max: 0.5, step: 0.01, label: "Scale React" },
    scaleSmoothing: { value: 0.04, min: 0.01, max: 0.2, step: 0.01, label: "Scale Smoothing" },
    opacity: { value: 0.8, min: 0, max: 1, step: 0.01, label: "Opacity" },
    singleSide: { value: true, label: "Single Side" },
  });

  const builtinGeometry = useBuiltinGeometry(shape);
  const activeGeometry = shape === "Brain" ? brainGeometry : builtinGeometry;

  useFrame((_state, delta) => {
    if (!meshRef.current || !enabled) return;

    const vel = scrollVelocity.current;

    // Track scroll direction
    if (Math.abs(vel) > 0.001) {
      lastScrollDirection.current = vel > 0 ? 1 : -1;
    }

    // Rotation — same logic as gallery
    const scrollContribution = vel * scrollRotateForce;
    const idleSpeed = autoRotateSpeed * lastScrollDirection.current;
    const targetSpeed = idleSpeed + scrollContribution;
    const clampedSpeed = THREE.MathUtils.clamp(targetSpeed, -maxRotationSpeed, maxRotationSpeed);

    rotationSpeed.current += (clampedSpeed - rotationSpeed.current) * rotationSmoothing;
    rotationY.current += rotationSpeed.current * delta * 60;

    meshRef.current.rotation.x = tiltX;
    meshRef.current.rotation.y = rotationY.current;
    meshRef.current.rotation.z = tiltZ;

    // Scale reacts to scroll velocity
    const targetScale = torusScale - Math.abs(vel) * scaleReact * 10;
    smoothScale.current += (targetScale - smoothScale.current) * scaleSmoothing;
    meshRef.current.scale.setScalar(smoothScale.current);
  });

  if (!enabled || !activeGeometry) return null;

  return (
    <mesh ref={meshRef} geometry={activeGeometry}>
      <meshBasicMaterial
        color={color}
        wireframe
        transparent
        opacity={opacity}
        side={singleSide ? THREE.FrontSide : THREE.DoubleSide}
      />
    </mesh>
  );
}

useGLTF.preload("/glb/brain-only.glb");
