export const modelViewers = {
  "tvd-installation": {
    directory: "tvd-2",
    fileName: "installation_viewer.html.br",
    downloadName: "TVD-2.0_full-installation.html",
    manifestFile: "installation_manifest.json"
  },
  "nf-1200": {
    directory: "nf-1200",
    fileName: "nutsche_viewer.html.br",
    downloadName: "NF-1200_pressure-nutsche.html",
    manifestFile: "nutsche_manifest.json"
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
    key: "tvd-installation",
    title: "TVD-2.0 트레이 진공 건조기",
    revision: "REV.11 건조기 · REV.07 전체설비 · 시연 개선 2",
    name: "전체설비",
    description: "건조기, 컨덴서, 리시버, 온수탱크, 진공펌프와 연결 배관을 함께 확인합니다.",
    partCount: "3,476개 부품",
    components: ["건조기", "컨덴서", "리시버", "온수탱크", "진공펌프", "연결 배관"]
  },
  {
    key: "nf-1200",
    title: "NF-1200 가압누체",
    revision: "REV.04 · Ø1200 mm · 0.6 m³",
    name: "전체설비",
    description: "상·하경판, SHELL, 타공판, 유압 승강부와 대차를 함께 확인합니다.",
    partCount: "444개 부품",
    components: ["상·하경판", "SHELL", "타공판·지지대", "유압 승강부", "대차", "WISE 연성계"]
  }
];

export const plannedModelSets = ["반응기", "분쇄기", "로터리 드라이어"] as const;
