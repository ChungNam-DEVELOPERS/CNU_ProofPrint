import "server-only";

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "로그인이 필요합니다.") {
    super(message, 401, "unauthorized");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "요청한 학습과정 기록을 찾을 수 없습니다.") {
    super(message, 404, "not_found");
  }
}

export class ConflictError extends AppError {
  constructor(
    message = "다른 화면에서 먼저 수정되었습니다. 새로고침 후 다시 시도해 주세요.",
  ) {
    super(message, 409, "revision_conflict");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "validation_error");
  }
}

export class IntegrationError extends AppError {
  constructor(message = "학교 AI 서비스와 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.") {
    super(message, 502, "integration_error");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = "AI 서비스를 사용할 수 없습니다.") {
    super(message, 503, "service_unavailable");
  }
}
