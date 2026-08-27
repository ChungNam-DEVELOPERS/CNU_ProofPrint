import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * 모델 접근 경로. 학교 게이트웨이가 Anthropic 네이티브 Messages API 를 그대로
 * 제공하므로 baseURL 만 바꿔 같은 SDK 를 쓴다. 도구 호출과 adaptive thinking 이
 * 게이트웨이에서도 동작하는 것을 확인했다.
 */
export function resolveModelAccess(): { client: Anthropic; model: string } | null {
  const gatewayUrl = process.env.CNU_LLM_BASE_URL?.trim();
  const gatewayToken = process.env.CNU_MULTI_LLM_CONNECTOR_TOKEN?.trim();

  if (gatewayUrl && gatewayToken) {
    return {
      client: new Anthropic({ baseURL: gatewayUrl, apiKey: gatewayToken }),
      model: process.env.CNU_LLM_MODEL?.trim() || "claude-sonnet-5",
    };
  }

  if (process.env.ANTHROPIC_API_KEY?.trim() || process.env.ANTHROPIC_AUTH_TOKEN?.trim()) {
    return {
      client: new Anthropic(),
      model: process.env.CNU_LLM_MODEL?.trim() || "claude-opus-5",
    };
  }

  return null;
}
