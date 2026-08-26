import { BookOpen } from "@phosphor-icons/react/dist/ssr/BookOpen";
import { CheckSquare } from "@phosphor-icons/react/dist/ssr/CheckSquare";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { TreeStructure } from "@phosphor-icons/react/dist/ssr/TreeStructure";
import type { ReactNode } from "react";
import type { ActivityItem } from "../lib/study-data";
import styles from "../study.module.css";

const toolIcon: Record<ActivityItem["tool"], ReactNode> = {
  record_gap: <NotePencil size={15} weight="bold" />,
  update_syllabus: <TreeStructure size={15} weight="bold" />,
  log_evidence: <CheckSquare size={15} weight="bold" />,
  read_material: <BookOpen size={15} weight="bold" />,
  web_search: <MagnifyingGlass size={15} weight="bold" />,
};

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className={styles.muted}>아직 기록된 활동이 없습니다.</p>;
  }

  return (
    <div className={styles.activityList}>
      {items.map((item) => (
        <div key={item.id} className={styles.activityItem}>
          <span className={styles.activityIcon} aria-hidden="true">
            {toolIcon[item.tool]}
          </span>
          <div className={styles.activityBody}>
            <p>
              <span className={styles.toolTag}>{item.tool}</span>
              {item.message}
            </p>
            <em>{item.at}</em>
          </div>
        </div>
      ))}
    </div>
  );
}
