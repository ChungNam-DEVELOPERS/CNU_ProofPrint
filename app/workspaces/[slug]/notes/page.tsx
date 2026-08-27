import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { NoteDeck } from "../../../components/note-deck";
import { getServerActor } from "../../../server/auth";
import {
  getWorkspaceBySlug,
  listGaps,
  requireWorkspaceId,
} from "../../../server/learning-repository";
import styles from "../../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();

  const gaps = await listGaps(await requireWorkspaceId(actor, slug));
  const visible = gaps.filter((gap) => (filter === "all" ? true : gap.status === filter));

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
              ? gaps.length
              : gaps.filter((gap) => gap.status === item.key).length}
          </Link>
        ))}
      </div>

      <NoteDeck notes={visible} workspaceSlug={slug} />
    </AppShell>
  );
}
