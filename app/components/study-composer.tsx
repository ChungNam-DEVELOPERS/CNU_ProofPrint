"use client";

import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../study.module.css";

type AgentResponse = {
  mode: "live" | "no_credentials" | "bad_credentials" | "unavailable";
  reply: string;
  trace: { tool: string; summary: string }[];
};

export function StudyComposer({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || pending) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message ?? "답변을 받지 못했습니다.");
      }

      const result = (await response.json()) as AgentResponse;
      if (result.mode !== "live") {
        setError(result.reply);
      }

      setText("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "답변을 받지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {error ? (
        <p className={styles.composerError}>
          <Warning size={15} weight="fill" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <form className={styles.composer} onSubmit={onSubmit}>
        <button type="button" className={styles.iconBtnLight} aria-label="자료 첨부">
          <Paperclip size={18} weight="bold" aria-hidden="true" />
        </button>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={pending}
          placeholder={
            pending
              ? "에이전트가 목차와 오답노트를 확인하는 중입니다…"
              : "궁금한 것을 물어보거나, 배운 것을 직접 설명해 보세요"
          }
        />
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnPrimary}`}
          disabled={pending || text.trim().length === 0}
          aria-label="보내기"
        >
          {pending ? (
            <CircleNotch size={16} weight="bold" className={styles.spin} aria-hidden="true" />
          ) : (
            <ArrowUp size={16} weight="bold" aria-hidden="true" />
          )}
        </button>
      </form>
    </>
  );
}
