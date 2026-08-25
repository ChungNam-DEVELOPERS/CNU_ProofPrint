# CNU Proofprint × 멀티LLM 연동 설계

작성일: 2026-08-25
상태: 과제 화면 내 AI 인터페이스·교체형 서버 커넥터 구현, 학교 공식 API 승인 전

## 결론

학생은 Proofprint 2단계에서 모델과 AI 사용 목적을 선택하고 질문한다. 답변 전체가 자동 제출되는 것이 아니라 학생이 `이 답변을 Proofprint에서 검토`를 눌렀을 때 질문, 선택한 답변, 모델·요청 식별자만 판단 단계로 이동한다. 이후 학생이 채택·수정·폐기와 이유를 직접 기록한다.

충남대학교는 학생·교직원에게 AI 포털의 월 5,000 크레딧을 제공하고, 전공 개념 요약·과제 구성·학습 질의응답 같은 활용을 안내하고 있다. 공식 근거는 [충남대학교 AI 포털 운영 기사](https://plus.cnu.ac.kr/_prog/_board/?code=sub07_0703&menu_dvs_cd=0703&mode=V&no=2512070&site_dvs_cd=kr)와 [AI 포털 서비스 안내](https://plus.cnu.ac.kr/_prog/_board/?code=sub07_0701&menu_dvs_cd=0701&mode=V&no=2512499&site_dvs_cd=kr&upr_ntt_no=2512499)다.

## 현재 동작

| 모드 | 조건 | 동작 |
| --- | --- | --- |
| 연동 데모 | 커넥터 환경변수 없음 | 캠퍼스 문제 해결 과제용 고정 데모 답변을 스트리밍하고 `provider=demo`로 저장 |
| 학교 커넥터 | URL·서버 토큰 설정 | 승인된 중계 서버에 학생·과제·모델 컨텍스트를 전달하고 `provider=cnu_multillm`으로 저장 |

데모 모드는 실제 CNU 크레딧을 사용하거나 잔여량을 조회하지 않는다. 화면의 `예상 1 크레딧`은 인터랙션을 검증하기 위한 표시다.

## 포털을 iframe으로 넣지 않는 이유

2026-08-25 `https://aiportal.cnu.ac.kr/` 응답 헤더를 확인한 결과 `Content-Security-Policy: frame-ancestors 'none'`과 `X-Frame-Options: DENY`가 설정되어 있었다. 따라서 현재 포털 페이지 자체를 Proofprint 안에 iframe으로 삽입하는 방식은 브라우저에서 차단된다.

공개 웹 문서에서는 학생별 크레딧을 위임해 호출하는 공식 API·OAuth 범위를 확인하지 못했다. 이는 공개 자료 조사에 따른 판단이며, API가 없다는 단정은 아니다. 운영 연동은 AI정보화본부가 승인한 API/SSO 문서를 받아 확정해야 한다.

## Proofprint 서버 커넥터 계약

브라우저는 학교 서비스 토큰을 받지 않는다. `/api/ai/assist`가 작업공간 소유권을 확인한 뒤 서버 전용 커넥터를 호출한다.

요청 예시:

```json
{
  "version": "2026-08-25",
  "actor": { "subject": "학교가 승인한 학생 외부 식별자" },
  "modelAlias": "auto",
  "task": {
    "course": "[2026-2학기] 어드벤처디자인 (01반)",
    "assignment": "캠퍼스 문제 해결 서비스 설계",
    "learningGoal": "사용자 문제를 요구사항으로 구조화하고 대안을 비교한다.",
    "purpose": "아이디어 탐색",
    "message": "도서관 좌석 이용 불편을 해결할 기능을 제안해 줘."
  },
  "privacy": {
    "persistRawConversation": false,
    "returnUsage": true
  }
}
```

응답 예시:

```json
{
  "text": "AI 답변 문자열",
  "model": "학교 모델 카탈로그의 실제 모델 ID",
  "requestId": "감사·사용량 대조용 요청 ID",
  "creditsUsed": 1
}
```

커넥터는 `Authorization: Bearer <server-token>`을 사용한다. 학생 인증을 위임형 OAuth/OIDC 토큰으로 바꾸게 되면 정적 서비스 토큰 대신 짧은 수명의 사용자 위임 토큰을 서버에서 교환한다.

## 환경변수

```bash
CNU_MULTI_LLM_CONNECTOR_URL=https://approved-connector.example/api/generate
CNU_MULTI_LLM_CONNECTOR_TOKEN=server-only-secret
```

둘 중 하나라도 없으면 애플리케이션은 데모 모드로 내려간다. 토큰은 `.env.local` 또는 배포 환경의 비밀 저장소에만 두고 `NEXT_PUBLIC_` 접두사를 사용하지 않는다.

## 학교에 확인할 항목

1. 외부 교육 도구용 생성 API와 모델 카탈로그 API가 제공되는가?
2. 학생의 월별 크레딧을 차감할 수 있는 OAuth/OIDC 위임 방식과 scope는 무엇인가?
3. 잔여 크레딧·요청별 사용량 조회 API가 있는가?
4. 응답의 모델 ID·요청 ID·사용 크레딧 필드 규격은 무엇인가?
5. 프롬프트·응답의 학교 측 보존 기간과 민감정보 필터 정책은 무엇인가?
6. LTI/SSO 식별자와 AI 포털 사용자를 안전하게 매핑하는 기준은 무엇인가?
7. 스트리밍 응답, 호출 제한, 장애 시 대체 모델 정책을 지원하는가?

## 단계적 적용

1. 현재 데모로 과제 수행 흐름과 교수자 검토 가치를 검증한다.
2. 학교 샌드박스에서 SSO 사용자 매핑·모델 목록·크레딧 조회를 연결한다.
3. 소수 교과목에서 실제 크레딧 사용량, 실패율, 개인정보 노출 여부를 측정한다.
4. 운영 승인 후 모델 카탈로그와 잔여 크레딧을 실시간 표시하고 학과 단위로 확대한다.
