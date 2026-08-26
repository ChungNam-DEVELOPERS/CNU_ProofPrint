import type { UnderstandingLevel } from "../lib/learning";
import { understandingMeta } from "../lib/learning";
import styles from "../study.module.css";

const levelClass: Record<UnderstandingLevel, string> = {
  solid: styles.levelSolid,
  shaky: styles.levelShaky,
  exposed: styles.levelExposed,
  unseen: styles.levelUnseen,
};

export function LevelChip({ level }: { level: UnderstandingLevel }) {
  return (
    <span
      className={`${styles.level} ${levelClass[level]}`}
      title={understandingMeta[level].hint}
    >
      {understandingMeta[level].label}
    </span>
  );
}

export function LevelMeter({
  counts,
}: {
  counts: Record<UnderstandingLevel, number>;
}) {
  const total =
    counts.solid + counts.shaky + counts.exposed + counts.unseen || 1;
  const order: { key: UnderstandingLevel; cls: string; swatch: string }[] = [
    { key: "solid", cls: styles.meterSolid, swatch: "#35a06a" },
    { key: "shaky", cls: styles.meterShaky, swatch: "#e0a03e" },
    { key: "exposed", cls: styles.meterExposed, swatch: "#6f9be0" },
    { key: "unseen", cls: styles.meterUnseen, swatch: "#d7dae1" },
  ];

  return (
    <div>
      <div className={styles.meter}>
        {order.map((item) => (
          <span
            key={item.key}
            className={`${styles.meterSeg} ${item.cls}`}
            style={{ width: `${(counts[item.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className={styles.legend}>
        {order.map((item) => (
          <span key={item.key} className={styles.legendItem}>
            <span
              className={styles.legendSwatch}
              style={{ background: item.swatch }}
              aria-hidden="true"
            />
            {understandingMeta[item.key].label} <strong>{counts[item.key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
