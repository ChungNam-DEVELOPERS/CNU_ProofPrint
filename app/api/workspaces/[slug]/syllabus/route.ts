import { apiErrorResponse, noStoreJson } from "../../../../server/api-response";
import { reviewSyllabus } from "../../../../server/agent/review";
import { getServerActor } from "../../../../server/auth";
import { requireWorkspaceId } from "../../../../server/learning-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const actor = await getServerActor();
    const workspaceId = await requireWorkspaceId(actor, slug);
    return noStoreJson(await reviewSyllabus(workspaceId));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
