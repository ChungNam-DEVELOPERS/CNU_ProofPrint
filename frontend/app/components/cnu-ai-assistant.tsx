"use client";

import { ArrowSquareOut } from "@phosphor-icons/react/ArrowSquareOut";
import { ChatCircleDots } from "@phosphor-icons/react/ChatCircleDots";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Coins } from "@phosphor-icons/react/Coins";
import { PaperPlaneTilt } from "@phosphor-icons/react/PaperPlaneTilt";
import { ShieldCheck } from "@phosphor-icons/react/ShieldCheck";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import { useState } from "react";
import type {
  AiModelAlias,
  AiProvider,
  AiPurpose,
} from "../lib/proofprint-api";
import styles from "../proofprint.module.css";

export type AiUseSelection = {
  question: string;
  text: string;
  provider: AiProvider;
  model: string;
  requestId: string;
};

type GenerationState = "idle" | "streaming" | "ready" | "applying" | "error";

const modelOptions: Array<{
  value: AiModelAlias;
  label: string;
  description: string;
}> = [
  { value: "auto", label: "CNU 추천", description: "질문에 맞는 모델 자동 선택" },
  { value: "gpt", label: "GPT 계열", description: "요구사항과 구조화" },
  { value: "claude", label: "Claude 계열", description: "긴 맥락과 비판적 검토" },
  { value: "gemini", label: "Gemini 계열", description: "자료·아이디어 확장" },
];

const promptSuggestions = [
  "이 문제의 핵심 사용자와 요구사항을 3가지로 정리해 줘.",
  "제안한 기능에서 개인정보나 구현상 위험을 찾아 줘.",
  "한 학기 안에 구현할 MVP 기능의 우선순위를 제안해 줘.",
];

