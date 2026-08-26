import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { PresentationChart } from "@phosphor-icons/react/dist/ssr/PresentationChart";
import { Receipt } from "@phosphor-icons/react/dist/ssr/Receipt";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { TreeStructure } from "@phosphor-icons/react/dist/ssr/TreeStructure";
import Link from "next/link";
import type { ReactNode } from "react";
import { cyberCampus, getWorkItems, projects, user } from "../lib/study-data";
import styles from "../study.module.css";
import { ProjectSwitcher } from "./project-switcher";

export type ShellMenu =
  | "overview"
  | "study"
  | "workspace"
  | "syllabus"
  | "notes"
  | "materials"
  | "record"
  | "none";

type NavItem = {
  key: ShellMenu;
  label: string;
  hint: string;
  href: string;
  icon: ReactNode;
  badge?: number;
};

export function AppShell({
  projectSlug,
  active,
  children,
}: {
  projectSlug: string;
  active: ShellMenu;
  children: ReactNode;
}) {
  const project = projects.find((item) => item.slug === projectSlug);
  const base = `/projects/${projectSlug}`;
  const openNotes = project?.notes.filter((note) => note.status !== "resolved").length ?? 0;
  const openWork = getWorkItems(projectSlug).filter(
    (item) => item.status !== "제출 완료",
  ).length;

  const groups: { title: string; items: NavItem[] }[] = [
    {
      title: "학습",
      items: [
        {
          key: "overview",
          label: "학습 현황",
          hint: "지금 어디까지 왔는지",
          href: base,
          icon: <PresentationChart size={19} weight="bold" />,
        },
        {
          key: "study",
          label: "학습하기",
          hint: "에이전트와 공부",
          href: `${base}/study`,
          icon: <ChatCircleDots size={19} weight="bold" />,
        },
      ],
    },
    {
      title: "작업",
      items: [
        {
          key: "workspace",
          label: "작업공간",
          hint: "과제 · 개인 학습",
          href: `${base}/workspace`,
          icon: <SquaresFour size={19} weight="bold" />,
          badge: openWork,
        },
      ],
    },
    {
      title: "점검",
      items: [
        {
          key: "syllabus",
          label: "목차 · 이해도",
          hint: "단원별 상태",
          href: `${base}/syllabus`,
          icon: <TreeStructure size={19} weight="bold" />,
        },
        {
          key: "notes",
          label: "오답노트",
          hint: "몰랐던 것 모음",
          href: `${base}/notes`,
          icon: <NotePencil size={19} weight="bold" />,
          badge: openNotes,
        },
      ],
    },
    {
      title: "자료 · 기록",
      items: [
        {
          key: "materials",
          label: "학습 자료",
          hint: "내가 올린 자료",
          href: `${base}/materials`,
          icon: <FileText size={19} weight="bold" />,
        },
        {
          key: "record",
          label: "학습 기록",
          hint: "Proofprint",
          href: `${base}/record`,
          icon: <Receipt size={19} weight="bold" />,
        },
      ],
    },
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/projects" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={20} weight="bold" />
            </span>
            <span>
              <strong>Proofprint</strong>
            </span>
          </Link>
          <span className={styles.topbarDivider} aria-hidden="true" />
          <ProjectSwitcher projects={projects} currentSlug={projectSlug} />
        </div>

        <div className={styles.topbarRight}>
          <span className={styles.syncPill}>
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            사이버캠퍼스 연동됨 · {cyberCampus.lastSyncedAt}
          </span>
          <Link href="/projects" className={styles.topbarLink}>
            <Books size={18} weight="bold" aria-hidden="true" /> 전체 프로젝트
          </Link>
          <button type="button" className={styles.iconBtn} aria-label="알림 5개">
            <EnvelopeSimple size={20} weight="regular" aria-hidden="true" />
            <span className={styles.dot} aria-hidden="true" />
          </button>
          <span className={styles.topbarDivider} aria-hidden="true" />
          <button type="button" className={styles.userBtn}>
            <span className={styles.avatar} aria-hidden="true">
              {user.initial}
            </span>
            <span className={styles.userMeta}>
              <em>{user.department}</em>
              <strong>{user.name}</strong>
            </span>
          </button>
        </div>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidenav} aria-label="프로젝트 메뉴">
          {groups.map((group) => (
            <section key={group.title} className={styles.navGroup}>
              <p className={styles.navGroupTitle}>{group.title}</p>
              <nav aria-label={group.title}>
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={active === item.key ? "page" : undefined}
                    className={
                      active === item.key
                        ? `${styles.navItem} ${styles.navItemActive}`
                        : styles.navItem
                    }
                  >
                    <span className={styles.navIcon} aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className={styles.navText}>
                      <strong>{item.label}</strong>
                      <em>{item.hint}</em>
                    </span>
                    {item.badge ? (
                      <span className={styles.navBadge}>{item.badge}</span>
                    ) : null}
                  </Link>
                ))}
              </nav>
            </section>
          ))}

          {project ? (
            <div className={styles.navFooter}>
              <p>마지막 갱신</p>
              <strong>{project.updatedAt}</strong>
              <span>
                사이버캠퍼스에서 가져온 과제와 자료를 바탕으로 에이전트가 학습 중에
                자동으로 기록합니다.
              </span>
            </div>
          ) : null}
        </aside>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
