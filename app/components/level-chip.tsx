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
  // 막대와 범례가 같은 CSS 변수를 쓰므로 색이 어긋날 수 없다.
  const order: { key: UnderstandingLevel; bar: string; dot: string }[] = [
    { key: "solid", bar: styles.meterSolid, dot: styles.swatchSolid },
    { key: "shaky", bar: styles.meterShaky, dot: styles.swatchShaky },
    { key: "exposed", bar: styles.meterExposed, dot: styles.swatchExposed },
    { key: "unseen", bar: styles.meterUnseen, dot: styles.swatchUnseen },
  ];

  return (
    <div>
      <div className={styles.meter}>
        {order.map((item) => (
          <span
            key={item.key}
            className={`${styles.meterSeg} ${item.bar}`}
            style={{ width: `${(counts[item.key] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className={styles.legend}>
        {order.map((item) => (
          <span key={item.key} className={styles.legendItem}>
            <span
              className={`${styles.legendSwatch} ${item.dot}`}
              aria-hidden="true"
            />
            {understandingMeta[item.key].label} <strong>{counts[item.key]}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
