export const aiPurposes = [
  "개념 이해",
  "아이디어 탐색",
  "반론 검토",
  "초안 피드백",
  "근거 확인",
  "기타",
] as const;

export type AiPurpose = (typeof aiPurposes)[number];
export const aiModelAliases = ["auto", "gpt", "claude", "gemini"] as const;
export type AiModelAlias = (typeof aiModelAliases)[number];
export type AiProvider = "manual" | "demo" | "cnu_multillm";
export type Decision = "adopt" | "revise" | "reject";
export type WorkspaceStatus =
  | "draft"
  | "in_progress"
  | "ready_to_submit"
  | "submitted"
  | "archived";

export type WorkspaceDraft = {
  personalGoal: string;
  purpose: AiPurpose;
  aiQuestion: string;
  aiSummary: string;
  aiProvider: AiProvider;
  aiModel: string | null;
  aiRequestId: string | null;
  decision: Decision;
  reason: string;
  learned: string;
  changed: string;
  remainingQuestion: string;
};

export type DisclosureSettings = {
  sharePurpose: boolean;
  shareJudgment: boolean;
  shareReflection: boolean;
  shareRaw: false;
};

export type CourseResource = {
  publicId: string;
  title: string;
  section: string | null;
  term: string;
  displayTitle: string;
};

export type AssignmentResource = {
  publicId: string;
  slug: string;
  title: string;
  description: string;
  courseGoal: string;
  dueAt: string | null;
  score: number | null;
};

export type StudentResource = {
  displayName: string;
  studentNumber: string | null;
  department: string | null;
};

export type CheckpointResource = {
  publicKey: string;
  occurredAt: string;
  purpose: AiPurpose;
  questionSummary: string;
  suggestionSummary: string;
  provider: AiProvider;
  modelId: string | null;
  sourceRequestId: string | null;
  decision: Decision | null;
  reason: string | null;
  isPrimary: boolean;
};

export type ProofprintSubmission = {
  publicId: string;
  version: number;
  checksum: string;
  submittedAt: string;
};

export type WorkspaceResource = {
  workspaceId: string;
  revision: number;
  status: WorkspaceStatus;
  currentStep: number;
  startedAt: string;
  updatedAt: string;
  submittedAt: string | null;
  assignment: AssignmentResource;
  course: CourseResource;
  student: StudentResource;
  draft: WorkspaceDraft;
  disclosure: DisclosureSettings;
  checkpoints: CheckpointResource[];
  agentDraft: {
    sourceCount: number;
    purpose: AiPurpose | null;
    aiQuestion: string | null;
    aiSummary: string | null;
    decision: Decision | null;
    reason: string | null;
    learned: string | null;
    changed: string | null;
    remainingQuestion: string | null;
  };
  latestSubmission: ProofprintSubmission | null;
};

export type ProofprintHistoryItem = {
  workspaceId: string;
  title: string;
  course: string;
  date: string;
  checkpointCount: number;
  status: "작성 중" | "제출 완료";
  rawShared: boolean;
  href: string;
};

export type SaveWorkspaceInput = {
  revision: number;
  currentStep: number;
  draft: WorkspaceDraft;
};

export type UpdateDisclosureInput = {
  revision: number;
  disclosure: DisclosureSettings;
};

export type SubmitWorkspaceInput = {
  revision: number;
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};
