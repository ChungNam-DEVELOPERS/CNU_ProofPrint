import "server-only";

import { randomUUID } from "node:crypto";
import type {
  AiModelAlias,
  AiProvider,
  AiPurpose,
  WorkspaceResource,
} from "../../lib/proofprint-api";
import type { ServerActor } from "../auth";
import { IntegrationError, ServiceUnavailableError } from "../errors";

export type CnuAiMode = "demo" | "connector";

export type CnuAiAssistanceInput = {
  actor: ServerActor;
  workspace: WorkspaceResource;
  model: AiModelAlias;
  purpose: AiPurpose;
  message: string;
};

export type CnuAiAssistanceResult = {
  text: string;
  provider: AiProvider;
  modelId: string;
  requestId: string;
  creditsUsed: number | null;
};

type ConnectorResponse = {
  text?: unknown;
  model?: unknown;
  requestId?: unknown;
  creditsUsed?: unknown;
};

export function getCnuAiMode(): CnuAiMode {
  return process.env.CNU_MULTI_LLM_CONNECTOR_URL &&
    process.env.CNU_MULTI_LLM_CONNECTOR_TOKEN
    ? "connector"
    : "demo";
}

function demoModelId(model: AiModelAlias) {
  return model === "auto" ? "cnu-auto" : `cnu-${model}-family`;
}

function buildDemoResponse(input: CnuAiAssistanceInput) {
  const focus = {
    auto: "사용자 가치와 구현 가능성을 함께 기준으로",
    gpt: "요구사항과 MVP 우선순위를 중심으로",
    claude: "이해관계자와 위험 요소를 중심으로",
    gemini: "공간·센서 데이터 활용 가능성을 중심으로",
  }[input.model];

  return `${focus} 아이디어를 정리했습니다.

1. 핵심 기능: 도서관 좌석과 스터디룸의 현재 이용 가능 여부를 한 화면에서 확인하고, 예약 가능한 공간은 사이버캠퍼스 계정으로 연결합니다.
2. 데이터 방식: 상시 위치 추적 대신 사용자의 자발적 체크인·체크아웃과 익명 혼잡도 집계를 사용합니다.
3. MVP 범위: 좌석 현황, 스터디룸 예약 링크, 혼잡 시간 안내를 먼저 구현하고 개인화 추천은 후순위로 둡니다.

검토할 쟁점은 참여자가 적을 때 정보가 부정확해질 수 있다는 점입니다. 체크인 보상, 일정 시간 후 자동 만료, 관리자 표본 확인을 함께 설계하는 것이 좋습니다.`;
}

async function callConnector(
  input: CnuAiAssistanceInput,
): Promise<CnuAiAssistanceResult> {
  const url = process.env.CNU_MULTI_LLM_CONNECTOR_URL;
  const token = process.env.CNU_MULTI_LLM_CONNECTOR_TOKEN;
  if (!url || !token) {
    throw new ServiceUnavailableError(
      "학교 멀티LLM 커넥터의 URL과 서비스 인증 정보가 필요합니다.",
    );
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "2026-08-25",
        actor: { subject: input.actor.externalSubject },
        modelAlias: input.model,
        task: {
          purpose: input.purpose,
          message: input.message,
          course: input.workspace.course.displayTitle,
          assignment: input.workspace.assignment.title,
          learningGoal: input.workspace.assignment.courseGoal,
        },
        privacy: {
          persistRawConversation: false,
          returnUsage: true,
        },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    console.error("CNU multi-LLM connector request failed", error);
    throw new IntegrationError();
  }

  if (!response.ok) {
    console.error("CNU multi-LLM connector rejected request", response.status);
    throw new IntegrationError();
  }

  const payload = (await response.json().catch(() => null)) as ConnectorResponse | null;
  if (!payload || typeof payload.text !== "string" || payload.text.trim().length === 0) {
    throw new IntegrationError("학교 AI 서비스의 응답 형식이 올바르지 않습니다.");
  }

  return {
    text: payload.text.trim().slice(0, 4_000),
    provider: "cnu_multillm",
    modelId:
      typeof payload.model === "string" && payload.model.trim()
        ? payload.model.trim().slice(0, 100)
        : input.model,
    requestId:
      typeof payload.requestId === "string" && payload.requestId.trim()
        ? payload.requestId.trim().slice(0, 200)
        : randomUUID(),
    creditsUsed:
      typeof payload.creditsUsed === "number" && Number.isFinite(payload.creditsUsed)
        ? Math.max(0, payload.creditsUsed)
        : null,
  };
}

export async function generateCnuAiAssistance(
  input: CnuAiAssistanceInput,
): Promise<CnuAiAssistanceResult> {
  if (getCnuAiMode() === "connector") return callConnector(input);

  return {
    text: buildDemoResponse(input),
    provider: "demo",
    modelId: demoModelId(input.model),
    requestId: `demo-${randomUUID()}`,
    creditsUsed: 1,
  };
}
