import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  alternates: { canonical: "/ko/privacy" },
  robots: { index: false, follow: true }
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "1. 수집하는 개인정보 항목",
      body: "회사는 견적 요청 및 상담 접수를 위해 회사명, 담당자명, 연락처, 이메일, 관심 제품, 문의 내용을 수집할 수 있습니다."
    },
    {
      title: "2. 개인정보의 수집 및 이용 목적",
      body: "수집한 정보는 제품 견적 검토, 기술 상담, 문의 응대, 프로젝트 진행 여부 확인을 위해 사용됩니다."
    },
    {
      title: "3. 보유 및 이용 기간",
      body: "개인정보는 상담 목적 달성 후 지체 없이 파기합니다. 다만 거래 진행, 분쟁 대응, 관계 법령에 따른 보관 필요가 있는 경우 해당 기간 동안 보관할 수 있습니다."
    },
    {
      title: "4. 개인정보의 제3자 제공",
      body: "회사는 정보주체의 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법령에 따라 요구되는 경우에는 예외로 합니다."
    },
    {
      title: "5. 개인정보 처리 위탁",
      body: "회사는 원활한 홈페이지 운영을 위해 서버, 호스팅, 데이터 저장 서비스 등 일부 업무를 외부 서비스에 위탁할 수 있으며, 필요한 범위 내에서만 처리합니다."
    },
    {
      title: "6. 정보주체의 권리",
      body: "정보주체는 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있으며, 회사는 관련 법령에 따라 지체 없이 조치합니다."
    },
    {
      title: "7. 개인정보 보호책임자 및 문의",
      body: "개인정보 관련 문의는 maharex@naver.com 또는 Tel. 031-673-5888로 연락해 주시기 바랍니다."
    }
  ];

  return (
    <section className="py-20">
      <div className="container">
        <div className="border-b border-black/10 pb-8">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Privacy Policy</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">개인정보처리방침</h1>
          <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-steel">
            ㈜마하렉스는 홈페이지 문의 및 견적 요청 과정에서 수집되는 개인정보를 안전하게 관리하고,
            관련 법령에 따라 필요한 범위 내에서만 이용합니다.
          </p>
        </div>

        <div className="mt-10 grid gap-5">
          {sections.map((section) => (
            <article key={section.title} className="border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-graphite">{section.title}</h2>
              <p className="mt-4 text-sm font-semibold leading-8 text-steel">{section.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 bg-graphite p-6 text-white">
          <p className="text-sm font-bold leading-7 text-white/70">
            시행일자 : 2026년 5월 6일
          </p>
          <Link href="/ko/contact" className="mt-5 inline-flex bg-signal px-5 py-3 text-sm font-black text-white hover:bg-white hover:text-graphite">
            문의/RFQ로 돌아가기
          </Link>
        </div>
      </div>
    </section>
  );
}
