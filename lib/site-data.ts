export type Locale = "ko" | "en";

export const locales: Locale[] = ["ko"];

export const nav = {
  ko: [
    ["회사소개", "/ko/about"],
    ["제품", "/ko/products"],
    ["납품실적", "/ko/references"],
    ["품질관리", "/ko/engineering"],
    ["문의/RFQ", "/ko/contact"]
  ],
  en: [
    ["About", "/en/about"],
    ["Products", "/en/products"],
    ["References", "/en/references"],
    ["Engineering", "/en/engineering"],
    ["Contact / RFQ", "/en/contact"]
  ]
} as const;

export const aboutMenu = [
  ["CEO 인사말", "ceo"],
  ["소개", ""],
  ["조직도", "organization"],
  ["연혁", "history"],
  ["주요고객사", "customers"],
  ["오시는길", "location"],
  ["인증 및 특허", "certifications"]
] as const;

export const qualityMenu = [
  ["품질관리", ""],
  ["Validation", "validation"],
  ["측정용 장비", "measuring-equipment"]
] as const;

export const aboutSections = {
  ceo: {
    title: "CEO 인사말",
    summary: "공정 장비의 기본은 현장을 이해하는 것에서 시작합니다.",
    body: "Maharex는 고객의 원료 특성, 운전 조건, 유지보수 환경을 함께 검토하며 오래 안정적으로 운전되는 설비를 만드는 데 집중합니다."
  },
  organization: {
    title: "조직도",
    summary: "설계, 제작, 품질, 납품 지원이 유기적으로 움직이는 제조 조직입니다.",
    body: "프로젝트 상담부터 제작 도면, 용접·조립, 검사, 출하까지 각 단계가 이어지는 실무 중심 체계를 갖추고 있습니다."
  },
  history: {
    title: "연혁",
    summary: "반응, 건조, 여과, 분쇄 설비 경험을 바탕으로 성장해왔습니다.",
    body: "정밀화학, 소재, 환경, 식품·바이오 분야의 다양한 공정 장비 프로젝트를 수행하며 제조 역량을 축적하고 있습니다."
  },
  customers: {
    title: "주요고객사",
    summary: "정밀화학, 2차전지, 환경, 바이오 등 다양한 산업군을 지원합니다.",
    body: "고객사명 공개가 제한되는 산업 특성을 고려해 프로젝트 유형과 적용 공정 중심으로 납품 경험을 소개합니다."
  },
  location: {
    title: "오시는길",
    summary: "프로젝트 상담과 제작 검토를 위한 방문 문의를 받습니다.",
    body: "상세 주소와 지도 정보는 실제 사업장 정보 확인 후 반영할 수 있도록 구성 영역을 준비했습니다."
  },
  certifications: {
    title: "인증 및 특허",
    summary: "제작 품질과 기술 신뢰도를 보여주는 인증·특허 정보를 제공합니다.",
    body: "보유 인증서, 특허, 검사 기준 자료를 정리해 신뢰도 높은 B2B 검토 페이지로 확장할 수 있습니다."
  }
} as const;

export const copy = {
  ko: {
    rfq: "견적 요청",
    viewProducts: "제품 보기",
    home: "홈",
    heroTitle: "반응·건조·여과 공정을 위한 정밀 산업 장비",
    heroText:
      "Maharex는 반응기, 트레이 진공 건조기, 로터리 드라이어, 필터, 분쇄기를 공정 조건에 맞춰 설계·제작하는 한국 제조사입니다.",
    aboutTitle: "공정 조건에서 출발하는 장비 제작",
    aboutText:
      "원료 특성, 운전 온도, 진공 조건, 세정성, 유지보수 동선을 함께 검토해 현장에 맞는 설비를 설계합니다.",
    productsTitle: "주요 제품",
    referencesTitle: "납품 실적",
    engineeringTitle: "품질관리",
    contactTitle: "프로젝트 상담 및 RFQ"
  },
  en: {
    rfq: "Request RFQ",
    viewProducts: "View Products",
    home: "Home",
    heroTitle: "Precision-built process equipment for demanding industrial plants",
    heroText:
      "Maharex is a Korean manufacturer of reactors, tray vacuum dryers, rotary dryers, filters, and heat exchangers.",
    aboutTitle: "Equipment manufacturing guided by process conditions",
    aboutText:
      "We review material behavior, operating temperature, vacuum duty, cleanability, and maintenance access to engineer equipment around the site.",
    productsTitle: "Product Lines",
    referencesTitle: "References",
    engineeringTitle: "Engineering Capabilities",
    contactTitle: "Project Inquiry and RFQ"
  }
};

