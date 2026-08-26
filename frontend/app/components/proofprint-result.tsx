"use client";

import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { DownloadSimple } from "@phosphor-icons/react/DownloadSimple";
import { Eye } from "@phosphor-icons/react/Eye";
import { EyeSlash } from "@phosphor-icons/react/EyeSlash";
import { FileText } from "@phosphor-icons/react/FileText";
import { LockKey } from "@phosphor-icons/react/LockKey";
import { PaperPlaneTilt } from "@phosphor-icons/react/PaperPlaneTilt";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { X } from "@phosphor-icons/react/X";
import Link from "next/link";
import { useState } from "react";
import { apiRequest } from "../lib/api-client";
import type {
  DisclosureSettings,
  ProofprintSubmission,
  WorkspaceResource,
} from "../lib/proofprint-api";
import { proofprintBase } from "../lib/study-data";
import styles from "../proofprint.module.css";

type SubmitState = "idle" | "submitting" | "submitted" | "error";
type VisibilityKey = "sharePurpose" | "shareJudgment" | "shareReflection";

const decisionLabels = {
  adopt: "채택",
  revise: "수정",
  reject: "폐기",
} as const;

function formatKoreanDate(value: string, withTime = false) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit", hour12: false }
      : {}),
  }).format(new Date(value));
}

