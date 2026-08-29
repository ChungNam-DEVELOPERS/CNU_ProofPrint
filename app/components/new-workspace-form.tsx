"use client";

import { CircleNotch } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { Plus } from "@phosphor-icons/react/dist/ssr/Plus";
import { Warning } from "@phosphor-icons/react/dist/ssr/Warning";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "../study.module.css";

const kinds = [
  { value: "수업 과목", label: "수업 과목" },
  { value: "시험 대비", label: "시험 대비" },
  { value: "과제 · 팀 작업", label: "과제 · 팀 작업" },
  { value: "개인 학습", label: "개인 학습" },
];

export function NewWorkspaceForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(kinds[0].value);
  const [goal, setGoal] = useState("");
  const [outline, setOutline] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending || title.trim().length === 0) return;

    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, subject, goal, outline }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        throw new Error(payload?.error?.message ?? "만들지 못했습니다.");
      }
      const created = (await response.json()) as { slug: string };
      router.push(`/workspaces/${created.slug}`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "만들지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <form className={styles.formCard} onSubmit={onSubmit}>
      <div className={styles.field}>
        <label htmlFor="title">워크스페이스 이름</label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 선형대수학, 정보처리기사 필기, 논문 읽기"
          autoFocus
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="kind">분류</label>
        <select
          id="kind"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          {kinds.map((kind) => (
            <option key={kind.value} value={kind.value}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="goal">이번 학습에서 도달하고 싶은 지점</label>
        <textarea
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          placeholder="예: 고유값과 대각화까지 스스로 설명할 수 있게 되고 싶다"
        />
        <p>비워둬도 됩니다. 학습을 시작하면 에이전트가 물어봅니다.</p>
      </div>

      <div className={styles.field}>
        <label htmlFor="outline">목차를 이미 알고 있다면 붙여넣기</label>
        <textarea
          id="outline"
          value={outline}
          onChange={(event) => setOutline(event.target.value)}
          placeholder={"강의계획서나 교재 목차를 한 줄에 하나씩 붙여넣으세요\n1. 벡터공간\n2. 행렬식"}
        />
        <p>한 줄이 목차 한 항목이 됩니다. 없으면 대화하면서 에이전트가 만들어 갑니다.</p>
      </div>

      {error ? (
        <p className={styles.formError}>
          <Warning size={15} weight="fill" aria-hidden="true" /> {error}
        </p>
      ) : null}

      <button
        type="submit"
        className={`${styles.btn} ${styles.btnPrimary} ${styles.blockBtn}`}
        disabled={pending || title.trim().length === 0}
      >
        {pending ? (
          <CircleNotch size={16} weight="bold" className={styles.spin} aria-hidden="true" />
        ) : (
          <Plus size={16} weight="bold" aria-hidden="true" />
        )}
        {pending ? "만드는 중" : "워크스페이스 만들기"}
      </button>
    </form>
  );
}