export const productImages = {
  reactor: "/equipment/reactor-new.jpg",
  trayVacuumDryer: "/equipment/tray-vacuum-dryer-close.jpg",
  trayVacuumDryerOpen: "/equipment/tray-vacuum-dryer-open.jpg",
  rotaryDryer: "/equipment/rotary-dryer-new.jpg",
  filter: "/equipment/nutsche-filter.jpg",
  mills: "/equipment/pin-mill.jpg",
  jetMill: "/equipment/jet-mill-new.jpg",
  turnkeyLine: "/equipment/turnkey-line.jpg",
  factory: "/equipment/factory.jpg",
  factoryExterior: "/factory-exterior.jpg"
};

export const products = [
  {
    slug: "reactors",
    image: productImages.reactor,
    ko: {
      name: "반응기",
      category: "Reactor",
      summary: "혼합, 냉각·가열, 진공 시스템을 통합해 재료의 화학 반응을 안정적으로 수행하는 설비.",
      details:
        "반응기는 다양한 산업에서 재료의 화학 반응을 일으키기 위해 설계된 장치로, 주로 혼합, 냉각과 가열, 진공 시스템 등이 합쳐져 구성됩니다. 마하렉스의 반응기는 파일럿(PILOT) 스케일부터 생산용 스케일까지 다양한 공정에 적용 가능하며 재료, 온도, 압력, 점도, 혼합 상태, 세정 조건을 함께 검토해 안정적인 반응 환경을 구현합니다. 원료 특성에 맞는 교반 방식과 밀폐 구조, Jacket 또는 Coil을 통한 열 제어, CIP 적용 여부까지 고려하여 공정별로 최적화된 반응 결과를 제공합니다.",
      specs: [
        "Jacket을 통한 반응 온도 조절 가능",
        "Mechanical Seal 및 Gland Packing을 이용한 탱크 밀폐",
        "Paddle, Turbine, Anchor Type 등 공정별 임펠러 적용",
        "내용물에 따라 R.P.M 조절 가능",
        "CIP 적용으로 간편한 세척 가능"
      ],
      applications: ["2차전지", "전자소재", "제약분야", "식품분야", "화학분야"],
      engineering: [
        "전극공정 양극재·음극재 원료 분산",
        "원료 및 제품 저장, 용해, 합성",
        "제약 원료 저장 및 유기합성",
        "식품 원료 저장 및 혼합",
        "화학 원료의 저장, 용해, 분산 및 합성"
      ]
    },
    en: {
      name: "Reactors",
      category: "Reactor",
      summary: "Custom reaction vessels for viscous media, heating, cooling, vacuum, and pressure duties.",
      details:
        "Jackets, coils, agitators, seals, and nozzle layouts are engineered around reaction goals for chemical, material, and environmental plants.",
      specs: ["SUS304 / SUS316L / special alloys", "Vacuum and pressure designs", "Anchor, paddle, and turbine agitation", "CIP/SIP options"],
      applications: ["Fine chemical reactions", "Battery materials", "Resin and polymer processing", "Environmental recycling processes"],
      engineering: ["Thermal jacket and internal coil configuration", "Agitator selection by viscosity and torque", "Optimized manhole, nozzle, and instrument locations"]
    }
  },
  {
    slug: "tray-vacuum-dryers",
    image: productImages.trayVacuumDryer,
    gallery: [productImages.trayVacuumDryer, productImages.trayVacuumDryerOpen],
    ko: {
      name: "트레이 진공 건조기",
      category: "Tray Vacuum Dryer",
      summary: "저온 진공 건조가 필요한 분말, 과립, 고부가 소재용 건조 설비.",
      details:
        "Tray 안에 제품을 얇게 펼쳐 넣은 후 내부는 진공을 유지하고, 외부 자켓 및 열판에는 온수를 순환시켜 제품을 건조시키는 장치입니다. 압력을 낮춰 끓는점을 감소시킴으로써 상대적으로 낮은 온도에서 용매나 수분을 증발시켜, 열에 민감한 물질을 손상 없이 건조할 수 있습니다.",
      specs: ["저온 건조물이 품질 저하 없이 균일화 가능", "온수·증기 열원으로 제어가 간단", "손실이 적고 건조 효율이 양호"],
      applications: ["식품분야", "제약분야", "기타분야", "화장품 분야", "화학 산업"],
      engineering: [
        "과일·야채 분말, 건강식품 원료, 정제, 과립, 분말 건조",
        "항생제, 비타민, 고분자 약물, 식물 추출물, 앰플 및 유리병 건조",
        "전자부품 건조 등 특수 소재 건조",
        "천연 성분 및 기능성 원료 건조",
        "정밀화학, 고분자 중간체, 촉매 건조"
      ]
    },
    en: {
      name: "Tray Vacuum Dryers",
      category: "Tray Vacuum Dryer",
      summary: "Drying systems for powders, sludge, and high-value materials requiring low-temperature vacuum operation.",
      details:
        "Uniform heat transfer, door sealing, tray handling, and internal cleanability help secure stable drying quality for sensitive materials.",
      specs: ["Low-temperature vacuum operation", "Electric, steam, or thermal oil heating", "Custom tray count", "Sight glass and safety interlocks"],
      applications: ["Powder and crystal drying", "Heat-sensitive materials", "Food and bio materials", "Small-batch production"],
      engineering: ["Door sealing and vacuum retention", "Tray-level heat distribution review", "Internal layout for cleaning and inspection"]
    }
  },
  {
    slug: "rotary-dryers",
    image: productImages.rotaryDryer,
    ko: {
      name: "로터리 드라이어",
      category: "Rotary Dryer",
      summary: "연속 대량 건조와 냉각 공정에 적합한 견고한 회전식 건조기.",
      details:
        "로터리 건조기는 수평 회전식 건조기로 구조가 간단하고 기계의 트러블 발생이 적어 다양한 제품 건조에 적합합니다. 고속 기류에 의한 열풍 건조뿐 아니라 간접 열에 의한 건조까지 가능해 슬러지 형태의 제품을 건조하고 분말화하는 데 적합합니다. 점성이 높아지거나 고형화 현상이 있는 제품 건조에도 효율적으로 사용할 수 있습니다.",
      specs: [
        "열풍 건조에 의한 전열 면적 최대화 가능",
        "부착성이 있는 원료의 건조 가능",
        "로터리 건조기 패들에 의한 파쇄 효과",
        "내부 고정판으로 충분한 체류 시간 확보",
        "열풍 공급 및 회전 속도 조절로 건조량 조절 가능"
      ],
      applications: ["광물 원료", "농업용 재료", "재활용 분야", "금속 광석", "탄소 소재"],
      engineering: [
        "석회석, 점토, 규석, 석고, 경석 등의 원료 건조",
        "배토, 비료 등 농업용 재료 건조",
        "폐기물, 하수 슬러지, 소각재 등의 재활용",
        "크롬, 망간, 니켈 등의 광석 원료 건조",
        "카본 블랙 등의 원료 건조"
      ]
    },
    en: {
      name: "Rotary Dryers",
      category: "Rotary Dryer",
      summary: "Robust rotating dryers for continuous high-volume drying and cooling processes.",
      details:
        "Drum angle, residence time, lifter geometry, and heat source configuration are matched to particle size and moisture profile.",
      specs: ["Continuous high-capacity handling", "Direct or indirect heating options", "Residence time optimization", "Dust collection and exhaust integration"],
      applications: ["Mineral materials", "Environmental sludge", "Biomass", "High-volume granular materials"],
      engineering: ["Lifter geometry and filling ratio review", "Feed and discharge integration", "Exhaust, dust collection, and heat-source package"]
    }
  },
  {
    slug: "filters",
    image: productImages.filter,
    ko: {
      name: "필터",
      category: "Filter",
      summary: "슬러리 분리, 고액 분리, 회수 공정에 맞춘 산업용 여과 장치.",
      details:
        "필터 면적, 케이크 배출, 세정 방식, 재질 선정까지 공정 조건에 맞춰 설계해 운전 안정성을 높입니다.",
      specs: ["고액 분리 공정", "내식 재질 선택", "케이크 배출 구조", "세정 및 점검 접근성"],
      applications: ["슬러리 고액분리", "용매 회수", "케이크 세정", "폐수·환경 공정"],
      engineering: ["필터 면적과 압력손실 검토", "케이크 배출 방식 설계", "내식성과 세정성을 고려한 재질 선정"]
    },
    en: {
      name: "Filters",
      category: "Filter",
      summary: "Industrial filtration equipment for slurry separation, solid-liquid separation, and recovery lines.",
      details:
        "Filter area, cake discharge, washing method, and material selection are tailored to the process conditions for stable operation.",
      specs: ["Solid-liquid separation", "Corrosion-resistant material options", "Cake discharge design", "Wash and inspection access"],
      applications: ["Slurry separation", "Solvent recovery", "Cake washing", "Wastewater and environmental processes"],
      engineering: ["Filter area and pressure drop review", "Cake discharge design", "Material selection for corrosion resistance and cleaning"]
    }
  },
  {
    slug: "mills",
    image: productImages.mills,
    gallery: [productImages.mills, productImages.jetMill],
    ko: {
      name: "분쇄기",
      category: "Mill",
      summary: "원료의 입도 조절과 분산 공정에 적용하는 Pin Mill, Jet Mill, Fitz Mill 기반 분쇄 설비.",
      details:
        "분쇄기는 원료 특성과 목표 입도, 처리량, 세정성, 분진 관리 조건을 고려해 선정합니다. Pin Mill은 고속 회전 핀의 충격력으로 원료를 분쇄하고, Jet Mill은 압축 공기 또는 가스를 이용해 미분쇄에 대응합니다. Fitz Mill은 스크린과 회전 블레이드를 통해 조분쇄, 정립, 입도 균일화 공정에 적용합니다.",
      specs: [
        "Pin Mill: 고속 회전 핀 충격에 의한 균일 분쇄",
        "Jet Mill: 열 발생과 금속 오염을 줄인 미분쇄",
        "Fitz Mill: 스크린 교체로 입도 조절이 쉬운 정립·조분쇄",
        "분진 포집 및 배기 시스템 연계 가능",
        "세정과 점검이 쉬운 구조로 제작 가능"
      ],
      applications: ["Pin Mill", "Jet Mill", "Fitz Mill", "분진 포집", "세정·점검"],
      engineering: [
        "식품, 화학, 제약 원료의 중간 입도 분쇄와 분산 공정",
        "전자소재, 세라믹, 촉매 등 미세 입도 분쇄가 필요한 공정",
        "과립 정리, 덩어리 해쇄, 정제 전후 입도 균일화 공정",
        "밀폐 이송, 집진기, 배기 라인과 연계한 분진 관리",
        "원료 교체가 잦은 현장을 고려한 분해·세척 구조"
      ],
      usageTitle: "분쇄 방식",
      notesTitle: "적용 공정"
    },
    en: {
      name: "Mills",
      category: "Mill",
      summary: "Pin Mill and Jet Mill systems for particle-size control and dispersion processes.",
      details:
        "Mill systems are selected by material properties, target particle size, throughput, cleanability, and dust-control requirements.",
      specs: ["Pin Mill", "Jet Mill", "Fitz Mill", "Dust collection integration", "Cleaning and inspection access"],
      applications: ["Electronic materials", "Pharma materials", "Food powders", "Chemical raw materials", "Specialty materials"],
      engineering: ["Target particle size and throughput review", "Mill type selection", "Dust and exhaust integration", "Cleanability and maintenance review"]
    }
  }
] as const;

