import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { listMessages } from "../learning-repository";
import { appendMessage, recordToolCall } from "../learning-writes";
import { getDb } from "../db";
import { buildTools, type ToolTrace } from "./tools";

const MODEL = "claude-opus-5";

const SYSTEM = `너는 대학생의 학습 파트너다. 한국어로, 군더더기 없이 답한다.

지켜야 할 것:
1. 답하기 전에 get_state 로 지금 목차와 이해도, 오답노트를 먼저 확인한다.
2. 학생이 올린 자료로 답할 수 있으면 read_material 을 먼저 쓴다.
3. 설명만 해 주고 끝내지 않는다. 설명한 뒤에는 학생이 자기 말로 다시 설명해 보게 한다.
4. 이해도를 네가 직접 정하지 않는다. log_evidence 로 무슨 일이 있었는지만 기록하면
   서버가 상태를 계산한다. 네가 설명해 준 것만으로는 이해도가 올라가지 않는다.
   학생이 직접 정확히 설명했을 때만 self_explained 로 기록한다.
5. 학생이 몰랐던 개념은 record_gap 으로 오답노트에 키워드로 남긴다.
   외워야 넘어갈 수 있는 개념·공식·정리·용어만 남기고, 계산 실수나 오타는 남기지 않는다.
   학생에게 "오답노트에 적어두라"고 시키지 않는다. 네가 남긴다.
6. 목차에 없는 주제가 나오면 update_syllabus 로 추가한다. 매 턴 목차를 재구성하지 않는다.

학생이 틀렸을 때는 정답만 던지지 말고, 어디서 어긋났는지 짚어 준다.`;

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export type AgentRunResult = {
  mode: "live" | "no_credentials";
  reply: string;
  trace: ToolTrace[];
};

/** 이번 턴에 쌓인 도구 호출을 방금 만든 답변 메시지에 붙인다. */
async function attachToolCalls(workspaceId: string, messageId: string) {
  const sql = getDb();
  await sql`
    update tool_calls set message_id = ${messageId}
    where workspace_id = ${workspaceId} and message_id is null
  `;
}

export async function runAgentTurn(
  workspaceId: string,
  userText: string,
): Promise<AgentRunResult> {
  await appendMessage(workspaceId, "user", userText);

  if (!hasCredentials()) {
    const reply =
      "지금은 학교 AI 연결이 설정되지 않아 답변을 만들 수 없습니다. " +
      "ANTHROPIC_API_KEY 를 설정하면 에이전트가 목차와 오답노트를 직접 갱신합니다.";
    await appendMessage(workspaceId, "agent", reply);
    return { mode: "no_credentials", reply, trace: [] };
  }

  const history = await listMessages(workspaceId);
  const messages: Anthropic.MessageParam[] = history.map((message) => ({
    role: message.role === "agent" ? "assistant" : "user",
    content: message.paragraphs.join("\n\n"),
  }));

  const client = new Anthropic();
  const trace: ToolTrace[] = [];

  const runner = client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    tools: [
      ...buildTools(workspaceId, trace),
      { type: "web_search_20260209", name: "web_search", max_uses: 3 },
    ],
    messages,
  });

  for await (const message of runner) {
    // 서버 도구가 길어지면 pause_turn 으로 끊긴다. 이어서 돌려준다.
    if (message.stop_reason === "pause_turn") {
      runner.pushMessages({ role: "assistant", content: message.content });
      continue;
    }

    for (const block of message.content) {
      if (block.type === "server_tool_use" && block.name === "web_search") {
        const query = (block.input as { query?: string })?.query ?? "";
        trace.push({ tool: "web_search", summary: `«${query}» 을(를) 검색했습니다.` });
        await recordToolCall(
          workspaceId,
          null,
          "web_search",
          `«${query}» 을(를) 검색했습니다.`,
          block.input,
          {},
        );
      }
    }
  }

  const final = await runner.done();
  const reply = final.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text.trim())
    .filter(Boolean)
    .join("\n\n");

  const messageId = await appendMessage(
    workspaceId,
    "agent",
    reply || "답변을 만들지 못했습니다.",
  );
  await attachToolCalls(workspaceId, messageId);

  return { mode: "live", reply, trace };
}
