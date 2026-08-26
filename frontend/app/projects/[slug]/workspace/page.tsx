import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { BookBookmark } from "@phosphor-icons/react/dist/ssr/BookBookmark";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { GraduationCap } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { getProject, getWorkItems, type WorkItem } from "../../../lib/study-data";
import styles from "../../../study.module.css";

const statusClass: Record<WorkItem["status"], string> = {
  "시작 전": styles.workStatusIdle,
  "작성 중": styles.workStatusActive,
  "진행 중": styles.workStatusActive,
  "제출 완료": styles.workStatusDone,
};

function WorkGroup({
  title,
  hint,
  icon,
  items,
  slug,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  items: WorkItem[];
  slug: string;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <h2 className={styles.cardTitle}>
          {icon}
          {title}
          <span className={styles.countBadge}>{items.length}</span>
        </h2>
        <span className={styles.muted}>{hint}</span>
      </div>

      {items.length === 0 ? (
        <p className={styles.muted}>아직 없습니다.</p>
      ) : (
        items.map((item) => (
          <Link
            key={item.id}
            href={`/projects/${slug}/workspace/${item.id}`}
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
              <span className={styles.workMeta}>
                {item.source}
                {item.due ? (
                  <>
                    {" · "}
                    <CalendarBlank size={12} weight="bold" aria-hidden="true" /> 마감{" "}
                    {item.due}
                  </>
                ) : null}
              </span>
            </span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        ))
      )}
    </section>
  );
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const items = getWorkItems(slug);
  const assignments = items.filter((item) => item.kind === "assignment");
  const selfStudy = items.filter((item) => item.kind === "self");

  return (
    <AppShell projectSlug={slug} active="workspace">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>작업공간</h1>
          <p className={styles.pageDesc}>
            {project.title}에서 지금 붙잡고 있는 것들입니다. 사이버캠퍼스에서 가져온
            과제와 직접 만든 개인 학습이 함께 놓입니다.
          </p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
            <Plus size={16} weight="bold" aria-hidden="true" /> 개인 학습 추가
          </button>
        </div>
      </div>

      <div className={styles.stack}>
        <WorkGroup
          title="과제"
          hint="사이버캠퍼스에서 자동으로 가져옵니다"
          icon={<GraduationCap size={17} weight="fill" aria-hidden="true" />}
          items={assignments}
          slug={slug}
        />
        <WorkGroup
          title="개인 학습"
          hint="직접 만들고 직접 끝냅니다"
          icon={<BookBookmark size={17} weight="fill" aria-hidden="true" />}
          items={selfStudy}
          slug={slug}
        />
      </div>
    </AppShell>
  );
}
