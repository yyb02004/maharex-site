import Link from "next/link";
import { notFound } from "next/navigation";
import { CertificateSlider } from "@/components/CertificateSlider";
import { NaverRouteMap } from "@/components/NaverRouteMap";
import { Section } from "@/components/Section";
import { aboutMenu, aboutSections, productImages } from "@/lib/site-data";

type AboutSlug = keyof typeof aboutSections;

export function generateStaticParams() {
  return aboutMenu.map(([, slug]) => ({ locale: "ko", slug }));
}

export default async function AboutSubPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams?: Promise<{ cert?: string }>;
}) {
  const { locale, slug } = await params;
  const query = searchParams ? await searchParams : {};

  if (slug === "ceo") {
    return (
      <section className="py-20">
        <div className="container">
          <div className="mb-14">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">CEO Message</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
              기술력 있는 신뢰의 기업, <span className="text-cobalt">㈜마하렉스</span>와 함께 하십시오.
            </h1>
            <p className="mt-4 inline-block bg-steel px-4 py-2 text-sm font-bold text-white">㈜마하렉스 홈페이지에 오신 것을 환영합니다.</p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="border border-black/10 bg-white p-4 shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden bg-nickel">
                <img src={productImages.factoryExterior} alt="마하렉스 회사 전경" className="image-cover object-[center_76%]" />
                <div className="absolute left-6 top-6 bg-white/90 p-4">
                  <img src="/maharex-logo-transparent.png" alt="마하렉스" className="h-14 w-auto max-w-[180px] object-contain" />
                </div>
              </div>
            </div>

            <div className="max-w-3xl text-base font-semibold leading-8 text-graphite md:text-lg md:leading-9">
              <p>
                <strong className="text-2xl font-black text-signal">1995년</strong> 창사 이래 당사는 외적·질적으로 많은 성장을 이어왔으며,
                업계에서도 기술력 있는 신뢰받는 기업으로 평가받고 있습니다.
              </p>
              <p className="mt-6">
                특히 의약품 원료, 정밀화학, 2차전지 소재 분야에서 GMP 개념에 입각한 설비 공급 실적을 축적해 왔으며,
                반응기, 건조기, 필터, 분쇄기를 공정 조건에 맞춰 설계·제작하고 있습니다.
              </p>
              <p className="mt-6">
                앞으로도 현장 생산자의 시각에서 운전 안정성과 유지보수성을 고려한 최적의 설비를 공급하고,
                지속적인 기술 개발과 품질 개선으로 고객을 위한 기업으로 성장해 나가겠습니다.
              </p>
              <p className="mt-12 text-right text-xl font-black">마하렉스 임직원 일동</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "certifications") {
    const certificates = [
      "/certificates/pages/iso-01.png",
      "/certificates/pages/iso-02.png",
      "/certificates/pages/iso-03.png",
      "/certificates/pages/iso-04.png",
      "/certificates/pages/iso-05.png",
      "/certificates/pages/iso-06.png"
    ];
    const activeCertificate = Number(query.cert || "1") - 1;

    return (
      <Section eyebrow="회사소개" title="인증 및 특허">
        <p className="mb-10 max-w-3xl text-lg leading-8 text-steel">
          품질, 환경, 안전보건 경영 인증을 기반으로 안정적인 산업 설비 제작 체계를 운영합니다. 인증서는 페이지 안에서 좌우 버튼과 썸네일로 확인할 수 있습니다.
        </p>
        <CertificateSlider certificates={certificates} activeIndex={activeCertificate} baseHref={`/${locale}/about/certifications`} />
      </Section>
    );
  }

  if (slug === "catalog") {
    return (
      <Section eyebrow="회사소개" title="카탈로그">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="overflow-hidden border border-black/10 bg-white shadow-sm">
            <img src="/catalog-pages/page-01.png" alt="마하렉스 카탈로그 표지" className="w-full object-cover" />
          </div>
          <div className="border border-black/10 bg-white p-8 shadow-industrial">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-signal">PDF Download</p>
            <h2 className="mt-4 text-2xl font-black leading-snug">마하렉스 제품 카탈로그</h2>
            <p className="mt-5 text-sm font-semibold leading-7 text-steel">
              반응기, 건조기, 여과기, 분쇄기 등 주요 공정 장비 정보를 PDF로 확인하실 수 있습니다.
            </p>
            <div className="mt-8 grid gap-3">
              <a href="/maharex-catalog.pdf" download className="bg-signal px-6 py-4 text-center text-sm font-black text-white hover:bg-graphite">
                카탈로그 다운로드
              </a>
              <a href="/maharex-catalog.pdf" target="_blank" className="border border-black/15 px-6 py-4 text-center text-sm font-black text-graphite hover:border-signal hover:text-signal">
                새 창에서 보기
              </a>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  if (slug === "company") {
    const strengths = [
      ["회사 소개", "1995년 창립한 마하렉스는 정밀화학, 제약, 식품, 2차전지 소재 분야의 생산설비를 제작해 온 산업장비 전문 제조사입니다."],
      ["최고의 품질생산능력", "현장 제작 경험을 바탕으로 원료 특성에 적합한 반응, 건조, 여과, 분쇄 설비를 제작합니다."],
      ["최적 원가절감 System", "핵심 공정은 자체 처리하고 전문성이 필요한 부분은 협력 네트워크와 조합해 납기와 품질을 관리합니다."],
      ["신속한 A/S 체계", "납품 후 운전 매뉴얼, 도면, 현장 대응 자료를 기반으로 생산 차질을 줄이는 사후 관리를 지향합니다."]
    ];

    return (
      <Section eyebrow="회사소개" title="최고의 기술력과 노하우로 신뢰받는 기업이 되겠습니다.">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.86fr] lg:items-start">
          <div className="space-y-5">
            {strengths.map(([title, text], index) => (
              <div key={title} className="border border-black/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-black text-signal">0{index + 1}</p>
                <h2 className="mt-3 text-xl font-black">{title}</h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-steel">{text}</p>
              </div>
            ))}
          </div>
          <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
            <img src={productImages.factoryExterior} alt="마하렉스 회사 전경" className="aspect-[4/3] w-full object-cover object-[center_76%]" />
          </div>
        </div>
      </Section>
    );
  }

  if (slug === "organization") {
    const departments = [
      ["연구개발부", "공정 검토, 설비 개선, 기술 자료 관리"],
      ["경영지원부", "구매, 자재, 회계, 납기 지원"],
      ["설계영업부", "RFQ 검토, 도면, 고객 커뮤니케이션"],
      ["제작부", "제관, 용접, 조립, 검사, 출하"]
    ];

    return (
      <Section eyebrow="Organization" title="프로젝트 중심 제조 조직">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto w-fit border border-cobalt/20 bg-white px-10 py-7 text-center shadow-industrial">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-signal">CEO</p>
            <h2 className="mt-2 text-3xl font-black">대표</h2>
          </div>
          <div className="mx-auto h-12 w-px bg-cobalt/30" />
          <div className="grid gap-4 md:grid-cols-4">
            {departments.map(([name, text]) => (
              <div key={name} className="border border-black/10 bg-white p-6 text-center shadow-sm">
                <h3 className="text-xl font-black text-cobalt">{name}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (slug === "history") {
    const companyHistory = [
      ["1995.03", "경기도 안성시 양성면에서 창업"],
      ["1996.09", "공장 등록"],
      ["2006.05", "신축 공장 건축 및 이전"],
      ["2006.07", "DQ, IQ, OQ, Validation 장비 완비 및 업무 수행"],
      ["2014.02", "벤처기업 인증"],
      ["2016.03", "기술연구 전담부서 설립"],
      ["2018.03", "생산공장 증설"]
    ] as const;

    return (
      <Section eyebrow="History" title="주요 연혁">
        <div className="overflow-hidden border-y border-black/10 bg-white shadow-sm">
          {companyHistory.map(([date, text]) => (
            <div key={date} className="grid gap-5 border-b border-black/10 px-5 py-7 last:border-b-0 md:grid-cols-[140px_1fr] md:px-8">
              <div className="text-2xl font-black text-signal md:text-3xl">{date}</div>
              <div className="flex items-center text-lg font-black leading-8 text-graphite">{text}</div>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  if (slug === "customers") {
    const customers = [
      ["㈜천보", "/Chunbo-Logo.JPG"],
      ["㈜천보신소재", "/Chunbo-Logo.JPG"],
      ["㈜천보비엘에스", "/Chunbo-Logo.JPG"],
      ["㈜파마코스텍", "/Pharma-Logo.jpg"],
      ["그린생명과학㈜", "/customer-logos/green-life-science.png"],
      ["동국생명과학㈜", "/customer-logos/dongkook-life-science.png"],
      ["성도이엔지", "/customer-logos/sungdo-eng.png"],
      ["㈜에이치에스바이오", "/customer-logos/hsbio.png"],
      ["㈜위매스", "/customer-logos/wimas.png"],
      ["㈜유니온케미칼", "/customer-logos/unionchemical.png"],
      ["㈜이지켐", "/customer-logos/easychem.png"],
      ["인디켐㈜", "/customer-logos/indichem.png"],
      ["폴라리스AI파마", "/customer-logos/polaris-ai-pharma.png"],
      ["㈜한서켐", "/customer-logos/hanseochem.png"],
      ["㈜Bell E&C", "/customer-logos/bellenc.gif"],
      ["㈜CMDL", "/customer-logos/cmdl.png"],
      ["㈜J2H Bio Tech", "/customer-logos/j2hbio-logo.jpg"],
      ["㈜MS유니켐", "/customer-logos/msunichem-large.png"],
      ["TTT", "/customer-logos/ttt-red-panel.png"],
      ["YCI Advanced", "/customer-logos/yci-advanced.png"]
    ];

    return (
      <Section eyebrow="Customers" title="주요 고객사">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {customers.map(([name, logo, subtitle]) => (
            <div key={name} className="flex min-h-32 flex-col items-center justify-center gap-3 border border-black/10 bg-white p-5 text-center shadow-sm">
              <div className="flex h-14 items-center justify-center">
                {logo && logo.startsWith("/") ? <img src={logo} alt="" className="max-h-14 max-w-[170px] object-contain" /> : null}
              </div>
              <span className="text-lg font-black text-graphite">{name}</span>
              {subtitle ? <span className="text-base font-black text-graphite">{subtitle}</span> : null}
              {logo && !logo.startsWith("/") ? <span className="text-base font-black text-graphite">{logo}</span> : null}
            </div>
          ))}
        </div>
      </Section>
    );
  }
  if (slug === "location") {
    return (
      <Section eyebrow="Location" title="오시는길">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="border border-black/10 bg-white p-6 shadow-sm md:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-signal">Address</p>
            <h2 className="mt-3 text-3xl font-black">경기도 안성시 양성면 한내로 534</h2>
            <p className="mt-4 text-sm font-semibold leading-7 text-steel">방문 상담 또는 설비 검토를 원하실 경우 사전에 연락 주시면 담당자가 안내드립니다.</p>
          </div>
          <div className="border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-signal">Contact</p>
            <p className="mt-3 text-sm font-bold leading-7 text-steel">Tel. 031-673-5888</p>
            <p className="text-sm font-bold leading-7 text-steel">Fax. 031-673-5288</p>
          </div>
        </div>
        <NaverRouteMap />
      </Section>
    );
  }

  const section = aboutSections[slug as AboutSlug];
  if (!section) notFound();

  return (
    <Section eyebrow="회사소개" title={section.title}>
      <div className="max-w-4xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xl font-black leading-8 text-graphite">{section.summary}</p>
        <p className="mt-6 text-base font-semibold leading-8 text-steel">{section.body}</p>
        <Link href={`/${locale}/about/company`} className="mt-8 inline-flex bg-signal px-6 py-4 text-sm font-black text-white hover:bg-graphite">
          회사소개 보기
        </Link>
      </div>
    </Section>
  );
}

