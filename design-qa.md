# CNU Proofprint 디자인 QA

## 비교 기준과 증거

아래 캡처는 로그인 계정 정보가 포함될 수 있는 로컬 QA 증거이며 `.gitignore`로 공개 저장소에서 제외한다.

- 시각적 기준(source of visual truth): `.artifacts/design/selected-option-2.png`
- 기준안 크기: 1869 × 842 px
- 대표 구현 화면: `.artifacts/qa/flow-workspace-final.png`
- 구현 브라우저 CSS 뷰포트: 1869 × 842 px
- 구현 브라우저 캡처 원본: `.artifacts/qa/flow-workspace-final-native.png`, 2335 × 1053 px
- 밀도 정규화: 캡처 백엔드가 CSS 뷰포트 밖의 빈 픽셀을 포함해 저장하므로 좌측 상단의 실제 CSS 화면 1869 × 842 px을 잘라 비교했다. 확대·축소는 하지 않았다.
- 비교 상태: Proofprint 3단계 `판단`, `수정` 선택, 원문 비공개, 저장 전
- 전체 화면 비교: `.artifacts/qa/flow-workspace-comparison.png`
- 판단 영역 확대 비교: `.artifacts/qa/flow-workspace-focus.png`

확장된 전체 흐름의 브라우저 증거:

- 과제 대시보드: `.artifacts/qa/flow-dashboard.png`
- 과제 상세: `.artifacts/qa/flow-assignment-detail.png`
- 1페이지 Proofprint: `.artifacts/qa/flow-proofprint-result.png`
- 제출 기록: `.artifacts/qa/flow-proofprint-history.png`
- 820px 대시보드: `.artifacts/qa/flow-dashboard-responsive.png`
- 820px 작업공간: `.artifacts/qa/flow-workspace-responsive.png`
- 820px 결과 화면: `.artifacts/qa/flow-result-responsive.png`

## Findings

최종 비교에서 조치가 필요한 P0, P1, P2 차이는 없다.

| 필수 검토면 | 결과 | 근거 |
| --- | --- | --- |
| 폰트·타이포그래피 | 통과 | Noto Sans KR, 제목·본문·보조 문구의 크기와 굵기 위계가 기준안과 일치한다. 생성 이미지와 브라우저 폰트의 미세한 안티앨리어싱 차이만 P3로 남는다. |
| 간격·레이아웃 리듬 | 통과 | 상단 CNU 셸, 5단계 표시, 좌우 카드 비율, 입력 영역과 우측 체크포인트의 시작선이 기준안과 맞는다. 820px에서 가로 스크롤 없이 단일 열로 전환된다. |
| 색상·토큰 | 통과 | CNU 남색·파랑, Proofprint 청록, 완료 초록, 비공개·안내 회색을 전 화면에 같은 의미로 사용했다. |
| 이미지·자산 품질 | 통과 | 사이버캠퍼스의 실제 로고 파일과 Phosphor 아이콘을 사용했다. 깨진 자산, 임시 이미지, 코드로 흉내 낸 로고가 없다. |
| 문구·콘텐츠 | 통과 | 기준안의 AI 제안, 채택·수정·폐기, 판단 이유, 학습목표, 원문 비공개 원칙이 유지된다. 확장 화면에도 같은 용어를 사용했다. |

의도적인 제품 확장 차이는 다음과 같다.

- 좌측 메뉴에 `AI 학습과정`과 `제출 기록`을 추가했다. 사이버캠퍼스에 Proofprint를 접목하기 위한 신규 기능 영역이다.
- 2단계 안에 CNU 멀티LLM 모델 선택, 추천 질문, 스트리밍 답변과 `이 답변을 Proofprint에서 검토` 동작을 추가했다. 기존 CNU 카드·입력·버튼 토큰을 그대로 사용했다.
- 완료된 1·2단계는 숫자 대신 체크 아이콘으로 표시한다.
- 기준안의 `체크포인트 저장`을 완결된 5단계 흐름의 `이전`·`저장하고 다음`으로 확장했다.
- 판단 이유는 학습과정 증명의 핵심 근거이므로 `(선택)` 대신 `(필수)`로 명확히 했다.

## 비교·수정 이력

1. 확장 1차 화면에서 breadcrumb, 설명문과 단계 안내가 판단 화면 상단에 중복되어 기준안보다 카드가 약 100px 아래로 밀리고 주요 동작이 첫 화면 아래로 내려가는 P2 차이를 확인했다. 판단 단계에서는 중복 정보를 제거하고 과제명 → 단계 표시 → 작업 카드 순서로 복원했다.
2. 확대 비교에서 판단 이유 입력란이 기준안보다 높아 하단 리듬이 달라지는 P2 차이를 확인했다. 판단 단계 입력란 높이를 99px로 고정했다.
3. 프로덕션 빌드를 다시 캡처해 전체 화면과 확대 영역을 재비교했다. 앞선 두 P2 차이가 해소됐고 새로운 P0/P1/P2는 발견되지 않았다.

## 기능·반응형·접근성 검증

- `과제 대시보드 → 과제 상세 → 작업공간 → 1페이지 결과 → 제출 확인 → 제출 기록` 전체 흐름을 브라우저에서 클릭했다.
- 5단계의 직접 이동, 이전·다음, PostgreSQL 임시 저장과 새로고침 후 데이터 유지가 동작한다.
- `CNU 추천/GPT/Claude/Gemini` 모델 선택 → AI 질문 → 스트리밍 답변 → 판단 단계 이동을 확인했다. 선택된 제공자·모델·요청 ID와 초기 `수정` 판단 근거가 PostgreSQL에 함께 저장된다.
- 채택·수정·폐기 전환 시 판단 이유가 상태에 맞게 바뀐다.
- 공개 범위 스위치를 끄면 해당 결과 영역이 즉시 제외되고 서버 저장 후 새로고침에도 유지된다. 원문 공개 요청은 서버에서도 거부한다.
- 제출 확인 모달, 제출 중 상태, 버전 스냅샷 생성, 제출 완료 알림과 DB 기반 제출 기록 반영을 확인했다.
- 제출 기록의 상태 필터와 빈 검색 결과 상태를 확인했다.
- 820 × 900 CSS 뷰포트에서 `scrollWidth = innerWidth = 820`, 사이드바 숨김, 카드 단일 열 전환을 확인했다.
- 모바일 브라우저 뷰포트에서도 `scrollWidth = innerWidth = 487`로 가로 넘침이 없고, AI 모델 카드와 체크포인트 패널이 단일 열로 전환되는 것을 확인했다.
- 시맨틱 heading, `fieldset`/`legend`, 입력 label, `aria-pressed`, `role="switch"`, 라이브 상태 영역과 키보드 포커스 스타일을 적용했다.
- 브라우저 오류 오버레이: 없음
- `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check`: 모두 성공

## Follow-up Polish

- P3: 실제 CNU 운영 환경의 브라우저·OS별 폰트 렌더링 차이를 학교 테스트 계정으로 추가 확인할 수 있다.
- P3: 실제 LTI iframe 높이 제약을 확인한 뒤 작업공간 우측 패널의 sticky 여부를 최종 결정할 수 있다.

## final result

passed
