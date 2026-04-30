import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maharex | 산업용 공정 장비",
  description: "반응기, 트레이 진공 건조기, 로터리 드라이어, 필터, 분쇄기를 제작하는 한국 산업 장비 제조사."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
