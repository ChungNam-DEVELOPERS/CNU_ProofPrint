import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Receipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { Target } from "@phosphor-icons/react/dist/ssr/Target";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityFeed } from "../../components/activity-feed";
import { AppShell } from "../../components/app-shell";
import { LevelChip, LevelMeter } from "../../components/level-chip";
import { ProofprintHistory } from "../../components/proofprint-history";
import {
  flattenTopics,
  getProject,
  levelCounts,
  proofprintProjectSlug,
} from "../../lib/study-data";
import { getServerActor } from "../../server/auth";
import { listProofprints } from "../../server/proofprint-repository";
import styles from "../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const counts = levelCounts(project.topics);
  const allTopics = flattenTopics(project.topics);
  const openNotes = project.notes.filter((note) => note.status !== "resolved");
  const attention = allTopics.filter((topic) => topic.level === "shaky").slice(0, 4);
  const hours = Math.floor(project.studyMinutes / 60);
  const minutes = project.studyMinutes % 60;

  const showSubmissions = slug === proofprintProjectSlug;
  const submissions = showSubmissions
    ? await listProofprints(await getServerActor())
    : [];

  return (
    <AppShell projectSlug={slug} active="overview">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습 현황</h1>
          <p className={styles.pageDesc}>
            {project.title} · {project.term} — 지금 상태와 지금까지의 학습 기록을 함께
            봅니다.
          </p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={styles.btn}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" /> 기록 내보내기
          </button>
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
                <span style={{ fontSize: 15 }}> / {allTopics.length}</span>
              </strong>
              <span>직접 설명해서 확인됨</span>
            </div>
            <div className={styles.statBox}>
              <em>외울 개념</em>
              <strong>{openNotes.length}</strong>
              <span>오답노트에 남아 있음</span>
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
              <div style={{ marginTop: 26 }}>
                <p className={styles.muted} style={{ marginBottom: 12, fontWeight: 700 }}>
                  지금 흔들리는 주제
                </p>
                <div className={styles.tree}>
                  {attention.map((topic) => (
                    <div key={topic.id} className={styles.treeRow} style={{ padding: "12px 0" }}>
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

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Receipt size={17} weight="bold" aria-hidden="true" /> 학습 흐름
              </h2>
              <span className={styles.muted}>에이전트가 남긴 기록</span>
            </div>
            <div className={styles.timelineList}>
              {project.activity.map((item) => (
                <div key={item.id} className={styles.timelineRow}>
                  <span className={styles.timelineWhen}>{item.at}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.7 }}>{item.message}</span>
                </div>
              ))}
            </div>
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
                외울 개념
              </h2>
              <Link href={`/projects/${slug}/notes`} className={styles.cardLink}>
                전체 보기
              </Link>
            </div>
            {openNotes.length === 0 ? (
              <p className={styles.muted}>아직 기록된 개념이 없습니다.</p>
            ) : (
              <div className={styles.termList}>
                {openNotes.slice(0, 4).map((note) => (
                  <div key={note.id} className={styles.termRow}>
                    <strong>{note.term}</strong>
                    <em>{note.topicTitle}</em>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showSubmissions ? (
        <div style={{ marginTop: 24 }}>
          <ProofprintHistory initialItems={submissions} />
        </div>
      ) : null}
    </AppShell>
  );
}
