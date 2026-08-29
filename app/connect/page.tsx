import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { GraduationCap } from "@phosphor-icons/react/dist/ssr/GraduationCap";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { Prohibit } from "@phosphor-icons/react/dist/ssr/Prohibit";
import { ShieldCheck } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import Link from "next/link";
import { OnboardSteps } from "../components/onboard-steps";
import styles from "../study.module.css";

export const metadata = { title: "사이버캠퍼스 연동 | Proofprint" };

const receives = [
  "수강 과목과 학기",
  "과제 목록과 마감일",
  "공개된 강의자료",
];

const neverReceives = [
  "사이버캠퍼스 비밀번호",
  "성적과 취득점수",
  "다른 학생의 정보",
];

export default function ConnectPage() {
  return (
    <div className={styles.shell}>
      <div className={styles.authWrap}>
        <div className={`${styles.authCard} ${styles.authCardWide}`}>
          <p className={styles.authBrand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={18} weight="bold" />
            </span>
            Proofprint
          </p>
          <h1 className={styles.authTitle}>사이버캠퍼스 연동</h1>
          <p className={styles.authDesc}>
            학교 통합 로그인으로 한 번만 연결하면 이번 학기 과목과 과제를 가져옵니다.
          </p>

          <OnboardSteps current={0} />

          <div className={styles.campusBox}>
            <GraduationCap size={26} weight="fill" aria-hidden="true" />
            <span>
              <strong>충남대학교 통합 로그인 (SSO)</strong>
              <span>
                학교 로그인 화면에서 직접 로그인하고, 학교가 Proofprint에 &ldquo;이
                학생이 맞다&rdquo;고 알려주는 방식입니다.
              </span>
            </span>
          </div>

          <div className={styles.permGrid}>
            <div className={styles.permCol}>
              <p className={styles.permHeading}>
                <Check size={14} weight="bold" aria-hidden="true" /> 가져오는 것
              </p>
              {receives.map((item) => (
                <span key={item} className={styles.permItem}>
                  {item}
                </span>
              ))}
            </div>
            <div className={styles.permCol}>
              <p className={`${styles.permHeading} ${styles.permHeadingDeny}`}>
                <Prohibit size={14} weight="bold" aria-hidden="true" /> 가져오지 않는 것
              </p>
              {neverReceives.map((item) => (
                <span key={item} className={`${styles.permItem} ${styles.permItemDeny}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          <Link
            href="/connect/importing"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}
          >
            <GraduationCap size={18} weight="fill" aria-hidden="true" />
            충남대학교 계정으로 로그인
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </Link>

          <p className={styles.privacyNote}>
            <ShieldCheck size={14} weight="bold" aria-hidden="true" /> 비밀번호는 학교
            로그인 화면에만 입력하고 Proofprint는 받지 않습니다. 연동은 설정에서 언제든
            끊을 수 있습니다.
          </p>

          <p className={styles.authFoot}>
            <Link href="/workspaces">나중에 하고 먼저 둘러보기</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
