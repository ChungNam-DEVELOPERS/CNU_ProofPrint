import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { LevelChip, LevelMeter } from "../../../components/level-chip";
import { getWorkspace, levelCounts } from "../../../lib/study-data";
import styles from "../../../study.module.css";

export default async function SyllabusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspace = getWorkspace(slug);
  if (!workspace) notFound();

  return (
    <AppShell workspaceSlug={slug} active="syllabus">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>목차 · 이해도</h1>
          <p className={styles.pageDesc}>
            목차는 고정된 것이 아니라 학습하면서 계속 갱신됩니다. 이해도는 에이전트의
            설명을 들은 것만으로는 올라가지 않고, 내가 직접 설명했을 때 올라갑니다.
          </p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={styles.btn}>
            <ArrowsClockwise size={15} weight="bold" aria-hidden="true" /> 목차 다시 정리
          </button>
        </div>
      </div>

      <section className={styles.card} style={{ marginBottom: 18 }}>
        <LevelMeter counts={levelCounts(workspace.topics)} />
      </section>

      <div className={styles.tree}>
        {workspace.topics.map((topic) => (
          <section key={topic.id} className={styles.treeNode}>
            <header className={styles.treeHead}>
              <h3>{topic.title}</h3>
              <span className={styles.treeMeta}>
                <LevelChip level={topic.level} />
                {topic.updatedAt ? (
                  <span className={styles.treeTime}>{topic.updatedAt}</span>
                ) : null}
              </span>
            </header>

            {topic.children?.length ? (
              <div>
                {topic.children.map((child) => (
                  <div key={child.id} className={styles.treeRow}>
                    <span className={styles.treeRowMain}>
                      <strong>{child.title}</strong>
                      {child.evidence ? <em>근거: {child.evidence}</em> : null}
                    </span>
                    <span className={styles.treeMeta}>
                      <LevelChip level={child.level} />
                      <span className={styles.treeTime}>{child.updatedAt ?? "—"}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.treeRow}>
                <span className={styles.treeRowMain}>
                  <em>하위 항목이 아직 없습니다.</em>
                </span>
              </div>
            )}
          </section>
        ))}
      </div>
    </AppShell>
  );
}
