import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import { Lightning } from "@phosphor-icons/react/dist/ssr/Lightning";
import { Sparkle } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { User } from "@phosphor-icons/react/dist/ssr/User";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "../../../../../components/app-shell";
import { DecisionCandidateList } from "../../../../../components/decision-candidate-list";
import { StudyComposer } from "../../../../../components/study-composer";
import { OrganizerButton } from "../../../../../components/organizer-button";
import {
  getOrCreateAgentContext,
  listDecisionCandidates,
  listSessionMessages,
} from "../../../../../server/agent/sessions";
import { getOrganizerStatus } from "../../../../../server/agent/organizer";
import { getServerActor } from "../../../../../server/auth";
import {
  getAssignment,
  getWorkspaceBySlug,
  requireWorkspaceId,
} from "../../../../../server/learning-repository";
import styles from "../../../../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AssignmentAgentPage({
  params,
}: {
  params: Promise<{ slug: string; itemId: string }>;
}) {
  const { slug, itemId } = await params;
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();
  const workspaceId = await requireWorkspaceId(actor, slug);
  const assignment = await getAssignment(workspaceId, itemId);
  if (!assignment) notFound();

  const agentContext = await getOrCreateAgentContext(workspaceId, {
    agentType: "assignment",
    assignmentSlug: itemId,
  });
  const [messages, candidates, organizerStatus] = await Promise.all([
    listSessionMessages(agentContext.sessionId),
    listDecisionCandidates(agentContext),
    getOrganizerStatus(agentContext),
  ]);

  return (
    <AppShell workspaceSlug={slug} active="assignments">
      <div className={styles.pageHead}>
        <div>
          <Link
            href={`/workspaces/${slug}/assignments/${itemId}`}
            className={styles.cardLink}
          >
            <ArrowLeft size={13} weight="bold" aria-hidden="true" /> 과제로 돌아가기
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            {assignment.title} · 과제 Agent
          </h1>
          <p className={styles.pageDesc}>
            이 대화의 기록은 해당 과제에 연결됩니다. AI가 찾은 판단은 후보로만 남고,
            내가 확정해야 Proofprint 재료가 됩니다.
          </p>
        </div>
      </div>

      <div className={styles.studyGrid}>
        <section className={styles.chatPane}>
          <div className={styles.chatList}>
            {messages.length === 0 ? (
              <p className={styles.muted}>
                아직 과제 대화가 없습니다. 과제에서 막힌 지점이나 검토할 대안을 물어보세요.
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
            <StudyComposer workspaceSlug={slug} assignmentId={itemId} />
          </Suspense>
        </section>

        <aside className={styles.toolPane}>
          <section className={styles.toolCard}>
            <h2 className={styles.toolTitle}>통합 기록 정리</h2>
            <p className={styles.muted}>
              학습·과제 기록의 중복을 묶고 Proofprint 초안 재료로 연결합니다.
            </p>
            <OrganizerButton
              workspaceSlug={slug}
              assignmentId={itemId}
              initialPending={organizerStatus.pending}
            />
          </section>
          <section className={styles.toolCard}>
            <h2 className={styles.toolTitle}>내 판단 후보</h2>
            <p className={styles.muted}>
              AI가 학생 발언에서 찾은 후보입니다. 내용을 확인한 뒤 확정하거나 제외하세요.
            </p>
            <DecisionCandidateList
              workspaceSlug={slug}
              assignmentId={itemId}
              candidates={candidates}
            />
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
