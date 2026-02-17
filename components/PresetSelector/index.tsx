import { PRESET_KEYS } from "./presets";
import styles from "./PresetSelector.module.scss";

interface PresetSelectorProps {
  active: string;
  onChange: (preset: string) => void;
  shapeVisible: boolean;
  onToggleShape: () => void;
  levaHidden: boolean;
  onToggleLeva: () => void;
  debugMode: string;
  onDebugChange: (mode: string) => void;
  onAtlasDownload: () => void;
}

const LABELS: Record<string, string> = {
  default: "Default",
  greenScifi: "Green SCIFI",
};

const DEBUG_BUTTONS = [
  { key: "wireframe", label: "Wireframe" },
  { key: "flat", label: "Flat" },
  { key: "colors", label: "Colors" },
  { key: "atlas", label: "Atlas" },
  { key: "depth", label: "Depth" },
];

export default function PresetSelector({
  active,
  onChange,
  shapeVisible,
  onToggleShape,
  levaHidden,
  onToggleLeva,
  debugMode,
  onDebugChange,
  onAtlasDownload,
}: PresetSelectorProps) {
  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {PRESET_KEYS.map((key) => (
          <button
            key={key}
            className={`${styles.button} ${active === key ? styles.active : ""}`}
            onClick={() => onChange(key)}
          >
            {LABELS[key] ?? key}
          </button>
        ))}
      </div>
      <div className={styles.row}>
        <button
          className={`${styles.button} ${shapeVisible ? styles.active : ""}`}
          onClick={onToggleShape}
        >
          Shape
        </button>
        <button
          className={`${styles.button} ${!levaHidden ? styles.active : ""}`}
          onClick={onToggleLeva}
        >
          Config
        </button>
      </div>
      <div className={styles.row}>
        {DEBUG_BUTTONS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.button} ${styles.debugButton} ${
              debugMode === key ? styles.activeDebug : ""
            }`}
            onClick={() =>
              key === "atlas" ? onAtlasDownload() : onDebugChange(key)
            }
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
