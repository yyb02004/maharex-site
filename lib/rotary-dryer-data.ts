export const rotaryDryerTypes = [
  {
    name: "수평형 교반식 진공건조기",
    englishName: "Horizontal Agitated Vacuum Dryer",
    description: "수평 용기 내부의 리본 교반부와 재킷 가열을 조합합니다. 원료의 부착성, 혼합 상태와 배출 구조를 함께 검토합니다."
  },
  {
    name: "원뿔형 진공건조기",
    englishName: "Conical Dryer",
    description: "원뿔형 용기와 교반부를 조합하는 진공건조 설비입니다. 원료의 순환, 잔류물, 하부 배출과 세척 조건에 맞춰 검토합니다."
  }
] as const;

export const rotaryDryerSpecifications = [
  ["운전 방식", "배치식 · 진공 · 교반 건조"],
  ["용량·처리량", "용기 총용적과 유효 투입량을 구분하여 협의"],
  ["접액부 재질", "STS304 · STS316L · Hastelloy 등 원료에 따라 검토"],
  ["가열 방식", "재킷 간접 가열 · 사용 열원은 공정에 따라 협의"],
  ["교반·배출", "리본·교반부 형상, 구동 및 배출 구조 개별 검토"],
  ["보조설비", "응축기 · 리시버 · 진공펌프 · 열원 계통 구성 협의"],
  ["설계 조건", "온도·압력·방폭·씰·세척 조건은 프로젝트별 확정"]
] as const;
