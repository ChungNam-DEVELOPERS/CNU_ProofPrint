import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { NoteDeck } from "../../../components/note-deck";
import { getProject } from "../../../lib/study-data";
import styles from "../../../study.module.css";

const filters = [
  { key: "open", label: "외울 것" },
  { key: "reviewing", label: "복습 중" },
  { key: "resolved", label: "외웠음" },
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
            공부하다가 몰랐던 개념만 키워드로 모았습니다. 사소한 계산 실수는 담지 않고,
            외워야 넘어갈 수 있는 것만 남깁니다.
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

      <NoteDeck notes={notes} />
    </AppShell>
  );
}
