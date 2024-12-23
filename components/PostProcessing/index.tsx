import { useThree } from "@react-three/fiber";
import { MeshTransmissionMaterial } from "@react-three/drei";
import { useControls } from "leva";

const PostProcessing = () => {
  const { viewport } = useThree();

  const {
    ior,
    transmission,
    roughness,
    chromaticAberration,
    active,
    thickness,
  } = useControls({
    active: {
      value: true,
    },
    ior: { value: 1.94, min: 0.8, max: 5.5, step: 0.01 },
    transmission: { value: 1, min: 0, max: 1, step: 0.1 },
    roughness: { value: 0, min: 0, max: 1, step: 0.001 },
    chromaticAberration: { value: 0.35, min: 0, max: 1, step: 0.001 },
    thickness: { value: 0.02, min: 0, max: 0.2, step: 0.001 },
  });

  return active ? (
    <mesh
      position={[0, 0, 10]}
      scale={[viewport.width, viewport.height * 0.5, 1]}
    >
      <planeGeometry />
      <MeshTransmissionMaterial
        transmission={transmission}
        roughness={roughness}
        thickness={thickness}
        chromaticAberration={chromaticAberration}
        ior={ior}
        anisotropicBlur={0.5}
      />
    </mesh>
  ) : null;
};

export default PostProcessing;
