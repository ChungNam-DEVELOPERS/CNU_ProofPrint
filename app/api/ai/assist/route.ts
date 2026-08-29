import { createTextStreamResponse } from "ai";
import { apiErrorResponse } from "@/app/server/api-response";
import { getServerActor } from "@/app/server/auth";
import { generateCnuAiAssistance } from "@/app/server/ai/cnu-multillm";
import { parseAiAssistInput } from "@/app/server/ai/validation";
import { getWorkspaceByPublicId } from "@/app/server/proofprint-repository";
import { readJsonRequest } from "@/app/server/validation";

export const runtime = "nodejs";

function streamChunks(text: string, signal: AbortSignal) {
  const chunks = text.match(/[^\n]+\n*|\n/g) ?? [text];
  let index = 0;
  return new ReadableStream<string>({
    async pull(controller) {
      if (signal.aborted || index >= chunks.length) {
        controller.close();
        return;
      }
      controller.enqueue(chunks[index]);
      index += 1;
      if (index < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 45));
      }
    },
  });
}

export async function POST(request: Request) {
  try {
    const actor = await getServerActor();
    const input = parseAiAssistInput(await readJsonRequest(request));
    const workspace = await getWorkspaceByPublicId(actor, input.workspaceId);
    const result = await generateCnuAiAssistance({
      actor,
      workspace,
      model: input.model,
      purpose: input.purpose,
      message: input.message,
    });

    return createTextStreamResponse({
      stream: streamChunks(result.text, request.signal),
      headers: {
        "Cache-Control": "no-store",
        "X-CNU-AI-Provider": result.provider,
        "X-CNU-AI-Model": result.modelId,
        "X-CNU-AI-Request-Id": result.requestId,
        "X-CNU-AI-Credits-Used": result.creditsUsed?.toString() ?? "unknown",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
