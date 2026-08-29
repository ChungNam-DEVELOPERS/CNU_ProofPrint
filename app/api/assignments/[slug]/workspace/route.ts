import { apiErrorResponse, noStoreJson } from "@/app/server/api-response";
import { getServerActor } from "@/app/server/auth";
import { getWorkspaceByAssignmentSlug } from "@/app/server/proofprint-repository";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const actor = await getServerActor();
    const { slug } = await context.params;
    const workspace = await getWorkspaceByAssignmentSlug(actor, slug);
    return noStoreJson({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
