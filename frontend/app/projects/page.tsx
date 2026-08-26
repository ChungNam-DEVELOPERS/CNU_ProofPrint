import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import Link from "next/link";
import { LevelMeter } from "../components/level-chip";
import { cyberCampus, levelCounts, projects, user } from "../lib/study-data";
import styles from "../study.module.css";

export const metadata = { title: "내 프로젝트 | CNU Proofprint" };

export default function ProjectsPage() {
  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/projects" className={styles.brand}>
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

      <main className={styles.main} style={{ padding: "34px 44px 60px" }}>
        <div className={styles.pageHead}>
          <div>
            <h1 className={styles.pageTitle}>내 프로젝트</h1>
            <p className={styles.pageDesc}>
              사이버캠퍼스에서 가져온 {cyberCampus.importedCourses}개 과목으로 프로젝트를
              만들어 뒀습니다. 학습하는 동안 에이전트가 이해도와 오답노트를 자동으로
              정리합니다.
            </p>
          </div>
          <div className={styles.headActions}>
            <Link href="/projects/new" className={`${styles.btn} ${styles.btnPrimary}`}>
              <Plus size={16} weight="bold" aria-hidden="true" /> 새 프로젝트
            </Link>
          </div>
        </div>

        <div className={styles.projGrid}>
          {projects.map((project) => {
            const counts = levelCounts(project.topics);
            const openNotes = project.notes.filter(
              (note) => note.status !== "resolved",
            ).length;

            return (
              <Link
                key={project.slug}
                href={`/projects/${project.slug}`}
                className={styles.projCard}
              >
                <div className={styles.projTop}>
                  <span className={styles.projEmoji} aria-hidden="true">
                    {project.emoji}
                  </span>
                  <span className={styles.projTitle}>
                    <strong>{project.title}</strong>
                    <em>
                      {project.term} · {project.subject}
                    </em>
                  </span>
                </div>

                <p className={styles.projSummary}>{project.summary}</p>

                <LevelMeter counts={counts} />

                <div className={styles.projFoot}>
                  <span>
                    <NotePencil size={13} weight="bold" aria-hidden="true" /> 오답노트{" "}
                    {openNotes}건
                  </span>
                  <span>
                    {project.updatedAt} 갱신{" "}
                    <ArrowRight size={12} weight="bold" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}

          <Link href="/projects/new" className={styles.projNew}>
            <Plus size={26} weight="bold" aria-hidden="true" />
            <strong>새 프로젝트 만들기</strong>
            <span>과목, 시험 범위, 개인 주제 무엇이든 가능합니다</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
