import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import Link from "next/link";
import { LevelMeter } from "../components/level-chip";
import { levelCounts } from "../lib/learning";
import { cyberCampus, user } from "../lib/study-data";
import { getServerActor } from "../server/auth";
import {
  getTopicTree,
  listGaps,
  listWorkspaces,
  requireWorkspaceId,
} from "../server/learning-repository";
import styles from "../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "내 워크스페이스 | Proofprint" };

export default async function WorkspacesPage() {
  const actor = await getServerActor();
  const workspaces = await listWorkspaces(actor);

  const cards = await Promise.all(
    workspaces.map(async (workspace) => {
      const workspaceId = await requireWorkspaceId(actor, workspace.slug);
      const [topics, gaps] = await Promise.all([
        getTopicTree(workspaceId),
        listGaps(workspaceId),
      ]);
      return {
        workspace,
        counts: levelCounts(topics),
        openGaps: gaps.filter((gap) => gap.status !== "resolved").length,
      };
    }),
  );

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/workspaces" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={20} weight="bold" />
            </span>
            <span>
              <strong>Proofprint</strong>
            </span>
          </Link>
        </div>
        <div className={styles.topbarRight}>
          <span className={styles.syncPill}>
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            사이버캠퍼스 연동됨 · {cyberCampus.lastSyncedAt}
          </span>
          <button type="button" className={styles.userBtn}>
            <span className={styles.avatar} aria-hidden="true">
              {user.initial}
            </span>
            <span className={styles.userMeta}>
              <em>{user.department}</em>
              <strong>{user.name}</strong>
            </span>
          </button>
        </div>
      </header>

      <main className={styles.main} style={{ padding: "40px 46px 84px" }}>
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>내 워크스페이스</h1>
            <p className={styles.pageDesc}>
              사이버캠퍼스에서 가져온 {workspaces.length}개 과목으로 워크스페이스를 만들어
              뒀습니다. 워크스페이스 하나가 과목 하나이고, 그 안에 학습과 과제가 함께
              있습니다.
            </p>
          </div>
          <div className={styles.headActions}>
            <Link href="/workspaces/new" className={`${styles.btn} ${styles.btnPrimary}`}>
              <Plus size={16} weight="bold" aria-hidden="true" /> 새 워크스페이스
            </Link>
          </div>
        </div>

        <div className={styles.projGrid}>
          {cards.map(({ workspace, counts, openGaps }) => (
            <Link
              key={workspace.slug}
              href={`/workspaces/${workspace.slug}`}
              className={styles.projCard}
            >
              <div className={styles.projTop}>
                <span className={styles.projEmoji} aria-hidden="true">
                  {workspace.emoji}
                </span>
                <span className={styles.projTitle}>
                  <strong>{workspace.title}</strong>
                  <em>
                    {workspace.term} · {workspace.subject}
                  </em>
                </span>
              </div>

              <p className={styles.projSummary}>{workspace.summary}</p>

              <LevelMeter counts={counts} />

              <div className={styles.projFoot}>
                <span>
                  <NotePencil size={13} weight="bold" aria-hidden="true" /> 외울 개념{" "}
                  {openGaps}개
                </span>
                <span>
                  {workspace.updatedAt} 갱신{" "}
                  <ArrowRight size={12} weight="bold" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}

          <Link href="/workspaces/new" className={styles.projNew}>
            <Plus size={26} weight="bold" aria-hidden="true" />
            <strong>새 워크스페이스 만들기</strong>
            <span>과목, 시험 범위, 개인 주제 무엇이든 가능합니다</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
