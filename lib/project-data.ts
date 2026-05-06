export type ProjectCategory = "Reactor" | "Dryer" | "Nutsche Filter" | "Condenser" | "Plant" | "Mixer" | "Mill" | "Vacuum System";

export type ProjectItem = {
  id: string;
  year: number;
  month?: number;
  client: string;
  title: string;
  category: ProjectCategory;
  summary: string;
  featured?: boolean;
};

export const projectCategories: ProjectCategory[] = ["Reactor", "Dryer", "Nutsche Filter", "Condenser", "Plant", "Mixer", "Mill"];

const categoryFromTitle = (title: string): ProjectCategory => {
  const text = title.toLowerCase();
  if (text.includes("nutsche") || text.includes("filter") || text.includes("누체") || text.includes("여과")) return "Nutsche Filter";
  if (text.includes("dryer") || text.includes("건조기") || text.includes("dry")) return "Dryer";
  if (text.includes("reactor") || text.includes("반응기")) return "Reactor";
  if (text.includes("condenser") || text.includes("heat exchanger")) return "Condenser";
  if (text.includes("mixer") || text.includes("혼합") || text.includes("향장")) return "Mixer";
  if (text.includes("mill") || text.includes("crusher") || text.includes("oscillator")) return "Mill";
  return "Plant";
};

const item = (id: string, year: number, month: number | undefined, client: string, title: string): ProjectItem => ({
  id,
  year,
  month,
  client,
  title,
  category: categoryFromTitle(title),
  summary: `${client} ${title}`
});

