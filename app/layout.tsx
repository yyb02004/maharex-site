import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.maharex.com"),
  title: {
    default: "Maharex | 산업용 공정 장비",
    template: "%s | Maharex"
  },
  description: "반응기, 트레이 진공 건조기, 로터리 드라이어, 필터, 분쇄기를 제작하는 한국 산업 장비 제조사.",
  applicationName: "Maharex",
  keywords: ["마하렉스", "Maharex", "산업용 공정 장비", "반응기", "진공 건조기", "Nutsche Filter", "Jet Mill"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Maharex",
    title: "Maharex | 산업용 공정 장비",
    description: "반응·건조·여과·분쇄 공정 장비를 설계하고 제작하는 산업 장비 제조사입니다.",
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
    title: "Maharex | 산업용 공정 장비",
    description: "반응·건조·여과·분쇄 공정 장비를 설계하고 제작하는 산업 장비 제조사입니다.",
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
      <body>{children}</body>
    </html>
  );
}
