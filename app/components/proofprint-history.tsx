"use client";

import { ArrowRight } from "@phosphor-icons/react/ArrowRight";
import { CalendarBlank } from "@phosphor-icons/react/CalendarBlank";
import { CheckCircle } from "@phosphor-icons/react/CheckCircle";
import { Clock } from "@phosphor-icons/react/Clock";
import { FileText } from "@phosphor-icons/react/FileText";
import { MagnifyingGlass } from "@phosphor-icons/react/MagnifyingGlass";
import { Sparkle } from "@phosphor-icons/react/Sparkle";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProofprintHistoryItem } from "../lib/proofprint-api";
import { proofprintBase } from "../lib/study-data";
import styles from "../proofprint.module.css";

type Filter = "전체" | "작성 중" | "제출 완료";

export function ProofprintHistory({
  initialItems,
}: {
  initialItems: ProofprintHistoryItem[];
}) {
  const [filter, setFilter] = useState<Filter>("전체");
  const [query, setQuery] = useState("");
  const submittedCount = initialItems.filter((item) => item.status === "제출 완료").length;
  const draftCount = initialItems.length - submittedCount;

  const items = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return initialItems
      .filter((item) => filter === "전체" || item.status === filter)
      .filter(
        (item) =>
          !normalizedQuery ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.course.toLowerCase().includes(normalizedQuery),
      );
  }, [filter, initialItems, query]);

  return (
    <>
      <div className={styles.pageHeadingRow}>
        <div>
          <p className={styles.eyebrow}>AI 학습과정</p>
          <h1>내 Proofprint</h1>
          <p className={styles.pageDescription}>
            과제별 작성 상태와 제출한 학습과정 기록을 확인할 수 있습니다.
          </p>
        </div>
        <Link className={styles.primaryTopButton} href={`${proofprintBase}/workspace`}>
          <Sparkle size={17} weight="fill" aria-hidden="true" /> 작성 중인 기록 열기
        </Link>
      </div>

      <section className={styles.historyStats} aria-label="Proofprint 현황">
        <div>
          <span className={styles.historyStatIcon} aria-hidden="true">
            <FileText size={21} weight="bold" />
          </span>
          <div><strong>{initialItems.length}</strong><span>전체 기록</span></div>
        </div>
        <div>
          <span className={styles.historyStatIcon} aria-hidden="true">
            <Clock size={21} weight="bold" />
          </span>
          <div><strong>{draftCount}</strong><span>작성 중</span></div>
        </div>
        <div>
          <span className={styles.historyStatIcon} aria-hidden="true">
            <CheckCircle size={21} weight="fill" />
          </span>
          <div><strong>{submittedCount}</strong><span>제출 완료</span></div>
        </div>
      </section>

      <div className={styles.historyToolbar}>
        <div className={styles.tabList} aria-label="Proofprint 상태 필터">
          {(["전체", "작성 중", "제출 완료"] as Filter[]).map((option) => (
            <button
              className={filter === option ? styles.activeTab : undefined}
              type="button"
              aria-pressed={filter === option}
              onClick={() => setFilter(option)}
              key={option}
            >
              {option}
            </button>
          ))}
        </div>
        <label className={styles.searchField}>
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
          <span className="sr-only">과제 또는 교과목 검색</span>
          <input
            type="search"
            placeholder="과제 또는 교과목 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {items.length ? (
        <section className={styles.historyList} aria-label="Proofprint 기록 목록">
          {items.map((item) => (
            <article className={styles.historyCard} key={item.workspaceId}>
              <span className={styles.documentTile} aria-hidden="true">
                <FileText size={24} weight="bold" />
              </span>
              <div className={styles.historyMain}>
                <div>
                  <h2>{item.title}</h2>
                  <span className={`${styles.statusPill} ${item.status === "제출 완료" ? styles.done : styles.progress}`}>
                    {item.status}
                  </span>
                </div>
                <p>{item.course}</p>
                <div className={styles.historyMeta}>
                  <span><CalendarBlank size={15} weight="bold" aria-hidden="true" /> {item.date}</span>
                  <span><Sparkle size={14} weight="fill" aria-hidden="true" /> 체크포인트 {item.checkpointCount}개</span>
                  <span><FileText size={15} weight="bold" aria-hidden="true" /> {item.rawShared ? "원문 공개" : "원문 비공개"}</span>
                </div>
              </div>
              <div className={styles.historyActions}>
                <Link href={item.href}>
                  {item.status === "제출 완료" ? "결과 보기" : "이어서 작성"}
                  <ArrowRight size={17} weight="bold" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState}>
          <MagnifyingGlass size={30} weight="bold" aria-hidden="true" />
          <h2>검색 결과가 없습니다</h2>
          <p>다른 과제명이나 교과목명으로 다시 찾아보세요.</p>
        </section>
      )}
    </>
  );
}
