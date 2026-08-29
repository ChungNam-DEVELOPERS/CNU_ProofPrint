import { apiErrorResponse } from "../../../../server/api-response";
import { getServerActor } from "../../../../server/auth";
import { NotFoundError } from "../../../../server/errors";
import {
  getTopicTree,
  getWorkspaceBySlug,
  listActivity,
  listGaps,
  listMaterials,
  requireWorkspaceId,
} from "../../../../server/learning-repository";
import { flattenTopics, levelCounts, understandingMeta } from "../../../../lib/learning";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const actor = await getServerActor();
    const workspace = await getWorkspaceBySlug(actor, slug);
    if (!workspace) throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");

    const workspaceId = await requireWorkspaceId(actor, slug);
    const [topics, gaps, materials, activity] = await Promise.all([
      getTopicTree(workspaceId),
      listGaps(workspaceId),
      listMaterials(workspaceId),
      listActivity(workspaceId, 50),
    ]);

    const counts = levelCounts(topics);
    const open = gaps.filter((gap) => gap.status !== "resolved");
    const done = gaps.filter((gap) => gap.status === "resolved");
    const hours = Math.floor(workspace.studyMinutes / 60);
    const minutes = workspace.studyMinutes % 60;

    const lines: string[] = [
      `# ${workspace.title} 학습 기록`,
      "",
      `${workspace.term} · ${workspace.subject} · ${workspace.updatedAt} 기준`,
      "",
      "## 지금 상태",
      "",
      workspace.summary,
      "",
      `**다음에 해볼 것** — ${workspace.nextAction}`,
      "",
      `누적 학습 ${hours}시간 ${minutes}분 · 설명 가능한 주제 ${counts.solid}개 · 외울 개념 ${open.length}개`,
      "",
      "## 목차별 이해도",
      "",
      "| 단원 | 상태 | 근거 |",
      "| --- | --- | --- |",
    ];

    for (const topic of flattenTopics(topics)) {
      lines.push(
        `| ${topic.title} | ${understandingMeta[topic.level].label} | ${topic.evidence ?? "—"} |`,
      );
    }

    lines.push("", "## 외울 개념", "");
    if (open.length === 0) {
      lines.push("남은 개념이 없습니다.", "");
    } else {
      for (const gap of open) {
        lines.push(`### ${gap.term} (${gap.kind}, ${gap.occurrences}번 막힘)`, "");
        lines.push(gap.definition, "");
        lines.push(`- 같이 외울 것: ${gap.keyPoint}`);
        if (gap.confusedWith) lines.push(`- 헷갈렸던 것: ${gap.confusedWith}`);
        lines.push(`- 연결 단원: ${gap.topicTitle}`, "");
      }
    }

    if (done.length > 0) {
      lines.push("## 외운 개념", "");
      for (const gap of done) lines.push(`- ${gap.term} — ${gap.definition}`);
      lines.push("");
    }

    if (materials.length > 0) {
      lines.push("## 참고한 자료", "");
      for (const material of materials) {
        lines.push(`- ${material.title} (${material.extent}, ${material.usedCount}회 참고)`);
      }
      lines.push("");
    }

    lines.push("## 학습 흐름", "");
    for (const item of activity) {
      lines.push(`- **${item.at}** — ${item.message}`);
    }
    lines.push("", "---", "", "이 기록은 학습 중에 에이전트가 자동으로 남긴 것입니다.");

    const filename = encodeURIComponent(`${workspace.title}-학습기록.md`);
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
