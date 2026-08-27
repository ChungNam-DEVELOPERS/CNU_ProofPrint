import { FilePdf } from "@phosphor-icons/react/dist/ssr/FilePdf";
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../../components/app-shell";
import { MaterialUpload } from "../../../components/material-upload";
import type { Material } from "../../../lib/learning";
import { getServerActor } from "../../../server/auth";
import {
  getWorkspaceBySlug,
  listMaterials,
  requireWorkspaceId,
} from "../../../server/learning-repository";
import styles from "../../../study.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const kindIcon: Record<Material["kind"], ReactNode> = {
  PDF: <FilePdf size={19} weight="bold" />,
  필기: <NotePencil size={19} weight="bold" />,
  링크: <LinkSimple size={19} weight="bold" />,
};

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actor = await getServerActor();
  if (!(await getWorkspaceBySlug(actor, slug))) notFound();

  const materials = await listMaterials(await requireWorkspaceId(actor, slug));

  return (
    <AppShell workspaceSlug={slug} active="materials">
      <div className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>학습 자료</h1>
          <p className={styles.pageDesc}>
            강의자료, 필기, 링크를 올려두면 에이전트가 답할 때 먼저 읽습니다.
            사이버캠퍼스에서 가져온 자료도 함께 표시됩니다.
          </p>
        </div>
        <div className={styles.headActions}>
          <MaterialUpload workspaceSlug={slug} />
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>올린 자료 {materials.length}개</h2>
          <span className={styles.muted}>
            사용 횟수는 에이전트가 실제로 참고한 횟수입니다
          </span>
        </div>

        {materials.map((material) => (
          <div key={material.id} className={styles.matRow}>
            <span className={styles.matIcon} aria-hidden="true">
              {kindIcon[material.kind]}
            </span>
            <span className={styles.matBody}>
              <strong>{material.title}</strong>
              <em>
                {material.kind} · {material.extent} · {material.addedAt} 추가
              </em>
            </span>
            <span className={styles.muted}>{material.usedCount}회 참고</span>
          </div>
        ))}

        {materials.length === 0 ? (
          <p className={styles.muted}>
            아직 올린 자료가 없습니다. 위 버튼으로 PDF 를 올리면 에이전트가 본문을 읽습니다.
          </p>
        ) : null}
      </section>
    </AppShell>
  );
}
