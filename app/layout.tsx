import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL || "http://localhost:3000"),
  title: "SafeChange | PSM 변경요소관리 AI 비서",
  description: "현장 구성원을 위한 단계별 PSM 변경요소관리 판단·작성 지원 서비스",
  openGraph: {
    title: "SafeChange | PSM 변경요소관리 AI 비서",
    description: "변경의 시작부터 안전한 완료까지",
    images: [{ url: "/og.png", width: 1733, height: 909, alt: "SafeChange PSM 변경요소관리 AI 비서" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SafeChange | PSM 변경요소관리 AI 비서",
    description: "변경의 시작부터 안전한 완료까지",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
