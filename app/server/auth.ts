import "server-only";

import { UnauthorizedError } from "./errors";

export type ServerActor = {
  tenantPublicId: string;
  externalSubject: string;
};

export async function getServerActor(): Promise<ServerActor> {
  if (process.env.PROOFPRINT_DEMO_MODE !== "true") {
    throw new UnauthorizedError(
      "학교 LTI/SSO 세션이 아직 연결되지 않았습니다. 데모 모드 또는 학교 로그인이 필요합니다.",
    );
  }

  return {
    tenantPublicId: "cnu",
    externalSubject: process.env.DEMO_STUDENT_SUB ?? "demo:cnu:202600001",
  };
}
