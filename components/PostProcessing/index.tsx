import { useEffect } from "react";
import { useControls } from "leva";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { PRESETS } from "../PresetSelector/presets";

interface PostProcessingProps {
  preset: string;
}

const PostProcessing = ({ preset }: PostProcessingProps) => {
  const [{ bloomIntensity, bloomThreshold, bloomSmoothing, bloomRadius }, setBloom] =
    useControls("Bloom", () => ({
      bloomIntensity: { value: 1.2, min: 0, max: 10, step: 0.1, label: "Intensity" },
      bloomThreshold: { value: 0.01, min: 0, max: 2, step: 0.01, label: "Threshold" },
      bloomSmoothing: { value: 0.45, min: 0, max: 1, step: 0.05, label: "Smoothing" },
      bloomRadius: { value: 0.65, min: 0, max: 1, step: 0.05, label: "Radius" },
    }));

  useEffect(() => {
    const p = PRESETS[preset];
    if (p) {
      setBloom(p.bloom);
    }
  }, [preset, setBloom]);

  const blendMap: Record<string, BlendFunction> = {
    OVERLAY: BlendFunction.OVERLAY,
    SCREEN: BlendFunction.SCREEN,
    SOFT_LIGHT: BlendFunction.SOFT_LIGHT,
    NORMAL: BlendFunction.NORMAL,
  };

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={bloomSmoothing}
        mipmapBlur={true}
        radius={bloomRadius}
      />
      {/* <Noise
        opacity={noiseOpacity}
        blendFunction={blendMap[noiseBlend] ?? BlendFunction.OVERLAY}
      /> */}
    </EffectComposer>
  );
};

export default PostProcessing;
