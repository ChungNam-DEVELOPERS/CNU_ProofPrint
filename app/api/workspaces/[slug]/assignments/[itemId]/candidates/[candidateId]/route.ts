import { apiErrorResponse, noStoreJson } from "../../../../../../../server/api-response";
import {
  decideCandidate,
  getOrCreateAgentContext,
} from "../../../../../../../server/agent/sessions";
import { getServerActor } from "../../../../../../../server/auth";
import { ValidationError } from "../../../../../../../server/errors";
import { requireWorkspaceId } from "../../../../../../../server/learning-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; itemId: string; candidateId: string }> },
) {
  try {
    const { slug, itemId, candidateId } = await context.params;
    const body = (await request.json().catch(() => null)) as {
      status?: unknown;
      decision?: unknown;
      reason?: unknown;
    } | null;
    if (body?.status !== "approved" && body?.status !== "rejected") {
      throw new ValidationError("판단 후보 상태가 올바르지 않습니다.");
    }
    const decision = ["adopt", "revise", "reject"].find(
      (value) => value === body.decision,
    ) as "adopt" | "revise" | "reject" | undefined;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (body.status === "approved" && (!decision || !reason || reason.length > 2_000)) {
      throw new ValidationError("판단과 판단 이유를 확인해 주세요.");
    }
    const actor = await getServerActor();
    const workspaceId = await requireWorkspaceId(actor, slug);
    const agentContext = await getOrCreateAgentContext(workspaceId, {
      agentType: "assignment",
      assignmentSlug: itemId,
    });
    return noStoreJson(
      await decideCandidate(
        actor,
        agentContext,
        candidateId,
        body.status,
        decision && reason ? { decision, reason } : undefined,
      ),
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
