export interface OpponentVisualIdentity {
  battle: string;
  alt: string;
  focusX: number;
  battleSize: "small" | "standard" | "large" | "giant";
  /** Direction the source battle art faces before any in-game mirroring. */
  battleFacing: "left" | "right";
}

export const opponentVisuals: Record<string, OpponentVisualIdentity> = {
  "rookie-piyo-slime": {
    battle: "/assets/battle/opponents/rookie-piyo-slime-v1.png",
    alt: "木の盾を構えたピヨゼリー",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "left",
  },
  "rookie-kobold": {
    battle: "/assets/battle/opponents/rookie-kobold-v1.png",
    alt: "木剣を持つコボルトの見習い",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "right",
  },
  "rookie-bat-mage": {
    battle: "/assets/battle/opponents/rookie-bat-mage-v1.png",
    alt: "魔導書を開いたコウモリ魔術師",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "left",
  },
};

const fallbackOpponentVisuals: Record<
  "guard" | "striker" | "mystic",
  OpponentVisualIdentity
> = {
  guard: {
    battle: "/assets/battle/opponents/rookie-piyo-slime-v1.png",
    alt: "専用敵チームの守備役",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "left",
  },
  striker: {
    battle: "/assets/battle/opponents/rookie-kobold-v1.png",
    alt: "専用敵チームの攻撃役",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "right",
  },
  mystic: {
    battle: "/assets/battle/opponents/rookie-bat-mage-v1.png",
    alt: "専用敵チームの術者",
    focusX: 50,
    battleSize: "standard",
    battleFacing: "left",
  },
};

const dedicatedVisualRoles: Record<string, keyof typeof fallbackOpponentVisuals> = {
  "bronze-mikage": "guard", "bronze-karin": "striker", "bronze-soroban": "mystic",
  "postal-weiss": "striker", "postal-rakka": "guard", "postal-tod": "mystic",
  "kitchen-poele": "guard", "kitchen-souffle": "mystic", "kitchen-consomme": "striker",
  "owner-regalia": "mystic", "owner-ordo": "striker", "owner-seal": "guard",
  "star-alpha": "striker", "star-beta": "guard", "star-gamma": "mystic",
  "finale-virgo": "guard", "finale-belze": "striker", "finale-nox": "mystic",
  "legend-hundred-arm": "striker", "legend-mirror-saint": "mystic", "legend-unfallen": "guard",
  "first-troupe-lead": "mystic", "first-troupe-blade": "striker", "first-troupe-chorus": "guard",
  "audit-north-pen": "mystic", "audit-north-file": "guard", "audit-north-clock": "striker",
  "audit-west-smile": "guard", "audit-west-arrow": "striker", "audit-west-note": "mystic",
  "audit-center-chief": "guard", "audit-center-form": "mystic", "audit-center-stamp": "striker",
  "audit-south-slide": "mystic", "audit-south-cake": "guard", "audit-south-pointer": "striker",
  "audit-optimal-zero": "striker", "audit-optimal-one": "guard", "audit-optimal-two": "mystic",
};

Object.entries(dedicatedVisualRoles).forEach(([id, role]) => {
  opponentVisuals[id] = fallbackOpponentVisuals[role];
});
