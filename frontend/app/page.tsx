import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr/FunnelSimple";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import Link from "next/link";
import { CnuCourseShell } from "./components/cnu-course-shell";
import { assignment as assignmentCopy } from "./lib/proofprint-data";
import { getServerActor } from "./server/auth";
import { getWorkspaceByAssignmentSlug } from "./server/proofprint-repository";
import styles from "./proofprint.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, "ai-service-proposal");
  const completedSteps = workspace.status === "submitted" ? 5 : workspace.currentStep;
  const progress = completedSteps * 20;
  const mainSubmitted = workspace.status === "submitted";
  const assignments = [
    {
      title: workspace.assignment.title,
      due: assignmentCopy.dueAt,
      meta: `${assignmentCopy.category} · ${workspace.assignment.score ?? 0}점`,
      status: mainSubmitted ? "제출 완료" : "작성 중",
      proofprint: mainSubmitted ? "제출 완료" : `${completedSteps}/5 단계`,
      tone: mainSubmitted ? "done" : "progress",
      href: `/assignments/${workspace.assignment.slug}`,
    },
    {
      title: "서비스 사용자 시나리오 작성",
      due: "2026.09.25 (금) 23:59",
      meta: "개인 과제 · 15점",
      status: "시작 전",
      proofprint: "선택 사용",
      tone: "ready",
      href: "#assignment-analysis",
    },
    {
      title: "사용자 인터뷰 분석 보고서",
      due: "2026.09.11 (금) 18:00",
      meta: "팀 과제 · 10점",
      status: "제출 완료",
      proofprint: "제출 완료",
      tone: "done",
      href: "/proofprints",
    },
  ];
  const submittedCount = assignments.filter((item) => item.status === "제출 완료").length;
  return (
    <CnuCourseShell activeMenu="과제">
      <div className={styles.pageHeadingRow}>
        <div>
          <p className={styles.eyebrow}>학습요소</p>
          <h1>과제</h1>
          <p className={styles.pageDescription}>
            제출할 과제와 AI 학습과정 기록 상태를 함께 확인하세요.
          </p>
        </div>
        <Link className={styles.outlineButton} href="/proofprints">
          <FileText size={18} weight="bold" aria-hidden="true" /> 내 Proofprint
        </Link>
      </div>

      <section className={styles.overviewBanner} aria-labelledby="proofprint-overview-title">
        <div className={styles.bannerIcon} aria-hidden="true">
          <Sparkle size={28} weight="fill" />
        </div>
        <div className={styles.bannerCopy}>
          <span className={styles.bannerLabel}>이번 주 AI 학습과정</span>
          <h2 id="proofprint-overview-title">
            {mainSubmitted
              ? "캠퍼스 서비스 설계 과제의 Proofprint 제출이 완료되었습니다"
              : "캠퍼스 서비스 설계 과제의 Proofprint를 이어서 작성하세요"}
          </h2>
          <p>
            5단계 중 {completedSteps}단계를 기록했습니다. 평균 체크포인트 작성 시간은 약 2분입니다.
          </p>
        </div>
        <div className={styles.bannerProgress}>
          <div>
            <strong>{progress}%</strong>
            <span>{completedSteps} / 5 단계</span>
          </div>
          <div className={styles.progressTrack} aria-label={`Proofprint 작성률 ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Link
          className={styles.bannerAction}
          href={mainSubmitted
            ? "/assignments/ai-service-proposal/proofprint/result"
            : "/assignments/ai-service-proposal/proofprint"}
        >
          {mainSubmitted ? "제출본 보기" : "이어서 작성"} <ArrowRight size={18} weight="bold" aria-hidden="true" />
        </Link>
      </section>

      <div className={styles.filterBar}>
        <div className={styles.tabList} aria-label="과제 상태 필터">
          <button className={styles.activeTab} type="button">
            전체 <span>3</span>
          </button>
          <button type="button">제출 전 {assignments.length - submittedCount}</button>
          <button type="button">제출 완료 {submittedCount}</button>
        </div>
        <button className={styles.filterButton} type="button">
          <FunnelSimple size={17} weight="bold" aria-hidden="true" /> 마감일순
        </button>
      </div>

      <section className={styles.assignmentList} aria-label="과제 목록">
        {assignments.map((item) => (
          <Link className={styles.assignmentCard} href={item.href} key={item.title}>
            <div className={`${styles.assignmentMarker} ${styles[item.tone]}`} aria-hidden="true" />
            <div className={styles.assignmentMain}>
              <div className={styles.assignmentTitleLine}>
                <h2>{item.title}</h2>
                {item.proofprint !== "선택 사용" && (
                  <span className={styles.proofprintBadge}>
                    <Sparkle size={13} weight="fill" aria-hidden="true" /> Proofprint
                  </span>
                )}
              </div>
              <p>{item.meta}</p>
              <div className={styles.assignmentMeta}>
                <span>
                  <CalendarBlank size={16} weight="bold" aria-hidden="true" /> 마감 {item.due}
                </span>
                <span>
                  {item.tone === "done" ? (
                    <CheckCircle size={16} weight="fill" aria-hidden="true" />
                  ) : (
                    <Clock size={16} weight="bold" aria-hidden="true" />
                  )}
                  {item.proofprint}
                </span>
              </div>
            </div>
            <span className={`${styles.statusPill} ${styles[item.tone]}`}>{item.status}</span>
            <ArrowRight className={styles.cardArrow} size={20} weight="bold" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </CnuCourseShell>
  );
}
