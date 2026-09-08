export const modelViewers = {
  "tvd-installation": {
    fileName: "installation_viewer.html.br",
    downloadName: "TVD-2.0_full-installation.html"
  },
  "tvd-dryer": {
    fileName: "dryer_viewer.html.br",
    downloadName: "TVD-2.0_dryer.html"
  },
  "tvd-condenser": {
    fileName: "condenser_viewer.html.br",
    downloadName: "TVD-2.0_condenser.html"
  },
  "tvd-receiver": {
    fileName: "receiver_viewer.html.br",
    downloadName: "TVD-2.0_receiver.html"
  },
  "tvd-hotwater": {
    fileName: "hotwater_viewer.html.br",
    downloadName: "TVD-2.0_hot-water-tank.html"
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
    partCount: "1,421개 부품",
    primary: true
  },
  {
    key: "tvd-dryer",
    name: "트레이 진공 건조기",
    description: "TVD-2.0 건조기 본체와 내부 구조를 확인합니다.",
    partCount: "923개 부품"
  },
  {
    key: "tvd-condenser",
    name: "컨덴서",
    description: "응축기 단독 모델을 확인합니다.",
    partCount: "164개 부품"
  },
  {
    key: "tvd-receiver",
    name: "리시버",
    description: "응축액 리시버 단독 모델을 확인합니다.",
    partCount: "51개 부품"
  },
  {
    key: "tvd-hotwater",
    name: "온수탱크",
    description: "온수 순환 탱크 단독 모델을 확인합니다.",
    partCount: "72개 부품"
  }
];

export const plannedModelSets = ["반응기", "여과기", "분쇄기", "로터리 드라이어"] as const;
