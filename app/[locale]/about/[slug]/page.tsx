import { notFound } from "next/navigation";
import { CertificateSlider } from "@/components/CertificateSlider";
import { Section } from "@/components/Section";
import { aboutMenu, aboutSections, productImages } from "@/lib/site-data";

type AboutSlug = keyof typeof aboutSections;

export function generateStaticParams() {
  return [
    ...aboutMenu.filter(([, slug]) => slug).map(([, slug]) => ({ locale: "ko", slug })),
    { locale: "ko", slug: "company" }
  ];
}

export default async function AboutSubPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params;

  if (slug === "vision") notFound();

  if (slug === "ceo") {
    return (
      <section className="py-20">
        <div className="container">
          <div className="mb-14">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">CEO Message</p>
            <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
              기술력있는 신뢰의 기업, <span className="text-cobalt">(주)마하렉스</span>와 함께 하십시오.
            </h1>
            <p className="mt-4 inline-block bg-steel px-4 py-2 text-sm font-bold text-white">
              (주)마하렉스 홈페이지에 오신 것을 환영합니다.
            </p>
          </div>

          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="border border-black/10 bg-white p-4 shadow-sm">
              <div className="relative aspect-[4/3] overflow-hidden bg-nickel">
                <img src={productImages.factoryExterior} alt="마하렉스 회사 전경" className="image-cover" />
                <div className="absolute left-6 top-6 bg-white/90 p-4">
                  <img src="/maharex-logo-transparent.png" alt="마하렉스" className="h-14 w-auto max-w-[180px] object-contain" />
                </div>
              </div>
            </div>

            <div className="max-w-3xl text-base font-semibold leading-8 text-graphite md:text-lg md:leading-9">
              <p>
                <strong className="text-2xl font-black text-signal">1995년</strong> 창사 이래 당사는 외적, 질적으로 많은 성장을 해왔으며
                업계에서도 내실있고 기술력있는 신뢰받는 기업으로 평가받고 있습니다.
              </p>
              <p className="mt-6">
                특히 의약품 원료업계와 정밀화학, 소재, 환경 분야에서 한 단계 향상된 설비 보급에 많은 실적을 쌓아가고 있으며,
                고객의 공정 조건에 맞춘 반응기, 트레이 진공 건조기, 로터리 드라이어, 필터, 분쇄기 제작에 최선을 다하고 있습니다.
              </p>
              <p className="mt-6">
                또한 현장 생산자의 시각에서 유지보수성과 운전 안정성을 고려한 최적의 설비를 공급하고자 하며,
                앞으로도 지속적인 기술 개발과 품질 개선으로 고객님을 위한 기업으로 성장해 나갈 것을 약속드립니다.
              </p>
              <p className="mt-12 text-right text-xl font-black">'마하렉스 임직원 일동'</p>
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

    return (
      <Section eyebrow="회사소개" title="인증 및 특허">
        <p className="mb-10 max-w-3xl text-lg leading-8 text-steel">
          품질, 환경, 안전보건 경영 인증을 기반으로 안정적인 산업 장비 제작 체계를 운영합니다.
          인증서는 페이지 안에서 좌우 버튼과 썸네일로 넘겨 확인할 수 있습니다.
        </p>
        <CertificateSlider certificates={certificates} />
      </Section>
    );
  }

  if (slug === "company") {
    const strengths = [
      ["회사 소개", "1995년 창립한 (주)마하렉스는 정밀화학, 제약, 식품, 화장품 등 GMP 개념이 중요한 생산 현장에 적합한 설비를 제작해왔습니다."],
      ["품질 생산 능력", "반응, 건조, 여과, 분쇄 공정 장비를 원료 특성과 운전 조건에 맞춰 설계하며 Turnkey Base 설비 공급 경험을 축적하고 있습니다."],
      ["최적 원가절감 System", "핵심 제작 역량은 자체 수행하고 전문성이 필요한 영역은 협력 체계를 활용해 납기와 품질, 원가 균형을 맞춥니다."],
      ["신속한 A/S 체계", "공급 설비에 대한 Operating Manual, Detail Drawing, Document를 정리해 실제 운전자가 안정적으로 운전할 수 있도록 지원합니다."]
    ];

    return (
      <section className="py-20">
        <div className="container">
          <div className="border-b border-black/15 pb-6">
            <h1 className="inline-block border-r border-black/20 pr-5 text-4xl font-black md:text-5xl">회사소개</h1>
            <span className="ml-5 inline-block text-base font-medium leading-7 text-steel md:text-lg">최고의 기술력과 노하우로 신뢰받는 기업이 되겠습니다.</span>
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_420px]">
            <div className="space-y-6">
              {strengths.map(([title, body], index) => (
                <div key={title} className="border-l-4 border-signal bg-white p-6 shadow-sm">
                  <p className="text-sm font-black text-signal">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-2xl font-black text-graphite">{title}</h2>
                  <p className="mt-3 text-base font-semibold leading-8 text-steel">{body}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-industrial">
              <img src={productImages.factoryExterior} alt="마하렉스 회사 전경" className="aspect-[4/5] w-full object-cover" />
              <div className="bg-white p-6">
                <img src="/maharex-logo-transparent.png" alt="마하렉스" className="h-16 w-auto object-contain" />
                <p className="mt-4 text-sm font-bold leading-7 text-steel">현장 중심의 설계와 제작 품질을 바탕으로 공정 장비를 공급합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (slug === "history") {
    const history = [
      ["1995.03", "경기도 안성시 양성면에서 창업"],
      ["1996.09", "공장 등록"],
      ["2006.05", "신축 공장 건축 및 이전"],
      ["2006.07", "DQ, IQ, OQ, Validation 장비 완비 및 업무 수행"],
      ["2014.02", "벤처기업 인증"],
      ["2016.03", "기술연구 전담부서 설립"],
      ["2018.03", "생산공장 증설"]
    ];

    return (
      <Section eyebrow="회사소개" title="연혁">
        <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
          <div className="bg-signal p-8 text-white">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-white/70">History</p>
            <h2 className="mt-4 text-3xl font-black leading-tight">주요 연혁</h2>
            <p className="mt-6 text-sm leading-7 text-white/80">1995년 창립 이후 축적해온 제조 기반과 프로젝트 경험을 정리했습니다.</p>
          </div>
          <div className="space-y-4">
            {history.map(([date, text]) => (
              <div key={`${date}-${text}`} className="grid gap-4 border border-black/10 bg-white p-5 shadow-sm md:grid-cols-[140px_1fr] md:items-start">
                <strong className="text-2xl font-black text-signal">{date}</strong>
                <p className="text-lg font-bold leading-8 text-graphite">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  if (slug === "organization") {
    const departments = [
      ["연구개발부", "공정 검토", "장비 개선, 기술 자료, Validation 대응"],
      ["경영지원부", "운영 관리", "계약, 구매, 품질 문서, 납품 일정 관리"],
      ["설계영업부", "설계 제안", "RFQ 검토, 고객 상담, 도면 협의"],
      ["제작부", "제작 품질", "용접, 조립, 표면 처리, 검사 및 출하"]
    ];

    return (
      <Section eyebrow="회사소개" title="조직도">
        <div className="mx-auto max-w-6xl">
          <div className="relative">
            <div className="mx-auto w-64 bg-graphite px-8 py-6 text-center text-2xl font-black text-white shadow-industrial">
              대표
              <span className="mt-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/55">Management</span>
            </div>
            <div className="mx-auto h-14 w-px bg-black/20" />
            <div className="hidden h-px bg-black/20 md:block" />
            <div className="grid gap-5 md:grid-cols-4">
              {departments.map(([name, label, desc]) => (
                <div key={name} className="relative border border-black/10 bg-white p-6 shadow-sm">
                  <div className="hidden md:absolute md:-top-5 md:left-1/2 md:block md:h-5 md:w-px md:-translate-x-1/2 md:bg-black/20" />
                  <span className="inline-flex bg-signal px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">{label}</span>
                  <h2 className="mt-5 text-2xl font-black">{name}</h2>
                  <p className="mt-4 text-sm font-semibold leading-7 text-steel">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    );
  }

  if (slug === "customers") {
    const customers = [
      { name: "(주)천보", logo: "/customer-logos/chunbo.jpg" },
      { name: "(주)천보신소재", logo: "/customer-logos/chunbo.jpg" },
      { name: "(주)천보비엘에스", logo: "/customer-logos/chunbo.jpg" },
      { name: "(주)파마코스텍", logo: "/customer-logos/pharmacostech.jpg" },
      { name: "(주)한서켐", logo: "" },
      { name: "(주)한불화농", logo: "/customer-logos/hanbul.png" },
      { name: "(주)동우신테크", logo: "" },
      { name: "폴라리스AI파마", logo: "https://polarisaipharma.com/ko/front/image/common/logo.png" },
      { name: "YCIA Advanced", logo: "https://www.ycia.co.kr/image/common/logo2.png" },
      { name: "(주)에이치에스바이오", logo: "" },
      { name: "(주)J2H Bio Tech", logo: "/customer-logos/j2hbio.ico" },
      { name: "(주)벨이앤씨", logo: "/customer-logos/bellenc.gif" },
      { name: "(주)유니온케미칼", logo: "/customer-logos/unionchemical.ico" },
      { name: "(주)MS유니켐", logo: "/customer-logos/msunichem.png" },
      { name: "(주)엠아이팜", logo: "" }
    ];

    return (
      <Section eyebrow="회사소개" title="주요고객사">
        <p className="mb-10 max-w-3xl text-lg leading-8 text-steel">
          정밀화학, 제약·바이오, 소재, 환경 분야의 주요 고객사와 다양한 공정 장비 프로젝트를 수행해왔습니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {customers.map((customer) => (
            <div key={customer.name} className="flex min-h-44 flex-col justify-between border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex h-20 items-center justify-center border border-black/5 bg-[#f8f9f8] p-4">
                {customer.logo ? (
                  <img src={customer.logo} alt={`${customer.name} 로고`} className="max-h-12 max-w-full object-contain" />
                ) : (
                  <span className="text-center text-lg font-black text-steel">{customer.name}</span>
                )}
              </div>
              <div className="mt-5">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-signal">Customer</span>
                <h2 className="mt-2 text-xl font-black">{customer.name}</h2>
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  if (slug === "location") {
    const address = "경기도 안성시 양성면 한내로 534";
    const mapUrl = `https://map.naver.com/p/search/${encodeURIComponent(address)}`;

    return (
      <Section eyebrow="회사소개" title="오시는길">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="bg-graphite p-8 text-white shadow-industrial">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-white/55">Address</p>
              <h2 className="mt-4 text-2xl font-black leading-snug md:text-3xl">{address}</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/70">방문 상담 또는 설비 검토는 사전 연락 후 방문해 주세요.</p>
              <div className="mt-5 space-y-1 text-sm font-bold text-white/78">
                <p>Tel. 031-673-5888</p>
                <p>Fax. 031-673-5288</p>
              </div>
              <a href={mapUrl} target="_blank" className="mt-8 inline-flex bg-signal px-6 py-4 text-sm font-black text-white hover:bg-white hover:text-graphite">
                네이버 지도에서 보기
              </a>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">고속도로 이용</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">경부고속도로 또는 평택제천고속도로 이용 후 안성·양성 방면으로 진입합니다.</p>
              </div>
              <div className="border border-black/10 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">국도 이용</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">안성 시내 또는 용인·평택 방면에서 양성면 방향으로 이동합니다.</p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden border border-black/10 bg-white p-4 shadow-sm">
            <img src="/location-map.svg" alt="마하렉스 오시는길 약도" className="w-full object-contain" />
            <p className="mt-4 px-2 pb-2 text-sm font-bold leading-7 text-steel">방문 전 차량 내비게이션에서 주소를 검색해 주세요.</p>
          </div>
        </div>
      </Section>
    );
  }

  const resolvedSlug = slug;
  if (!(resolvedSlug in aboutSections)) notFound();
  const section = aboutSections[resolvedSlug as AboutSlug];

  return (
    <Section eyebrow="회사소개" title={section.title}>
      <div className="grid gap-10 lg:grid-cols-[0.75fr_1fr]">
        <div className="border-l-4 border-signal bg-white p-8 shadow-sm">
          <p className="text-xl font-black leading-8 md:text-2xl md:leading-9">{section.summary}</p>
        </div>
        <div>
          <p className="text-base leading-8 text-steel md:text-lg">{section.body}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {["공정 이해", "설계 검토", "제작 품질", "납품 지원"].map((item) => (
              <div key={item} className="border border-black/10 bg-white p-5">
                <span className="text-sm font-black uppercase tracking-[0.18em] text-signal">Maharex</span>
                <p className="mt-3 text-xl font-black">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
