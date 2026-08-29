"use client";

import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { FileArrowUp } from "@phosphor-icons/react/dist/ssr/FileArrowUp";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import styles from "../study.module.css";

export type UploadResult = {
  title: string;
  kind: string;
  pageCount: number;
  chunks: number;
};

export async function uploadMaterial(
  workspaceSlug: string,
  file: File,
): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`/api/workspaces/${workspaceSlug}/materials`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? "자료를 올리지 못했습니다.");
  }
  return (await response.json()) as UploadResult;
}

export function MaterialUpload({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function send(file: File | undefined) {
    if (!file || pending) return;
    setPending(true);
    setError(null);
    setDone(null);
    try {
      const result = await uploadMaterial(workspaceSlug, file);
      setDone(
        `${result.title} — ${result.pageCount}쪽에서 ${result.chunks}개 대목을 읽었습니다.`,
      );
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "자료를 올리지 못했습니다.");
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void send(event.dataTransfer.files?.[0]);
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.txt,.md,.csv,text/plain,application/pdf"
        hidden
        onChange={(event) => void send(event.target.files?.[0])}
      />

      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={() => inputRef.current?.click()}
        disabled={pending}
      >
        {pending ? (
          <CircleNotch size={16} weight="bold" className={styles.spin} aria-hidden="true" />
        ) : (
          <FileArrowUp size={16} weight="bold" aria-hidden="true" />
        )}
        {pending ? "읽는 중" : "자료 올리기"}
      </button>

      <div
        className={
          dragging ? `${styles.uploadBox} ${styles.uploadBoxOver}` : styles.uploadBox
        }
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <FileArrowUp size={26} weight="bold" aria-hidden="true" />
        <strong>{pending ? "본문을 읽고 있습니다…" : "여기에 파일을 끌어다 놓으세요"}</strong>
        <span>PDF 와 텍스트 파일을 읽습니다. 스캔 이미지 PDF 는 아직 읽지 못합니다.</span>
        {error ? (
          <span className={styles.uploadError}>
            <Warning size={14} weight="fill" aria-hidden="true" /> {error}
          </span>
        ) : null}
        {done ? <span className={styles.uploadDone}>{done}</span> : null}
      </div>
    </>
  );
}
