"use client";

import { Check } from "@phosphor-icons/react/dist/ssr/Check";
import { X } from "@phosphor-icons/react/dist/ssr/X";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../study.module.css";

type DecisionCandidate = {
  id: string;
  decision: "adopt" | "revise" | "reject";
  reason: string;
  source: string;
  status: "pending" | "approved" | "rejected";
};

const labels = { adopt: "채택", revise: "수정", reject: "폐기" } as const;

export function DecisionCandidateList({
  workspaceSlug,
  assignmentId,
  candidates,
}: {
  workspaceSlug: string;
  assignmentId: string;
  candidates: DecisionCandidate[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function decide(
    id: string,
    status: "approved" | "rejected",
    edited?: { decision: DecisionCandidate["decision"]; reason: string },
  ) {
    setPending(id);
    setError("");
    try {
      const response = await fetch(
        `/api/workspaces/${workspaceSlug}/assignments/${assignmentId}/candidates/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, ...edited }),
        },
      );
      if (!response.ok) throw new Error("판단 후보를 처리하지 못했습니다.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "판단 후보를 처리하지 못했습니다.");
    } finally {
      setPending(null);
    }
  }

  if (candidates.length === 0) {
    return <p className={styles.muted}>아직 판단 후보가 없습니다.</p>;
  }

  return (
    <>
      {error ? <p className={styles.composerError}>{error}</p> : null}
      <div className={styles.toolList}>
        {candidates.map((candidate) => (
          <CandidateEditor
            key={candidate.id}
            candidate={candidate}
            busy={pending === candidate.id}
            onDecide={decide}
          />
        ))}
      </div>
    </>
  );
}

function CandidateEditor({
  candidate,
  busy,
  onDecide,
}: {
  candidate: DecisionCandidate;
  busy: boolean;
  onDecide: (
    id: string,
    status: "approved" | "rejected",
    edited?: { decision: DecisionCandidate["decision"]; reason: string },
  ) => Promise<void>;
}) {
  const [decision, setDecision] = useState(candidate.decision);
  const [reason, setReason] = useState(candidate.reason);

  return (
    <div className={styles.toolItem}>
      <span style={{ flex: 1 }}>
        {candidate.status === "pending" ? (
          <>
            <label>
              내 판단
              <select
                value={decision}
                onChange={(event) =>
                  setDecision(event.target.value as DecisionCandidate["decision"])
                }
                disabled={busy}
              >
                <option value="adopt">채택</option>
                <option value="revise">수정</option>
                <option value="reject">폐기</option>
              </select>
            </label>
            <label>
              판단 이유
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={2_000}
                disabled={busy}
              />
            </label>
          </>
        ) : (
          <>
            <strong>{labels[candidate.decision]}</strong>
            <div>{candidate.reason}</div>
          </>
        )}
        {candidate.source ? <small>내 발언: “{candidate.source}”</small> : null}
      </span>
      {candidate.status === "pending" ? (
        <span className={styles.headActions}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            disabled={busy || reason.trim().length === 0}
            onClick={() =>
              void onDecide(candidate.id, "approved", {
                decision,
                reason: reason.trim(),
              })
            }
          >
            <Check size={14} weight="bold" /> 수정해서 확정
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={busy}
            onClick={() => void onDecide(candidate.id, "rejected")}
          >
            <X size={14} weight="bold" /> 제외
          </button>
        </span>
      ) : (
        <em>{candidate.status === "approved" ? "확정됨" : "제외됨"}</em>
      )}
    </div>
  );
}
