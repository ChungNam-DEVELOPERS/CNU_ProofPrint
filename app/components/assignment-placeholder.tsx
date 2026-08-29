import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { Hammer } from "@phosphor-icons/react/dist/ssr/Hammer";
import Link from "next/link";
import type { Assignment } from "../lib/learning";
import styles from "../study.module.css";

export function AssignmentPlaceholder({
  item,
  workspaceSlug,
}: {
  item: Assignment;
  workspaceSlug: string;
}) {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <Link href={`/workspaces/${workspaceSlug}/assignments`} className={styles.cardLink}>
            <ArrowLeft size={13} weight="bold" aria-hidden="true" /> 작업공간
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            {item.title}
          </h1>
          <p className={styles.pageDesc}>{item.summary}</p>
        </div>
        <div className={styles.headActions}>
          <Link
            href={`/workspaces/${workspaceSlug}/assignments/${item.id}/agent`}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <ChatCircleDots size={16} weight="bold" aria-hidden="true" /> 에이전트와 시작하기
          </Link>
        </div>
      </div>

      <div className={styles.empty}>
        <Hammer size={26} weight="bold" aria-hidden="true" />
        <strong>이 항목의 작업공간은 아직 만드는 중입니다</strong>
        <span>
          {item.source} · {item.due ? `마감 ${item.due}` : "마감 없음"}
          <br />
          과제 Agent와 대화한 기록은 이 과제의 Proofprint 재료로 연결됩니다.
        </span>
      </div>
    </>
  );
}
