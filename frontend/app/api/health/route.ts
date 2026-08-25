import { apiErrorResponse, noStoreJson } from "@/app/server/api-response";
import { checkDatabaseHealth } from "@/app/server/proofprint-repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const database = await checkDatabaseHealth();
    return noStoreJson({
      status: database ? "ok" : "degraded",
      database,
      authentication: process.env.PROOFPRINT_DEMO_MODE === "true" ? "demo" : "lti",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
