import "server-only";

import {
  aiModelAliases,
  aiPurposes,
  type AiModelAlias,
  type AiPurpose,
} from "../../lib/proofprint-api";
import { ValidationError } from "../errors";

export type AiAssistInput = {
  workspaceId: string;
  model: AiModelAlias;
  purpose: AiPurpose;
  message: string;
};

export function parseAiAssistInput(value: unknown): AiAssistInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("AI 요청 형식이 올바르지 않습니다.");
  }
  const input = value as Record<string, unknown>;
  const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";

  if (!workspaceId || workspaceId.length > 200) {
    throw new ValidationError("작업공간 정보가 올바르지 않습니다.");
  }
  if (!message || message.length > 2_000) {
    throw new ValidationError("AI 질문은 1자 이상 2,000자 이하로 입력해 주세요.");
  }
  if (!aiModelAliases.includes(input.model as AiModelAlias)) {
    throw new ValidationError("지원하지 않는 모델 선택입니다.");
  }
  if (!aiPurposes.includes(input.purpose as AiPurpose)) {
    throw new ValidationError("지원하지 않는 AI 사용 목적입니다.");
  }

  return {
    workspaceId,
    model: input.model as AiModelAlias,
    purpose: input.purpose as AiPurpose,
    message,
  };
}