export function CnuAiAssistant({
  workspaceId,
  purpose,
  initialQuestion,
  initialMode,
  onUse,
}: {
  workspaceId: string;
  purpose: AiPurpose;
  initialQuestion: string;
  initialMode: "demo" | "connector";
  onUse: (selection: AiUseSelection) => Promise<boolean>;
}) {
  const [model, setModel] = useState<AiModelAlias>("auto");
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState("");
  const [state, setState] = useState<GenerationState>("idle");
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState<{
    provider: AiProvider;
    model: string;
    requestId: string;
    creditsUsed: string;
  } | null>(null);

  async function generateAnswer() {
    const normalizedQuestion = question.trim();
    if (!normalizedQuestion) {
      setError("AI에게 확인할 내용을 입력해 주세요.");
      setState("error");
      return;
    }

    setState("streaming");
    setAnswer("");
    setMetadata(null);
    setError("");

    try {
      const response = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          purpose,
          model,
          message: normalizedQuestion,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(payload?.error?.message ?? "AI 답변을 생성하지 못했습니다.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("AI 답변 스트림을 열지 못했습니다.");
      const decoder = new TextDecoder();
      let received = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });
        setAnswer(received);
      }
      received += decoder.decode();
      setAnswer(received);
      setMetadata({
        provider:
          response.headers.get("x-cnu-ai-provider") === "cnu_multillm"
            ? "cnu_multillm"
            : "demo",
        model: response.headers.get("x-cnu-ai-model") ?? model,
        requestId: response.headers.get("x-cnu-ai-request-id") ?? "unknown",
        creditsUsed: response.headers.get("x-cnu-ai-credits-used") ?? "unknown",
      });
      setState("ready");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI 답변을 생성하지 못했습니다.");
      setState("error");
    }
  }

  async function applyAnswer() {
    if (!answer || !metadata) return;
    setState("applying");
    const applied = await onUse({
      question: question.trim(),
      text: answer.trim(),
      provider: metadata.provider,
      model: metadata.model,
      requestId: metadata.requestId,
    });
    setState("ready");
    if (!applied) setError("답변을 작업공간에 저장하지 못했습니다. 다시 시도해 주세요.");
  }

  return (
    <section className={styles.aiAssistant} aria-labelledby="cnu-ai-title">
      <header className={styles.aiAssistantHeader}>
        <span className={styles.aiAssistantIcon} aria-hidden="true">
          <ChatCircleDots size={24} weight="fill" />
        </span>
        <div>
          <div className={styles.aiAssistantTitleLine}>
            <h3 id="cnu-ai-title">CNU 멀티LLM과 함께 탐색</h3>
            <span className={initialMode === "connector" ? styles.aiLiveBadge : styles.aiDemoBadge}>
              {initialMode === "connector" ? "학교 계정 연결" : "연동 데모"}
            </span>
          </div>
          <p>과제 안에서 질문하고, 사용할 답변만 Proofprint 판단 단계로 가져옵니다.</p>
        </div>
        <a
          className={styles.aiPortalLink}
          href="https://aiportal.cnu.ac.kr/"
          target="_blank"
          rel="noreferrer"
        >
          AI 포털 <ArrowSquareOut size={14} weight="bold" aria-hidden="true" />
        </a>
      </header>

      <div className={styles.aiCreditNotice}>
        <Coins size={18} weight="fill" aria-hidden="true" />
        <div>
          <strong>매월 5,000 CNU 크레딧</strong>
          <span>실제 잔여량은 학교 커넥터 승인 후 이 화면에 표시됩니다.</span>
        </div>
      </div>

      <fieldset className={styles.aiModelFieldset}>
        <legend>사용할 모델</legend>
        <div className={styles.aiModelOptions}>
          {modelOptions.map((option) => (
            <button
              className={model === option.value ? styles.selectedAiModel : undefined}
              type="button"
              aria-pressed={model === option.value}
              onClick={() => setModel(option.value)}
              key={option.value}
            >
              <strong>{option.label}</strong>
              <span>{option.description}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.aiPromptSuggestions} aria-label="추천 질문">
        {promptSuggestions.map((suggestion) => (
          <button type="button" onClick={() => setQuestion(suggestion)} key={suggestion}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className={styles.aiComposer}>
        <label htmlFor="cnu-ai-question">AI에게 확인할 내용</label>
        <textarea
          id="cnu-ai-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="해결하려는 문제, 현재 아이디어, 검토받고 싶은 관점을 적어 주세요."
        />
        <div>
          <span>{question.length} / 2,000</span>
          <button
            type="button"
            disabled={state === "streaming" || state === "applying"}
            onClick={() => void generateAnswer()}
          >
            <PaperPlaneTilt size={17} weight="fill" aria-hidden="true" />
            {state === "streaming" ? "답변 생성 중..." : "AI에게 질문"}
          </button>
        </div>
      </div>

      {(answer || state === "streaming") && (
        <section className={styles.aiResponse} aria-label="AI 답변" aria-live="polite">
          <div className={styles.aiResponseHeading}>
            <span><Sparkle size={16} weight="fill" aria-hidden="true" /> AI 답변</span>
            {metadata && <small>{metadata.model}</small>}
          </div>
          <p>{answer || "질문을 분석하고 있습니다…"}</p>
          {state === "ready" && metadata && (
            <div className={styles.aiResponseActions}>
              <span>
                {metadata.provider === "demo" ? "데모 응답" : "CNU 멀티LLM"}
                {metadata.creditsUsed !== "unknown"
                  ? metadata.provider === "demo"
                    ? ` · 예상 ${metadata.creditsUsed} 크레딧`
                    : ` · ${metadata.creditsUsed} 크레딧`
                  : ""}
              </span>
              <button type="button" onClick={() => void applyAnswer()}>
                <CheckCircle size={18} weight="fill" aria-hidden="true" />
                이 답변을 Proofprint에서 검토
              </button>
            </div>
          )}
        </section>
      )}

      {error && <p className={styles.aiError} role="alert">{error}</p>}

      <p className={styles.aiPrivacyNote}>
        <ShieldCheck size={15} weight="fill" aria-hidden="true" />
        대화가 자동 제출되지는 않습니다. 학생이 ‘검토’를 선택한 질문과 답변만 AI 제안 요지로 저장됩니다.
      </p>
    </section>
  );
}