export function ProofprintResult({
  initialWorkspace,
}: {
  initialWorkspace: WorkspaceResource;
}) {
  const [workspace, setWorkspace] = useState(initialWorkspace);
  const [disclosure, setDisclosure] = useState(initialWorkspace.disclosure);
  const [visibilitySaving, setVisibilitySaving] = useState(false);
  const [visibilityError, setVisibilityError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>(
    initialWorkspace.status === "submitted" ? "submitted" : "idle",
  );
  const [submission, setSubmission] = useState<ProofprintSubmission | null>(
    initialWorkspace.latestSubmission,
  );
  const [submitError, setSubmitError] = useState("");

  const { assignment, course, draft, student } = workspace;
  const isSubmitted = submitState === "submitted" || workspace.status === "submitted";
  const uniquePurposeCount = new Set(
    workspace.checkpoints.map((checkpoint) => checkpoint.purpose),
  ).size;

  const updateVisibility = async (key: VisibilityKey, checked: boolean) => {
    if (visibilitySaving) return;
    const previous = disclosure;
    const next: DisclosureSettings = { ...disclosure, [key]: checked, shareRaw: false };
    setDisclosure(next);
    setVisibilitySaving(true);
    setVisibilityError("");
    try {
      const response = await apiRequest<{ workspace: WorkspaceResource }>(
        `/api/workspaces/${workspace.workspaceId}/disclosure`,
        {
          method: "PATCH",
          body: JSON.stringify({ revision: workspace.revision, disclosure: next }),
        },
      );
      setWorkspace(response.workspace);
      setDisclosure(response.workspace.disclosure);
    } catch (error) {
      setDisclosure(previous);
      setVisibilityError(
        error instanceof Error ? error.message : "공개 범위를 저장하지 못했습니다.",
      );
    } finally {
      setVisibilitySaving(false);
    }
  };

  const submitProofprint = async () => {
    setConfirmOpen(false);
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const response = await apiRequest<{
        workspace: WorkspaceResource;
        submission: ProofprintSubmission;
      }>(`/api/workspaces/${workspace.workspaceId}/submit`, {
        method: "POST",
        body: JSON.stringify({ revision: workspace.revision }),
      });
      setWorkspace(response.workspace);
      setDisclosure(response.workspace.disclosure);
      setSubmission(response.submission);
      setSubmitState("submitted");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Proofprint를 제출하지 못했습니다.",
      );
      setSubmitState("error");
    }
  };

  return (
    <>
      <nav className={styles.breadcrumbs} aria-label="현재 위치">
        <Link href="/projects">프로젝트</Link>
        <span>/</span>
        <Link href={proofprintBase}>{assignment.title}</Link>
        <span>/</span>
        <span aria-current="page">Proofprint 결과</span>
      </nav>

      <div className={styles.resultHeader}>
        <div>
          <Link className={styles.backLink} href={`${proofprintBase}/workspace`}>
            <ArrowLeft size={16} weight="bold" aria-hidden="true" /> 작성 화면으로
          </Link>
          <h1>AI 학습과정 Proofprint</h1>
          <p>제출 전에 공개 항목과 1페이지 기록을 확인하세요.</p>
        </div>
        <div className={styles.resultActions}>
          <button className={styles.outlineButton} type="button" onClick={() => window.print()}>
            <DownloadSimple size={18} weight="bold" aria-hidden="true" /> PDF 저장
          </button>
          {isSubmitted ? (
            <Link className={styles.successButton} href={`${proofprintBase}/history`}>
              <CheckCircle size={19} weight="fill" aria-hidden="true" /> 제출 기록 보기
            </Link>
          ) : (
            <button
              className={styles.primaryTopButton}
              type="button"
              disabled={submitState === "submitting" || visibilitySaving}
              onClick={() => setConfirmOpen(true)}
            >
              <PaperPlaneTilt size={18} weight="fill" aria-hidden="true" />
              {submitState === "submitting" ? "제출 중..." : "Proofprint 제출"}
            </button>
          )}
        </div>
      </div>

      {isSubmitted && submission && (
        <section className={styles.submissionSuccess} role="status">
          <CheckCircle size={25} weight="fill" aria-hidden="true" />
          <div>
            <strong>Proofprint 제출본이 안전하게 저장되었습니다</strong>
            <span>
              제출 시각 {formatKoreanDate(submission.submittedAt, true)} · 제출 버전 {submission.version}
            </span>
          </div>
        </section>
      )}

      {submitState === "error" && (
        <section className={styles.submissionError} role="alert">
          <strong>제출하지 못했습니다.</strong>
          <span>{submitError}</span>
        </section>
      )}

      <div className={styles.resultLayout}>
        <article className={styles.proofprintPaper} aria-label="AI 학습과정 Proofprint 미리보기">
          <header className={styles.paperHeader}>
            <div>
              <span className={styles.paperBrand}>
                <Sparkle size={18} weight="fill" aria-hidden="true" /> CNU Proofprint
              </span>
              <h2>AI 학습과정 증명서</h2>
              <p>{assignment.title}</p>
            </div>
            <span className={styles.paperStatus}>
              {submission ? `제출본 v${submission.version}` : "제출용"}
            </span>
          </header>

          <dl className={styles.paperMeta}>
            <div>
              <dt>학생</dt>
              <dd>
                {student.displayName}
                {student.studentNumber ? ` · ${student.studentNumber}` : ""}
              </dd>
            </div>
            <div>
              <dt>교과목</dt>
              <dd>{course.displayTitle}</dd>
            </div>
            <div>
              <dt>작성 기간</dt>
              <dd>
                {formatKoreanDate(workspace.startedAt)} — {formatKoreanDate(workspace.updatedAt)}
              </dd>
            </div>
          </dl>

          <section className={styles.paperSection}>
            <span className={styles.paperSectionNumber}>01</span>
            <div>
              <h3>학습목표</h3>
              <p className={styles.goalQuote}>{draft.personalGoal}</p>
              <span className={styles.connectedGoal}>수업 목표 · {assignment.courseGoal}</span>
            </div>
          </section>

          {(disclosure.sharePurpose || disclosure.shareJudgment) && (
            <section className={styles.paperSection}>
              <span className={styles.paperSectionNumber}>02</span>
              <div>
                <h3>AI 활용과 판단</h3>
                {disclosure.sharePurpose && (
                  <div className={styles.paperStats}>
                    <div>
                      <strong>{workspace.checkpoints.length}</strong>
                      <span>체크포인트</span>
                    </div>
                    <div>
                      <strong>{uniquePurposeCount}가지</strong>
                      <span>AI 사용 목적</span>
                    </div>
                    <div>
                      <strong>0개</strong>
                      <span>공개 원문</span>
                    </div>
                  </div>
                )}
                <div className={styles.timeline}>
                  {workspace.checkpoints.map((checkpoint) => (
                    <div className={styles.timelineItem} key={checkpoint.publicKey}>
                      <span className={styles.timelineDot} aria-hidden="true" />
                      <div className={styles.timelineTopline}>
                        <span>
                          {formatKoreanDate(checkpoint.occurredAt, true)}
                          {disclosure.sharePurpose ? ` · ${checkpoint.purpose}` : ""}
                          {disclosure.sharePurpose && checkpoint.modelId
                            ? ` · ${checkpoint.modelId}`
                            : ""}
                        </span>
                        {disclosure.shareJudgment && checkpoint.decision && (
                          <strong className={styles[checkpoint.decision]}>
                            {decisionLabels[checkpoint.decision]}
                          </strong>
                        )}
                      </div>
                      <h4>
                        {disclosure.sharePurpose
                          ? checkpoint.questionSummary
                          : "AI 제안에 대한 학생 판단"}
                      </h4>
                      {disclosure.shareJudgment && checkpoint.reason && <p>{checkpoint.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {disclosure.shareReflection && (
            <section className={styles.paperSection}>
              <span className={styles.paperSectionNumber}>03</span>
              <div>
                <h3>학습의 변화</h3>
                <dl className={styles.reflectionSummary}>
                  <div>
                    <dt>배운 점</dt>
                    <dd>{draft.learned}</dd>
                  </div>
                  <div>
                    <dt>생각이 달라진 부분</dt>
                    <dd>{draft.changed}</dd>
                  </div>
                  <div>
                    <dt>남은 질문</dt>
                    <dd>{draft.remainingQuestion}</dd>
                  </div>
                </dl>
              </div>
            </section>
          )}

          <footer className={styles.paperFooter}>
            <ShieldCheck size={23} weight="fill" aria-hidden="true" />
            <div>
              <strong>기록된 활동만으로 생성된 요약입니다</strong>
              <span>프롬프트·응답 원문은 포함되지 않았으며 학생이 공개 범위를 선택했습니다.</span>
            </div>
            <span>{submission ? submission.publicId.slice(-16).toUpperCase() : "미리보기"}</span>
          </footer>
        </article>

        <aside className={styles.visibilityPanel} aria-labelledby="visibility-title">
          <div className={styles.visibilityHeading}>
            <LockKey size={20} weight="bold" aria-hidden="true" />
            <div>
              <h2 id="visibility-title">공개 범위</h2>
              <p>교수자에게 보일 항목을 선택하세요.</p>
            </div>
          </div>
          <VisibilityToggle
            label="AI 사용 목적·요약"
            checked={disclosure.sharePurpose}
            disabled={visibilitySaving || isSubmitted}
            onChange={(checked) => void updateVisibility("sharePurpose", checked)}
          />
          <VisibilityToggle
            label="채택·수정·폐기 판단"
            checked={disclosure.shareJudgment}
            disabled={visibilitySaving || isSubmitted}
            onChange={(checked) => void updateVisibility("shareJudgment", checked)}
          />
          <VisibilityToggle
            label="배운 점·남은 질문"
            checked={disclosure.shareReflection}
            disabled={visibilitySaving || isSubmitted}
            onChange={(checked) => void updateVisibility("shareReflection", checked)}
          />
          <div className={styles.lockedVisibility}>
            <EyeSlash size={18} weight="bold" aria-hidden="true" />
            <div>
              <strong>프롬프트·응답 원문</strong>
              <span>파일럿 정책상 항상 비공개</span>
            </div>
          </div>
          <p className={styles.visibilityNote} role={visibilityError ? "alert" : undefined}>
            {visibilityError ||
              (visibilitySaving
                ? "공개 범위를 서버에 저장하는 중입니다."
                : isSubmitted
                  ? "제출본의 공개 범위가 고정되었습니다."
                  : "변경한 공개 범위는 서버에 즉시 저장됩니다.")}
          </p>
        </aside>
      </div>

      {confirmOpen && (
        <div className={styles.modalBackdrop} role="presentation">
          <section className={styles.confirmModal} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <button
              className={styles.modalClose}
              type="button"
              aria-label="제출 확인 닫기"
              onClick={() => setConfirmOpen(false)}
            >
              <X size={20} weight="bold" aria-hidden="true" />
            </button>
            <span className={styles.modalIcon} aria-hidden="true">
              <FileText size={28} weight="bold" />
            </span>
            <h2 id="confirm-title">이 Proofprint를 제출할까요?</h2>
            <p>
              공개로 선택한 항목만 제출본에 기록됩니다. 다시 제출하면 기존 기록을 보존한 채 새 버전이 생성됩니다.
            </p>
            <div className={styles.modalSummary}>
              <span>공개 항목</span>
              <strong>
                {[
                  disclosure.sharePurpose,
                  disclosure.shareJudgment,
                  disclosure.shareReflection,
                ].filter(Boolean).length}개
              </strong>
              <span>원문 공개</span>
              <strong>0개</strong>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setConfirmOpen(false)}>취소</button>
              <button type="button" onClick={() => void submitProofprint()}>
                <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" /> 제출하기
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function VisibilityToggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className={styles.visibilityToggle}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span>
        {checked ? <Eye size={18} weight="bold" aria-hidden="true" /> : <EyeSlash size={18} weight="bold" aria-hidden="true" />}
        {label}
      </span>
      <i className={checked ? styles.switchOn : undefined} aria-hidden="true"><b /></i>
    </button>
  );
}
