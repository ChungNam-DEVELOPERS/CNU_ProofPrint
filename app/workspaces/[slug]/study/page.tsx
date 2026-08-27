import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { Target } from "@phosphor-icons/react/dist/ssr/Target";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "../../../components/app-shell";
import { LevelChip } from "../../../components/level-chip";
import { StudyComposer } from "../../../components/study-composer";
import { flattenTopics } from "../../../lib/learning";
import { getServerActor } from "../../../server/auth";
import {
  getTopicTree,
  getWorkspaceBySlug,
  listGaps,
  listMessages,
  requireWorkspaceId,
} from "../../../server/learning-repository";
import styles from "../../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function StudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();

  const workspaceId = await requireWorkspaceId(actor, slug);
  const [topics, gaps, messages] = await Promise.all([
    getTopicTree(workspaceId),
    listGaps(workspaceId),
    listMessages(workspaceId),
  ]);

  const focus = flattenTopics(topics).filter((topic) => topic.level === "shaky");
  const openGaps = gaps.filter((gap) => gap.status !== "resolved");

  return (
    <AppShell workspaceSlug={slug} active="study">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습하기</h1>
          <p className={styles.pageDesc}>
            대화하는 동안 에이전트가 스스로 판단해서 목차와 이해도를 갱신하고, 몰랐던
            개념은 오답노트에 키워드로 남깁니다. 따로 적을 필요 없습니다.
          </p>
        </div>
      </div>

      <div className={styles.studyGrid}>
        <section className={styles.chatPane}>
          <div className={styles.chatList}>
            {messages.length === 0 ? (
              <p className={styles.muted}>
                아직 대화가 없습니다. 아래에 궁금한 것을 물어보세요.
              </p>
            ) : (
              messages.map((message) => (
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
                    {message.paragraphs.map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                    {message.tool ? (
                      <span className={styles.inlineTool}>
                        <Lightning size={13} weight="fill" aria-hidden="true" />
                        {message.tool}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <Suspense fallback={null}>
            <StudyComposer workspaceSlug={slug} />
          </Suspense>
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
              {openGaps.slice(0, 3).map((gap) => (
                <div key={gap.id} className={styles.toolItem}>
                  <span>
                    <strong>{gap.term}</strong>
                    <div>
                      {gap.topicTitle} · {gap.occurrences}번
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
