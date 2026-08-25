import { BookOpenText } from "@phosphor-icons/react/dist/ssr/BookOpenText";
import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { ClockCounterClockwise } from "@phosphor-icons/react/dist/ssr/ClockCounterClockwise";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { List } from "@phosphor-icons/react/dist/ssr/List";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { UserCircle } from "@phosphor-icons/react/dist/ssr/UserCircle";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { course } from "../lib/proofprint-data";
import styles from "../proofprint.module.css";

type ActiveMenu = "과제" | "Proofprint 작성" | "제출 기록";

const learningItems = [
  "강의수강",
  "콘텐츠",
  "자료실",
  "과제",
  "토론",
  "시험/퀴즈",
  "팀프로젝트",
];

const boardItems = ["공지사항", "Q&A", "자유게시판", "설문조사"];

export function CnuCourseShell({
  activeMenu,
  children,
}: {
  activeMenu: ActiveMenu;
  children: ReactNode;
}) {
  return (
    <div className={styles.appShell}>
      <header className={styles.globalHeader}>
        <div className={styles.brandGroup}>
          <Link href="/" aria-label="CNU 사이버캠퍼스 과제 홈">
            <Image
              src="/assets/cnu-cyber-campus-logo.png"
              alt="CNU 사이버캠퍼스"
              width={170}
              height={40}
              priority
            />
          </Link>
          <button className={styles.iconButton} type="button" aria-label="전체 메뉴 열기">
            <List size={23} weight="bold" aria-hidden="true" />
          </button>
          <nav className={styles.globalNav} aria-label="사이버캠퍼스 주요 메뉴">
            <Link href="/">
              강의실 <CaretDown size={14} weight="fill" aria-hidden="true" />
            </Link>
            <Link href="/">
              To-Do-list <CaretDown size={14} weight="fill" aria-hidden="true" />
            </Link>
            <Link href="/proofprints">
              알림마당 <CaretDown size={14} weight="fill" aria-hidden="true" />
            </Link>
          </nav>
        </div>

        <div className={styles.userArea}>
          <UserCircle size={39} weight="fill" aria-hidden="true" />
          <div className={styles.userText}>
            <span>{course.department}</span>
            <strong>{course.student}(학생)</strong>
          </div>
          <CaretDown size={14} weight="fill" aria-hidden="true" />
          <span className={styles.userDivider} aria-hidden="true" />
          <EnvelopeSimple size={30} weight="regular" aria-hidden="true" />
          <span className={styles.noticeBadge} aria-label="읽지 않은 알림 5개">
            5
          </span>
        </div>
      </header>

      <div className={styles.courseBar}>
        <strong>{course.title}</strong>
        <button type="button" aria-label="과목 목록 열기">
          <CaretDown size={17} weight="fill" aria-hidden="true" />
        </button>
      </div>

      <div className={styles.pageGrid}>
        <aside className={styles.sidebar} aria-label="과목 메뉴">
          <SidebarSection title="학습요소" icon={<BookOpenText size={22} weight="bold" />}>
            {learningItems.map((item) =>
              item === "과제" ? (
                <Link
                  className={activeMenu === "과제" ? styles.activeSubmenu : undefined}
                  href="/"
                  key={item}
                  aria-current={activeMenu === "과제" ? "page" : undefined}
                >
                  {item}
                </Link>
              ) : (
                <span key={item}>{item}</span>
              ),
            )}
          </SidebarSection>

          <SidebarSection title="AI 학습과정" icon={<Sparkle size={22} weight="fill" />}>
            <Link
              className={activeMenu === "Proofprint 작성" ? styles.activeSubmenu : undefined}
              href="/assignments/ai-service-proposal/proofprint"
              aria-current={activeMenu === "Proofprint 작성" ? "page" : undefined}
            >
              <Sparkle size={15} weight="fill" aria-hidden="true" /> Proofprint 작성
            </Link>
            <Link
              className={activeMenu === "제출 기록" ? styles.activeSubmenu : undefined}
              href="/proofprints"
              aria-current={activeMenu === "제출 기록" ? "page" : undefined}
            >
              <ClockCounterClockwise size={16} weight="bold" aria-hidden="true" /> 제출 기록
            </Link>
          </SidebarSection>

          <SidebarSection title="학습게시판" icon={<FileText size={22} weight="bold" />}>
            {boardItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </SidebarSection>
        </aside>

        <main className={styles.mainContent}>{children}</main>
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.sidebarSection}>
      <div className={styles.sidebarHeading}>
        <span>
          {icon}
          {title}
        </span>
        <CaretDown size={15} weight="bold" aria-hidden="true" />
      </div>
      <nav className={styles.sidebarLinks} aria-label={title}>
        {children}
      </nav>
    </section>
  );
}
