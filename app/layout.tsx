import type { Metadata } from "next";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.maharex.com"),
  title: {
    default: "㈜마하렉스(Maharex) | 산업용 공정 장비",
    template: "%s | ㈜마하렉스(Maharex)"
  },
  description:
    "제약·화학·이차전지·화장품·식품 제조 및 가공용 화학 플랜트, 진공 건조기, 로터리 드라이어, 여과기, 분쇄기 설계·제작 전문기업입니다.",
  applicationName: "㈜마하렉스(Maharex)",
  keywords: ["마하렉스", "Maharex", "산업용 공정 장비", "화학 플랜트", "이차전지 장비", "진공 건조기", "로터리 드라이어", "여과기", "분쇄기"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "㈜마하렉스(Maharex)",
    title: "㈜마하렉스(Maharex) | 산업용 공정 장비",
    description:
      "제약·화학·이차전지·화장품·식품 제조 및 가공용 화학 플랜트, 진공 건조기, 로터리 드라이어, 여과기, 분쇄기 설계·제작 전문기업입니다.",
    images: [
      {
        url: "/factory-exterior.jpg",
        width: 1024,
        height: 768,
        alt: "마하렉스 회사 전경"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "㈜마하렉스(Maharex) | 산업용 공정 장비",
    description:
      "제약·화학·이차전지·화장품·식품 제조 및 가공용 화학 플랜트, 진공 건조기, 로터리 드라이어, 여과기, 분쇄기 설계·제작 전문기업입니다.",
    images: ["/factory-exterior.jpg"]
  },
  robots: {
    index: true,
    follow: true
  },
  other: {
    "naver-site-verification": "dc374fc06ec9d8240b348402aeba1bbb95a1459c"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <SiteAnalytics />
      </body>
    </html>
  );
}
