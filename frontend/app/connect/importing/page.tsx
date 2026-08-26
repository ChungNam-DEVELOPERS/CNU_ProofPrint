import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import Link from "next/link";
import { OnboardSteps } from "../../components/onboard-steps";
import { cyberCampus, importedAssignments } from "../../lib/study-data";
import { getServerActor } from "../../server/auth";
import { listWorkspaces } from "../../server/learning-repository";
import styles from "../../study.module.css";

export const metadata = { title: "가져오는 중 | Proofprint" };

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ImportingPage() {
  const workspaces = await listWorkspaces(await getServerActor());
  return (
    <div className={styles.shell}>
      <div className={styles.authWrap}>
        <div className={`${styles.authCard} ${styles.authCardWide}`} style={{ maxWidth: 680 }}>
          <p className={styles.authBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={18} weight="bold" />
            </span>
            Proofprint
          </p>
          <h1 className={styles.authTitle}>사이버캠퍼스를 읽었습니다</h1>
          <p className={styles.authDesc}>
            {cyberCampus.term} 수강 정보를 가져와 워크스페이스를 만들어 뒀습니다.
          </p>

          <OnboardSteps current={1} />

          <div className={styles.importGrid}>
            <div className={styles.importStat}>
              <strong>{cyberCampus.importedCourses}</strong>
              <span>과목</span>
            </div>
            <div className={styles.importStat}>
              <strong>{cyberCampus.importedAssignments}</strong>
              <span>과제</span>
            </div>
            <div className={styles.importStat}>
              <strong>{cyberCampus.importedMaterials}</strong>
              <span>강의자료</span>
            </div>
          </div>

          <div className={styles.card} style={{ marginBottom: 16 }}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>
                <Sparkle size={16} weight="fill" aria-hidden="true" />
                자동으로 만들어진 워크스페이스
              </h2>
            </div>
            {workspaces.map((workspace) => (
              <div key={workspace.slug} className={styles.importRow}>
                <span className={styles.projEmoji} style={{ width: 34, height: 34, flex: "0 0 34px", fontSize: 17 }}>
                  {workspace.emoji}
                </span>
                <span className={styles.importRowMain}>
                  <strong>{workspace.title}</strong>
                  <em>{workspace.subject}</em>
                </span>
                <CheckCircle size={19} weight="fill" color="#10b981" aria-hidden="true" />
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>가져온 과제</h2>
            </div>
            {importedAssignments.map((item) => (
              <div key={item.id} className={styles.importRow}>
                <span className={styles.importRowMain}>
                  <strong>{item.title}</strong>
                  <em>
                    {item.course} · 마감 {item.due}
                  </em>
                </span>
                <span
                  className={
                    item.state === "제출 완료"
                      ? `${styles.importBadge} ${styles.importBadgeDone}`
                      : styles.importBadge
                  }
                >
                  {item.state}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/workspaces"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}
          >
            학습 시작하기
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
