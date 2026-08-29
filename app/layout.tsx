import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Proofprint | 사이버캠퍼스를 읽고 나에게 맞춘 학습",
  description:
    "사이버캠퍼스의 과목과 과제를 읽어와, 학습 에이전트가 목차별 이해도와 오답노트를 스스로 정리하는 학습 서비스",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body>{children}</body>
    </html>
  );
}
