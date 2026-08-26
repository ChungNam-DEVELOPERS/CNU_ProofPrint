import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import Link from "next/link";
import { OnboardSteps } from "../components/onboard-steps";
import styles from "../study.module.css";

export const metadata = { title: "회원가입 | Proofprint" };

export default function SignupPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.authWrap}>
        <div className={styles.authCard}>
          <p className={styles.authBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={18} weight="bold" />
            </span>
            Proofprint
          </p>
          <h1 className={styles.authTitle}>회원가입</h1>
          <p className={styles.authDesc}>
            먼저 Proofprint 계정을 만듭니다. 사이버캠퍼스 연동은 다음 단계입니다.
          </p>

          <OnboardSteps current={0} />

          <div className={styles.field}>
            <label htmlFor="name">이름</label>
            <input id="name" placeholder="기니돼지" />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" placeholder="student@o.cnu.ac.kr" />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" placeholder="8자 이상" />
            <p>사이버캠퍼스 비밀번호와 다른 것을 사용하세요.</p>
          </div>

          <Link
            href="/connect"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}
          >
            다음 — 사이버캠퍼스 연동
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>

          <p className={styles.authFoot}>
            이미 계정이 있으신가요? <Link href="/login">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
