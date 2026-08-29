import { ArrowLeft } from "@phosphor-icons/react/dist/ssr/ArrowLeft";
import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { NewWorkspaceForm } from "../../components/new-workspace-form";
import styles from "../../study.module.css";

// AppShell 이 DB 를 읽으므로 정적 프리렌더 대상이 될 수 없다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata = { title: "새 워크스페이스 | Proofprint" };

export default function NewWorkspacePage() {
  return (
    <AppShell workspaceSlug="" active="none">
      <div className={styles.pageHead}>
        <div>
          <Link href="/workspaces" className={styles.cardLink}>
            <ArrowLeft size={13} weight="bold" aria-hidden="true" /> 워크스페이스 목록
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: 8 }}>
            새 워크스페이스 만들기
          </h1>
          <p className={styles.pageDesc}>
            무엇을 공부하는지만 알려주면 됩니다. 학습하는 동안 에이전트가 목차와 이해도를
            채워 갑니다.
          </p>
        </div>
      </div>

      <NewWorkspaceForm />
    </AppShell>
  );
}
