import { ArrowUp } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Paperclip } from "@phosphor-icons/react/dist/ssr/Paperclip";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Target } from "@phosphor-icons/react/dist/ssr/Target";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { notFound } from "next/navigation";
import { AppShell } from "../../../components/app-shell";
import { LevelChip } from "../../../components/level-chip";
import { flattenTopics, getProject } from "../../../lib/study-data";
import styles from "../../../study.module.css";

type Message = {
  id: string;
  role: "user" | "agent";
  paragraphs: string[];
  tool?: string;
};

const conversation: Message[] = [
  {
    id: "c1",
    role: "user",
    paragraphs: ["대각화 가능 조건이 뭐였지? 고유값이 겹치면 안 되는 거 맞아?"],
  },
  {
    id: "c2",
    role: "agent",
    paragraphs: [
      "겹치는 것 자체는 문제가 아닙니다. 조건은 «각 고유값의 기하적 중복도 = 대수적 중복도» 입니다.",
      "예를 들어 단위행렬은 고유값 1이 n번 겹치지만 이미 대각행렬이라 대각화가 됩니다. 반대로 [[1,1],[0,1]] 은 고유값 1이 두 번 나오는데 고유벡터가 한 방향밖에 없어서 대각화가 안 됩니다.",
    ],
    tool: "read_material — 강의노트 3주차.pdf 14~17쪽",
  },
  {
    id: "c3",
    role: "user",
    paragraphs: ["아 그러면 기하적 중복도가 고유공간의 차원인 거야?"],
  },
  {
    id: "c4",
    role: "agent",
    paragraphs: [
      "맞습니다. 그 부분은 정확하게 짚으셨습니다.",
      "그러면 확인차 하나만 여쭤볼게요. [[2,1],[0,2]] 는 대각화가 될까요? 이유까지 같이 말해 보세요.",
    ],
    tool: "log_evidence — «고유공간» 을 접함 → 설명 가능 후보로 표시",
  },
  {
    id: "c5",
    role: "user",
    paragraphs: ["고유값이 2로 겹치니까... 안 될 것 같은데 이유는 잘 모르겠어"],
  },
  {
    id: "c6",
    role: "agent",
    paragraphs: [
      "결론은 맞지만 이유가 «겹쳐서» 로 남아 있어서, 조금 전에 정리한 조건과 어긋납니다. 이 부분을 오답노트에 남겨뒀습니다.",
      "정확한 이유는 이렇습니다. 고유값 2의 대수적 중복도는 2인데, (A - 2I) 의 해공간을 구해 보면 차원이 1입니다. 두 값이 다르므로 대각화가 불가능합니다.",
    ],
    tool: "record_gap — «고유값 중복과 대각화» 3회째 기록",
  },
];

export default async function StudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const focus = flattenTopics(project.topics).filter(
    (topic) => topic.level === "shaky",
  );
  const openNotes = project.notes.filter((note) => note.status !== "resolved");

  return (
    <AppShell projectSlug={slug} active="study">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습하기</h1>
          <p className={styles.pageDesc}>
            대화하는 동안 에이전트가 스스로 판단해서 목차와 이해도를 갱신하고, 몰랐던
            것은 오답노트에 남깁니다.
          </p>
        </div>
      </div>

      <div className={styles.studyGrid}>
        <section className={styles.chatPane}>
          <div className={styles.chatList}>
            {conversation.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === "user"
                    ? `${styles.msg} ${styles.msgUser}`
                    : styles.msg
                }
              >
                <span className={styles.msgAvatar} aria-hidden="true">
                  {message.role === "user" ? (
                    <User size={15} weight="bold" />
                  ) : (
                    <Sparkle size={15} weight="fill" />
                  )}
                </span>
                <div className={styles.msgBubble}>
                  {message.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {message.tool ? (
                    <span className={styles.inlineTool}>
                      <Lightning size={13} weight="fill" aria-hidden="true" />
                      {message.tool}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <form className={styles.composer}>
            <button type="button" className={styles.iconBtnLight} aria-label="자료 첨부">
              <Paperclip size={18} weight="bold" aria-hidden="true" />
            </button>
            <input placeholder="궁금한 것을 물어보거나, 배운 것을 직접 설명해 보세요" />
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
              <ArrowUp size={16} weight="bold" aria-hidden="true" />
            </button>
          </form>
        </section>

        <aside className={styles.toolPane}>
          <section className={styles.toolCard}>
            <h2 className={styles.toolTitle}>
              <Target size={15} weight="bold" aria-hidden="true" /> 지금 보고 있는 주제
            </h2>
            <div className={styles.toolList}>
              {focus.map((topic) => (
                <div key={topic.id} className={styles.toolItem}>
                  <span style={{ flex: 1 }}>
                    <strong>{topic.title}</strong>
                    {topic.evidence ? <div>{topic.evidence}</div> : null}
                  </span>
                  <LevelChip level={topic.level} />
                </div>
              ))}
            </div>
          </section>

          <section className={styles.toolCard}>
            <h2 className={styles.toolTitle}>
              <NotePencil size={15} weight="bold" aria-hidden="true" /> 외울 개념으로 남긴 것
            </h2>
            <div className={styles.toolList}>
              {openNotes.slice(0, 3).map((note) => (
                <div key={note.id} className={styles.toolItem}>
                  <span>
                    <strong>{note.term}</strong>
                    <div>
                      {note.topicTitle} · {note.occurrences}회
                    </div>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
