import "server-only";

import { NextResponse } from "next/server";
import { AppError } from "./errors";

export function noStoreJson<T>(body: T, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return NextResponse.json(body, { ...init, headers });
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return noStoreJson(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("Proofprint API error", error);
  return noStoreJson(
    {
      error: {
        code: "internal_error",
        message: "서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      },
    },
    { status: 500 },
  );
}
