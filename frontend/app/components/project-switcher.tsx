"use client";

import { CaretDown } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../lib/study-data";
import styles from "../study.module.css";

export function ProjectSwitcher({
  projects,
  currentSlug,
}: {
  projects: Project[];
  currentSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const current = projects.find((project) => project.slug === currentSlug);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.switcher} ref={wrapperRef}>
      <button
        type="button"
        className={styles.switcherTrigger}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.switcherEmoji} aria-hidden="true">
          {current?.emoji ?? "📚"}
        </span>
        <span className={styles.switcherLabel}>
          <em>{current?.term ?? "전체"}</em>
          <strong>{current?.title ?? "프로젝트 선택"}</strong>
        </span>
        <CaretDown size={16} weight="bold" aria-hidden="true" />
      </button>

      {open ? (
        <div className={styles.switcherMenu} role="menu">
          <p className={styles.switcherMenuHeading}>내 프로젝트</p>
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              role="menuitem"
              className={
                project.slug === currentSlug
                  ? `${styles.switcherItem} ${styles.switcherItemActive}`
                  : styles.switcherItem
              }
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">{project.emoji}</span>
              <span className={styles.switcherItemText}>
                <strong>{project.title}</strong>
                <em>
                  {project.status} · {project.updatedAt} 갱신
                </em>
              </span>
              {project.slug === currentSlug ? (
                <Check size={16} weight="bold" aria-hidden="true" />
              ) : null}
            </Link>
          ))}
          <Link
            href="/projects/new"
            role="menuitem"
            className={styles.switcherNew}
            onClick={() => setOpen(false)}
          >
            <Plus size={16} weight="bold" aria-hidden="true" /> 새 프로젝트 만들기
          </Link>
        </div>
      ) : null}
    </div>
  );
}
