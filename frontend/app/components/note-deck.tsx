"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { Eye } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlash } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { Repeat } from "@phosphor-icons/react/dist/ssr/Repeat";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useState } from "react";
import type { Note } from "../lib/study-data";
import styles from "../study.module.css";

export function NoteDeck({ notes }: { notes: Note[] }) {
  const [hidden, setHidden] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

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
          외울 개념 {notes.length}개 · 반복이 많은 것부터
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
                    {note.occurrences}회 반복
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
                        <em>{note.confusedWith}</em> 와(과) 헷갈렸습니다
                      </span>
                    </p>
                  ) : null}
                </>
              )}

              <div className={styles.noteFoot}>
                <span className={styles.muted}>마지막 발생 {note.lastSeen}</span>
                <span style={{ display: "flex", gap: 8 }}>
                  <button type="button" className={styles.btn}>
                    <ArrowCounterClockwise size={14} weight="bold" aria-hidden="true" />
                    다시 물어보기
                  </button>
                  {note.status !== "resolved" ? (
                    <button type="button" className={styles.btn}>
                      <CheckCircle size={14} weight="bold" aria-hidden="true" /> 외웠음
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
