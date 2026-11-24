export const dryerSelectionGuide = [
  {
    name: "트레이 진공 건조기",
    englishName: "Tray Vacuum Dryer",
    description: "열에 민감한 분말·과립을 트레이에 얇게 펼쳐, 젓지 않고 저온에서 건조할 때."
  },
  {
    name: "수평형 로터리 드라이어",
    englishName: "Horizontal Agitated Vacuum Dryer",
    description: "여과 후 수분이 남은 케이크나 분말을 리본 교반기로 섞으면서 건조할 때."
  },
  {
    name: "코니컬 드라이어",
    englishName: "Conical Dryer",
    description: "원뿔형 용기 안에서 원료를 순환시키고 하부로 배출하는 구조가 필요할 때. 배출 후 잔류량과 세척 조건을 함께 검토합니다."
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
