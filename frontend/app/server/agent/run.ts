import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { listGaps, listMessages } from "../learning-repository";
import { appendMessage, recordToolCall } from "../learning-writes";
import { getDb } from "../db";
import { buildTools, type ToolTrace } from "./tools";

const MODEL = "claude-opus-5";

/** 설명을 듣고 이만큼 지나서 되물으면 «바로 이해하지는 못했다» 는 신호로 본다. */
const SLOW_REPLY_SECONDS = 90;

const CONFUSION = /모르겠|모르겠어|이해가 안|이해를 못|잘 안 |헷갈|다시 설명|무슨 뜻|뭐였|어렵|감이 안/;

const SYSTEM = `너는 대학생의 학습 파트너다. 한국어로, 군더더기 없이 답한다.

도구는 필요할 때만 쓴다. 매 턴 전부 부르지 않는다.
대부분의 턴은 도구 없이 답만 하면 되고, 아래 조건이 맞을 때만 도구를 부른다.

1. get_state — 학생이 어디까지 아는지에 따라 답이 달라질 때, 또는 무언가를 기록하기 직전에.
2. read_material — 학생이 올린 자료로 답할 수 있을 때.
3. log_evidence — 이해도의 근거가 될 일이 실제로 생겼을 때.
   이해도 값은 네가 정하지 못한다. 무슨 일이 있었는지만 기록하면 서버가 계산한다.
   네가 설명해 준 것만으로는 이해도가 올라가지 않는다.
   학생이 자기 말로 정확히 설명했을 때만 self_explained 로 기록한다.
4. record_gap — 학생이 «실제로 막혔다» 는 신호가 있을 때만. 신호는 매 턴 [학습 신호] 로 알려준다.
   개념이 처음 나왔다는 이유만으로는 남기지 않는다. 한 번 듣고 바로 이해했으면 남기지 않는다.
   남길 때는 학생에게 시키지 말고 네가 남긴다. 한 턴에 하나까지.
5. update_syllabus — 목차에 없는 주제가 나왔을 때만. 매 턴 목차를 재구성하지 않는다.

설명만 해 주고 끝내지 않는다. 설명한 뒤에는 학생이 자기 말로 다시 설명해 보게 한다.
학생이 틀렸을 때는 정답만 던지지 말고, 어디서 어긋났는지 짚어 준다.`;

function hasCredentials() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * 이번 턴에 «막힘» 신호가 있었는지 실제로 재서 알려준다.
 * 모델이 짐작하지 않게, 잰 값만 넘긴다.
 */
async function measureStudySignals(workspaceId: string, userText: string) {
  const sql = getDb();
  const [last] = await sql<
    Array<{ role: "user" | "agent"; created_at: Date }>
  >`
    select role, created_at from messages
    where workspace_id = ${workspaceId}
    order by created_at desc limit 1
  `;

  const notes: string[] = [];

  if (last?.role === "agent") {
    const seconds = Math.round((Date.now() - last.created_at.getTime()) / 1000);
    if (seconds >= SLOW_REPLY_SECONDS) {
      const minutes = Math.floor(seconds / 60);
      notes.push(
        `직전 설명 이후 ${minutes}분 만에 되물었다 (slow_to_grasp 신호).`,
      );
    }
  }

  if (CONFUSION.test(userText)) {
    notes.push("학생이 모르겠다는 표현을 직접 썼다 (explicit_confusion 신호).");
  }

  const gaps = await listGaps(workspaceId);
  const repeated = gaps.find(
    (gap) => gap.status !== "resolved" && userText.includes(gap.term),
  );
  if (repeated) {
    notes.push(
      `이미 오답노트에 있는 «${repeated.term}» 을(를) 다시 물었다 (repeat_question 신호).`,
    );
  }

  return notes.length > 0
    ? `[학습 신호] ${notes.join(" ")}`
    : "[학습 신호] 지연이나 되물음 없음. 이 턴만으로는 record_gap 을 부를 근거가 없다. " +
        "학생의 설명이 실제로 어긋난 경우에만 incorrect_explanation 으로 남긴다.";
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
  // 사용자 메시지를 넣기 전에 재야 «직전 답변 이후 얼마나 걸렸는지» 가 나온다.
  const signalLine = await measureStudySignals(workspaceId, userText);
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

  // 잰 신호는 대화 본문이 아니라 운영자 채널로 넣는다.
  messages.push({ role: "system", content: signalLine });

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
