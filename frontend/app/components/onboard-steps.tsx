import { CaretRight } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import styles from "../study.module.css";

const steps = ["회원가입", "사이버캠퍼스 연동", "학습 시작"] as const;

export function OnboardSteps({ current }: { current: 0 | 1 | 2 }) {
  return (
    <div className={styles.onboardSteps}>
      {steps.map((step, index) => (
        <span key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={[
              styles.stepPill,
              index === current ? styles.stepPillActive : "",
              index < current ? styles.stepPillDone : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {index < current ? (
              <Check size={13} weight="bold" aria-hidden="true" />
            ) : (
              <em style={{ fontStyle: "normal" }}>{index + 1}</em>
            )}
            {step}
          </span>
          {index < steps.length - 1 ? (
            <CaretRight
              size={13}
              weight="bold"
              className={styles.stepArrow}
              aria-hidden="true"
            />
          ) : null}
        </span>
      ))}
    </div>
  );
}
