import "server-only";

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { getTopicTree, listGaps, listMaterials } from "../learning-repository";
import {
  applySyllabusOps,
  logEvidence,
  recordToolCall,
  searchMaterials,
  upsertGap,
} from "../learning-writes";
import { flattenTopics, gapSignalLabel } from "../../lib/learning";

export type ToolTrace = { tool: string; summary: string };

/**
 * 에이전트가 쓸 수 있는 도구. 워크스페이스 밖으로는 나가지 못하도록
 * workspaceId 를 클로저로 묶어 넘긴다.
 */
export function buildTools(workspaceId: string, trace: ToolTrace[]) {
  async function note(tool: string, summary: string, args: unknown, result: unknown) {
    trace.push({ tool, summary });
    await recordToolCall(workspaceId, null, tool, summary, args, result);
  }

  const getState = betaZodTool({
    name: "get_state",
    description:
      "이 워크스페이스의 목차와 단원별 이해도, 오답노트에 남은 개념, 올려둔 자료 목록을 돌려준다. " +
      "학생이 어디까지 아는지에 따라 답이 달라질 때, 또는 무언가를 기록하기 직전에 쓴다. " +
      "단순한 사실 확인이나 이어지는 잡담에는 부르지 않는다.",
    inputSchema: z.object({}),
    run: async () => {
      const [topics, gaps, materials] = await Promise.all([
        getTopicTree(workspaceId),
        listGaps(workspaceId),
        listMaterials(workspaceId),
      ]);

      return JSON.stringify({
        목차: flattenTopics(topics).map((topic) => ({
          제목: topic.title,
          이해도: topic.level,
          근거: topic.evidence,
        })),
        오답노트: gaps
          .filter((gap) => gap.status !== "resolved")
          .map((gap) => ({ 키워드: gap.term, 막힌횟수: gap.occurrences })),
        자료: materials.map((material) => material.title),
      });
    },
  });

  const readMaterial = betaZodTool({
    name: "read_material",
    description:
      "학생이 올린 자료에서 관련 부분을 찾는다. 자료에 근거해 답할 수 있을 때 먼저 쓴다.",
    inputSchema: z.object({
      query: z.string().describe("찾을 내용. 예: 대각화 가능 조건"),
    }),
    run: async (input) => {
      const found = await searchMaterials(workspaceId, input.query);
      await note(
        "read_material",
        found.length > 0
          ? `«${found[0].title}» 을(를) 참고했습니다.`
          : `«${input.query}» 관련 자료를 찾지 못했습니다.`,
        input,
        found,
      );
      return JSON.stringify(found);
    },
  });

  const logEvidenceTool = betaZodTool({
    name: "log_evidence",
    description:
      "학습 근거를 기록한다. 이해도 값은 직접 정하지 못하고, 무슨 일이 있었는지만 기록한다. 상태는 서버가 계산한다. " +
      "explained_by_agent=내가 설명해 줌, seen_in_material=자료에 나옴, " +
      "self_explained=학생이 직접 정확히 설명함, incomplete_explanation=설명했지만 부정확함.",
    inputSchema: z.object({
      topicTitle: z.string().describe("목차에 있는 단원 제목 그대로"),
      kind: z.enum([
        "explained_by_agent",
        "seen_in_material",
        "self_explained",
        "incomplete_explanation",
      ]),
      note: z.string().describe("무엇을 근거로 그렇게 판단했는지 한 줄"),
    }),
    run: async (input) => {
      const result = await logEvidence(
        workspaceId,
        input.topicTitle,
        input.kind,
        input.note,
      );
      await note(
        "log_evidence",
        result.ok
          ? `«${result.topicTitle}» 을(를) ${result.level} 상태로 갱신했습니다. ${input.note}`
          : result.reason,
        input,
        result,
      );
      return JSON.stringify(result);
    },
  });

  const recordGap = betaZodTool({
    name: "record_gap",
    description:
      "학생이 실제로 막힌 개념을 오답노트에 키워드로 남긴다. 암기용이므로 아껴서 쓴다.\n" +
      "부를 조건 — 아래 신호 중 하나가 실제로 관찰될 때만 부른다:\n" +
      "  repeat_question: 전에 다룬 것을 다시 물어봄\n" +
      "  slow_to_grasp: 설명한 뒤에도 이해에 시간이 걸림 (학습 신호로 알려준다)\n" +
      "  explicit_confusion: 모르겠다·헷갈린다고 직접 말함\n" +
      "  incorrect_explanation: 설명해 봤는데 어긋남\n" +
      "부르지 말 것 — 개념이 대화에 처음 등장했다는 이유만으로는 부르지 않는다. " +
      "학생이 한 번 듣고 바로 이해했으면 남기지 않는다. 계산 실수, 오타, 단순 확인 질문도 남기지 않는다.\n" +
      "한 턴에 하나까지만 남긴다. 같은 키워드를 다시 남기면 막힌 횟수가 올라간다.",
    inputSchema: z.object({
      term: z.string().describe("외울 키워드. 짧게. 예: 대각화 가능 조건"),
      kind: z.enum(["개념", "공식", "정리", "용어"]),
      definition: z.string().describe("한 줄 정의. 이것이 암기 대상이다."),
      keyPoint: z.string().describe("같이 외워야 하는 조건이나 단서"),
      confusedWith: z
        .string()
        .nullable()
        .optional()
        .describe("학생이 대신 알고 있던 잘못된 내용. 없으면 null"),
      topicTitle: z
        .string()
        .nullable()
        .optional()
        .describe("연결할 목차 제목. 모르면 null"),
      signal: z
        .enum([
          "repeat_question",
          "slow_to_grasp",
          "explicit_confusion",
          "incorrect_explanation",
        ])
        .describe("이 개념을 남기기로 판단한 근거. 실제로 관찰된 것만 고른다."),
    }),
    run: async (input) => {
      const result = await upsertGap(workspaceId, {
        term: input.term,
        kind: input.kind,
        definition: input.definition,
        keyPoint: input.keyPoint,
        confusedWith: input.confusedWith ?? null,
        topicTitle: input.topicTitle ?? null,
        signal: input.signal,
      });
      const why = gapSignalLabel[input.signal];
      await note(
        "record_gap",
        result.occurrences > 1
          ? `«${result.term}» 을(를) 오답노트에 기록했습니다. ${why} ${result.occurrences}번째로 막힌 지점입니다.`
          : `«${result.term}» 을(를) 오답노트에 키워드로 기록했습니다. ${why}`,
        input,
        result,
      );
      return JSON.stringify(result);
    },
  });

  const updateSyllabus = betaZodTool({
    name: "update_syllabus",
    description:
      "목차를 고친다. 학생이 목차에 없는 주제를 물었을 때만 쓴다. 매번 재구성하지 말 것. " +
      "이미 있는 제목은 다시 추가되지 않는다.",
    inputSchema: z.object({
      ops: z
        .array(
          z.union([
            z.object({
              op: z.literal("add"),
              title: z.string(),
              parentTitle: z.string().nullable().optional(),
            }),
            z.object({
              op: z.literal("rename"),
              title: z.string(),
              newTitle: z.string(),
            }),
          ]),
        )
        .max(5),
    }),
    run: async (input) => {
      const applied = await applySyllabusOps(
        workspaceId,
        input.ops.map((op) =>
          op.op === "add"
            ? { op: "add" as const, title: op.title, parentTitle: op.parentTitle ?? null }
            : { op: "rename" as const, title: op.title, newTitle: op.newTitle },
        ),
      );
      if (applied.length > 0) {
        await note("update_syllabus", `목차를 고쳤습니다 — ${applied.join(", ")}`, input, applied);
      }
      return JSON.stringify(applied);
    },
  });

  return [getState, readMaterial, logEvidenceTool, recordGap, updateSyllabus];
}
