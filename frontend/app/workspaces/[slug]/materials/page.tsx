import { FileArrowUp } from "@phosphor-icons/react/dist/ssr/FileArrowUp";
import { FilePdf } from "@phosphor-icons/react/dist/ssr/FilePdf";
import { LinkSimple } from "@phosphor-icons/react/dist/ssr/LinkSimple";
import { NotePencil } from "@phosphor-icons/react/dist/ssr/NotePencil";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../../../components/app-shell";
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
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
            <FileArrowUp size={16} weight="bold" aria-hidden="true" /> 자료 올리기
          </button>
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

        <div className={styles.uploadBox}>
          <FileArrowUp size={26} weight="bold" aria-hidden="true" />
          <strong>여기에 파일을 끌어다 놓으세요</strong>
          <span>PDF, 이미지, 텍스트를 지원합니다</span>
        </div>
      </section>
    </AppShell>
  );
}
