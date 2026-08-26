import { DownloadSimple } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { Receipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { LevelMeter } from "../../../components/level-chip";
import { ProofprintHistory } from "../../../components/proofprint-history";
import { getProject, levelCounts, proofprintProjectSlug } from "../../../lib/study-data";
import { getServerActor } from "../../../server/auth";
import { listProofprints } from "../../../server/proofprint-repository";
import styles from "../../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function RecordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const counts = levelCounts(project.topics);
  const openNotes = project.notes.filter((note) => note.status !== "resolved");
  const resolvedNotes = project.notes.filter((note) => note.status === "resolved");

  const showSubmissions = slug === proofprintProjectSlug;
  const submissions = showSubmissions
    ? await listProofprints(await getServerActor())
    : [];

  return (
    <AppShell projectSlug={slug} active="record">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습 기록</h1>
          <p className={styles.pageDesc}>
            이 프로젝트에서 무엇을 어떻게 공부했는지 한 장으로 정리한 기록입니다. 과제
            제출이나 상담 때 그대로 첨부할 수 있습니다.
          </p>
        </div>
        <div className={styles.headActions}>
          <button type="button" className={styles.btn}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" /> PDF로 내보내기
          </button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Receipt size={17} weight="bold" aria-hidden="true" /> 학습 요약
              </h2>
              <span className={styles.muted}>{project.updatedAt} 기준</span>
            </div>
            <p className={styles.statusText} style={{ fontSize: 15 }}>
              {project.summary}
            </p>
            <div style={{ marginTop: 18 }}>
              <LevelMeter counts={counts} />
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>학습 흐름</h2>
            </div>
            <div className={styles.timelineList}>
              {project.activity.map((item) => (
                <div key={item.id} className={styles.timelineRow}>
                  <span className={styles.timelineWhen}>{item.at}</span>
                  <span style={{ fontSize: 13.5, lineHeight: 1.6 }}>{item.message}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>해결한 것</h2>
            </div>
            {resolvedNotes.length === 0 ? (
              <p className={styles.muted}>아직 해결 처리한 오답노트가 없습니다.</p>
            ) : (
              resolvedNotes.map((note) => (
                <p key={note.id} style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.6 }}>
                  <strong>{note.topicTitle}</strong> — {note.title}
                </p>
              ))
            )}
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>아직 남은 것</h2>
            </div>
            {openNotes.length === 0 ? (
              <p className={styles.muted}>열린 오답노트가 없습니다.</p>
            ) : (
              openNotes.map((note) => (
                <p key={note.id} style={{ margin: "0 0 10px", fontSize: 13.5, lineHeight: 1.6 }}>
                  <strong>{note.topicTitle}</strong> — {note.title}
                  {note.occurrences > 1 ? ` (${note.occurrences}회)` : ""}
                </p>
              ))
            )}
          </section>
        </div>
      </div>

      {showSubmissions ? (
        <div style={{ marginTop: 18 }}>
          <ProofprintHistory initialItems={submissions} />
        </div>
      ) : null}
    </AppShell>
  );
}
