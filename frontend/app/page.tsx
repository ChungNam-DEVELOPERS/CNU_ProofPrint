import { ArrowRight } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { Receipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { TreeStructure } from "@phosphor-icons/react/dist/ssr/TreeStructure";
import Link from "next/link";
import styles from "./study.module.css";

const features = [
  {
    icon: <LinkSimple size={19} weight="bold" />,
    title: "사이버캠퍼스 연동",
    body: "과목, 과제, 강의자료를 자동으로 가져옵니다.",
  },
  {
    icon: <TreeStructure size={19} weight="bold" />,
    title: "목차별 이해도",
    body: "설명을 들은 것과 설명할 수 있는 것을 구분합니다.",
  },
  {
    icon: <NotePencil size={19} weight="bold" />,
    title: "오답노트 자동 정리",
    body: "몰랐던 개념과 공식만 따로 모아 반복을 잡습니다.",
  },
  {
    icon: <Receipt size={19} weight="bold" />,
    title: "1페이지 학습 기록",
    body: "무엇을 어떻게 공부했는지 한 장으로 남습니다.",
  },
];

export default function LandingPage() {
  return (
    <div className={styles.shell}>
      <nav className={styles.landingNav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            <PencilSimpleLine size={20} weight="bold" />
          </span>
          <span>
            <strong>Proofprint</strong>
          </span>
        </Link>
        <div className={styles.landingNavLinks}>
          <Link href="/login" className={styles.topbarLink}>
            로그인
          </Link>
          <Link href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>
            시작하기
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div>
          <h1 className={styles.heroTitle}>
            사이버캠퍼스는
            <br />
            과제만 알려줍니다.
            <br />
            <span>무엇을 아는지는</span> 여기서.
          </h1>
          <p className={styles.heroLead}>
            학번으로 한 번만 연동하면 이번 학기 과목과 과제를 그대로 읽어옵니다. 그
            위에서 학습 에이전트가 함께 공부하면서, 목차별 이해도와 몰랐던 개념을
            스스로 정리해 둡니다.
          </p>
          <div className={styles.heroActions}>
            <Link href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>
              사이버캠퍼스 연동하고 시작하기
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
            <Link href="/projects" className={styles.btn}>
              둘러보기
            </Link>
          </div>
        </div>

        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.artCard}>
            <h3>선형대수학 · 학습 현황</h3>
            {[
              { icon: <TreeStructure size={17} weight="bold" />, width: "82%" },
              { icon: <NotePencil size={17} weight="bold" />, width: "64%" },
              { icon: <Receipt size={17} weight="bold" />, width: "73%" },
              { icon: <LinkSimple size={17} weight="bold" />, width: "48%" },
            ].map((row, index) => (
              <div key={index} className={styles.artRow}>
                <span className={styles.artIcon}>{row.icon}</span>
                <span className={styles.artBar} style={{ maxWidth: row.width }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className={styles.featureStrip}>
        {features.map((feature) => (
          <div key={feature.title} className={styles.featureItem}>
            <span className={styles.featureIcon} aria-hidden="true">
              {feature.icon}
            </span>
            <span>
              <strong>{feature.title}</strong>
              <span>{feature.body}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
