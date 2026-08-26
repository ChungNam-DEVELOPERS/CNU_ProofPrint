import { redirect } from "next/navigation";

/** 프로토타입에서는 항상 로그인된 상태로 시작한다. */
export default function RootPage() {
  redirect("/workspaces");
}
