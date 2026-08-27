import "server-only";

import { getTopicTree } from "../learning-repository";
import { flattenTopics } from "../../lib/learning";
import { buildTools, type ToolTrace } from "./tools";
import { resolveModelAccess } from "./access";

const SYSTEM = `너는 학생의 목차를 정리하는 조수다. 한국어로 답한다.

지금 워크스페이스의 목차를 보고, 빠졌거나 잘못 놓인 항목만 고친다.
- get_state 로 지금 목차와 오답노트를 먼저 확인한다.
- 오답노트에 있는데 목차에 없는 개념이 있으면 update_syllabus 로 추가한다.
- 제목이 모호하면 rename 한다.
- 고칠 게 없으면 아무 도구도 부르지 말고 «고칠 것이 없습니다» 라고만 답한다.
- 목차를 통째로 다시 짜지 않는다. 한 번에 5개까지만 고친다.

마지막에 무엇을 왜 고쳤는지 두 문장 안으로 요약한다.`;

export type SyllabusReviewResult = {
  mode: "live" | "no_credentials";
  summary: string;
  changes: ToolTrace[];
};

export async function reviewSyllabus(
  workspaceId: string,
): Promise<SyllabusReviewResult> {
  const access = resolveModelAccess();
  if (!access) {
    return {
      mode: "no_credentials",
      summary: "AI 연결이 설정되지 않아 목차를 정리할 수 없습니다.",
      changes: [],
    };
  }

  const before = flattenTopics(await getTopicTree(workspaceId)).map((t) => t.title);
  const trace: ToolTrace[] = [];

  const runner = access.client.beta.messages.toolRunner({
    model: access.model,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    tools: buildTools(workspaceId, trace),
    messages: [
      {
        role: "user",
        content:
          `지금 목차는 다음과 같다.\n${before.map((t) => `- ${t}`).join("\n")}\n\n` +
          "이 목차를 검토해 줘.",
      },
    ],
  });

  const final = await runner.done();
  const summary = final.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { text: string }).text.trim())
    .filter(Boolean)
    .join("\n\n");

  return {
    mode: "live",
    summary: summary || "정리를 마쳤습니다.",
    changes: trace.filter((item) => item.tool === "update_syllabus"),
  };
}
