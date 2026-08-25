import { apiErrorResponse, noStoreJson } from "@/app/server/api-response";
import { getServerActor } from "@/app/server/auth";
import { updateDisclosure } from "@/app/server/proofprint-repository";
import {
  parseUpdateDisclosureInput,
  readJsonRequest,
} from "@/app/server/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const actor = await getServerActor();
    const { workspaceId } = await context.params;
    const input = parseUpdateDisclosureInput(await readJsonRequest(request));
    const workspace = await updateDisclosure(actor, workspaceId, input);
    return noStoreJson({ workspace });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