export const references = {
  ko: ["정밀화학 반응/건조 라인", "2차전지 소재 전처리 설비", "환경 슬러지 건조 시스템", "식품/바이오 원료 진공 건조", "소재 분쇄·분산 설비"],
  en: ["Fine chemical reaction and drying lines", "Battery material pre-treatment systems", "Environmental sludge drying systems", "Food and bio-material vacuum drying", "Petrochemical heat exchanger packages"]
};

export const engineering = {
  ko: ["공정 조건 검토", "3D 배치 및 제작 도면", "재질/두께/강도 검토", "용접 및 표면 처리", "시운전 및 유지보수 지원"],
  en: ["Process condition review", "3D layout and fabrication drawings", "Material, thickness, and strength review", "Welding and surface finishing", "Commissioning and maintenance support"]
};

export const industries = {
  ko: ["정밀화학", "2차전지 소재", "제약·바이오", "환경·폐수", "식품·화장품", "석유화학"],
  en: ["Fine chemicals", "Battery materials", "Pharma and bio", "Environmental", "Food and cosmetics", "Petrochemical"]
};

export const processSteps = {
  ko: [
    ["01", "공정 상담", "원료 특성, 처리량, 온도·압력, 진공 조건을 먼저 확인합니다."],
    ["02", "장비 제안", "제품 형식, 재질, 가열 방식, 교반·여과·건조 구조를 검토합니다."],
    ["03", "제작 설계", "제작도, 노즐 배치, 점검 동선, 안전 요소를 도면화합니다."],
    ["04", "제작·검사", "용접, 표면 처리, 조립, 검사 기준에 맞춰 품질을 관리합니다."],
    ["05", "납품 지원", "설치, 시운전, 유지보수 관점의 기술 대응을 이어갑니다."]
  ],
  en: [
    ["01", "Process Review", "Material properties, capacity, temperature, pressure, and vacuum conditions are clarified first."],
    ["02", "Equipment Proposal", "Equipment type, material, heating method, and process structure are reviewed."],
    ["03", "Fabrication Design", "Fabrication drawings, nozzle layout, access routes, and safety elements are documented."],
    ["04", "Manufacturing", "Welding, finishing, assembly, and inspection are controlled to quality standards."],
    ["05", "Delivery Support", "Technical support continues through installation, commissioning, and maintenance."]
  ]
};
