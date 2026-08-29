// 데모 시드 전용 데이터. 화면은 DB를 읽고, 이 파일은 DB를 채울 때만 쓴다.

export const workspaces = [
  {
    slug: "linear-algebra",
    title: "선형대수학",
    subject: "전공 기초",
    term: "2026-2학기",
    emoji: "📐",
    status: "학습 중",
    summary:
      "고유값 단원 초반을 보고 있습니다. 행렬식 계산은 직접 설명할 수 있게 됐지만, 고유값과 대각화의 연결 지점에서 계속 막히고 있어 같은 지점을 세 번 다시 물어봤습니다.",
    nextAction: "대각화 가능 조건을 스스로 설명해 보기 — 외울 개념 2개가 여기에 몰려 있습니다.",
    updatedAt: "3분 전",
    studyMinutes: 412,
    topics: [
      {
        id: "t1",
        title: "1. 벡터공간",
        level: "solid",
        updatedAt: "8월 20일",
        children: [
          { id: "t1-1", title: "부분공간", level: "solid", evidence: "정의를 직접 서술함", updatedAt: "8월 20일" },
          { id: "t1-2", title: "일차독립과 기저", level: "solid", evidence: "예제 풀이를 직접 설명함", updatedAt: "8월 21일" },
          { id: "t1-3", title: "차원", level: "exposed", evidence: "에이전트 설명만 들음", updatedAt: "8월 21일" },
        ],
      },
      {
        id: "t2",
        title: "2. 행렬식",
        level: "solid",
        updatedAt: "8월 24일",
        children: [
          { id: "t2-1", title: "여인수 전개", level: "solid", evidence: "3x3 직접 계산 설명", updatedAt: "8월 24일" },
          { id: "t2-2", title: "행렬식의 성질", level: "shaky", evidence: "행 교환 부호를 반대로 설명함", updatedAt: "8월 24일" },
          { id: "t2-3", title: "크래머 공식", level: "exposed", updatedAt: "8월 24일" },
        ],
      },
      {
        id: "t3",
        title: "3. 고유값과 고유벡터",
        level: "shaky",
        updatedAt: "3분 전",
        children: [
          { id: "t3-1", title: "특성방정식", level: "shaky", evidence: "부호 처리를 두 번 다시 물어봄", updatedAt: "3분 전" },
          { id: "t3-2", title: "고유공간", level: "exposed", updatedAt: "26분 전" },
          { id: "t3-3", title: "대각화 가능 조건", level: "shaky", evidence: "설명해 봤지만 이유가 빠져 있었음", updatedAt: "12분 전" },
          { id: "t3-4", title: "직교대각화", level: "unseen" },
        ],
      },
      {
        id: "t4",
        title: "4. 내적공간",
        level: "unseen",
        children: [
          { id: "t4-1", title: "그람-슈미트 과정", level: "unseen" },
          { id: "t4-2", title: "정사영", level: "unseen" },
        ],
      },
    ],
    notes: [
      {
        id: "n1",
        topicTitle: "고유값과 고유벡터",
        kind: "개념",
        term: "대각화 가능 조건",
        definition:
          "n×n 행렬 A가 서로 일차독립인 고유벡터 n개를 가지면 대각화할 수 있다.",
        keyPoint:
          "각 고유값의 기하적 중복도 = 대수적 중복도. 중복 자체는 문제가 아니다.",
        confusedWith: "고유값이 겹치면 무조건 대각화가 안 된다",
        occurrences: 3,
        status: "open",
        lastSeen: "12분 전",
      },
      {
        id: "n2",
        topicTitle: "고유값과 고유벡터",
        kind: "공식",
        term: "특성방정식",
        definition:
          "det(A − λI) = 0 을 만족하는 λ가 A의 고유값이다.",
        keyPoint:
          "det(λI − A) 와는 (−1)ⁿ 만큼 차이 난다. 한 형태로 고정해서 쓴다.",
        confusedWith: "det(λI − A) 와 언제나 같다",
        occurrences: 2,
        status: "open",
        lastSeen: "3분 전",
      },
      {
        id: "n3",
        topicTitle: "고유공간",
        kind: "용어",
        term: "기하적 중복도",
        definition:
          "고유값 λ에 대한 고유공간의 차원, 즉 dim(null(A − λI)).",
        keyPoint:
          "항상 대수적 중복도보다 작거나 같다.",
        confusedWith: null,
        occurrences: 1,
        status: "open",
        lastSeen: "26분 전",
      },
      {
        id: "n4",
        topicTitle: "행렬식",
        kind: "정리",
        term: "행렬식의 다중선형성",
        definition:
          "행렬식은 한 행씩 고정했을 때만 선형이다.",
        keyPoint:
          "det(A + B) ≠ det(A) + det(B). 전체에 대해서는 선형이 아니다.",
        confusedWith: "행렬식이 전체적으로 선형이다",
        occurrences: 1,
        status: "reviewing",
        lastSeen: "8월 24일",
      },
      {
        id: "n5",
        topicTitle: "벡터공간",
        kind: "용어",
        term: "기저",
        definition:
          "벡터공간을 생성하면서 동시에 일차독립인 벡터 집합.",
        keyPoint:
          "생성만으로는 기저가 아니다. 두 조건을 모두 만족해야 한다.",
        confusedWith: "생성집합",
        occurrences: 1,
        status: "resolved",
        lastSeen: "8월 21일",
      },
    ],
    materials: [
      { id: "m1", title: "선형대수학 강의노트 3주차.pdf", kind: "PDF", pages: "24쪽", addedAt: "8월 18일", usedCount: 12 },
      { id: "m2", title: "교수님 필기 사진 (고유값 단원)", kind: "필기", pages: "6장", addedAt: "8월 24일", usedCount: 5 },
      { id: "m3", title: "MIT 18.06 Lecture 21", kind: "링크", pages: "영상", addedAt: "8월 25일", usedCount: 2 },
    ],
    activity: [
      { id: "a1", at: "3분 전", tool: "record_gap", message: "«det(A − λI) 부호» 를 오답노트에 키워드로 기록했습니다. 두 번째로 막힌 지점입니다." },
      { id: "a2", at: "12분 전", tool: "log_evidence", message: "«대각화 가능 조건» 을 불안정으로 표시했습니다. 설명 시도가 부정확했습니다." },
      { id: "a3", at: "26분 전", tool: "update_syllabus", message: "«3. 고유값과 고유벡터» 아래에 «직교대각화» 를 추가했습니다." },
      { id: "a4", at: "41분 전", tool: "read_material", message: "«강의노트 3주차.pdf» 14~17쪽을 참고했습니다." },
      { id: "a5", at: "1시간 전", tool: "web_search", message: "«기하적 중복도 대수적 중복도 차이» 를 검색했습니다." },
    ],
  },
  {
    slug: "adventure-design",
    title: "어드벤처디자인",
    subject: "전공 설계",
    term: "2026-2학기",
    emoji: "🧭",
    status: "과제 진행 중",
    summary:
      "캠퍼스 문제 해결 서비스 설계 과제를 진행 중입니다. 요구사항 도출까지는 정리됐고, 지금은 실시간 혼잡도 기능의 개인정보 문제를 어떻게 우회할지 판단하는 단계입니다.",
    nextAction: "자발적 체크인 방식의 정확도 한계를 스스로 정리해 보기",
    updatedAt: "2시간 전",
    studyMinutes: 260,
    topics: [
      {
        id: "d1",
        title: "1. 문제 정의",
        level: "solid",
        children: [
          { id: "d1-1", title: "사용자 관점 문제 서술", level: "solid", evidence: "직접 재정의함", updatedAt: "8월 22일" },
          { id: "d1-2", title: "이해관계자 식별", level: "exposed", updatedAt: "8월 22일" },
        ],
      },
      {
        id: "d2",
        title: "2. 요구사항 도출",
        level: "shaky",
        children: [
          { id: "d2-1", title: "기능·비기능 요구 구분", level: "shaky", evidence: "비기능 요구를 기능으로 분류", updatedAt: "8월 25일" },
          { id: "d2-2", title: "우선순위 결정", level: "exposed", updatedAt: "8월 25일" },
        ],
      },
      { id: "d3", title: "3. 프로토타입 설계", level: "unseen" },
    ],
    notes: [
      {
        id: "dn1",
        topicTitle: "요구사항 도출",
        kind: "개념",
        term: "비기능 요구사항",
        definition:
          "시스템이 무엇을 하는가가 아니라, 얼마나 잘 하는가에 대한 조건.",
        keyPoint:
          "성능·보안·가용성·사용성이 여기에 속한다. «3초 이내 응답»은 비기능이다.",
        confusedWith: "기능 요구사항",
        occurrences: 2,
        status: "open",
        lastSeen: "8월 25일",
      },
      {
        id: "dn2",
        topicTitle: "우선순위 결정",
        kind: "용어",
        term: "MoSCoW",
        definition:
          "요구사항을 Must·Should·Could·Won't 네 등급으로 나누는 우선순위 기법.",
        keyPoint:
          "Must는 하나라도 빠지면 제품이 성립하지 않는 것만 넣는다.",
        confusedWith: null,
        occurrences: 1,
        status: "open",
        lastSeen: "8월 25일",
      },
    ],
    materials: [
      { id: "dm1", title: "과제 안내문.pdf", kind: "PDF", pages: "3쪽", addedAt: "8월 20일", usedCount: 8 },
    ],
    activity: [
      { id: "da1", at: "2시간 전", tool: "record_gap", message: "«비기능 요구사항» 을 오답노트에 키워드로 기록했습니다." },
      { id: "da2", at: "2시간 전", tool: "log_evidence", message: "«기능·비기능 요구 구분» 을 불안정으로 표시했습니다." },
    ],
  },
  {
    slug: "operating-system",
    title: "운영체제",
    subject: "전공 필수",
    term: "2026-2학기",
    emoji: "⚙️",
    status: "시험 대비",
    summary:
      "중간고사 범위인 프로세스·스레드 단원을 복습 중입니다. 컨텍스트 스위칭은 직접 설명할 수 있게 됐지만, 동기화 파트에서는 아직 설명이 자꾸 멈춥니다.",
    nextAction: "교착 상태 4조건을 근거와 함께 설명해 보기",
    updatedAt: "어제",
    studyMinutes: 188,
    topics: [
      {
        id: "o1",
        title: "1. 프로세스",
        level: "solid",
        children: [
          { id: "o1-1", title: "프로세스 상태 전이", level: "solid", updatedAt: "8월 23일" },
          { id: "o1-2", title: "컨텍스트 스위칭", level: "solid", updatedAt: "8월 23일" },
        ],
      },
      {
        id: "o2",
        title: "2. 동기화",
        level: "shaky",
        children: [
          { id: "o2-1", title: "임계구역 문제", level: "exposed", updatedAt: "어제" },
          { id: "o2-2", title: "세마포어", level: "shaky", evidence: "wait/signal 순서를 거꾸로 설명함", updatedAt: "어제" },
          { id: "o2-3", title: "교착 상태 4조건", level: "shaky", updatedAt: "어제" },
        ],
      },
    ],
    notes: [
      {
        id: "on1",
        topicTitle: "세마포어",
        kind: "개념",
        term: "뮤텍스 vs 이진 세마포어",
        definition:
          "뮤텍스는 소유권이 있고, 이진 세마포어는 소유권이 없다.",
        keyPoint:
          "뮤텍스는 잠근 스레드만 해제할 수 있다. 세마포어는 다른 스레드도 signal 가능.",
        confusedWith: "둘 다 0/1이니 같은 것",
        occurrences: 2,
        status: "open",
        lastSeen: "어제",
      },
      {
        id: "on2",
        topicTitle: "동기화",
        kind: "정리",
        term: "교착 상태 4조건",
        definition:
          "상호배제 · 점유와 대기 · 비선점 · 순환 대기.",
        keyPoint:
          "네 조건이 동시에 성립해야 교착이 생긴다. 하나만 깨도 예방된다.",
        confusedWith: null,
        occurrences: 1,
        status: "open",
        lastSeen: "어제",
      },
    ],
    materials: [
      { id: "om1", title: "OS 공룡책 5장 요약.pdf", kind: "PDF", pages: "18쪽", addedAt: "8월 19일", usedCount: 9 },
    ],
    activity: [
      { id: "oa1", at: "어제", tool: "record_gap", message: "«뮤텍스 vs 이진 세마포어» 를 오답노트에 키워드로 기록했습니다." },
    ],
  },
];

