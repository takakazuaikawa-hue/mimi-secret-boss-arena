export interface CharacterVisualIdentity {
  portrait: string;
  standing: string;
  battle: string;
  encounter?: string;
  battleCutIn?: string;
  battleCutInPosition?: string;
  alt: string;
  focusX: number;
  battleSize: "small" | "standard" | "large" | "giant";
}

export const characterVisuals: Record<string, CharacterVisualIdentity> = {
  gidonozeaas: {
    portrait: "/assets/story/gidono-sealed-neutral.png",
    standing: "/assets/battle/fighters/gidonozeaas-v1.png",
    battle: "/assets/battle/fighters/gidonozeaas-v1.png",
    battleCutIn: "/assets/battle/cutins/gidonozeaas-starburst-v1.webp",
    battleCutInPosition: "center center",
    alt: "黒い星を抱いた封印形態のギドノゼアース",
    focusX: 50,
    battleSize: "large",
  },
  minato: {
    portrait: "/assets/story/encounters/minato.png",
    standing: "/assets/battle/fighters/minato-v1.png",
    battle: "/assets/battle/fighters/minato-v1.png",
    battleCutIn: "/assets/battle/cutins/minato-last-v1.webp",
    battleCutInPosition: "center center",
    alt: "無数の神器を返却するミナト",
    focusX: 78,
    battleSize: "standard",
  },
  amara: {
    portrait: "/assets/story/encounters/amara.png",
    standing: "/assets/battle/fighters/amara-v1.png",
    battle: "/assets/battle/fighters/amara-v1.png",
    battleCutIn: "/assets/battle/cutins/amara-verdict-v1.webp",
    battleCutInPosition: "center center",
    alt: "天秤の裁定者アマラ",
    focusX: 77,
    battleSize: "standard",
  },
  shahar: {
    portrait: "/assets/story/sprites/shahar-trueform.png",
    standing: "/assets/battle/fighters/shahar-v1.png",
    battle: "/assets/battle/fighters/shahar-v1.png",
    battleCutIn: "/assets/battle/cutins/shahar-sky-v1.webp",
    battleCutInPosition: "center center",
    encounter: "/assets/story/encounters/shahar.png",
    alt: "一枚の鱗を端末に雲上から語る古竜シャハル",
    focusX: 50,
    battleSize: "giant",
  },
  teirei: {
    portrait: "/assets/story/encounters/teirei.png",
    standing: "/assets/battle/fighters/teirei-v1.png",
    battle: "/assets/battle/fighters/teirei-v1.png",
    battleCutIn: "/assets/battle/cutins/teirei-blank-v1.webp",
    battleCutInPosition: "center center",
    alt: "都市防衛兵器の丁零",
    focusX: 79,
    battleSize: "standard",
  },
  "night-eater": {
    portrait: "/assets/story/encounters/night-eater.png",
    standing: "/assets/battle/fighters/night-eater-v1.png",
    battle: "/assets/battle/fighters/night-eater-v1.png",
    battleCutIn: "/assets/battle/cutins/night-eater-full-v1.webp",
    battleCutInPosition: "center center",
    alt: "夜の輪郭をまとう夜を食べるもの",
    focusX: 83,
    battleSize: "large",
  },
  peony: {
    portrait: "/assets/story/encounters/peony.png",
    standing: "/assets/battle/fighters/peony-v1.png",
    battle: "/assets/battle/fighters/peony-v1.png",
    battleCutIn: "/assets/battle/cutins/peony-full-v1.webp",
    battleCutInPosition: "center center",
    alt: "巨人の守護者ピオニー",
    focusX: 51,
    battleSize: "large",
  },
  "cassim-bell": {
    portrait: "/assets/story/encounters/cassim-bell.png",
    standing: "/assets/battle/fighters/cassim-bell-v1.png",
    battle: "/assets/battle/fighters/cassim-bell-v1.png",
    battleCutIn: "/assets/battle/cutins/cassim-bell-vault-v1.webp",
    battleCutInPosition: "center center",
    alt: "失くした世界の番人カシム・ベル",
    focusX: 78,
    battleSize: "standard",
  },
  sazanami: {
    portrait: "/assets/story/sprites/sazanami-trueform.png",
    standing: "/assets/battle/fighters/sazanami-v1.png",
    battle: "/assets/battle/fighters/sazanami-v1.png",
    battleCutIn: "/assets/battle/cutins/sazanami-turn-v1.webp",
    battleCutInPosition: "center center",
    encounter: "/assets/story/encounters/sazanami.png",
    alt: "水槽へ巨大な瞳と影だけを映すさざなみ",
    focusX: 50,
    battleSize: "giant",
  },
  marian: {
    portrait: "/assets/story/encounters/marian.png",
    standing: "/assets/battle/fighters/marian-v1.png",
    battle: "/assets/battle/fighters/marian-v1.png",
    battleCutIn: "/assets/battle/cutins/marian-dawn-v1.webp",
    battleCutInPosition: "center center",
    alt: "終わりまで治す聖女マリアン",
    focusX: 80,
    battleSize: "standard",
  },
  ushiro: {
    portrait: "/assets/story/encounters/ushiro.png",
    standing: "/assets/battle/fighters/ushiro-v1.png",
    battle: "/assets/battle/fighters/ushiro-v1.png",
    battleCutIn: "/assets/battle/cutins/ushiro-lastrow-v1.webp",
    battleCutInPosition: "center center",
    alt: "人々の背後に立つうしろ",
    focusX: 55,
    battleSize: "standard",
  },
  "wolf-nine": {
    portrait: "/assets/story/encounters/wolf-nine.png",
    standing: "/assets/battle/fighters/wolf-nine-v1.png",
    battle: "/assets/battle/fighters/wolf-nine-v1.png",
    battleCutIn: "/assets/battle/cutins/wolf-nine-ninth-v1.webp",
    battleCutInPosition: "center center",
    alt: "九度目の決闘者ヴォルフ・ナイン",
    focusX: 79,
    battleSize: "large",
  },
  "room-seventeen": {
    portrait: "/assets/story/encounters/room-seventeen.png",
    standing: "/assets/battle/fighters/room-seventeen-v1.png",
    battle: "/assets/battle/fighters/room-seventeen-v1.png",
    battleCutIn: "/assets/battle/cutins/room-seventeen-floor-v1.webp",
    battleCutInPosition: "center center",
    alt: "扉の姿をした十七号室",
    focusX: 18,
    battleSize: "large",
  },
  rinne: {
    portrait: "/assets/story/encounters/rinne.png",
    standing: "/assets/battle/fighters/rinne-v1.png",
    battle: "/assets/battle/fighters/rinne-v1.png",
    battleCutIn: "/assets/battle/cutins/rinne-allin-v1.webp",
    battleCutInPosition: "center center",
    alt: "未来を賭ける勝負師リンネ",
    focusX: 77,
    battleSize: "standard",
  },
  mumyo: {
    portrait: "/assets/story/sprites/mumyo-trueform.png",
    standing: "/assets/battle/fighters/mumyo-v1.png",
    battle: "/assets/battle/fighters/mumyo-v1.png",
    battleCutIn: "/assets/battle/cutins/mumyo-none-v1.webp",
    battleCutInPosition: "center center",
    encounter: "/assets/story/encounters/mumyo.png",
    alt: "鏡の中だけに人影を映す一振りの無銘",
    focusX: 50,
    battleSize: "giant",
  },
};

export const encounterCgs: Record<string, string> = Object.fromEntries(
  Object.entries(characterVisuals)
    .filter(([id]) => id !== "gidonozeaas")
    .map(([id, visual]) => [id, visual.encounter ?? visual.portrait]),
);
