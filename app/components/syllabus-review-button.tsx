"use client";

import { ArrowsClockwise } from "@phosphor-icons/react/dist/ssr/ArrowsClockwise";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../study.module.css";

export function SyllabusReviewButton({ workspaceSlug }: { workspaceSlug: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function review() {
    if (pending) return;
    setPending(true);
    setResult(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceSlug}/syllabus`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | { summary?: string; changes?: unknown[]; error?: { message?: string } }
        | null;

      setResult(
        payload?.error?.message ?? payload?.summary ?? "목차를 정리하지 못했습니다.",
      );
      if ((payload?.changes?.length ?? 0) > 0) router.refresh();
    } catch {
      setResult("목차를 정리하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.reviewWrap}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => void review()}
        disabled={pending}
      >
        {pending ? (
          <CircleNotch size={15} weight="bold" className={styles.spin} aria-hidden="true" />
        ) : (
          <ArrowsClockwise size={15} weight="bold" aria-hidden="true" />
        )}
        {pending ? "살펴보는 중" : "목차 다시 정리"}
      </button>
      {result ? <p className={styles.reviewResult}>{result}</p> : null}
    </div>
  );
}
