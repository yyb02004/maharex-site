export default function EngineeringPage() {
  const policies = [
    ["고객 요구사항 반영", "원료 특성, 운전 조건, 설치 환경, 납기 요구사항을 초기 단계에서 확인합니다."],
    ["표준화된 제작 관리", "설계, 구매, 제작, 검사 단계별 기준을 정리해 재현 가능한 품질을 확보합니다."],
    ["검사와 기록 중심", "용접, 조립, 표면 처리, 주요 치수, 압력·진공 조건을 확인하고 기록합니다."],
    ["지속적인 개선", "납품 후 현장 피드백을 설계와 제작 기준에 반영합니다."]
  ];

  const process = [
    ["01", "고객 요구 접수", "RFQ, 공정 조건, 적용 제품, 설치 현장 정보를 수집합니다."],
    ["02", "설계 검토", "재질, 용량, 압력, 진공, 가열 방식, 인정성과 유지보수성을 검토합니다."],
    ["03", "구매 및 제작 관리", "주요 자재와 외주 공정의 사양을 확인하고 제작 기준을 관리합니다."],
    ["04", "공정 검사", "용접 상태, 조립 상태, 용접 위치, 외관, 주요 치수 등을 점검합니다."],
    ["05", "최종 검사 및 출하", "완성 장비의 기능, 문서, 출하 상태를 확인합니다."],
    ["06", "사후 개선", "설치·시운전 이후 피드백을 반영해 기준을 개선합니다."]
  ];

  const controls = ["ISO 기반 품질 문서", "제작 도면 검토", "자재 및 재질 확인", "용접·조립 검사", "압력·진공 조건 확인", "출하 전 최종 점검"];

  return (
    <>
      <section className="bg-graphite py-24 text-white">
        <div className="container">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-signal">Quality Management</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">품질관리 프로세스</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/70">
            설계 검토부터 제작, 검사, 출하, 사후 개선까지 이어지는 품질관리 체계로 신뢰할 수 있는 산업 설비를 제작합니다.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid gap-5 md:grid-cols-4">
            {policies.map(([title, text], index) => (
              <div key={title} className="border border-black/10 bg-white p-7 shadow-sm">
                <span className="text-sm font-black text-signal">0{index + 1}</span>
                <h2 className="mt-5 text-xl font-black leading-8">{title}</h2>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="container">
          <div className="mb-12">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">Process</p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">품질관리 흐름</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-6">
            {process.map(([number, title, text]) => (
              <div key={number} className="border-t-4 border-signal bg-[#f5f6f4] p-6">
                <span className="text-3xl font-black text-cobalt">{number}</span>
                <h3 className="mt-5 text-lg font-black leading-7">{title}</h3>
                <p className="mt-4 text-sm font-semibold leading-7 text-steel">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid gap-10 lg:grid-cols-[0.72fr_1fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-signal">Control Points</p>
            <h2 className="mt-3 max-w-xl text-3xl font-black leading-tight md:text-4xl">제작 품질을 확인하는 핵심 관리 항목</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-steel md:text-lg">
              장비별 사양과 고객 요구 문서에 따라 내부 검사항목은 달라질 수 있으며, 출하 전 주요 조건을 다시 확인합니다.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {controls.map((item) => (
              <div key={item} className="flex items-center justify-between border border-black/10 bg-white p-5 shadow-sm">
                <span className="font-black">{item}</span>
                <span className="h-2 w-2 bg-signal" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
