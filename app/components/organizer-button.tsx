"use client";

import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../study.module.css";

export function OrganizerButton({
  workspaceSlug,
  assignmentId,
  initialPending,
}: {
  workspaceSlug: string;
  assignmentId: string;
  initialPending: number;
}) {
  const router = useRouter();
  const [pendingCount, setPendingCount] = useState(initialPending);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  async function organize() {
    setRunning(true);
    setError("");
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/assignments/${assignmentId}/organize`,
        { method: "POST" },
      );
      const payload = (await response.json().catch(() => null)) as
        | { status?: { pending?: number }; error?: { message?: string } }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "기록을 정리하지 못했습니다.");
      }
      setPendingCount(payload?.status?.pending ?? 0);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "기록을 정리하지 못했습니다.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={() => void organize()}
        disabled={running || pendingCount === 0}
      >
        {pendingCount === 0 ? (
          <CheckCircle size={15} weight="fill" aria-hidden="true" />
        ) : (
          <ArrowsClockwise
            size={15}
            weight="bold"
            className={running ? styles.spin : undefined}
            aria-hidden="true"
          />
        )}
        {running
          ? "정리 Agent 실행 중…"
          : pendingCount === 0
            ? "정리 완료"
            : `새 기록 ${pendingCount}개 정리하기`}
      </button>
      {error ? <p className={styles.composerError}>{error}</p> : null}
    </div>
  );
}
