import { apiErrorResponse, noStoreJson } from "../../server/api-response";
import { getServerActor } from "../../server/auth";
import { ValidationError } from "../../server/errors";
import { createWorkspace } from "../../server/learning-writes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const subject = typeof body?.subject === "string" ? body.subject.trim() : "";
    const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
    const outline = typeof body?.outline === "string" ? body.outline : "";

    if (!title || title.length > 200) {
      throw new ValidationError("워크스페이스 이름을 200자 이하로 입력해 주세요.");
    }

    const actor = await getServerActor();
    const created = await createWorkspace(actor, {
      title,
      subject: subject || "개인 학습",
      goal: goal.slice(0, 1000),
      outline: outline.slice(0, 20_000),
    });

    return noStoreJson(created);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