export const assignments = [
  {
    id: "campus-service-design",
    workspaceSlug: "adventure-design",
    title: "캠퍼스 문제 해결 서비스 설계",
    source: "사이버캠퍼스",
    due: "9월 18일 23:59",
    status: "작성 중",
    steps: 2,
    summary:
      "요구사항 도출까지 정리했고, 실시간 혼잡도 기능의 개인정보 문제를 판단하는 중입니다.",
    hasProofprint: true,
  },
  {
    id: "user-interview",
    workspaceSlug: "adventure-design",
    title: "사용자 인터뷰 분석 보고서",
    source: "사이버캠퍼스",
    due: "9월 11일 18:00",
    status: "제출 완료",
    steps: 5,
    summary: "인터뷰 6건을 코딩해 문제 유형 3개로 묶었습니다.",
    hasProofprint: false,
  },
  {
    id: "eigen-exercise",
    workspaceSlug: "linear-algebra",
    title: "3주차 연습문제 (고유값)",
    source: "사이버캠퍼스",
    due: "9월 2일 18:00",
    status: "시작 전",
    steps: 0,
    summary: "특성방정식과 대각화 범위.",
    hasProofprint: false,
  },
  {
    id: "os-midterm",
    workspaceSlug: "operating-system",
    title: "중간고사 대비 문제풀이",
    source: "사이버캠퍼스",
    due: "10월 20일",
    status: "시작 전",
    steps: 0,
    summary: "프로세스·스레드·동기화 범위.",
    hasProofprint: false,
  },
];

