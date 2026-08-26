export const course = {
  title: "[2026-2학기] 어드벤처디자인 (01반)",
  department: "컴퓨터융합학부",
  student: "기니돼지",
  studentNumber: "202600001",
};

export const assignment = {
  slug: "ai-service-proposal",
  title: "캠퍼스 문제 해결 서비스 설계",
  category: "개인 과제",
  dueAt: "2026.09.18 (금) 23:59",
  remaining: "D-24",
  score: "20점",
  description:
    "충남대학교 캠퍼스에서 겪는 불편을 사용자 관점에서 정의하고, 요구사항과 핵심 기능을 도출해 실행 가능한 소프트웨어 서비스 프로토타입을 제안합니다.",
  courseGoal:
    "사용자 문제를 요구사항으로 구조화하고, 대안을 비교해 구현 가능한 소프트웨어 해결안을 설계한다.",
};

export const proofprintSteps = [
  "학습목표",
  "AI 활용",
  "판단",
  "배운 점",
  "제출",
] as const;

export const sampleCheckpoints = [
  {
    time: "8월 24일 19:42",
    purpose: "개념 이해",
    title: "도서관 좌석 이용 불편의 원인 정리",
    decision: "채택",
    decisionTone: "adopt",
    summary:
      "단순 좌석 부족보다 실시간 정보의 부정확성과 예약·현장 이용의 분리가 핵심 문제라고 정리했다.",
  },
  {
    time: "8월 25일 14:18",
    purpose: "아이디어 탐색",
    title: "실시간 혼잡도 기능 제안 검토",
    decision: "수정",
    decisionTone: "revise",
    summary:
      "상시 위치 추적은 제외하고 사용자가 직접 체크인한 정보와 익명 집계만 활용하도록 수정했다.",
  },
  {
    time: "8월 25일 16:05",
    purpose: "반론 검토",
    title: "자발적 체크인 방식의 한계 검토",
    decision: "폐기",
    decisionTone: "reject",
    summary:
      "참여자가 적으면 정보가 부정확해질 수 있어, 단순 체크인만으로 완전한 실시간 현황을 보장한다는 주장은 제외했다.",
  },
] as const;

export const proofprintDefaults = {
  personalGoal:
    "AI가 제안한 기능을 그대로 수용하지 않고, 사용자 가치·기술 가능성·개인정보 관점에서 우선순위를 판단할 수 있다.",
  purpose: "아이디어 탐색",
  aiQuestion:
    "도서관 좌석과 스터디룸 이용 불편을 해결하는 서비스의 핵심 기능과 예상되는 문제를 제안해 줘.",
  aiSummary:
    "실시간 좌석 현황, 혼잡도 예측, 스터디룸 예약 통합, 위치 기반 추천 기능을 제안했다. 다만 Wi-Fi·블루투스 기반 위치 추적은 개인정보와 정확도 문제가 있어 자발적 체크인과 익명 집계 방식도 함께 검토해야 한다.",
  decision: "revise" as const,
  reason:
    "상시 위치 추적 기능은 제외하고, 사용자가 직접 체크인한 정보와 익명 혼잡도 데이터만 활용하도록 수정했다.",
  learned:
    "기능의 수보다 사용자에게 필요한 정보가 무엇인지, 그 정보를 안전하게 수집할 수 있는지가 서비스 설계에서 더 중요하다는 것을 배웠다.",
  changed:
    "처음에는 자동 위치 추적이 정확하고 편리하다고 생각했지만, 자발적 체크인과 익명 집계가 신뢰와 구현 가능성을 함께 높일 수 있다고 판단했다.",
  remainingQuestion:
    "자발적 체크인만으로도 실제 좌석 현황을 충분히 정확하게 유지하려면 어떤 참여 유인과 검증 방식이 필요할까?",
};
