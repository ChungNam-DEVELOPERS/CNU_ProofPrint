import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import Link from "next/link";
import styles from "../study.module.css";

export const metadata = { title: "로그인 | Proofprint" };

export default function LoginPage() {
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
          <h1 className={styles.authTitle}>로그인</h1>
          <p className={styles.authDesc}>Proofprint 계정으로 로그인하세요.</p>

          <div className={styles.field}>
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" placeholder="student@o.cnu.ac.kr" />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" />
          </div>

          <Link
            href="/projects"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}
          >
            로그인
          </Link>

          <p className={styles.authFoot}>
            계정이 없으신가요? <Link href="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
