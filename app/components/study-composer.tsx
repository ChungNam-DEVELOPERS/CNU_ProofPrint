"use client";

import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { uploadMaterial } from "./material-upload";
import styles from "../study.module.css";

type AgentResponse = {
  mode: "live" | "no_credentials" | "bad_credentials" | "unavailable";
  reply: string;
  trace: { tool: string; summary: string }[];
};

export function StudyComposer({
  workspaceSlug,
  assignmentId,
}: {
  workspaceSlug: string;
  assignmentId?: string;
}) {
  const router = useRouter();
  // 오답노트의 «다시 물어보기» 가 질문을 실어 보낸다.
  const prefilled = useSearchParams().get("ask") ?? "";
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(prefilled);
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attach(file: File | undefined) {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const result = await uploadMaterial(workspaceSlug, file);
      setText((current) =>
        `${current}${current ? "\n" : ""}(자료 «${result.title}» 를 올렸습니다. 이 자료를 참고해 답해 줘.)`,
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "자료를 올리지 못했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const message = text.trim();
    if (!message || pending) return;

    setPending(true);
    setError(null);

    try {
      const endpoint = assignmentId
        ? `/api/workspaces/${workspaceSlug}/assignments/${assignmentId}/agent`
        : `/api/workspaces/${workspaceSlug}/agent`;
      const response = await fetch(endpoint, {
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
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,text/plain,application/pdf"
          hidden
          onChange={(event) => void attach(event.target.files?.[0])}
        />
        <button
          type="button"
          className={styles.iconBtnLight}
          aria-label="자료 첨부"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || pending}
        >
          {uploading ? (
            <CircleNotch size={18} weight="bold" className={styles.spin} aria-hidden="true" />
          ) : (
            <Paperclip size={18} weight="bold" aria-hidden="true" />
          )}
        </button>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          disabled={pending}
          placeholder={
            pending
              ? "에이전트가 기록과 자료를 확인하는 중입니다…"
              : assignmentId
                ? "과제에 관해 묻거나, 내 판단을 직접 말해 보세요"
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
