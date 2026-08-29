import { Books } from "@phosphor-icons/react/dist/ssr/Books";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { EnvelopeSimple } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import { FileText } from "@phosphor-icons/react/dist/ssr/FileText";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { PencilSimpleLine } from "@phosphor-icons/react/dist/ssr/PencilSimpleLine";
import { PresentationChart } from "@phosphor-icons/react/dist/ssr/PresentationChart";
import { SquaresFour } from "@phosphor-icons/react/dist/ssr/SquaresFour";
import { TreeStructure } from "@phosphor-icons/react/dist/ssr/TreeStructure";
import Link from "next/link";
import type { ReactNode } from "react";
import { cyberCampus, user } from "../lib/study-data";
import { getServerActor } from "../server/auth";
import {
  listAssignments,
  listGaps,
  listWorkspaces,
  requireWorkspaceId,
} from "../server/learning-repository";
import styles from "../study.module.css";
import { WorkspaceSwitcher } from "./workspace-switcher";

export type ShellMenu =
  | "overview"
  | "study"
  | "assignments"
  | "syllabus"
  | "notes"
  | "materials"
  | "none";

type NavItem = {
  key: ShellMenu;
  label: string;
  hint: string;
  href: string;
  icon: ReactNode;
  badge?: number;
};

export async function AppShell({
  workspaceSlug,
  active,
  children,
}: {
  workspaceSlug: string;
  active: ShellMenu;
  children: ReactNode;
}) {
  const actor = await getServerActor();
  const workspaces = await listWorkspaces(actor);
  const workspace = workspaces.find((item) => item.slug === workspaceSlug);
  const base = `/workspaces/${workspaceSlug}`;

  let openGaps = 0;
  let openAssignments = 0;
  if (workspace) {
    const workspaceId = await requireWorkspaceId(actor, workspaceSlug);
    const [gaps, assignments] = await Promise.all([
      listGaps(workspaceId),
      listAssignments(workspaceId),
    ]);
    openGaps = gaps.filter((gap) => gap.status !== "resolved").length;
    openAssignments = assignments.filter((item) => item.status !== "제출 완료").length;
  }

  const navItems: NavItem[] = [
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
    {
      key: "assignments",
      label: "과제",
      hint: "사이버캠퍼스 과제",
      href: `${base}/assignments`,
      icon: <SquaresFour size={19} weight="bold" />,
      badge: openAssignments,
    },
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
      hint: "몰랐던 개념 암기",
      href: `${base}/notes`,
      icon: <NotePencil size={19} weight="bold" />,
      badge: openGaps,
    },
    {
      key: "materials",
      label: "학습 자료",
      hint: "내가 올린 자료",
      href: `${base}/materials`,
      icon: <FileText size={19} weight="bold" />,
    },
  ];

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.topbarLeft}>
          <Link href="/workspaces" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              <PencilSimpleLine size={20} weight="bold" />
            </span>
            <span>
              <strong>Proofprint</strong>
            </span>
          </Link>
          <span className={styles.topbarDivider} aria-hidden="true" />
          <WorkspaceSwitcher workspaces={workspaces} currentSlug={workspaceSlug} />
        </div>

        <div className={styles.topbarRight}>
          <span className={styles.syncPill}>
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            사이버캠퍼스 연동됨 · {cyberCampus.lastSyncedAt}
          </span>
          <Link href="/workspaces" className={styles.topbarLink}>
            <Books size={18} weight="bold" aria-hidden="true" /> 전체 워크스페이스
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
        <aside className={styles.sidenav} aria-label="워크스페이스 메뉴">
          <nav className={styles.navList} aria-label="워크스페이스 메뉴">
            {navItems.map((item) => (
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
                {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
              </Link>
            ))}
          </nav>

          {workspace ? (
            <div className={styles.navFooter}>
              <p>마지막 갱신</p>
              <strong>{workspace.updatedAt}</strong>
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
