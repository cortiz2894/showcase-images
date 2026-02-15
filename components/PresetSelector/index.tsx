import { PRESET_KEYS } from "./presets";
import styles from "./PresetSelector.module.scss";

interface PresetSelectorProps {
  active: string;
  onChange: (preset: string) => void;
}

const LABELS: Record<string, string> = {
  default: "Default",
  greenScifi: "Green SCIFI",
};

export default function PresetSelector({ active, onChange }: PresetSelectorProps) {
  return (
    <div className={styles.container}>
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
  );
}
