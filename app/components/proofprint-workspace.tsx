"use client";

import { ArrowLeft } from "@phosphor-icons/react/ArrowLeft";
import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { Check } from "@phosphor-icons/react/Check";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { FileText } from "@phosphor-icons/react/FileText";
import { Lightbulb } from "@phosphor-icons/react/Lightbulb";
import { LockKey } from "@phosphor-icons/react/LockKey";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import {
  CnuAiAssistant,
  type AiUseSelection,
} from "./cnu-ai-assistant";
import { apiRequest } from "../lib/api-client";
import type {
  AiPurpose,
  Decision,
  WorkspaceDraft,
  WorkspaceResource,
} from "../lib/proofprint-api";
import { proofprintSteps } from "../lib/proofprint-data";
import { proofprintBase } from "../lib/study-data";
import styles from "../proofprint.module.css";

type SaveState = "idle" | "saving" | "saved" | "error";

const decisionOptions: Array<{ value: Decision; label: string }> = [
  { value: "adopt", label: "채택" },
  { value: "revise", label: "수정" },
  { value: "reject", label: "폐기" },
];

const reasonByDecision: Record<Decision, string> = {
  adopt:
    "사용자 인터뷰에서 확인한 요구와 구현 범위에 맞아 MVP의 핵심 기능으로 채택했다.",
  revise:
    "상시 위치 추적 기능은 제외하고, 사용자가 직접 체크인한 정보와 익명 혼잡도 데이터만 활용하도록 수정했다.",
  reject:
    "개인의 위치를 계속 수집하는 방식은 과제의 최소수집 원칙과 구현 범위에 맞지 않아 제외했다.",
};

const purposeOptions: AiPurpose[] = [
  "개념 이해",
  "아이디어 탐색",
  "반론 검토",
  "초안 피드백",
  "근거 확인",
];

