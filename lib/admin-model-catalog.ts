export const modelViewers = {
  "tvd-installation": {
    fileName: "installation_viewer.html.br",
    downloadName: "TVD-2.0_full-installation.html",
    manifestFile: "installation_manifest.json"
  }
} as const;

export type ModelViewerKey = keyof typeof modelViewers;

export const tvdModels: Array<{
  key: ModelViewerKey;
  name: string;
  description: string;
  partCount: string;
  primary?: boolean;
}> = [
  {
    key: "tvd-installation",
    name: "전체설비",
    description: "건조기, 컨덴서, 리시버, 온수탱크와 연결 배관을 함께 확인합니다.",
    partCount: "3,135개 부품",
    primary: true
  }
];

export const plannedModelSets = ["반응기", "여과기", "분쇄기", "로터리 드라이어"] as const;
