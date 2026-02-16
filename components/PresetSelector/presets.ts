export interface PresetValues {
  bloom: {
    bloomIntensity: number;
    bloomThreshold?: number;
  };
  border: {
    borderColor: string;
    borderEmission: number;
  };
  dither: {
    ditherUseColor: boolean;
    ditherFgColor: string;
    ditherGap: number;
    ditherContrast: number;
    ditherBaseScale: number;
  };
}

export const PRESETS: Record<string, PresetValues> = {
  default: {
    bloom: {
      bloomIntensity: 1.2,
    },
    border: {
      borderColor: "#ffffff",
      borderEmission: 0,
    },
    dither: {
      ditherUseColor: true,
      ditherFgColor: "#ffffff",
      ditherGap: 2.75,
      ditherContrast: 0.0,
      ditherBaseScale: 0.76,
    },
  },
  greenScifi: {
    bloom: {
      bloomIntensity: 0.9,
      // bloomThreshold: 0.01,
    },
    border: {
      borderColor: "#6df4ce",
      borderEmission: 1.6,
    },
    dither: {
      ditherUseColor: false,
      ditherFgColor: "#6df4ce",
      ditherGap: 5.5,
      ditherContrast: -0.02,
      ditherBaseScale: 0.44,
    },
  },
};

export const PRESET_KEYS = Object.keys(PRESETS) as string[];
