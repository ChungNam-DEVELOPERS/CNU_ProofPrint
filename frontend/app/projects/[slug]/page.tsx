import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Target } from "@phosphor-icons/react/dist/ssr/Target";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "../../components/activity-feed";
import { AppShell } from "../../components/app-shell";
import { LevelChip, LevelMeter } from "../../components/level-chip";
import { flattenTopics, getProject, levelCounts } from "../../lib/study-data";
import styles from "../../study.module.css";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const counts = levelCounts(project.topics);
  const openNotes = project.notes.filter((note) => note.status !== "resolved");
  const attention = flattenTopics(project.topics)
    .filter((topic) => topic.level === "shaky")
    .slice(0, 4);
  const hours = Math.floor(project.studyMinutes / 60);
  const minutes = project.studyMinutes % 60;

  return (
    <AppShell projectSlug={slug} active="overview">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습 현황</h1>
          <p className={styles.pageDesc}>
            {project.title} · {project.term}
          </p>
        </div>
        <div className={styles.headActions}>
          <Link
            href={`/projects/${slug}/study`}
            className={`${styles.btn} ${styles.btnPrimary}`}
          >
            <ChatCircleDots size={16} weight="bold" aria-hidden="true" /> 이어서 학습하기
          </Link>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.stack}>
          <section className={styles.statusCard}>
            <p className={styles.statusTop}>
              <span className={styles.liveDot} aria-hidden="true" />
              지금 이렇게 공부하고 있습니다 · {project.updatedAt} 갱신
            </p>
            <p className={styles.statusText}>{project.summary}</p>
            <div className={styles.nextAction}>
              <Target size={19} weight="bold" aria-hidden="true" />
              <span>
                <strong>다음에 해볼 것</strong>
                {project.nextAction}
              </span>
            </div>
          </section>

          <div className={styles.statRow}>
            <div className={styles.statBox}>
              <em>누적 학습</em>
              <strong>
                {hours}시간 {minutes}분
              </strong>
              <span>이 프로젝트에서</span>
            </div>
            <div className={styles.statBox}>
              <em>설명 가능한 주제</em>
              <strong>
                {counts.solid}
                <span style={{ fontSize: 15 }}> / {flattenTopics(project.topics).length}</span>
              </strong>
              <span>직접 설명해서 확인됨</span>
            </div>
            <div className={styles.statBox}>
              <em>열린 오답노트</em>
              <strong>{openNotes.length}</strong>
              <span>아직 해결하지 않음</span>
            </div>
          </div>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>목차별 이해도</h2>
              <Link href={`/projects/${slug}/syllabus`} className={styles.cardLink}>
                전체 목차 보기 <ArrowRight size={12} weight="bold" aria-hidden="true" />
              </Link>
            </div>
            <LevelMeter counts={counts} />

            {attention.length > 0 ? (
              <div style={{ marginTop: 18 }}>
                <p className={styles.muted} style={{ marginBottom: 10, fontWeight: 700 }}>
                  지금 흔들리는 주제
                </p>
                <div className={styles.tree}>
                  {attention.map((topic) => (
                    <div key={topic.id} className={styles.treeRow} style={{ paddingLeft: 0 }}>
                      <span className={styles.treeRowMain}>
                        <strong>{topic.title}</strong>
                        {topic.evidence ? <em>{topic.evidence}</em> : null}
                      </span>
                      <span className={styles.treeMeta}>
                        <LevelChip level={topic.level} />
                        <span className={styles.treeTime}>{topic.updatedAt}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Lightning size={17} weight="fill" aria-hidden="true" />
                에이전트가 한 일
              </h2>
            </div>
            <ActivityFeed items={project.activity} />
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <NotePencil size={17} weight="bold" aria-hidden="true" />
                최근 오답노트
              </h2>
              <Link href={`/projects/${slug}/notes`} className={styles.cardLink}>
                전체 보기
              </Link>
            </div>
            {openNotes.length === 0 ? (
              <p className={styles.muted}>아직 기록된 오답이 없습니다.</p>
            ) : (
              <div className={styles.tree}>
                {openNotes.slice(0, 3).map((note) => (
                  <div key={note.id} className={styles.treeRow} style={{ paddingLeft: 0 }}>
                    <span className={styles.treeRowMain}>
                      <strong style={{ fontWeight: 700 }}>{note.title}</strong>
                      <em>
                        {note.topicTitle} · {note.occurrences}회 반복
                      </em>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
