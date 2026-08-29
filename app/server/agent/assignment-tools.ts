import "server-only";

import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { flattenTopics } from "../../lib/learning";
import { getDb } from "../db";
import { getTopicTree, listGaps, listMaterials } from "../learning-repository";
import { searchMaterialChunks } from "../materials";
import {
  createArtifact,
  recordSessionToolCall,
  type AgentContext,
} from "./sessions";
import type { ToolTrace } from "./tools";

export function buildAssignmentTools(context: AgentContext, trace: ToolTrace[]) {
  async function note(tool: string, summary: string, args: unknown, result: unknown) {
    trace.push({ tool, summary });
    await recordSessionToolCall(context, null, tool, summary, args, result);
  }

  const getAssignmentState = betaZodTool({
    name: "get_assignment_state",
    description:
      "현재 과제의 목표와 설명, 이 과목에서 쌓인 목차·오답노트·자료를 확인한다. 과제에 관한 판단이나 기록을 만들기 전에 사용한다.",
    inputSchema: z.object({}),
    run: async () => {
      const [topics, gaps, materials] = await Promise.all([
        getTopicTree(context.workspaceId),
        listGaps(context.workspaceId),
        listMaterials(context.workspaceId),
      ]);
      return JSON.stringify({
        과제: { 제목: context.assignmentTitle, 설명: context.assignmentSummary },
        학습목차: flattenTopics(topics).map((topic) => ({
          제목: topic.title,
          이해도: topic.level,
          근거: topic.evidence,
        })),
        오답노트: gaps.filter((gap) => gap.status !== "resolved").map((gap) => gap.term),
        자료: materials.map((material) => material.title),
      });
    },
  });

  const readMaterial = betaZodTool({
    name: "read_material",
    description: "올린 자료에서 과제와 관련된 원문을 찾는다. 인용할 때 자료명과 쪽수를 밝힌다.",
    inputSchema: z.object({ query: z.string() }),
    run: async (input) => {
      const found = await searchMaterialChunks(context.workspaceId, input.query);
      await note(
        "read_material",
        found.length > 0
          ? `«${input.query}» 관련 자료 ${found.length}곳을 참고했습니다.`
          : `«${input.query}» 관련 대목을 찾지 못했습니다.`,
        input,
        found,
      );
      return JSON.stringify(found);
    },
  });

  const findLearningEvidence = betaZodTool({
    name: "find_learning_evidence",
    description:
      "학습 Agent 대화와 정리된 학습 근거에서 현재 과제에 재사용할 수 있는 기록을 찾는다. 원문을 복사하지 않고 출처 id와 함께 반환한다.",
    inputSchema: z.object({ query: z.string() }),
    run: async (input) => {
      const sql = getDb();
      const query = `%${input.query}%`;
      const rows = await sql<
        Array<{ id: string; artifact_type: string; payload: unknown; created_at: Date }>
      >`
        select id, artifact_type, payload, created_at
        from agent_artifacts
        where workspace_id = ${context.workspaceId}
          and agent_type in ('study', 'organizer')
          and payload::text ilike ${query}
        order by created_at desc limit 12
      `;
      await note(
        "find_learning_evidence",
        `학습 기록에서 «${input.query}» 관련 근거 ${rows.length}개를 찾았습니다.`,
        input,
        rows,
      );
      return JSON.stringify(rows);
    },
  });

  const recordAiContribution = betaZodTool({
    name: "record_ai_contribution",
    description:
      "AI가 과제에 제안하거나 설명한 핵심 내용을 Proofprint 원재료로 기록한다. 학생의 생각을 AI의 기여로 기록하지 않는다.",
    inputSchema: z.object({
      purpose: z.enum(["개념 이해", "아이디어 탐색", "반론 검토", "초안 피드백", "근거 확인", "기타"]),
      questionSummary: z.string(),
      contributionSummary: z.string(),
      learningArtifactIds: z.array(z.string()).max(12).default([]),
    }),
    run: async (input) => {
      const artifactId = await createArtifact(context, "ai_contribution", input);
      const result = { artifactId };
      await note("record_ai_contribution", "과제에 사용한 AI 기여를 기록했습니다.", input, result);
      return JSON.stringify(result);
    },
  });

  const proposeStudentDecision = betaZodTool({
    name: "propose_student_decision",
    description:
      "학생이 대화에서 직접 밝힌 판단을 후보로 만든다. AI가 대신 확정할 수 없으며 학생 화면에 승인 버튼이 나타난다. 학생 발언에 없는 판단을 만들지 않는다.",
    inputSchema: z.object({
      decision: z.enum(["adopt", "revise", "reject"]),
      reason: z.string(),
      source: z.string().describe("판단의 근거가 된 학생 발언을 짧게 그대로 인용"),
    }),
    run: async (input) => {
      const artifactId = await createArtifact(context, "decision_candidate", input);
      const result = { artifactId, status: "pending" as const };
      await note(
        "propose_student_decision",
        "학생 판단 후보를 만들었습니다. 학생이 승인해야 Proofprint에 반영됩니다.",
        input,
        result,
      );
      return JSON.stringify(result);
    },
  });

  return [
    getAssignmentState,
    readMaterial,
    findLearningEvidence,
    recordAiContribution,
    proposeStudentDecision,
  ];
}
