import { apiErrorResponse, noStoreJson } from "../../../../server/api-response";
import { getServerActor } from "../../../../server/auth";
import { ValidationError } from "../../../../server/errors";
import { requireWorkspaceId } from "../../../../server/learning-repository";
import { runAgentTurn } from "../../../../server/agent/run";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message || message.length > 4_000) {
      throw new ValidationError("질문은 1자 이상 4,000자 이하로 입력해 주세요.");
    }

    const actor = await getServerActor();
    const workspaceId = await requireWorkspaceId(actor, slug);
    const result = await runAgentTurn(workspaceId, message);

    return noStoreJson(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
