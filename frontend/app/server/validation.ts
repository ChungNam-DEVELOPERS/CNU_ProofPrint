import "server-only";

import {
  type AiProvider,
  aiPurposes,
  type Decision,
  type DisclosureSettings,
  type SaveWorkspaceInput,
  type SubmitWorkspaceInput,
  type UpdateDisclosureInput,
  type WorkspaceDraft,
} from "../lib/proofprint-api";
import { ValidationError } from "./errors";

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} 형식이 올바르지 않습니다.`);
  }
  return value as Record<string, unknown>;
}

function asString(
  value: unknown,
  label: string,
  maxLength: number,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${label}을(를) 입력해 주세요.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new ValidationError(`${label}은(는) ${maxLength}자 이하여야 합니다.`);
  }
  return normalized;
}

function asRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new ValidationError("revision 값이 올바르지 않습니다.");
  }
  return value as number;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new ValidationError(`${label} 값이 올바르지 않습니다.`);
  }
  return value;
}

function asNullableString(value: unknown, label: string, maxLength: number) {
  if (value === null || value === undefined || value === "") return null;
  return asString(value, label, maxLength);
}

function parseDraft(value: unknown): WorkspaceDraft {
  const draft = asRecord(value, "학습과정 기록");
  const purpose = asString(draft.purpose, "AI 사용 목적", 30);
  if (!aiPurposes.includes(purpose as (typeof aiPurposes)[number])) {
    throw new ValidationError("지원하지 않는 AI 사용 목적입니다.");
  }

  const decision = draft.decision;
  if (!(["adopt", "revise", "reject"] as const).includes(decision as Decision)) {
    throw new ValidationError("채택·수정·폐기 중 하나를 선택해 주세요.");
  }

  const aiProvider = draft.aiProvider;
  if (!(["manual", "demo", "cnu_multillm"] as const).includes(aiProvider as AiProvider)) {
    throw new ValidationError("AI 제공자 정보가 올바르지 않습니다.");
  }

  return {
    personalGoal: asString(draft.personalGoal, "나의 학습목표", 1000),
    purpose: purpose as WorkspaceDraft["purpose"],
    aiQuestion: asString(draft.aiQuestion, "AI에게 확인한 내용", 2000),
    aiSummary: asString(draft.aiSummary, "AI 제안 요지", 4000),
    aiProvider: aiProvider as AiProvider,
    aiModel: asNullableString(draft.aiModel, "AI 모델", 100),
    aiRequestId: asNullableString(draft.aiRequestId, "AI 요청 식별자", 200),
    decision: decision as Decision,
    reason: asString(draft.reason, "판단 이유", 2000),
    learned: asString(draft.learned, "배운 점", 3000),
    changed: asString(draft.changed, "생각이 달라진 부분", 3000),
    remainingQuestion: asString(draft.remainingQuestion, "남은 질문", 3000),
  };
}

function parseDisclosure(value: unknown): DisclosureSettings {
  const disclosure = asRecord(value, "공개 범위");
  const shareRaw = asBoolean(disclosure.shareRaw, "원문 공개");
  if (shareRaw) {
    throw new ValidationError("파일럿에서는 프롬프트와 응답 원문을 공개할 수 없습니다.");
  }

  return {
    sharePurpose: asBoolean(disclosure.sharePurpose, "AI 활용 공개"),
    shareJudgment: asBoolean(disclosure.shareJudgment, "판단 공개"),
    shareReflection: asBoolean(disclosure.shareReflection, "학습 변화 공개"),
    shareRaw: false,
  };
}

export function parseSaveWorkspaceInput(value: unknown): SaveWorkspaceInput {
  const input = asRecord(value, "요청");
  const currentStep = input.currentStep;
  if (!Number.isInteger(currentStep) || (currentStep as number) < 0 || (currentStep as number) > 4) {
    throw new ValidationError("작성 단계는 0부터 4 사이여야 합니다.");
  }
  return {
    revision: asRevision(input.revision),
    currentStep: currentStep as number,
    draft: parseDraft(input.draft),
  };
}

export function parseUpdateDisclosureInput(value: unknown): UpdateDisclosureInput {
  const input = asRecord(value, "요청");
  return {
    revision: asRevision(input.revision),
    disclosure: parseDisclosure(input.disclosure),
  };
}

export function parseSubmitWorkspaceInput(value: unknown): SubmitWorkspaceInput {
  const input = asRecord(value, "요청");
  return { revision: asRevision(input.revision) };
}

export async function readJsonRequest(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("JSON 요청 본문을 확인해 주세요.");
  }
}
