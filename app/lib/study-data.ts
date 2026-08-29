// 아직 DB에 없는 값들. 인증과 사이버캠퍼스 연동이 붙으면 여기서 사라진다.

export const user = {
  name: "기니돼지",
  department: "컴퓨터융합학부",
  studentNumber: "202600001",
  initial: "기",
};

/** 사이버캠퍼스에서 읽어온 정보. 우리 서비스는 이 데이터를 재료로만 사용한다. */
export const cyberCampus = {
  connected: true,
  account: "202600001",
  lastSyncedAt: "12분 전",
  term: "2026-2학기",
  importedCourses: 3,
  importedAssignments: 5,
  importedMaterials: 12,
};

export type ImportedItem = {
  id: string;
  course: string;
  title: string;
  due: string;
  state: "새 과제" | "진행 중" | "제출 완료";
};

export const importedAssignments: ImportedItem[] = [
  {
    id: "i1",
    course: "어드벤처디자인",
    title: "캠퍼스 문제 해결 서비스 설계",
    due: "9월 18일 23:59",
    state: "진행 중",
  },
  {
    id: "i2",
    course: "선형대수학",
    title: "3주차 연습문제 (고유값)",
    due: "9월 2일 18:00",
    state: "새 과제",
  },
  {
    id: "i3",
    course: "운영체제",
    title: "중간고사 대비 문제풀이",
    due: "10월 20일",
    state: "새 과제",
  },
  {
    id: "i4",
    course: "어드벤처디자인",
    title: "사용자 인터뷰 분석 보고서",
    due: "9월 11일 18:00",
    state: "제출 완료",
  },
];

/** Proofprint 기록이 연결된 워크스페이스. 사캠 과제와 1:1로 매칭된다. */
export const proofprintWorkspaceSlug = "adventure-design";
export const proofprintAssignmentSlug = "ai-service-proposal";
export const proofprintItemId = "campus-service-design";
export const proofprintBase = `/workspaces/${proofprintWorkspaceSlug}/assignments/${proofprintItemId}`;
