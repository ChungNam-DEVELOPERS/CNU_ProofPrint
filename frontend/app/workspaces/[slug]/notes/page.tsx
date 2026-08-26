import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { NoteDeck } from "../../../components/note-deck";
import { getWorkspace } from "../../../lib/study-data";
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
  const workspace = getWorkspace(slug);
  if (!workspace) notFound();

  const notes = [...workspace.notes]
    .filter((note) => (filter === "all" ? true : note.status === filter))
    .sort((a, b) => b.occurrences - a.occurrences);

  return (
    <AppShell workspaceSlug={slug} active="notes">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>오답노트</h1>
          <p className={styles.pageDesc}>
            학습하는 동안 에이전트가 &ldquo;이건 키워드로 남겨야겠다&rdquo;고 판단한 개념만
            자동으로 쌓입니다. 직접 적을 필요 없고, 사소한 계산 실수는 담지 않습니다.
          </p>
        </div>
      </div>

      <div className={styles.filterRow}>
        {filters.map((item) => (
          <Link
            key={item.key}
            href={`/workspaces/${slug}/notes?filter=${item.key}`}
            className={
              filter === item.key ? `${styles.chip} ${styles.chipActive}` : styles.chip
            }
          >
            {item.label}{" "}
            {item.key === "all"
              ? workspace.notes.length
              : workspace.notes.filter((note) => note.status === item.key).length}
          </Link>
        ))}
      </div>

      <NoteDeck notes={notes} />
    </AppShell>
  );
}
