export const modelViewers = {
  "tvd-installation": {
    directory: "tvd-2",
    fileName: "installation_viewer.html.br",
    downloadName: "TVD-2.0_full-installation.html",
    manifestFile: "installation_manifest.json"
  },
  "tvd-5000": {
    directory: "tvd-5000",
    fileName: "tvd5000_installation_viewer.html.br",
    downloadName: "TVD-5.0_full-installation.html",
    manifestFile: "tvd5000_installation_manifest.json"
  },
  "nf-1200": {
    directory: "nf-1200",
    fileName: "nutsche_viewer.html.br",
    downloadName: "NF-1200_pressure-nutsche.html",
    manifestFile: "nutsche_manifest.json"
  },
  "rs-205": {
    directory: "rs-205",
    fileName: "reactor_fullset_viewer.html.br",
    downloadName: "RS-205_full-installation.html",
    manifestFile: "reactor_fullset_manifest.json"
  },
  "rvd-1500": {
    directory: "rvd-1500",
    fileName: "rvd1500_viewer.html.br",
    downloadName: "RVD-1500_full-installation.html",
    manifestFile: "rvd1500_manifest.json"
  },
  "rvd-501": {
    directory: "rvd-501",
    fileName: "rvd501_viewer.html.br",
    downloadName: "RVD-501_full-installation.html",
    manifestFile: "rvd501_manifest.json"
  },
  "ejm12": {
    directory: "ejm12",
    fileName: "jetmill_viewer.html.br",
    downloadName: "EJM12_full-installation.html",
    manifestFile: "jetmill_manifest.json"
  },
  "pm12": {
    directory: "pm12",
    fileName: "pinmill_viewer.html.br",
    downloadName: "PM12_standard.html",
    manifestFile: "pinmill_manifest.json"
  },
  "pm12-low-hopper": {
    directory: "pm12-low-hopper",
    fileName: "pinmill_viewer.html.br",
    downloadName: "PM12_low-hopper.html",
    manifestFile: "pinmill_manifest.json"
  }
} as const;

export type ModelViewerKey = keyof typeof modelViewers;

export const modelSets: Array<{
  key: ModelViewerKey;
  title: string;
  revision: string;
  name: string;
  description: string;
  partCount: string;
  components: string[];
}> = [
  {
    key: "rs-205",
    title: "RS-205 반응기",
    revision: "REV.06 · 하부 축 지지대 · 공정 시연",
    name: "전체설비",
    description: "반응기, 컨덴서, 리시버, 분리기와 연결 배관을 함께 확인합니다.",
    partCount: "1,515개 부품",
    components: ["반응기·교반기", "컨덴서", "리시버", "분리기", "스테이지", "연결 배관"]
  },
  {
    key: "tvd-installation",
    title: "TVD-2.0 트레이 진공 건조기",
    revision: "REV.11 건조기 · REV.07 전체설비 · 시연 개선 2",
    name: "전체설비",
    description: "건조기, 컨덴서, 리시버, 온수탱크, 진공펌프와 연결 배관을 함께 확인합니다.",
    partCount: "3,476개 부품",
    components: ["건조기", "컨덴서", "리시버", "온수탱크", "진공펌프", "연결 배관"]
  },
  {
    key: "tvd-5000",
    title: "TVD-5.0 트레이 진공 건조기",
    revision: "REV.04 · 양개 도어 · 셸 고정 패킹 · 공통 환수 헤더",
    name: "전체설비",
    description: "5 m³급 건조기, 컨덴서, 리시버, 온수탱크, 진공펌프와 연결 배관을 함께 확인합니다.",
    partCount: "3,433개 부품",
    components: ["건조기·양개 도어", "열판·트레이", "컨덴서", "리시버", "온수탱크·펌프", "진공펌프", "연결 배관"]
  },
  {
    key: "rvd-1500",
    title: "RVD-1500 로타리 드라이어",
    revision: "REV.04 · 이중 리본 · 도어 호스 연결부 개선",
    name: "전체설비",
    description: "건조기, 리본 교반부, 응축기, 리시버, 온수탱크와 연결 배관을 함께 확인합니다.",
    partCount: "838개 부품",
    components: ["건조기·이중 리본", "응축기", "리시버", "온수탱크·펌프", "도어 호스", "연결 배관"]
  },
  {
    key: "rvd-501",
    title: "RVD-501 로타리 드라이어",
    revision: "REV.03.2 · 사이트글라스 · 개방 전 배관 분리",
    name: "전체설비",
    description: "건조기, 리본 교반부, 보조 백필터, 응축기, 응축액 수조와 이송 펌프를 함께 확인합니다.",
    partCount: "1,780개 부품",
    components: ["건조기·리본 교반부", "보조 백필터", "응축기", "응축액 수조", "이송 펌프", "공정 배관"]
  },
  {
    key: "nf-1200",
    title: "NF-1200 가압누체 여과기",
    revision: "REV.04 · Ø1200 mm · 0.6 m³",
    name: "전체설비",
    description: "상·하경판, SHELL, 타공판, 유압 승강부와 대차를 함께 확인합니다.",
    partCount: "444개 부품",
    components: ["상·하경판", "SHELL", "타공판·지지대", "유압 승강부", "대차", "WISE 연성계"]
  },
  {
    key: "pm12",
    title: "PM12 핀밀 · 기본형",
    revision: "REV.02 · 높은 호퍼 · 수평 스크루",
    name: "전체설비",
    description: "높은 호퍼와 수평 피더, 핀 분쇄부, 배출 호퍼와 수취 드럼을 함께 확인합니다.",
    partCount: "722개 부품",
    components: ["투입 호퍼", "수평 스크루", "핀 분쇄부", "배출 호퍼", "수취 드럼·돌리", "제어반"]
  },
  {
    key: "pm12-low-hopper",
    title: "PM12 핀밀 · 낮은 호퍼형",
    revision: "REV.05 · 경사 스크루 · 정비 커버·힌지 드레인",
    name: "전체설비",
    description: "낮은 호퍼와 경사 피더, 핀 분쇄부, 탈착 커버, 힌지 드레인과 수취 드럼을 함께 확인합니다.",
    partCount: "903개 부품",
    components: ["낮은 호퍼", "35° 경사 스크루", "핀 분쇄부", "탈착 모터 커버", "힌지 드레인", "수취 드럼·돌리"]
  },
  {
    key: "ejm12",
    title: "EJM12 제트밀",
    revision: "REV.03 · FD12 공급기 · 공정 시연",
    name: "전체설비",
    description: "공급기, 분쇄실, 사이클론, 집진기와 회수통을 함께 확인합니다.",
    partCount: "977개 부품",
    components: ["FD12 공급기·호퍼", "분쇄실", "사이클론", "집진기", "회수통", "공정 배관"]
  }
];
