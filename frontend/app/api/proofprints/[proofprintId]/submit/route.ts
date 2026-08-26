import { apiErrorResponse, noStoreJson } from "@/app/server/api-response";
import { getServerActor } from "@/app/server/auth";
import { submitWorkspace } from "@/app/server/proofprint-repository";
import {
  parseSubmitWorkspaceInput,
  readJsonRequest,
} from "@/app/server/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ proofprintId: string }> },
) {
  try {
    const actor = await getServerActor();
    const { proofprintId } = await context.params;
    const input = parseSubmitWorkspaceInput(await readJsonRequest(request));
    const result = await submitWorkspace(actor, proofprintId, input.revision);
    return noStoreJson(result, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
