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
    ["Quality", "/en/engineering"],
    ["Contact / RFQ", "/en/contact"]
  ]
} as const;

export const aboutMenu = [
  ["CEO 인사말", "ceo"],
  ["소개", "company"],
  ["카탈로그", "catalog"],
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

export const productImages = {
  factoryExterior: "/회사 전경 - 05.JPG",
  factoryCard: "/factory-exterior.jpg",
  reactor: "/equipment/reactor-new.jpg",
  trayDryer: "/Tray Vacuum Dryer-close.jpg",
  trayDryerOpen: "/Tray Vacuum Dryer-open.jpg",
  rotaryDryer: "/equipment/rotary-dryer-new.jpg",
  filter: "/Nutsche Filter.jpg",
  pinMill: "/Pin Mill.jpg",
  jetMill: "/Jet Mill.jpg",
  mills: "/Pin Mill.jpg"
} as const;

export const aboutSections = {
  company: {
    title: "회사소개",
    summary: "최고의 기술력과 노하우로 신뢰받는 기업이 되겠습니다.",
    body:
      "1995년 창립한 마하렉스는 화학, 제약, 식품, 화장품, 2차전지 소재 등 다양한 산업의 생산설비를 제작하는 산업장비 전문 제조사입니다. 반응, 건조, 여과, 분쇄 공정을 이해하고 고객의 원료 특성과 운전 조건에 맞춘 설계와 제작을 제공합니다."
  },
  ceo: {
    title: "CEO 인사말",
    summary: "기술력 있는 신뢰의 기업, 마하렉스와 함께 하십시오.",
    body:
      "마하렉스는 1995년 창사 이래 외적·질적으로 성장하며 업계에서 기술력 있는 기업으로 평가받아 왔습니다. 특히 의약품 원료와 정밀화학 설비 분야에서 GMP 개념에 입각한 설비 공급 경험을 축적해 왔으며, 현장 생산자의 시각에서 안정적인 운전과 유지보수가 가능한 장비를 만들기 위해 노력하고 있습니다."
  },
  organization: {
    title: "조직도",
    summary: "설계, 제작, 품질, 납품 지원이 유기적으로 이어지는 제조 조직입니다.",
    body:
      "마하렉스는 프로젝트 상담부터 설계 검토, 제작, 조립, 검사, 출하까지 각 단계가 긴밀하게 연결되는 실무 중심 체계를 갖추고 있습니다."
  },
  history: {
    title: "연혁",
    summary: "반응, 건조, 여과, 분쇄 설비 경험을 바탕으로 성장해왔습니다.",
    body:
      "정밀화학, 2차전지 소재, 제약·바이오, 환경 분야의 다양한 공정 설비 프로젝트를 수행하며 제조 역량을 축적하고 있습니다."
  },
  customers: {
    title: "주요고객사",
    summary: "정밀화학, 2차전지, 제약·바이오, 환경 분야의 고객사를 지원합니다.",
    body:
      "고객사명 공개가 제한되는 산업 특성을 고려하여 주요 거래 분야와 반복 납품 경험을 중심으로 신뢰를 보여드립니다."
  },
  location: {
    title: "오시는길",
    summary: "방문 상담과 제작 검토를 위한 사전 연락을 부탁드립니다.",
    body: "경기도 안성시 양성면 한내로 534에 위치하고 있습니다."
  },
  certifications: {
    title: "인증 및 특허",
    summary: "품질, 환경, 안전보건 인증을 기반으로 안정적인 제작 체계를 운영합니다.",
    body: "마하렉스의 인증 자료를 페이지 내 슬라이드 방식으로 확인하실 수 있습니다."
  },
  catalog: {
    title: "카탈로그",
    summary: "마하렉스의 주요 설비와 납품 경험을 정리한 회사 카탈로그입니다.",
    body: "제품 검토와 RFQ 준비에 참고하실 수 있도록 카탈로그 PDF를 제공합니다."
  }
} as const;

export const copy = {
  ko: {
    heroTitle: "반응·건조·여과 공정을 위한 정밀 산업 장비",
    heroText:
      "Maharex는 반응기, 트레이 진공 건조기, 로터리 드라이어, 필터, 분쇄기를 공정 조건에 맞춰 설계·제작하는 한국 제조사입니다.",
    viewProducts: "제품 보기",
    rfq: "문의/RFQ",
    productsTitle: "주요 제품",
    referencesTitle: "납품실적",
    engineeringTitle: "품질관리",
    contactTitle: "문의/RFQ"
  },
  en: {
    heroTitle: "Process Equipment for Reaction, Drying and Filtration",
    heroText:
      "Maharex designs and manufactures reactors, tray vacuum dryers, rotary dryers, filters and milling systems for industrial process conditions.",
    viewProducts: "View Products",
    rfq: "RFQ",
    productsTitle: "Main Products",
    referencesTitle: "References",
    engineeringTitle: "Quality Management",
    contactTitle: "Contact / RFQ"
  }
} as const;

export const products = [
  {
    slug: "reactors",
    image: productImages.reactor,
    gallery: [productImages.reactor],
    ko: {
      category: "Reactor",
      name: "반응기",
      summary: "혼합, 냉각·가열, 진공 시스템을 통합해 재료의 화학 반응을 안정적으로 수행하는 설비.",
      details:
        "반응기는 다양한 산업에서 재료의 화학 반응을 일으키기 위해 설계된 장치로, 혼합, 냉각과 가열, 진공 시스템이 공정 목적에 맞게 조합됩니다. 마하렉스의 반응기는 파일럿 스케일부터 생산용 스케일까지 적용 가능하며 재료, 온도, 압력, 점도, 혼합 상태, 세척 방식, 유지보수 동선을 함께 검토해 안정적인 반응 결과와 현장 운전성을 제공합니다. STS304, STS316L은 물론 Hastelloy 계열 재질 제작도 가능합니다.",
      specs: [
        "Jacket을 통한 반응 온도 조절 가능",
        "Mechanical Seal 및 Lip Seal 적용 가능",
        "Paddle, Turbine, Anchor Type 등 공정별 임펠러 적용",
        "내용물에 따른 R.P.M 조절 가능",
        "CIP 적용으로 간편한 세척 가능"
      ],
      applications: ["2차전지", "전자소재", "제약분야", "식품분야", "화학분야"],
      engineering: [
        "전극공정 양극재·음극재 원료 분산",
        "원료 및 제품 저장, 용해, 합성",
        "원료 저장 및 유기합성",
        "식품 원료 저장과 혼합 공정",
        "정밀화학 원료의 용해, 분산, 합성"
      ]
    },
    en: {
      category: "Reactor",
      name: "Reactor",
      summary: "Custom reactor systems with agitation, heating, cooling and vacuum options.",
      details: "Custom reactor systems for pilot and production scale process requirements.",
      specs: ["Jacket heating and cooling", "Mechanical seal and lip seal", "Custom impeller types", "Variable RPM", "CIP option"],
      applications: ["Battery", "Electronic materials", "Pharmaceutical", "Food", "Chemical"],
      engineering: ["Dispersion", "Storage", "Synthesis", "Mixing", "Reaction"]
    }
  },
  {
    slug: "tray-vacuum-dryers",
    image: productImages.trayDryer,
    gallery: [productImages.trayDryer, productImages.trayDryerOpen],
    ko: {
      category: "Tray Vacuum Dryer",
      name: "트레이 진공 건조기",
      summary: "저온 진공 건조가 필요한 분말, 과립, 고부가 소재용 건조 설비.",
      details:
        "Tray 안에 제품을 얇게 펼쳐 넣은 후 내부는 진공을 유지하고 외부 자켓 및 열판에는 온수 또는 증기를 순환시켜 제품을 건조시키는 장치입니다. 압력을 낮춰 끓는점을 감소시킴으로써 상대적으로 낮은 온도에서 용매나 수분을 증발시켜 열에 민감한 물질을 손상 없이 건조할 수 있습니다. STS304, STS316L, Hastelloy 제작 검토가 가능합니다.",
      specs: ["저온 건조물의 품질 저하 최소화", "온수·증기 열원으로 제어가 간단", "손실이 적고 건조 효율이 양호"],
      applications: ["식품분야", "제약분야", "기타분야", "화장품 분야", "화학 산업"],
      engineering: [
        "과일·야채 분말, 건강식품 원료, 정제, 과립, 분말 건조",
        "항생제, 비타민, 고분자 약물, 식물 추출물 및 앰플·유리병 건조",
        "전자부품 건조 등",
        "천연 성분과 기능성 원료 건조",
        "정밀화학, 고분자 중간체, 촉매 건조"
      ]
    },
    en: {
      category: "Tray Vacuum Dryer",
      name: "Tray Vacuum Dryer",
      summary: "Low-temperature vacuum drying equipment.",
      details: "Tray vacuum dryers for powders, granules and heat-sensitive materials.",
      specs: ["Low-temperature drying", "Simple heat source control", "Efficient drying"],
      applications: ["Food", "Pharmaceutical", "Electronics", "Cosmetics", "Chemical"],
      engineering: ["Powder drying", "Extract drying", "Component drying", "Functional raw materials", "Catalysts"]
    }
  },
  {
    slug: "rotary-dryers",
    image: productImages.rotaryDryer,
    gallery: [productImages.rotaryDryer],
    ko: {
      category: "Rotary Dryer",
      name: "로터리 드라이어",
      summary: "연속 대량 건조와 냉각 공정에 적합한 견고한 회전식 건조기.",
      details:
        "로터리 건조기는 수평 회전식 건조기로 구조가 간단하고 기계적 트러블 발생이 적어 다양한 제품 건조에 적합합니다. 고속 기류에 의한 열풍 건조뿐 아니라 간접열 건조까지 가능해 슬러지 형태의 제품을 건조하여 분말화하는 공정에 효과적입니다. 점성이 높아지거나 고형화 현상 등 변화가 많은 제품 건조에도 안정적으로 사용할 수 있으며, STS304, STS316L, Hastelloy 재질 검토가 가능합니다.",
      specs: [
        "열풍 건조에 의한 전열면적 최대화",
        "부착성이 있는 원료의 건조 가능",
        "패들에 의한 파쇄 효과",
        "내부 고정판을 통한 충분한 체류시간 확보",
        "열풍 공급 및 회전 속도 조절로 건조량 제어"
      ],
      applications: ["광물 원료", "농업 재료", "재활용 공정", "광석 원료", "카본 블랙"],
      engineering: [
        "석회석, 점토, 규석, 석고, 경석 등의 원료 건조",
        "배토, 비료 등 농업용 재료 건조",
        "폐기물, 하수 슬러지, 소각재 등의 재활용",
        "크롬, 망간, 니켈 등의 광석 원료 건조",
        "카본 블랙 등의 원료 건조"
      ]
    },
    en: {
      category: "Rotary Dryer",
      name: "Rotary Dryer",
      summary: "Robust rotary drying equipment for continuous bulk drying.",
      details: "Rotary dryer systems for industrial drying and cooling processes.",
      specs: ["High heat transfer area", "Adhesive raw materials", "Crushing effect", "Residence time control", "Airflow and speed control"],
      applications: ["Minerals", "Agriculture", "Recycling", "Ore", "Carbon black"],
      engineering: ["Raw material drying", "Fertilizer drying", "Sludge reuse", "Ore drying", "Carbon black drying"]
    }
  },
  {
    slug: "filters",
    image: productImages.filter,
    gallery: [productImages.filter],
    ko: {
      category: "Filter",
      name: "필터",
      summary: "슬러리 분리, 고액 분리, 회수 공정에 맞춘 산업용 여과 장치.",
      details:
        "Nutsche Filter는 슬러리 상태의 원료를 여과, 세척, 탈액하는 공정에 적용되는 장비입니다. 압력 또는 진공 조건, 원료의 점도와 입도, 세척 방식, 배출 구조를 고려해 제작하며 STS304, STS316L, Hastelloy, Teflon Coating, ETFE 등 공정 조건에 맞는 재질과 표면 사양을 검토할 수 있습니다.",
      specs: ["압력·진공 조건 대응", "세척 및 탈액 공정 적용", "재질 및 코팅 사양 협의", "현장 배관 조건 맞춤 제작", "유지보수 동선 고려"],
      applications: ["정밀화학", "2차전지 소재", "제약·바이오", "환경·폐수", "식품·화장품"],
      engineering: ["결정 분리", "촉매 회수", "용매 회수", "세척 공정", "고액 분리"]
    },
    en: {
      category: "Filter",
      name: "Nutsche Filter",
      summary: "Pressure and vacuum filtration equipment.",
      details: "Custom filtration equipment for slurry and solid-liquid separation.",
      specs: ["Pressure and vacuum", "Washing and deliquoring", "Material options", "Piping integration", "Maintenance access"],
      applications: ["Fine chemical", "Battery materials", "Pharma", "Environment", "Food and cosmetics"],
      engineering: ["Crystal separation", "Catalyst recovery", "Solvent recovery", "Washing", "Solid-liquid separation"]
    }
  },
  {
    slug: "mills",
    image: productImages.mills,
    gallery: [productImages.pinMill, productImages.jetMill],
    ko: {
      category: "Mill",
      name: "분쇄기",
      summary: "원료의 입도 조절과 분산 공정에 적용하는 Pin Mill, Jet Mill, Fitz Mill 기반 분쇄 설비.",
      details:
        "분쇄기는 원료의 입도 조절, 균일화, 분산, 후공정 투입성을 높이기 위한 장비입니다. 마하렉스는 Pin Mill, Jet Mill, Fitz Mill을 원료 특성, 목표 입도, 처리량, 집진·이송 조건에 맞춰 검토합니다. 제약, 화학, 식품, 2차전지 소재 등 분진 관리와 세척성이 중요한 공정에 맞춰 STS304, STS316L, Hastelloy 등 재질 사양도 협의할 수 있습니다.",
      specs: [
        "Pin Mill: 회전 핀 충격을 이용한 미세 분쇄",
        "Jet Mill: 압축공기 기류를 이용한 초미세 분쇄",
        "Fitz Mill: 스크린과 임펠러를 통한 균일 입도 조절",
        "집진, 이송, 배출 조건에 맞춘 구성",
        "원료 특성에 따른 재질과 세척 구조 검토"
      ],
      applications: ["제약 원료", "정밀화학", "식품 원료", "전자소재", "2차전지 소재"],
      engineering: ["입도 조절", "분산 전처리", "건조 후 분쇄", "분말 이송", "집진 연계"]
    },
    en: {
      category: "Mill",
      name: "Milling System",
      summary: "Pin Mill, Jet Mill and Fitz Mill systems.",
      details: "Milling systems for particle size control and powder processing.",
      specs: ["Pin Mill", "Jet Mill", "Fitz Mill", "Dust collection", "Material options"],
      applications: ["Pharma", "Fine chemical", "Food", "Electronic materials", "Battery materials"],
      engineering: ["Particle sizing", "Dispersion", "Post-drying milling", "Powder conveying", "Dust collection"]
    }
  }
] as const;

export const references = {
  ko: [
    "천보·천보신소재·천보BLS 반응·건조 설비",
    "파마코스텍 Jet Mill 및 Tray Vacuum Dryer",
    "YCI Advanced(YCI 어드밴스드) Nutsche Filter",
    "CMDL Nutsche Filter",
    "인디켐 Tray Vacuum Dryer 외 제작 설치"
  ],
  en: ["Chunbo group process equipment", "Pharmacos Jet Mill and Tray Vacuum Dryer", "YCI Advanced(YCI Advanced) Nutsche Filter", "CMDL Nutsche Filter"]
} as const;

export const engineering = {
  ko: [
    ["01", "요구 조건 확인", "원료 특성, 처리량, 온도·압력, 세척 조건을 확인합니다."],
    ["02", "설계 검토", "공정 조건에 맞는 구조, 재질, 구동부, 배관 조건을 검토합니다."],
    ["03", "제작 관리", "용접, 조립, 표면 처리, 검사 기록을 관리합니다."],
    ["04", "검사 및 출하", "운전 조건과 고객 요구사항에 맞춰 최종 점검 후 출하합니다."]
  ],
  en: [
    ["01", "Requirement Review", "Review raw material, capacity and process conditions."],
    ["02", "Engineering", "Check structure, materials, drive units and piping."],
    ["03", "Fabrication", "Manage welding, assembly and inspection records."],
    ["04", "Shipment", "Final inspection before delivery."]
  ]
} as const;

export const industries = {
  ko: ["정밀화학", "2차전지 소재", "제약·바이오", "환경·폐수", "식품·화장품", "석유화학"],
  en: ["Fine Chemical", "Battery Materials", "Pharma & Bio", "Environment", "Food & Cosmetics", "Petrochemical"]
} as const;

export const processSteps = {
  ko: [
    ["01", "상담", "제품 특성과 공정 조건을 확인합니다."],
    ["02", "설계", "재질, 용량, 구동부, 배관 조건을 검토합니다."],
    ["03", "제작", "용접·조립·표면 마감 품질을 관리합니다."],
    ["04", "검사", "압력, 진공, 구동, 외관 상태를 확인합니다."],
    ["05", "납품", "현장 조건에 맞춰 설치와 후속 대응을 지원합니다."]
  ],
  en: [
    ["01", "Consulting", "Review product and process conditions."],
    ["02", "Design", "Review material, capacity, drive and piping."],
    ["03", "Fabrication", "Manage welding, assembly and finish quality."],
    ["04", "Inspection", "Check pressure, vacuum, drive and appearance."],
    ["05", "Delivery", "Support installation and follow-up."]
  ]
} as const;