const stepGuidance = [
  {
    title: "좋은 학습목표는",
    body: "과제 결과가 아니라 이번 과정을 통해 내가 설명하거나 판단할 수 있게 될 것을 적습니다.",
  },
  {
    title: "원문은 제출되지 않아요",
    body: "AI를 왜 사용했는지와 실제 과제에 반영한 제안 요지만 기록합니다.",
  },
  {
    title: "판단이 핵심이에요",
    body: "AI의 답이 맞았는지보다 왜 채택·수정·폐기했는지를 짧게 남겨 주세요.",
  },
  {
    title: "변화를 구체적으로",
    body: "새로 안 사실, 처음과 달라진 생각, 아직 해결하지 못한 질문을 구분해 적습니다.",
  },
  {
    title: "제출 전 확인",
    body: "Proofprint에는 입력 원문 대신 선택한 요약과 판단 근거만 포함됩니다.",
  },
];

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function ProofprintWorkspace({
  initialWorkspace,
  initialAiMode,
}: {
  initialWorkspace: WorkspaceResource;
  initialAiMode: "demo" | "connector";
}) {
  const router = useRouter();
  const assignment = initialWorkspace.assignment;
  const personalGoalId = useId();
  const reasonId = useId();
  const learnedId = useId();
  const changedId = useId();
  const questionId = useId();
  const [activeStep, setActiveStep] = useState(initialWorkspace.currentStep);
  const [personalGoal, setPersonalGoal] = useState(initialWorkspace.draft.personalGoal);
  const [purpose, setPurpose] = useState(initialWorkspace.draft.purpose);
  const [aiQuestion, setAiQuestion] = useState(initialWorkspace.draft.aiQuestion);
  const [aiSummary, setAiSummary] = useState(initialWorkspace.draft.aiSummary);
  const [aiProvider, setAiProvider] = useState(initialWorkspace.draft.aiProvider);
  const [aiModel, setAiModel] = useState(initialWorkspace.draft.aiModel);
  const [aiRequestId, setAiRequestId] = useState(initialWorkspace.draft.aiRequestId);
  const [decision, setDecision] = useState<Decision>(initialWorkspace.draft.decision);
  const [reason, setReason] = useState(initialWorkspace.draft.reason);
  const [learned, setLearned] = useState(initialWorkspace.draft.learned);
  const [changed, setChanged] = useState(initialWorkspace.draft.changed);
  const [remainingQuestion, setRemainingQuestion] = useState(
    initialWorkspace.draft.remainingQuestion,
  );
  const [revision, setRevision] = useState(initialWorkspace.revision);
  const [updatedAt, setUpdatedAt] = useState(initialWorkspace.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const agentDraft = initialWorkspace.agentDraft;

  const draft: WorkspaceDraft = {
    personalGoal,
    purpose,
    aiQuestion,
    aiSummary,
    aiProvider,
    aiModel,
    aiRequestId,
    decision,
    reason,
    learned,
    changed,
    remainingQuestion,
  };

  const persistDraft = async (
    currentStep: number,
    draftToSave: WorkspaceDraft = draft,
  ) => {
    setSaveState("saving");
    setSaveError("");
    try {
      const { workspace } = await apiRequest<{ workspace: WorkspaceResource }>(
        `/api/proofprints/${initialWorkspace.workspaceId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ revision, currentStep, draft: draftToSave }),
        },
      );
      setRevision(workspace.revision);
      setUpdatedAt(workspace.updatedAt);
      setSaveState("saved");
      return true;
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "현재 단계를 저장하지 못했습니다.",
      );
      setSaveState("error");
      return false;
    }
  };

  const chooseDecision = (nextDecision: Decision) => {
    setDecision(nextDecision);
    setReason(reasonByDecision[nextDecision]);
    setSaveState("idle");
  };

  const applyAgentDraft = () => {
    if (agentDraft.purpose) setPurpose(agentDraft.purpose);
    if (agentDraft.aiQuestion) setAiQuestion(agentDraft.aiQuestion);
    if (agentDraft.aiSummary) setAiSummary(agentDraft.aiSummary);
    if (agentDraft.decision) setDecision(agentDraft.decision);
    if (agentDraft.reason) setReason(agentDraft.reason);
    if (agentDraft.learned) setLearned(agentDraft.learned);
    if (agentDraft.changed) setChanged(agentDraft.changed);
    if (agentDraft.remainingQuestion) {
      setRemainingQuestion(agentDraft.remainingQuestion);
    }
    setSaveState("idle");
  };

  const useAiAnswer = async (selection: AiUseSelection) => {
    const nextDraft: WorkspaceDraft = {
      ...draft,
      aiQuestion: selection.question,
      aiSummary: selection.text,
      aiProvider: selection.provider,
      aiModel: selection.model,
      aiRequestId: selection.requestId,
      decision: "revise",
      reason: reasonByDecision.revise,
    };
    const saved = await persistDraft(2, nextDraft);
    if (!saved) return false;

    setAiQuestion(selection.question);
    setAiSummary(selection.text);
    setAiProvider(selection.provider);
    setAiModel(selection.model);
    setAiRequestId(selection.requestId);
    setDecision("revise");
    setReason(reasonByDecision.revise);
    setActiveStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  };

  const goToStep = async (step: number) => {
    if (step === activeStep || saveState === "saving") return;
    const saved = await persistDraft(step);
    if (!saved) return;
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextStep = Math.min(activeStep + 1, proofprintSteps.length - 1);
    const saved = await persistDraft(nextStep);
    if (!saved) return;
    if (activeStep < proofprintSteps.length - 1) {
      setActiveStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(`${proofprintBase}/workspace/result`);
    }
  };

  return (
    <>
      <div className={styles.workspaceHeader}>
        <h1>{assignment.title}</h1>
        <span className={styles.draftBadge}>임시저장됨 · {formatSavedAt(updatedAt)}</span>
        {agentDraft.sourceCount > 0 ? (
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={applyAgentDraft}
          >
            Agent 기록 {agentDraft.sourceCount}개로 초안 채우기
          </button>
        ) : null}
      </div>

      <ol className={styles.stepper} aria-label="Proofprint 작성 단계">
        {proofprintSteps.map((step, index) => {
          const isActive = activeStep === index;
          const isComplete = index < activeStep;

          return (
            <li
              key={step}
              className={`${isActive ? styles.activeStep : ""} ${
                isComplete ? styles.completeStep : ""
              }`}
              aria-current={isActive ? "step" : undefined}
            >
              <button
                type="button"
                disabled={saveState === "saving"}
                onClick={() => void goToStep(index)}
                aria-label={`${index + 1}단계 ${step}`}
              >
                <span className={styles.stepNumber}>
                  {isComplete ? <Check size={17} weight="bold" aria-hidden="true" /> : index + 1}
                </span>
                <span className={styles.stepLabel}>{step}</span>
              </button>
              {index < proofprintSteps.length - 1 && (
                <span className={styles.stepLine} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>

      <form id="proofprint-workspace-form" onSubmit={handleSubmit}>
        <div className={styles.workspaceGrid}>
          <section className={styles.decisionPanel} aria-labelledby="workspace-step-title">
            {activeStep === 0 && (
              <div className={styles.stepContent}>
                <span className={styles.stepKicker}>1단계</span>
                <h2 id="workspace-step-title">이번 과제에서 무엇을 배우고 싶나요?</h2>
                <p className={styles.sectionIntro}>
                  교수자가 제시한 목표를 확인하고, 나만의 학습목표를 한 문장으로 적어 주세요.
                </p>
                <div className={styles.goalCallout}>
                  <span>수업 학습목표</span>
                  <strong>{assignment.courseGoal}</strong>
                </div>
                <div className={styles.formField}>
                  <label htmlFor={personalGoalId}>나의 학습목표</label>
                  <textarea
                    id={personalGoalId}
                    value={personalGoal}
                    onChange={(event) => setPersonalGoal(event.target.value)}
                    rows={4}
                    maxLength={300}
                  />
                  <span className={styles.fieldHint}>“~할 수 있다” 형태로 작성하면 좋아요.</span>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className={styles.stepContent}>
                <span className={styles.stepKicker}>2단계</span>
                <h2 id="workspace-step-title">AI를 어떤 목적으로 활용했나요?</h2>
                <p className={styles.sectionIntro}>
                  실제 과제에 연결된 목적과 AI에게 확인한 내용을 요약합니다.
                </p>
                <fieldset className={styles.purposeFieldset}>
                  <legend>AI 사용 목적</legend>
                  <div className={styles.chipGroup}>
                    {purposeOptions.map((option) => (
                      <button
                        className={purpose === option ? styles.selectedChip : undefined}
                        type="button"
                        aria-pressed={purpose === option}
                        onClick={() => setPurpose(option)}
                        key={option}
                      >
                        {purpose === option && <Check size={15} weight="bold" aria-hidden="true" />}
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <CnuAiAssistant
                  workspaceId={initialWorkspace.workspaceId}
                  purpose={purpose}
                  initialQuestion={aiQuestion}
                  initialMode={initialAiMode}
                  onUse={useAiAnswer}
                />
              </div>
            )}

            {activeStep === 2 && (
              <div className={styles.stepContent}>
                <section aria-labelledby="ai-suggestion-title">
                  <h2 id="workspace-step-title">AI 제안</h2>
                  <div className={styles.suggestionBox}>
                    <p>{aiSummary}</p>
                    <span>
                      AI 제안 요지
                      {aiModel ? ` · ${aiModel}` : ""}
                      {aiProvider === "demo" ? " · 연동 데모" : ""}
                    </span>
                  </div>
                </section>

                <fieldset className={styles.decisionFieldset}>
                  <legend>이 제안을 어떻게 활용했나요?</legend>
                  <div className={styles.segmentedControl}>
                    {decisionOptions.map((option) => {
                      const isSelected = decision === option.value;
                      return (
                        <button
                          key={option.value}
                          className={isSelected ? styles.selectedDecision : undefined}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => chooseDecision(option.value)}
                        >
                          <span>{option.label}</span>
                          {isSelected && (
                            <CheckCircle size={23} weight="fill" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <div className={styles.formField}>
                  <label htmlFor={reasonId}>
                    판단 이유 <span>(필수)</span>
                  </label>
                  <textarea
                    id={reasonId}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={300}
                    rows={4}
                    required
                  />
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className={styles.stepContent}>
                <span className={styles.stepKicker}>4단계</span>
                <h2 id="workspace-step-title">무엇을 배우고, 생각이 어떻게 달라졌나요?</h2>
                <p className={styles.sectionIntro}>
                  완성된 문장보다 이번 판단을 통해 생긴 변화를 짧고 구체적으로 적어 주세요.
                </p>
                <div className={styles.reflectionGrid}>
                  <div className={styles.formField}>
                    <label htmlFor={learnedId}>배운 점</label>
                    <textarea
                      id={learnedId}
                      value={learned}
                      onChange={(event) => setLearned(event.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor={changedId}>생각이 달라진 부분</label>
                    <textarea
                      id={changedId}
                      value={changed}
                      onChange={(event) => setChanged(event.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label htmlFor={questionId}>남은 질문</label>
                    <textarea
                      id={questionId}
                      value={remainingQuestion}
                      onChange={(event) => setRemainingQuestion(event.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className={styles.stepContent}>
                <span className={styles.stepKicker}>5단계</span>
                <h2 id="workspace-step-title">Proofprint를 만들 준비가 됐어요</h2>
                <p className={styles.sectionIntro}>
                  공개 범위와 핵심 내용을 확인한 뒤 1페이지 결과물을 생성합니다.
                </p>
                <div className={styles.reviewList}>
                  <ReviewRow label="나의 학습목표" value={personalGoal} />
                  <ReviewRow label="AI 사용 목적" value={purpose} />
                  <ReviewRow
                    label="AI 제안 판단"
                    value={`${decisionOptions.find((option) => option.value === decision)?.label} · ${reason}`}
                  />
                  <ReviewRow label="배운 점" value={learned} />
                  <ReviewRow label="남은 질문" value={remainingQuestion} />
                </div>
                <div className={styles.readyNotice}>
                  <CheckCircle size={24} weight="fill" aria-hidden="true" />
                  <div>
                    <strong>필수 항목을 모두 작성했습니다</strong>
                    <span>결과 화면에서 공개 범위를 한 번 더 확인할 수 있어요.</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className={styles.checkpointPanel} aria-labelledby="checkpoint-title">
            <h2 id="checkpoint-title">이번 체크포인트</h2>
            <dl className={styles.summaryList}>
              {activeStep !== 2 && (
                <div>
                  <dt>현재 단계</dt>
                  <dd>
                    {activeStep + 1}. {proofprintSteps[activeStep]}
                  </dd>
                </div>
              )}
              <div>
                <dt>연결된 학습목표</dt>
                <dd>{assignment.courseGoal}</dd>
              </div>
              {activeStep === 2 && (
                <div>
                  <dt>목적</dt>
                  <dd>{purpose}</dd>
                </div>
              )}
              <div>
                <dt>개인정보 공개 설정</dt>
                <dd>
                  <button
                    className={styles.privacyButton}
                    type="button"
                    aria-expanded={privacyOpen}
                    onClick={() => setPrivacyOpen((open) => !open)}
                  >
                    <LockKey size={18} weight="bold" aria-hidden="true" /> 원문 비공개
                  </button>
                  {privacyOpen && (
                    <span className={styles.privacyDetails}>
                      프롬프트와 응답 원문은 Proofprint에 포함되지 않습니다.
                    </span>
                  )}
                </dd>
              </div>
            </dl>

            {activeStep !== 2 && (
              <div className={styles.guidanceBox}>
                <Lightbulb size={22} weight="fill" aria-hidden="true" />
                <div>
                  <strong>{stepGuidance[activeStep].title}</strong>
                  <p>{stepGuidance[activeStep].body}</p>
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.secondaryAction}
                type="button"
                disabled={activeStep === 0}
                onClick={() => void goToStep(Math.max(0, activeStep - 1))}
              >
                <ArrowLeft size={17} weight="bold" aria-hidden="true" /> 이전
              </button>
              <button
                className={styles.primaryAction}
                type="submit"
                disabled={saveState === "saving"}
              >
                {saveState === "saving" ? (
                  "저장 중..."
                ) : activeStep === proofprintSteps.length - 1 ? (
                  <>
                    <FileText size={19} weight="bold" aria-hidden="true" /> Proofprint 만들기
                  </>
                ) : (
                  <>
                    저장하고 다음 <ArrowRight size={18} weight="bold" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
            <Link className={styles.deferLink} href={proofprintBase}>
              나중에 이어서 작성
            </Link>
          </aside>
        </div>
      </form>

      <div
        className={`${styles.statusToast} ${
          saveState === "saved" || saveState === "error" ? styles.visibleToast : ""
        } ${saveState === "error" ? styles.errorToast : ""}`}
        role="status"
        aria-live="polite"
      >
        {saveState === "error" ? (
          <span>{saveError}</span>
        ) : (
          <>
            <CheckCircle size={22} weight="fill" aria-hidden="true" />
            <span>현재 단계가 서버에 저장되었습니다.</span>
          </>
        )}
      </div>
    </>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}
