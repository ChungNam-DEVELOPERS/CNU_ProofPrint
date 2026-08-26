import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Repeat } from "@phosphor-icons/react/dist/ssr/Repeat";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { getProject } from "../../../lib/study-data";
import styles from "../../../study.module.css";

const filters = [
  { key: "open", label: "해결 안 됨" },
  { key: "reviewing", label: "복습 중" },
  { key: "resolved", label: "해결함" },
  { key: "all", label: "전체" },
] as const;

export default async function NotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { slug } = await params;
  const { filter = "open" } = await searchParams;
  const project = getProject(slug);
  if (!project) notFound();

  const notes = [...project.notes]
    .filter((note) => (filter === "all" ? true : note.status === filter))
    .sort((a, b) => b.occurrences - a.occurrences);

  return (
    <AppShell projectSlug={slug} active="notes">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>오답노트</h1>
          <p className={styles.pageDesc}>
            공부하다가 몰랐거나 틀린 개념·공식만 따로 모았습니다. 같은 것을 여러 번
            틀리면 항목이 늘어나는 대신 반복 횟수가 올라갑니다.
          </p>
        </div>
      </div>

      <div className={styles.filterRow}>
        {filters.map((item) => (
          <Link
            key={item.key}
            href={`/projects/${slug}/notes?filter=${item.key}`}
            className={
              filter === item.key ? `${styles.chip} ${styles.chipActive}` : styles.chip
            }
          >
            {item.label}{" "}
            {item.key === "all"
              ? project.notes.length
              : project.notes.filter((note) => note.status === item.key).length}
          </Link>
        ))}
      </div>

      {notes.length === 0 ? (
        <div className={styles.empty}>
          <strong>여기에 해당하는 오답노트가 없습니다.</strong>
          <span>학습하면서 몰랐던 것이 생기면 자동으로 쌓입니다.</span>
        </div>
      ) : (
        <div className={styles.noteList}>
          {notes.map((note) => (
            <article
              key={note.id}
              className={
                note.status === "resolved"
                  ? `${styles.noteCard} ${styles.noteResolved}`
                  : styles.noteCard
              }
            >
              <div className={styles.noteTop}>
                <span className={styles.noteKind}>{note.kind}</span>
                <span className={styles.noteTopic}>{note.topicTitle}</span>
                {note.occurrences > 1 ? (
                  <span className={styles.noteOcc}>
                    <Repeat size={13} weight="bold" aria-hidden="true" />
                    {note.occurrences}회 반복
                  </span>
                ) : null}
              </div>

              <h2 className={styles.noteTitle}>{note.title}</h2>
              <p className={styles.noteDetail}>{note.detail}</p>

              <div className={styles.noteCorrection}>
                <strong>바로잡은 내용</strong>
                {note.correction}
              </div>

              <div className={styles.noteFoot}>
                <span className={styles.muted}>마지막 발생 {note.lastSeen}</span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button type="button" className={styles.btn}>
                    <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
                    다시 물어보기
                  </button>
                  {note.status !== "resolved" ? (
                    <button type="button" className={styles.btn}>
                      <CheckCircle size={14} weight="bold" aria-hidden="true" /> 해결함
                    </button>
                  ) : null}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
