import { apiErrorResponse, noStoreJson } from "../../../../../server/api-response";
import { getServerActor } from "../../../../../server/auth";
import { ValidationError } from "../../../../../server/errors";
import { requireWorkspaceId } from "../../../../../server/learning-repository";
import { setGapStatus } from "../../../../../server/learning-writes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowed = ["open", "reviewing", "resolved"] as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ slug: string; gapId: string }> },
) {
  try {
    const { slug, gapId } = await context.params;
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    const status = allowed.find((value) => value === body?.status);

    if (!status) throw new ValidationError("바꿀 상태가 올바르지 않습니다.");

    const actor = await getServerActor();
    const workspaceId = await requireWorkspaceId(actor, slug);
    return noStoreJson(await setGapStatus(workspaceId, gapId, status));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
