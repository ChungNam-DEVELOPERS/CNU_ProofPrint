import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import styles from "../../study.module.css";

// AppShell 이 DB 를 읽으므로 정적 프리렌더 대상이 될 수 없다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "새 워크스페이스 | Proofprint" };

export default function NewProjectPage() {
  return (
    <AppShell workspaceSlug="" active="none">
      <div className={styles.pageHead}>
        <div>
          <Link href="/workspaces" className={styles.cardLink}>
            <ArrowLeft size={13} weight="bold" aria-hidden="true" /> 워크스페이스 목록
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            새 워크스페이스 만들기
          </h1>
          <p className={styles.pageDesc}>
            무엇을 공부하는지만 알려주면 에이전트가 목차 초안을 만들고, 학습하는 동안
            계속 갱신합니다.
          </p>
        </div>
      </div>

      <div className={styles.formCard}>
        <div className={styles.field}>
          <label htmlFor="title">워크스페이스 이름</label>
          <input id="title" placeholder="예: 선형대수학, 정보처리기사 필기, 논문 읽기" />
        </div>

        <div className={styles.field}>
          <label htmlFor="kind">분류</label>
          <select id="kind" defaultValue="course">
            <option value="course">수업 과목</option>
            <option value="exam">시험 대비</option>
            <option value="assignment">과제 · 팀 작업</option>
            <option value="self">개인 학습</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="goal">이번 학습에서 도달하고 싶은 지점</label>
          <textarea
            id="goal"
            placeholder="예: 고유값과 대각화까지 스스로 설명할 수 있게 되고 싶다"
          />
          <p>비워둬도 됩니다. 학습을 시작하면 에이전트가 물어봅니다.</p>
        </div>

        <div className={styles.field}>
          <label htmlFor="outline">목차를 이미 알고 있다면 붙여넣기</label>
          <textarea id="outline" placeholder="강의계획서나 교재 목차를 그대로 붙여넣으세요" />
          <p>없으면 자료를 올리거나 대화하면서 에이전트가 목차를 만들어 갑니다.</p>
        </div>

        <button type="button" className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}>
          <Plus size={16} weight="bold" aria-hidden="true" /> 워크스페이스 만들기
        </button>
      </div>
    </AppShell>
  );
}
