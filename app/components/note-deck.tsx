"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Repeat } from "@phosphor-icons/react/dist/ssr/Repeat";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { gapSignalLabel, type Gap } from "../lib/learning";
import styles from "../study.module.css";

export function NoteDeck({
  notes,
  workspaceSlug,
}: {
  notes: Gap[];
  workspaceSlug: string;
}) {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markMemorized(gap: Gap) {
    if (busyId) return;
    setBusyId(gap.id);
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/gaps/${gap.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "resolved" }),
        },
      );
      if (response.ok) router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  function askAgain(gap: Gap) {
    router.push(
      `/workspaces/${workspaceSlug}/study?ask=${encodeURIComponent(
        `«${gap.term}» 다시 설명해 줘. 내가 어디서 헷갈렸는지도 짚어 줘.`,
      )}`,
    );
  }

  function toggleHide() {
    setHidden((value) => !value);
    setRevealed(new Set());
  }

  function reveal(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  if (notes.length === 0) {
    return (
      <div className={styles.empty}>
        <strong>여기에 해당하는 개념이 없습니다.</strong>
        <span>학습하면서 몰랐던 개념이 나오면 자동으로 쌓입니다.</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.deckBar}>
        <span className={styles.muted}>
          외울 개념 {notes.length}개 · 학습하면서 에이전트가 자동으로 기록합니다
        </span>
        <button
          type="button"
          className={hidden ? `${styles.btn} ${styles.btnPrimary}` : styles.btn}
          onClick={toggleHide}
          aria-pressed={hidden}
        >
          {hidden ? (
            <Eye size={15} weight="bold" aria-hidden="true" />
          ) : (
            <EyeSlash size={15} weight="bold" aria-hidden="true" />
          )}
          {hidden ? "뜻 보이기" : "뜻 가리고 외우기"}
        </button>
      </div>

      <div className={styles.noteList}>
        {notes.map((note) => {
          const masked = hidden && !revealed.has(note.id);

          return (
            <article
              key={note.id}
              className={
                note.status === "resolved"
                  ? `${styles.noteCard} ${styles.noteResolved}`
                  : styles.noteCard
              }
            >
              <div className={styles.noteTop}>
                <span className={styles.noteKind}>{note.kind}</span>
                <span className={styles.noteTopic}>{note.topicTitle}</span>
                {note.occurrences > 1 ? (
                  <span className={styles.noteOcc}>
                    <Repeat size={13} weight="bold" aria-hidden="true" />
                    {note.occurrences}번 막힘
                  </span>
                ) : null}
              </div>

              <h2 className={styles.termTitle}>{note.term}</h2>

              {masked ? (
                <button
                  type="button"
                  className={styles.maskBox}
                  onClick={() => reveal(note.id)}
                >
                  <EyeSlash size={17} weight="bold" aria-hidden="true" />
                  먼저 스스로 설명해 보고 눌러서 확인하세요
                </button>
              ) : (
                <>
                  <p className={styles.termDefinition}>{note.definition}</p>

                  <div className={styles.termKey}>
                    <strong>같이 외울 것</strong>
                    {note.keyPoint}
                  </div>

                  {note.confusedWith ? (
                    <p className={styles.termConfused}>
                      <Warning size={14} weight="fill" aria-hidden="true" />
                      <span>
                        대화에서 <em>{note.confusedWith}</em> 로 알고 있었습니다
                      </span>
                    </p>
                  ) : null}
                </>
              )}

              <div className={styles.noteFoot}>
                <span className={styles.muted}>
                  <span className={styles.autoTag}>자동 기록</span>
                  {note.signal ? `${gapSignalLabel[note.signal]} · ` : ""}
                  {note.lastSeen}
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => askAgain(note)}
                  >
                    <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
                    다시 물어보기
                  </button>
                  {note.status !== "resolved" ? (
                    <button
                      type="button"
                      className={styles.btn}
                      onClick={() => void markMemorized(note)}
                      disabled={busyId === note.id}
                    >
                      {busyId === note.id ? (
                        <CircleNotch
                          size={14}
                          weight="bold"
                          className={styles.spin}
                          aria-hidden="true"
                        />
                      ) : (
                        <CheckCircle size={14} weight="bold" aria-hidden="true" />
                      )}
                      외웠음
                    </button>
                  ) : null}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
