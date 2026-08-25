import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr/CalendarBlank";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Clock } from "@phosphor-icons/react/dist/ssr/Clock";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { Info } from "@phosphor-icons/react/dist/ssr/Info";
import { LockKey } from "@phosphor-icons/react/dist/ssr/LockKey";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import Link from "next/link";
import { CnuCourseShell } from "../../components/cnu-course-shell";
import { assignment as assignmentCopy, proofprintSteps } from "../../lib/proofprint-data";
import { getServerActor } from "../../server/auth";
import { getWorkspaceByAssignmentSlug } from "../../server/proofprint-repository";
import styles from "../../proofprint.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function formatLastSaved(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function AssignmentDetailPage() {
  const actor = await getServerActor();
  const workspace = await getWorkspaceByAssignmentSlug(actor, "ai-service-proposal");
  const assignment = workspace.assignment;
  const submitted = workspace.status === "submitted";
  const completedSteps = submitted ? 5 : workspace.currentStep;
  const progress = completedSteps * 20;

  return (
    <CnuCourseShell activeMenu="과제">
      <nav className={styles.breadcrumbs} aria-label="현재 위치">
        <Link href="/">과제</Link>
        <span>/</span>
        <span aria-current="page">{assignment.title}</span>
      </nav>

      <div className={styles.detailHeader}>
        <div>
          <Link className={styles.backLink} href="/">
            <ArrowLeft size={16} weight="bold" aria-hidden="true" /> 과제 목록
          </Link>
          <h1>{assignment.title}</h1>
          <p>{assignment.description}</p>
        </div>
        <span className={styles.dueBadge}>{assignmentCopy.remaining}</span>
      </div>

      <div className={styles.detailGrid}>
        <div className={styles.detailBody}>
          <section className={styles.contentCard}>
            <h2>과제 안내</h2>
            <p>
              충남대학교 캠퍼스에서 반복되는 불편 하나를 선택해 사용자를 정의하고,
              인터뷰 또는 관찰 근거를 바탕으로 요구사항·핵심 기능·사용 흐름을 설계하세요.
              생성형 AI로 대안을 탐색하거나 반론을 검토할 수 있으며, 최종 설계 보고서와 함께
              핵심 판단 과정이 담긴 Proofprint를 제출해야 합니다.
            </p>
            <dl className={styles.assignmentFacts}>
              <div>
                <dt>제출 기간</dt>
                <dd>
                  <CalendarBlank size={18} weight="bold" aria-hidden="true" /> 2026.09.01 09:00
                  ~ {assignmentCopy.dueAt}
                </dd>
              </div>
              <div>
                <dt>배점</dt>
                <dd>{assignment.score ?? 0}점</dd>
              </div>
              <div>
                <dt>제출 파일</dt>
                <dd>설계 보고서 PDF + 프로토타입 링크 + Proofprint</dd>
              </div>
            </dl>
          </section>

          <section className={styles.contentCard}>
            <h2>학습목표</h2>
            <div className={styles.goalCallout}>
              <span>수업 학습목표</span>
              <strong>{assignment.courseGoal}</strong>
            </div>
            <ul className={styles.checkList}>
              <li>
                <Check size={18} weight="bold" aria-hidden="true" /> 관찰·인터뷰 근거로 해결할 문제와
                핵심 사용자를 정의한다.
              </li>
              <li>
                <Check size={18} weight="bold" aria-hidden="true" /> AI가 제시한 기능 대안을 사용자
                가치·기술 가능성·개인정보 관점에서 비교한다.
              </li>
              <li>
                <Check size={18} weight="bold" aria-hidden="true" /> 핵심 기능과 사용자 흐름을 프로토타입으로
                표현하고 자신의 판단 근거를 남긴다.
              </li>
            </ul>
          </section>

          <section className={styles.policyNotice} aria-labelledby="policy-title">
            <div className={styles.policyIcon} aria-hidden="true">
              <LockKey size={24} weight="bold" />
            </div>
            <div>
              <h2 id="policy-title">AI 활용 기록은 원문 제출이 아닙니다</h2>
              <p>
                프롬프트와 응답 원문은 기본 비공개입니다. 교수자에게는 학생이 선택한 목적,
                판단 이유, 배운 점과 공개하기로 한 근거만 전달됩니다.
              </p>
            </div>
            <button type="button" aria-label="개인정보 안내 보기">
              <Info size={20} weight="bold" aria-hidden="true" />
            </button>
          </section>
        </div>

        <aside className={styles.startCard} aria-label="Proofprint 작성 상태">
          <div className={styles.startCardHeading}>
            <span className={styles.sparkleTile} aria-hidden="true">
              <Sparkle size={23} weight="fill" />
            </span>
            <div>
              <span>CNU Proofprint</span>
              <h2>학습과정 기록</h2>
            </div>
          </div>

          <div className={styles.completionRing} aria-label={`Proofprint ${progress}퍼센트 작성`}>
            <div>
              <strong>{progress}%</strong>
              <span>{submitted ? "제출 완료" : "작성 중"}</span>
            </div>
          </div>

          <ol className={styles.miniSteps}>
            {proofprintSteps.map((step, index) => {
              const done = submitted || index < workspace.currentStep;
              const current = !submitted && index === workspace.currentStep;
              return (
                <li
                  className={done ? styles.miniStepDone : current ? styles.miniStepCurrent : undefined}
                  key={step}
                >
                  {done ? (
                    <><Check size={14} weight="bold" aria-hidden="true" /> {step}</>
                  ) : (
                    `${index + 1}. ${step}`
                  )}
                </li>
              );
            })}
          </ol>

          <Link
            className={styles.primaryLinkButton}
            href={submitted
              ? "/assignments/ai-service-proposal/proofprint/result"
              : "/assignments/ai-service-proposal/proofprint"}
          >
            {submitted ? "제출본 보기" : "이어서 작성하기"} <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </Link>
          <p className={styles.autosaveNote}>
            <Clock size={15} weight="bold" aria-hidden="true" /> 마지막 저장: {formatLastSaved(workspace.updatedAt)}
          </p>
          <Link className={styles.textLink} href="/assignments/ai-service-proposal/proofprint/result">
            <FileText size={16} weight="bold" aria-hidden="true" /> 현재 Proofprint 미리보기
          </Link>
        </aside>
      </div>
    </CnuCourseShell>
  );
}
