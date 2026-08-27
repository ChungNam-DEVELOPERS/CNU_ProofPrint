import { apiErrorResponse, noStoreJson } from "../../../../server/api-response";
import { getServerActor } from "../../../../server/auth";
import { ValidationError } from "../../../../server/errors";
import { requireWorkspaceId } from "../../../../server/learning-repository";
import {
  extractPdfPages,
  MAX_UPLOAD_BYTES,
  storeMaterial,
  type MaterialKind,
} from "../../../../server/materials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

function kindFor(mime: string, name: string): MaterialKind {
  if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "PDF";
  return "필기";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const actor = await getServerActor();
    const workspaceId = await requireWorkspaceId(actor, slug);

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");

    if (!(file instanceof File)) {
      throw new ValidationError("올릴 파일을 선택해 주세요.");
    }
    if (file.size === 0) {
      throw new ValidationError("빈 파일입니다.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new ValidationError(
        `파일이 너무 큽니다. ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB 이하로 올려 주세요.`,
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = kindFor(file.type, file.name);

    let pages: string[];
    if (kind === "PDF") {
      pages = await extractPdfPages(bytes);
    } else {
      pages = [new TextDecoder().decode(bytes)];
    }

    const readable = pages.join("").replace(/\s/g, "").length;
    if (readable === 0) {
      throw new ValidationError(
        "이 파일에서 글자를 찾지 못했습니다. 스캔한 이미지 PDF 는 아직 읽지 못합니다.",
      );
    }

    const stored = await storeMaterial(workspaceId, {
      title: file.name,
      kind,
      mimeType: file.type || "application/octet-stream",
      byteSize: file.size,
      pages,
    });

    return noStoreJson({
      title: file.name,
      kind,
      pageCount: stored.pageCount,
      chunks: stored.chunks,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
