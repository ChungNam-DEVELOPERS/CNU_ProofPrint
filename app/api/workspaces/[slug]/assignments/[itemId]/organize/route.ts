import { apiErrorResponse, noStoreJson } from "../../../../../../server/api-response";
import {
  getOrganizerStatus,
  runOrganizer,
} from "../../../../../../server/agent/organizer";
import { getOrCreateAgentContext } from "../../../../../../server/agent/sessions";
import { getServerActor } from "../../../../../../server/auth";
import { requireWorkspaceId } from "../../../../../../server/learning-repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

async function resolveContext(slug: string, itemId: string) {
  const actor = await getServerActor();
  const workspaceId = await requireWorkspaceId(actor, slug);
  return getOrCreateAgentContext(workspaceId, {
    agentType: "assignment",
    assignmentSlug: itemId,
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; itemId: string }> },
) {
  try {
    const { slug, itemId } = await context.params;
    return noStoreJson(await getOrganizerStatus(await resolveContext(slug, itemId)));
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string; itemId: string }> },
) {
  try {
    const { slug, itemId } = await context.params;
    const agentContext = await resolveContext(slug, itemId);
    const result = await runOrganizer(agentContext);
    return noStoreJson({ result, status: await getOrganizerStatus(agentContext) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
