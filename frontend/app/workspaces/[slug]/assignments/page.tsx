import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { GraduationCap } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { getAssignments, getWorkspace, type Assignment } from "../../../lib/study-data";
import styles from "../../../study.module.css";

const statusClass: Record<Assignment["status"], string> = {
  "시작 전": styles.workStatusIdle,
  "작성 중": styles.workStatusActive,
  "진행 중": styles.workStatusActive,
  "제출 완료": styles.workStatusDone,
};

export default async function AssignmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = getWorkspace(slug);
  if (!workspace) notFound();

  const items = getAssignments(slug);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>과제</h1>
          <p className={styles.pageDesc}>
            {workspace.title}에서 제출해야 할 것들입니다. 사이버캠퍼스에서 자동으로
            가져오고, 마감이 가까운 순으로 놓입니다.
          </p>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>
            <GraduationCap size={17} weight="fill" aria-hidden="true" />
            가져온 과제
            <span className={styles.countBadge}>{items.length}</span>
          </h2>
          <span className={styles.muted}>사이버캠퍼스 · 12분 전 동기화</span>
        </div>

        {items.length === 0 ? (
          <p className={styles.muted}>이 워크스페이스에 등록된 과제가 없습니다.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={`/workspaces/${slug}/assignments/${item.id}`}
              className={styles.workRow}
            >
              <span className={styles.workMain}>
                <span className={styles.workTitleLine}>
                  <strong>{item.title}</strong>
                  <span className={`${styles.workStatus} ${statusClass[item.status]}`}>
                    {item.status}
                  </span>
                  {item.hasProofprint ? (
                    <span className={styles.proofBadge}>Proofprint {item.steps}/5</span>
                  ) : null}
                </span>
                <em>{item.summary}</em>
                {item.due ? (
                  <span className={styles.workMeta}>
                    <CalendarBlank size={12} weight="bold" aria-hidden="true" /> 마감{" "}
                    {item.due}
                  </span>
                ) : null}
              </span>
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          ))
        )}
      </section>
    </AppShell>
  );
}
