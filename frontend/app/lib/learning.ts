export type UnderstandingLevel = "unseen" | "exposed" | "shaky" | "solid";

export const understandingMeta: Record<
  UnderstandingLevel,
  { label: string; hint: string }
> = {
  unseen: { label: "미학습", hint: "아직 다루지 않음" },
  exposed: { label: "접함", hint: "설명을 듣거나 자료에서 봄" },
  shaky: { label: "불안정", hint: "설명해 봤지만 정확하지 않았음" },
  solid: { label: "설명 가능", hint: "직접 정확히 설명함" },
};

export type Topic = {
  id: string;
  title: string;
  level: UnderstandingLevel;
  evidence: string | null;
  updatedAt: string | null;
  children: Topic[];
};

export type Gap = {
  id: string;
  topicTitle: string;
  kind: "개념" | "공식" | "정리" | "용어";
  term: string;
  definition: string;
  keyPoint: string;
  confusedWith: string | null;
  occurrences: number;
  status: "open" | "reviewing" | "resolved";
  lastSeen: string;
};

export type Material = {
  id: string;
  kind: "PDF" | "필기" | "링크";
  title: string;
  extent: string;
  addedAt: string;
  usedCount: number;
};

export type ToolName =
  | "record_gap"
  | "update_syllabus"
  | "log_evidence"
  | "read_material"
  | "web_search";

export type ActivityItem = {
  id: string;
  at: string;
  tool: ToolName;
  message: string;
};

export type Assignment = {
  id: string;
  title: string;
  summary: string;
  source: "사이버캠퍼스" | "직접 추가";
  status: "시작 전" | "작성 중" | "진행 중" | "제출 완료";
  due: string | null;
  hasProofprint: boolean;
  steps: number;
};

export type Workspace = {
  slug: string;
  title: string;
  subject: string;
  term: string;
  emoji: string;
  status: string;
  summary: string;
  nextAction: string;
  updatedAt: string;
  studyMinutes: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "agent";
  paragraphs: string[];
  tool: string | null;
};

export function flattenTopics(topics: Topic[]): Topic[] {
  return topics.flatMap((topic) => [topic, ...flattenTopics(topic.children)]);
}

export function levelCounts(topics: Topic[]): Record<UnderstandingLevel, number> {
  const counts: Record<UnderstandingLevel, number> = {
    unseen: 0,
    exposed: 0,
    shaky: 0,
    solid: 0,
  };
  for (const topic of flattenTopics(topics)) counts[topic.level] += 1;
  return counts;
}

/** DB 시각을 화면 문구로. 최근이면 상대 시각, 오래되면 날짜. */
export function formatWhen(value: Date | string | null): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();

  if (diff < 60_000) return "방금";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}분 전`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}시간 전`;
  if (diff < 172_800_000) return "어제";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(date);
}
