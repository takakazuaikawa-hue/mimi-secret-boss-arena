export interface OpponentVisualIdentity {
  battle: string;
  alt: string;
  focusX: number;
  battleSize: "small" | "standard" | "large" | "giant";
}

export const opponentVisuals: Record<string, OpponentVisualIdentity> = {
  "rookie-piyo-slime": {
    battle: "/assets/battle/opponents/rookie-piyo-slime-v1.png",
    alt: "木の盾を構えたピヨゼリー",
    focusX: 50,
    battleSize: "standard",
  },
  "rookie-kobold": {
    battle: "/assets/battle/opponents/rookie-kobold-v1.png",
    alt: "木剣を持つコボルトの見習い",
    focusX: 50,
    battleSize: "standard",
  },
  "rookie-bat-mage": {
    battle: "/assets/battle/opponents/rookie-bat-mage-v1.png",
    alt: "魔導書を開いたコウモリ魔術師",
    focusX: 50,
    battleSize: "standard",
  },
};