export const projects: ProjectItem[] = [
  item("2026-03-wemass-etfe-filter", 2026, 3, "㈜위매스", "ETFE Nutsche Filter 제작 공사"),
  item("2026-02-easychem-sts304-filter", 2026, 2, "㈜이지켐", "STS304 Nutsche Filter"),
  item("2026-01-greenlife-pin-mill", 2026, 1, "그린생명과학", "Pin Mill 제작 공사"),

  item("2025-09-daekyung-indichem-tray-dryer", 2025, 9, "대경이앤씨", "인디켐 Tray Vacuum Dryer 외 제작 설치"),
  item("2025-08-easychem-filter", 2025, 8, "㈜이지켐", "Nutsche Filter 제작공사"),
  item("2025-05-sungdo-cmdl-filter", 2025, 5, "성도이엔지", "㈜CMDL Nutsche Filter 제작공사"),
  item("2025-04-easychem-filter-delivery", 2025, 4, "㈜이지켐", "Nutsche Filter 제작공사 납품"),
  item("2025-03-wemass-filter", 2025, 3, "㈜위매스", "Nutsche Filter 제작공사"),
  item("2025-03-ttt-condenser", 2025, 3, "㈜TTT", "Condenser 제작설치"),

  item("2024-08-chunbo-bls-urea-dryer", 2024, 8, "㈜천보비엘에스", "GLS Urea Dryer 제작설치공사"),
  item("2024-08-bell-ycia-filter", 2024, 8, "Bell E&C", "YCIA Advanced Nutsche Filter 제작공사"),
  item("2024-06-pharmacostech-tray-dryer", 2024, 6, "㈜파마코스텍", "Tray Vacuum Dryer 0.8㎥ 4 Set 제작설치공사"),
  item("2024-06-pharmacostech-jet-mill", 2024, 6, "㈜파마코스텍", "화성공장 Jet Mill 제작 설치 공사"),
  item("2024-04-msunichem-teflon-filter", 2024, 4, "㈜MS유니켐", "Teflon Coating Nutsche Filter 제작"),
  item("2024-03-hansung-distributor-screw-feeder", 2024, 3, "㈜한성기공", "Distributor Screw Feeder 제작 공사"),
  item("2024-02-chunbo-vacuum-tray-dryer", 2024, 2, "㈜천보", "Vacuum Tray Dryer 제작 설치 공사"),
  item("2024-01-hansung-screw-feeder", 2024, 1, "한성기공", "㈜천보비엘에스 Screw Feeder 제작공사"),
  item("2024-01-chunbo-bls-gls", 2024, 1, "㈜천보비엘에스", "GLS 추가설비 제작공사"),

  item("2023-11-chunbo-bls-conical-vacuum-dryer", 2023, 11, "㈜천보BLS", "Conical Vacuum Dryer 3㎥ Full Set 제작 설치공사"),
  item("2023-08-chunbo-double-cone-mixer", 2023, 8, "㈜천보", "Double Cone Mixer 제작설치공사"),
  item("2023-05-chunbo-bls-reactor", 2023, 5, "㈜천보BLS", "군산공장 증설공사 반응기 외 제작 납품"),
  item("2023-03-chunbo-oxa", 2023, 3, "㈜천보", "OXA 포장라인 증설공사"),
  item("2023-03-msunichem-filter", 2023, 3, "㈜MS유니켐", "Nutsche Filter 외 제작"),
  item("2023-02-pharmacostech-reactor", 2023, 2, "㈜파마코스텍", "음성공장 반응기 SUS 반응기 5㎥ Full Set 제작 설치공사"),

  item("2022-12-chunbo-material-vacuum-dryer", 2022, 12, "㈜천보신소재", "영평 신규공장 Vacuum Dryer 외 8종 제작 설치공사"),
  item("2022-11-hanseochem-tray-dryer", 2022, 11, "㈜한서켐", "Tray Vacuum Dryer 2.5㎥ 2 Set 신규 제작 설치공사"),
  item("2022-08-unionchemical-expansion", 2022, 8, "㈜유니온케미칼", "익산공장 증설공사"),
  item("2022-07-bell-vacuum-dryer", 2022, 7, "㈜벨이앤씨", "진공건조기 제작납품"),
  item("2022-06-chunbo-bls-gunsan", 2022, 6, "㈜천보BLS", "군산공장 신축공사"),
  item("2022-05-jungwon-26-equipment", 2022, 5, "㈜중원신소재", "영평공장 신규공장 건조기 외 반응설비 26기 제작설치공사"),
  item("2022-03-hsbio-hastelloy", 2022, 3, "㈜에이치에스바이오", "Hastelloy-C22 반응기 및 건조기 제작설치공사"),
  item("2022-03-bell-tray-dryer", 2022, 3, "㈜벨이앤씨", "Tray Vacuum Dryer 제작 설치공사"),
  item("2022-03-chunbo-rotary-vacuum-dryer", 2022, 3, "㈜천보", "0동 Rotary Vacuum Dryer 제작 납품"),
  item("2022-02-jungwon-thin-film", 2022, 2, "㈜중원신소재 2공장", "LS용 THIN FILM EVAPORATOR"),
  item("2022-01-j2h-filter", 2022, 1, "㈜J2H Bio Tech", "가압누체 스텐드형 제작 납품"),

  item("2021-12-bell-filter", 2021, 12, "㈜벨이앤씨", "Nutsche Filter 제작"),
  item("2021-10-jungwon-reactor-dryer", 2021, 10, "㈜중원신소재", "영평공장 반응기 SET, 건조기 제작 및 설치공사"),
  item("2021-09-bell-tray-dryer", 2021, 9, "㈜벨이앤씨", "Tray Vacuum Dryer 제작설치공사"),
  item("2021-08-chunbo-rotary-vacuum-dryer", 2021, 8, "㈜천보", "Rotary Vacuum Dryer 3.4㎥ - 2 Set"),
  item("2021-07-yuwon-tray-dryer", 2021, 7, "㈜유원팜테크", "Tray Vacuum Dryer 제작설치 & 부대설비 공사"),
  item("2021-05-wemass-tray-dryer-2", 2021, 5, "㈜위매스", "Tray Vacuum Dryer 1.6㎥ 제작설치"),
  item("2021-05-hanseochem-filter", 2021, 5, "㈜한서켐", "0동 Nutsche Filter 제작설치공사"),
  item("2021-05-bell-tray-dryer", 2021, 5, "㈜벨이앤씨", "Tray Vacuum Dryer 제작설치공사"),
  item("2021-03-wemass-tray-dryer", 2021, 3, "㈜위매스", "Tray Vacuum Dryer 1.6㎥ 제작설치"),
  item("2021-03-hsbio-reactor-dryer", 2021, 3, "㈜에이치에스바이오", "진천공장 Reactor Dryer Full Set 제작설치공사"),

  item("2020-12-jungwon-rotary-dryer", 2020, 12, "㈜중원신소재", "00동 Rotary Dryer System 신설공사"),
  item("2020-09-jungwon-auto-filter", 2020, 9, "㈜중원신소재", "자동여과기 제작설치공사"),
  item("2020-09-jungwon-rotary-dryer", 2020, 9, "㈜중원신소재", "00동 Rotary Dryer System 신설공사"),
  item("2020-09-unionchemical-dropping-tank", 2020, 9, "㈜유니온케미칼", "Dropping Tank 제작설치공사"),
  item("2020-07-hanseochem-storage-tank", 2020, 7, "㈜한서켐", "Storage Tank 제작설치공사"),
  item("2020-05-hanseochem-heat-exchanger", 2020, 5, "㈜한서켐", "Heat Exchanger 제작설치공사"),
  item("2020-05-mipharm-filter", 2020, 5, "㈜엠아이팜", "누체필터 제작설치"),
  item("2020-04-chunbo-precision-rotary-dryer", 2020, 4, "㈜천보정밀", "Rotary Dryer System 제작설치공사"),
  item("2020-04-estec-fitz-mill", 2020, 4, "㈜에스텍파마", "Hastelloy-C22 Fitz Mill"),
  item("2020-02-jungwon-plant", 2020, 2, "㈜중원신소재", "0동 Plant 신설공사"),

  item("2019-11-ieg-filter", 2019, 11, "㈜이지켐", "가압누체필터 제작설치공사"),
  item("2019-10-jungwon-rotary-dryer", 2019, 10, "㈜중원신소재", "0동 Rotary Dryer 신설공사"),
  item("2019-09-hanseochem-reactor", 2019, 9, "㈜한서켐", "Reactor Full Set 제작설치공사"),
  item("2019-03-wemass-teflon-filter", 2019, 3, "㈜위매스", "Teflon Coating Nutsche Filter 제작"),
  item("2019-02-chunbo-rotary-vacuum-dryer", 2019, 2, "㈜천보", "Rotary Vacuum Dryer 2.8㎥"),
  item("2019-01-mipharm-jincheon", 2019, 1, "㈜엠아이팜", "진천공장 생산설비 제작설치공사"),
  item("2019-01-j2h-reactor", 2019, 1, "㈜J2H Bio Tech", "반응기 Full Set 제작설치공사"),
  item("2019-01-jungwon-hastelloy-plant", 2019, 1, "㈜중원신소재", "Hastelloy-C22 Plant 신설공사"),

  item("2018-11-ieg-carbonic", 2018, 11, "㈜이지켐", "탄천공장 증설공사"),
  item("2018-09-it-chem", 2018, 9, "㈜It Chem", "생산동 증설공사"),
  item("2018-07-chunbo-e-building", 2018, 7, "㈜천보", "E동 증설공사"),
  item("2018-06-j2h-production", 2018, 6, "㈜J2H BioTech", "생산동 신설공사"),
  item("2018-04-hanseochem-reactor", 2018, 4, "㈜한서켐", "STS316L Reactor 3.0㎥"),
  item("2018-01-hanbul-candle", 2018, 1, "㈜한불화농", "향초 제조 설비"),
  item("2018-01-hsbio-tray-dryer", 2018, 1, "㈜HS-Bio", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2018-01-hanseochem-tray-dryer", 2018, 1, "㈜한서켐", "Tray Vacuum Dryer Full Set 1.0㎥"),
  item("2018-01-hanseochem-filter", 2018, 1, "㈜한서켐", "Nutsche Filter Ø1100"),

  item("2017-09-chunbo-mp-plant", 2017, 9, "㈜천보", "MP PLANT 제작설비"),
  item("2017-08-hanbul-candle-equipment", 2017, 8, "㈜한불화농", "향초제조설비"),
  item("2017-07-chunbo-filter", 2017, 7, "㈜천보", "가압 Nutsche Filter"),
  item("2017-07-chunbo-reactor-2", 2017, 7, "㈜천보", "STS316L Reactor System 8.0㎥ - 2 Set"),
  item("2017-07-unionchemical-hot-water-tank", 2017, 7, "㈜유니온케미칼", "Hot Water Tank 5.0㎥ 외"),
  item("2017-06-huve-global-reactor", 2017, 6, "㈜휴브글로벌", "High Pressure STS316L Reactor 3.0㎥ - 2 Set"),
  item("2017-06-heesung-pilot", 2017, 6, "㈜희성소재", "이차전해질 합성 Pilot System"),
  item("2017-05-mipharm-filter", 2017, 5, "㈜엠아이팜", "Nutsche Filter Ø1000"),
  item("2017-04-hl-genomics-jet-mill", 2017, 4, "㈜HL지노믹스", "Jet-Mill System"),
  item("2017-04-unionchemical-teflon", 2017, 4, "㈜유니온케미칼", "Teflon Reactor 8.0㎥, 가압 Nutsche Filter"),
  item("2017-03-chunbo-reactor", 2017, 3, "㈜천보", "STS316L Reactor System 8.0㎥ - 3 Set"),
  item("2017-01-chunbo-precision-tray-dryer", 2017, 1, "㈜천보정밀", "Tray Vacuum Dryer Full Set 2.0㎥"),

  item("2016-11-chunbo-condenser", 2016, 11, "㈜천보", "Hastelloy C22 Condenser 10.0㎥"),
  item("2016-11-hanseochem-filter", 2016, 11, "㈜한서켐", "Nutsche Filter"),
  item("2016-11-hanbul-hot-water-tank", 2016, 11, "㈜한불화농", "Hot Water Tank 5.0㎥"),
  item("2016-10-hanseochem-tray-dryer", 2016, 10, "㈜한서켐", "Tray Vacuum Dryer Full Set 1.0㎥"),
  item("2016-10-hanbul-mixer", 2016, 10, "㈜한불화농", "식향, 향장 Mixer 2.0㎥ - 4 Set"),
  item("2016-10-hsbio-tray-dryer", 2016, 10, "㈜에이치에스바이오", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2016-08-sungil-reactor", 2016, 8, "㈜성일바이오엑스", "STS316L Reactor System 1.5㎥"),
  item("2016-08-sungil-condenser", 2016, 8, "㈜성일바이오엑스", "Condenser 20.0㎥ - 2 Set"),
  item("2016-08-daewoong-rotary-vacuum-dryer", 2016, 8, "㈜대웅바이오", "Rotary Vacuum Dryer 2.8㎥"),
  item("2016-07-base-korea-reactor", 2016, 7, "㈜베이스코리아", "STS304 Reactor System 3.0㎥"),
  item("2016-07-chunbo-tank", 2016, 7, "㈜천보", "질산 탈수여액탱크"),
  item("2016-06-woodone-feeder", 2016, 6, "㈜후드원", "향미제 투입장치"),
  item("2016-06-chunbo-filter", 2016, 6, "㈜천보", "가압 Nutsche Filter"),
  item("2016-05-hanbul-filter-washer", 2016, 5, "㈜한불화농", "Filter Washer 4.0㎥"),
  item("2016-03-chunbo-hastelloy-reactor", 2016, 3, "㈜천보", "Hastelloy C22 Reactor System"),
  item("2016-02-chunbo-hastelloy-reactor", 2016, 2, "㈜천보", "Hastelloy C22 Reactor System"),
  item("2016-01-hanbul-mixer", 2016, 1, "㈜한불화농", "식향, 향장 Mixer 1.0㎥ - 4 Set"),

  item("2015-11-chunbo-reactor-2", 2015, 11, "㈜천보", "STS316L Reactor System 2.0㎥"),
  item("2015-11-hanmiprecision-filter", 2015, 11, "㈜한미정밀화학", "Nutsche Filter"),
  item("2015-11-hanseochem-oscillator", 2015, 11, "㈜한서켐", "Oscillator, Pin Crusher"),
  item("2015-11-chunbo-reactor-small", 2015, 11, "㈜천보", "STS316L Reactor System 0.5㎥, 1.0㎥ - 2 Set"),
  item("2015-11-chunbo-filtrate-tank", 2015, 11, "㈜천보", "F/D Filtrate Tank"),
  item("2015-11-mipharm-receiver", 2015, 11, "㈜엠아이팜", "STS316L Receiver 2.0㎥"),
  item("2015-07-chunbo-teflon-reactor", 2015, 7, "㈜천보", "Teflon Reactor 1.0㎥, 2.0㎥, 3.0㎥ - 3 Set"),
  item("2015-05-chunbo-tray-dryer", 2015, 5, "㈜천보", "Tray Vacuum Dryer Full Set 3.6㎥ - 2 Set"),
  item("2015-05-chunbo-reactor", 2015, 5, "㈜천보", "STS316L Reactor 7.0㎥ - 2 Set"),
  item("2015-05-hanmiprecision-tray-dryer", 2015, 5, "㈜한미정밀화학", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2015-03-chunbo-hastelloy-c276", 2015, 3, "㈜천보", "Hastelloy C276 Reactor 제작"),
  item("2015-03-mipharm-reactor", 2015, 3, "㈜엠아이팜", "STS316L Reactor 2.0㎥"),

  item("2014-12-dongwoo-fitz-mill", 2014, 12, "㈜동우신테크", "Fitz Mill"),
  item("2014-09-chunbo-reactor", 2014, 9, "㈜천보", "STS316L Reactor 6.0㎥"),
  item("2014-06-pharmacostech-convention-dryer", 2014, 6, "㈜파마코스텍", "Convention Dryer"),
  item("2014-06-chunbo-reactor", 2014, 6, "㈜천보", "STS316L Reactor Full Set 3.0㎥ - 2 Set"),
  item("2014-05-chunbo-teflon-reactor", 2014, 5, "㈜천보", "Teflon Reactor 3.0㎥"),
  item("2014-05-smc-tray-dryer", 2014, 5, "㈜SMC", "Tray Vacuum Dryer Full Set 1.4㎥"),
  item("2014-04-dongwoo-extension", 2014, 4, "㈜동우신테크", "생산2동 증축공사"),
  item("2014-03-chunbo-tray-dryer", 2014, 3, "㈜천보", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2014-03-nsm-homo-mixer", 2014, 3, "NSM", "Homo Mixer 1.5㎥"),
  item("2014-02-hwail-fitz-mill", 2014, 2, "㈜화일약품", "Fitz Mill"),
  item("2014-01-chunbo-storage", 2014, 1, "㈜천보", "위험물저장설비 제작 20.0㎥ - 6 Set"),

  item("2013-05-pharmacostech-reactor", 2013, 5, "㈜파마코스텍", "STS316L Reactor System"),
  item("2013-03-bioland-extract", 2013, 3, "㈜바이오랜드", "Extract System"),
  item("2013-02-pharmacostech-tray-dryer", 2013, 2, "㈜파마코스텍", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2013-01-hanmiprecision-tray-dryer", 2013, 1, "㈜한미정밀화학", "Tray Vacuum Dryer Full Set 2.0㎥"),
  item("2013-01-chunbo-storage-tank", 2013, 1, "㈜천보", "Storage Tank 5.0㎥"),
  item("2013-01-chunbo-oscillator", 2013, 1, "㈜천보", "Oscillator"),

  item("2012-12-chunbo-reactor", 2012, 12, "㈜천보", "STS316L Reactor System 2.0㎥"),
  item("2012-11-hansechem-pin-mill", 2012, 11, "㈜한세켐", "Pin Mill"),
  item("2012-10-chunbo-reactor", 2012, 10, "㈜천보", "STS316L Reactor System 8.0㎥"),
  item("2012-09-estec-filter", 2012, 9, "㈜에스텍파마", "Nutsche Filter - 5 Set"),
  item("2012-09-estec-b-reactor", 2012, 9, "㈜에스텍파마", "발안공장 B동 Reactor System 설치공사"),
  item("2012-08-duksung-tray-dryer", 2012, 8, "㈜덕성", "Tray Vacuum Dryer Full Set 3.0㎥ - 2 Set"),
  item("2012-08-estec-reactor", 2012, 8, "에스텍파마", "Reactor System - 4 Set"),
  item("2012-07-estec-fitz-mill", 2012, 7, "에스텍파마", "Fitz Mill - 4 Set"),
  item("2012-06-chunbo-tray-dryer", 2012, 6, "㈜천보", "Tray Vacuum Dryer Full Set 2.0㎥ - 2 Set"),
  item("2012-06-duksung-reactor", 2012, 6, "㈜덕성", "STS316L Reactor Full Set 10.0㎥"),
  item("2012-05-nsm-homo-mixer", 2012, 5, "NSM", "Homo Mixer 1.5㎥")
];
