export default function ReferencesPage() {
  const projects = [
    ["2012", "(주)덕성", "STS316L Reactor Full Set 10.0m³"],
    ["2012", "(주)천보", "Tray Vacuum Dryer Full Set 2.0m³ - 2 Set"],
    ["2014", "(주)천보", "위험물 저장설비 20.0m³ - 6 Set"],
    ["2015", "(주)천보", "Hastelloy C276 Reactor 제작"],
    ["2016", "(주)한불화농", "Filter Washer 4.0m³"],
    ["2017", "(주)천보", "STS316L Reactor System 8.0m³ - 3 Set"],
    ["2017", "(주)유니온케미칼", "Teflon Reactor 8.0m³ 및 가압 Nutsche Filter"],
    ["2018", "(주)한서켐", "STS316L Reactor 3.0m³"],
    ["2019", "(주)중원신소재", "Hastelloy-C22 Plant 신설공사"],
    ["2020", "(주)한서켐", "Heat Exchanger 제작설치공사"],
    ["2020", "(주)중원신소재", "Rotary Dryer System 신설공사"],
    ["2021", "(주)에이치에스바이오", "진천공장 Reactor Dryer Full Set 제작설치공사"],
    ["2021", "(주)벨이앤씨", "Tray Vacuum Dryer 제작설치공사"],
    ["2022", "(주)천보신소재", "영평공장 건조기 외 반응설비 26기 제작설치공사"],
    ["2022", "(주)천보BLS", "군산공장 신축공사"],
    ["2023", "(주)파마코스텍", "음성공장 SUS 반응기 5m³ Full Set 제작설치공사"],
    ["2023", "(주)MS유니켐", "Nutsche Filter 외 제작"],
    ["2024", "(주)파마코스텍", "Tray Vacuum Dryer 0.8m³ 4 Set 제작설치공사"]
  ];

  return (
    <section className="py-24">
      <div className="container">
        <div className="mb-12 max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-signal">References</p>
          <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">납품 실적</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-steel">
            카탈로그의 주요 사업 실적을 기준으로 대표 프로젝트를 정리했습니다.
            정밀화학, 소재, 제약·바이오 분야의 반응, 건조, 여과 설비 경험을 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {projects.map(([year, client, project]) => (
            <div key={`${year}-${client}-${project}`} className="border border-black/10 bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <strong className="text-2xl font-black text-signal">{year}</strong>
                <span className="text-sm font-black text-cobalt">{client}</span>
              </div>
              <p className="mt-4 text-base font-bold leading-7 text-graphite md:text-[17px] md:leading-8">{project}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
