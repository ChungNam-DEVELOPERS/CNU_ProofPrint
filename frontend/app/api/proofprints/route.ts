import { apiErrorResponse, noStoreJson } from "@/app/server/api-response";
import { getServerActor } from "@/app/server/auth";
import { listProofprints } from "@/app/server/proofprint-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const actor = await getServerActor();
    const items = await listProofprints(actor);
    return noStoreJson({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