export const sampleConversation = {
  "workspaceSlug": "linear-algebra",
  "messages": [
    {
      "role": "user",
      "paragraphs": [
        "대각화 가능 조건이 뭐였지? 고유값이 겹치면 안 되는 거 맞아?"
      ],
      "tool": null
    },
    {
      "role": "agent",
      "paragraphs": [
        "겹치는 것 자체는 문제가 아닙니다. 조건은 «각 고유값의 기하적 중복도 = 대수적 중복도» 입니다.",
        "예를 들어 단위행렬은 고유값 1이 n번 겹치지만 이미 대각행렬이라 대각화가 됩니다. 반대로 [[1,1],[0,1]] 은 고유값 1이 두 번 나오는데 고유벡터가 한 방향밖에 없어서 대각화가 안 됩니다."
      ],
      "tool": "read_material — 강의노트 3주차.pdf 14~17쪽"
    },
    {
      "role": "user",
      "paragraphs": [
        "아 그러면 기하적 중복도가 고유공간의 차원인 거야?"
      ],
      "tool": null
    },
    {
      "role": "agent",
      "paragraphs": [
        "맞습니다. 그 부분은 정확하게 짚으셨습니다.",
        "그러면 확인차 하나만 여쭤볼게요. [[2,1],[0,2]] 는 대각화가 될까요? 이유까지 같이 말해 보세요."
      ],
      "tool": "log_evidence — «고유공간» 을 접함 → 설명 가능 후보로 표시"
    },
    {
      "role": "user",
      "paragraphs": [
        "고유값이 2로 겹치니까... 안 될 것 같은데 이유는 잘 모르겠어"
      ],
      "tool": null
    },
    {
      "role": "agent",
      "paragraphs": [
        "결론은 맞지만 이유가 «겹쳐서» 로 남아 있어서, 조금 전에 정리한 조건과 어긋납니다. 이 부분을 오답노트에 남겨뒀습니다.",
        "정확한 이유는 이렇습니다. 고유값 2의 대수적 중복도는 2인데, (A - 2I) 의 해공간을 구해 보면 차원이 1입니다. 두 값이 다르므로 대각화가 불가능합니다."
      ],
      "tool": "record_gap — «고유값 중복과 대각화» 3회째 기록"
    }
  ]
};
