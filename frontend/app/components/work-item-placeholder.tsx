import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { Hammer } from "@phosphor-icons/react/dist/ssr/Hammer";
import Link from "next/link";
import type { WorkItem } from "../lib/study-data";
import styles from "../study.module.css";

export function WorkItemPlaceholder({
  item,
  projectSlug,
}: {
  item: WorkItem;
  projectSlug: string;
}) {
  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <Link href={`/projects/${projectSlug}/workspace`} className={styles.cardLink}>
            <ArrowLeft size={13} weight="bold" aria-hidden="true" /> 작업공간
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            {item.title}
          </h1>
          <p className={styles.pageDesc}>{item.summary}</p>
        </div>
        <div className={styles.headActions}>
          <Link
            href={`/projects/${projectSlug}/study`}
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
          지금은 학습하기 화면에서 이 주제로 바로 대화할 수 있습니다.
        </span>
      </div>
    </>
  );
}
