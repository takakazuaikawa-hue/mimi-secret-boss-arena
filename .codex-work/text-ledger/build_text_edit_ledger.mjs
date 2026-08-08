import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..", "..");
const sourcePath = path.join(projectRoot, "exports", "mimi_narrative_export.json");
const outputDir = path.join(
  projectRoot,
  "outputs",
  "019f8d51-7c42-7aa1-90d7-8ea6de798bdf",
);
const previewDir = path.join(scriptDir, "previews");
const outputPath = path.join(
  outputDir,
  "ミミのときめき裏ボス闘技場_テキスト編集台帳.xlsx",
);

const data = JSON.parse(await fs.readFile(sourcePath, "utf8"));
const workbook = Workbook.create();

const COLORS = {
  ink: "#24323B",
  charcoal: "#34434C",
  teal: "#167C80",
  tealSoft: "#DDEFF0",
  gold: "#D6A63A",
  input: "#FFF3BF",
  inputStrong: "#FFE49A",
  note: "#E5F2FA",
  reference: "#F0F2F3",
  white: "#FFFFFF",
  line: "#CCD5D9",
  green: "#DDF2E2",
  greenText: "#26653A",
  red: "#FCE2DE",
  redText: "#A23B33",
  gray: "#E7EAEC",
  grayText: "#5A6972",
  orange: "#FCE9D2",
  orangeText: "#8A5720",
};

const STATUS_VALUES = ["未着手", "要修正", "修正済", "保留"];
const ACTION_LABELS = {
  work: "働く",
  play: "遊ぶ",
  rest: "休む",
  search: "探す",
};

function text(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function pad(value, width = 2) {
  return String(value).padStart(width, "0");
}

function columnName(index) {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function compactObject(value) {
  if (!value || typeof value !== "object") return text(value);
  return Object.entries(value)
    .filter(([, entry]) => entry !== null && entry !== undefined && entry !== "")
    .map(([key, entry]) => `${key}: ${text(entry)}`)
    .join(" / ");
}

function lineDirection(line) {
  const parts = [];
  if (line.beat) parts.push(`beat: ${line.beat}`);
  if (line.cue) parts.push(`cue: ${line.cue}`);
  if (line.direction) parts.push(compactObject(line.direction));
  return parts.filter(Boolean).join(" / ");
}

function spriteDescription(sprite) {
  if (!sprite) return "";
  if (typeof sprite === "string") return sprite;
  return compactObject(sprite);
}

const bodyRows = [];

function addBodyRow({
  id,
  currentText,
  speaker = "",
  category,
  target,
  stage = "",
  sceneTitle = "",
  location = "",
  lineNumber = "",
  displayKind = "",
  direction = "",
}) {
  bodyRows.push([
    id,
    "未着手",
    text(currentText),
    "",
    text(speaker),
    "",
    "",
    category,
    target,
    stage,
    sceneTitle,
    location,
    lineNumber,
    displayKind,
    direction,
    null,
    null,
    null,
  ]);
}

for (const version of ["full", "condensed"]) {
  const label = version === "full" ? "通常版" : "短縮版";
  for (const [index, entry] of (data.prologue?.[version] ?? []).entries()) {
    const line = typeof entry === "string" ? { text: entry } : entry;
    addBodyRow({
      id: `prologue.${version}.line.${pad(index + 1, 3)}`,
      currentText: line.text,
      speaker: line.speaker,
      category: `プロローグ（${label}）`,
      target: "ミミ",
      stage: label,
      sceneTitle: line.sceneLabel || "プロローグ",
      lineNumber: index + 1,
      displayKind: line.kind || (line.speaker ? "dialogue" : "narration"),
      direction: lineDirection(line),
    });
  }
}

function addSceneLines(scene, context) {
  for (const [index, lineValue] of (scene.lines ?? []).entries()) {
    const line = typeof lineValue === "string" ? { text: lineValue } : lineValue;
    addBodyRow({
      id: `${scene.id}.line.${pad(index + 1, 3)}`,
      currentText: line.text,
      speaker: line.speaker,
      category: context.category,
      target: context.target,
      stage: context.stage,
      sceneTitle: scene.title,
      location: scene.location,
      lineNumber: index + 1,
      displayKind: line.kind || (line.speaker ? "dialogue" : "narration"),
      direction: lineDirection(line),
    });
  }
}

for (const scene of data.openingScenes ?? []) {
  addSceneLines(scene, {
    category: "共通導入",
    target: "ミミ",
    stage: "導入",
  });
}

for (const fighter of data.fighters ?? []) {
  for (const scene of fighter.scenes ?? []) {
    addSceneLines(scene, {
      category: "キャラクター固有",
      target: fighter.name,
      stage: scene.stage,
    });
  }
}

for (const [weekIndex, week] of (data.weeklyNarratives ?? []).entries()) {
  const weekLabel = `第${weekIndex + 1}週`;
  for (const [lineIndex, setup] of (week.setup ?? []).entries()) {
    addBodyRow({
      id: `weekly.${pad(weekIndex + 1)}.setup.${pad(lineIndex + 1)}`,
      currentText: setup,
      category: "週進行（共通）",
      target: weekLabel,
      stage: "週の導入",
      sceneTitle: week.title,
      lineNumber: lineIndex + 1,
      displayKind: "setup",
    });
  }
  for (const [actionKey, actionText] of Object.entries(week.actions ?? {})) {
    addBodyRow({
      id: `weekly.${pad(weekIndex + 1)}.action.${actionKey}`,
      currentText: actionText,
      category: "週進行（行動結果）",
      target: weekLabel,
      stage: ACTION_LABELS[actionKey] || actionKey,
      sceneTitle: week.title,
      lineNumber: ACTION_LABELS[actionKey] || actionKey,
      displayKind: "action-result",
    });
  }
}

const choiceRows = [];

function addChoices(scene, context) {
  for (const [index, choice] of (scene.choices ?? []).entries()) {
    choiceRows.push([
      `${scene.id}.choice.${pad(index + 1)}`,
      "未着手",
      text(choice.label),
      "",
      text(choice.result),
      "",
      text(choice.intent),
      "",
      text(choice.promise),
      "",
      text(choice.memory),
      "",
      "",
      context.target,
      context.stage,
      scene.title,
      scene.location,
      index + 1,
      choice.trust ?? "",
      choice.ownership ?? "",
      choice.fighterPoints ?? "",
      choice.sharedPoints ?? "",
      text(choice.tone),
      text(choice.recruitmentDecision),
      text(choice.liberationDecision),
    ]);
  }
}

for (const scene of data.openingScenes ?? []) {
  addChoices(scene, { target: "ミミ", stage: "導入" });
}
for (const fighter of data.fighters ?? []) {
  for (const scene of fighter.scenes ?? []) {
    addChoices(scene, { target: fighter.name, stage: scene.stage });
  }
}

const sceneRows = [];
const groupedPrologue = new Map();

for (const version of ["full", "condensed"]) {
  const versionLabel = version === "full" ? "通常版" : "短縮版";
  for (const entry of data.prologue?.[version] ?? []) {
    const line = typeof entry === "string" ? { text: entry } : entry;
    const sceneLabel = line.sceneLabel || "プロローグ";
    const key = `${version}::${sceneLabel}`;
    if (!groupedPrologue.has(key)) {
      groupedPrologue.set(key, {
        version,
        versionLabel,
        sceneLabel,
        count: 0,
        direction: "",
      });
    }
    const group = groupedPrologue.get(key);
    group.count += 1;
    if (!group.direction && line.direction) group.direction = compactObject(line.direction);
  }
}

let prologueSceneIndex = 0;
for (const group of groupedPrologue.values()) {
  prologueSceneIndex += 1;
  sceneRows.push([
    `prologue.${group.version}.scene.${pad(prologueSceneIndex)}`,
    "未着手",
    group.sceneLabel,
    "",
    "",
    "",
    "",
    "",
    "",
    `プロローグ（${group.versionLabel}）`,
    "ミミ",
    group.versionLabel,
    group.count,
    0,
    group.direction,
    "",
  ]);
}

function addSceneRow(scene, context) {
  sceneRows.push([
    scene.id,
    "未着手",
    text(scene.title),
    "",
    text(scene.location),
    "",
    (scene.actions ?? []).map(text).join("\n"),
    "",
    "",
    context.category,
    context.target,
    context.stage,
    scene.lines?.length ?? 0,
    scene.choices?.length ?? 0,
    text(scene.background),
    spriteDescription(scene.sprite),
  ]);
}

for (const scene of data.openingScenes ?? []) {
  addSceneRow(scene, {
    category: "共通導入",
    target: "ミミ",
    stage: "導入",
  });
}
for (const fighter of data.fighters ?? []) {
  for (const scene of fighter.scenes ?? []) {
    addSceneRow(scene, {
      category: "キャラクター固有",
      target: fighter.name,
      stage: scene.stage,
    });
  }
}
for (const [weekIndex, week] of (data.weeklyNarratives ?? []).entries()) {
  sceneRows.push([
    `weekly.${pad(weekIndex + 1)}`,
    "未着手",
    text(week.title),
    "",
    "",
    "",
    Object.keys(week.actions ?? {})
      .map((key) => ACTION_LABELS[key] || key)
      .join(" / "),
    "",
    "",
    "週進行",
    `第${weekIndex + 1}週`,
    "共通",
    (week.setup?.length ?? 0) + Object.keys(week.actions ?? {}).length,
    0,
    "",
    "",
  ]);
}

const characterRows = (data.fighters ?? []).map((fighter) => [
  fighter.id,
  "未着手",
  text(fighter.name),
  "",
  text(fighter.kind),
  "",
  text(fighter.role),
  "",
  text(fighter.summary),
  "",
  text(fighter.currentLimit),
  "",
  text(fighter.traitName),
  "",
  text(fighter.traitText),
  "",
  "",
]);

const eventRows = [];

function addEventField({ id, category, entity, field, current, context = "" }) {
  eventRows.push([
    id,
    "未着手",
    category,
    entity,
    field,
    text(current),
    "",
    context,
    "",
  ]);
}

for (const [category, matches] of [
  ["公式大会", data.officialMatches ?? []],
  ["支配ルート大会", data.dominationMatches ?? []],
]) {
  for (const match of matches) {
    const context = `第${match.week}週 / 難易度 ${match.difficulty} / 勝利追加試合 ${match.roundsOnWin}`;
    for (const [field, label] of [
      ["name", "大会名"],
      ["opponentName", "対戦相手名"],
      ["prize", "賞品・報酬"],
      ["story", "大会の物語説明"],
    ]) {
      addEventField({
        id: `${category === "公式大会" ? "official" : "domination"}.${match.id}.${field}`,
        category,
        entity: match.name,
        field: label,
        current: match[field],
        context,
      });
    }
  }
}

for (const route of data.routes ?? []) {
  const context = `開始資金 ${route.startingMoney} / 共有PT ${route.startingSharedPoints} / 最大編成 ${route.maxRoster}`;
  for (const [field, label] of [
    ["name", "ルート名"],
    ["kicker", "短い紹介文"],
    ["description", "ルート説明"],
  ]) {
    addEventField({
      id: `route.${route.id}.${field}`,
      category: "周回ルート",
      entity: route.name,
      field: label,
      current: route[field],
      context,
    });
  }
  for (const [index, rule] of (route.rules ?? []).entries()) {
    addEventField({
      id: `route.${route.id}.rule.${pad(index + 1)}`,
      category: "周回ルート",
      entity: route.name,
      field: `ルール ${index + 1}`,
      current: rule,
      context,
    });
  }
}

function setWidths(sheet, widths, rowCount) {
  for (const [index, width] of widths.entries()) {
    const col = columnName(index);
    sheet.getRange(`${col}1:${col}${Math.max(2, rowCount)}`).format.columnWidth = width;
  }
}

function applyStatusFormatting(sheet, rowCount) {
  if (rowCount < 2) return;
  const range = sheet.getRange(`B2:B${rowCount}`);
  range.dataValidation = {
    rule: {
      type: "list",
      values: STATUS_VALUES,
    },
  };
  range.conditionalFormats.add("containsText", {
    text: "修正済",
    format: {
      fill: COLORS.green,
      font: { color: COLORS.greenText, bold: true },
    },
  });
  range.conditionalFormats.add("containsText", {
    text: "要修正",
    format: {
      fill: COLORS.red,
      font: { color: COLORS.redText, bold: true },
    },
  });
  range.conditionalFormats.add("containsText", {
    text: "保留",
    format: {
      fill: COLORS.orange,
      font: { color: COLORS.orangeText },
    },
  });
  range.conditionalFormats.add("containsText", {
    text: "未着手",
    format: {
      fill: COLORS.gray,
      font: { color: COLORS.grayText },
    },
  });
}

function formatDataSheet({
  sheet,
  headers,
  rows,
  widths,
  tableName,
  inputColumns,
  noteColumns,
  centerColumns = [],
  numericColumns = [],
  rowHeight = 54,
}) {
  const rowCount = rows.length + 1;
  const lastCol = columnName(headers.length - 1);
  const fullRange = sheet.getRange(`A1:${lastCol}${rowCount}`);
  fullRange.values = [headers, ...rows];
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  sheet.freezePanes.freezeColumns(2);

  const table = sheet.tables.add(`A1:${lastCol}${rowCount}`, true, tableName);
  table.style = "TableStyleLight9";
  table.showFilterButton = true;

  fullRange.format = {
    font: { name: "Yu Gothic UI", size: 10, color: COLORS.ink },
    verticalAlignment: "top",
    wrapText: true,
  };
  sheet.getRange(`A1:${lastCol}1`).format = {
    fill: COLORS.charcoal,
    font: { name: "Yu Gothic UI", size: 10, bold: true, color: COLORS.white },
    verticalAlignment: "center",
    horizontalAlignment: "center",
    wrapText: true,
    rowHeight: 34,
    borders: { preset: "outside", style: "medium", color: COLORS.charcoal },
  };

  if (rowCount >= 2) {
    sheet.getRange(`A2:${lastCol}${rowCount}`).format.rowHeight = rowHeight;
    sheet.getRange(`A2:${lastCol}${rowCount}`).format.borders = {
      insideHorizontal: { style: "thin", color: COLORS.line },
      bottom: { style: "thin", color: COLORS.line },
    };

    const allColumns = Array.from({ length: headers.length }, (_, index) => index);
    const editable = new Set([...inputColumns, ...noteColumns, 1]);
    for (const index of allColumns.filter((value) => !editable.has(value))) {
      const col = columnName(index);
      sheet.getRange(`${col}2:${col}${rowCount}`).format.fill = COLORS.reference;
    }
    for (const index of inputColumns) {
      const col = columnName(index);
      sheet.getRange(`${col}2:${col}${rowCount}`).format.fill = COLORS.input;
    }
    for (const index of noteColumns) {
      const col = columnName(index);
      sheet.getRange(`${col}2:${col}${rowCount}`).format.fill = COLORS.note;
    }
    for (const index of centerColumns) {
      const col = columnName(index);
      sheet.getRange(`${col}2:${col}${rowCount}`).format.horizontalAlignment = "center";
    }
    for (const index of numericColumns) {
      const col = columnName(index);
      sheet.getRange(`${col}2:${col}${rowCount}`).format.numberFormat = "0";
    }
  }

  setWidths(sheet, widths, rowCount);
  applyStatusFormatting(sheet, rowCount);
  return rowCount;
}

const guide = workbook.worksheets.add("使い方");
const body = workbook.worksheets.add("本文編集");
const choices = workbook.worksheets.add("選択肢編集");
const scenes = workbook.worksheets.add("場面構成");
const characters = workbook.worksheets.add("キャラクター概要");
const events = workbook.worksheets.add("大会・ルート");

const bodyHeaders = [
  "不変ID",
  "状態",
  "現在の文章",
  "修正文",
  "現在の話者",
  "話者修正",
  "編集メモ",
  "区分",
  "対象",
  "段階",
  "場面名",
  "場所",
  "行",
  "表示種別",
  "演出情報",
  "現在文字数",
  "修正文文字数",
  "増減",
];
const bodyRowCount = formatDataSheet({
  sheet: body,
  headers: bodyHeaders,
  rows: bodyRows,
  widths: [34, 12, 60, 60, 16, 16, 30, 20, 18, 16, 32, 22, 8, 14, 38, 12, 12, 10],
  tableName: "NarrativeBodyTable",
  inputColumns: [3, 5],
  noteColumns: [6],
  centerColumns: [1, 12, 13, 15, 16, 17],
  numericColumns: [12, 15, 16, 17],
  rowHeight: 62,
});
body.getRange("P2").formulas = [["=LEN(C2)"]];
body.getRange(`P2:P${bodyRowCount}`).fillDown();
body.getRange("Q2").formulas = [['=IF(D2="","",LEN(D2))']];
body.getRange(`Q2:Q${bodyRowCount}`).fillDown();
body.getRange("R2").formulas = [['=IF(D2="","",Q2-P2)']];
body.getRange(`R2:R${bodyRowCount}`).fillDown();

const choiceHeaders = [
  "不変ID",
  "状態",
  "現在の選択肢",
  "選択肢修正",
  "現在の結果文",
  "結果文修正",
  "現在の意図",
  "意図修正",
  "現在の約束",
  "約束修正",
  "現在の記憶文",
  "記憶文修正",
  "編集メモ",
  "対象",
  "段階",
  "場面名",
  "場所",
  "選択肢番号",
  "信頼変化",
  "所有変化",
  "固有PT",
  "共有PT",
  "トーン",
  "加入判定",
  "解放判定",
];
const choiceRowCount = formatDataSheet({
  sheet: choices,
  headers: choiceHeaders,
  rows: choiceRows,
  widths: [
    34, 12, 38, 38, 54, 54, 38, 38, 38, 38, 38, 38, 30, 18, 15, 30, 22, 10, 10,
    10, 10, 10, 14, 18, 18,
  ],
  tableName: "NarrativeChoicesTable",
  inputColumns: [3, 5, 7, 9, 11],
  noteColumns: [12],
  centerColumns: [1, 17, 18, 19, 20, 21],
  numericColumns: [17, 18, 19, 20, 21],
  rowHeight: 68,
});

const sceneHeaders = [
  "不変ID",
  "状態",
  "現在の場面名",
  "場面名修正",
  "現在の場所",
  "場所修正",
  "現在の場面設計",
  "場面設計修正",
  "場面全体メモ",
  "区分",
  "対象",
  "段階",
  "本文数",
  "選択肢数",
  "背景情報",
  "立ち絵情報",
];
const sceneRowCount = formatDataSheet({
  sheet: scenes,
  headers: sceneHeaders,
  rows: sceneRows,
  widths: [34, 12, 34, 34, 22, 22, 52, 52, 36, 22, 18, 16, 10, 10, 42, 42],
  tableName: "NarrativeScenesTable",
  inputColumns: [3, 5, 7],
  noteColumns: [8],
  centerColumns: [1, 12, 13],
  numericColumns: [12, 13],
  rowHeight: 64,
});

const characterHeaders = [
  "不変ID",
  "状態",
  "現在の名前",
  "名前修正",
  "現在の種別",
  "種別修正",
  "現在の役割",
  "役割修正",
  "現在の概要",
  "概要修正",
  "現在の制限・弱点",
  "制限・弱点修正",
  "現在の特性名",
  "特性名修正",
  "現在の特性説明",
  "特性説明修正",
  "編集メモ",
];
const characterRowCount = formatDataSheet({
  sheet: characters,
  headers: characterHeaders,
  rows: characterRows,
  widths: [24, 12, 18, 18, 20, 20, 20, 20, 44, 44, 38, 38, 24, 24, 44, 44, 34],
  tableName: "NarrativeCharactersTable",
  inputColumns: [3, 5, 7, 9, 11, 13, 15],
  noteColumns: [16],
  centerColumns: [1],
  rowHeight: 76,
});

const eventHeaders = [
  "不変ID",
  "状態",
  "区分",
  "対象",
  "項目",
  "現在の文章",
  "修正文",
  "ゲーム条件",
  "編集メモ",
];
const eventRowCount = formatDataSheet({
  sheet: events,
  headers: eventHeaders,
  rows: eventRows,
  widths: [36, 12, 18, 28, 20, 58, 58, 36, 34],
  tableName: "NarrativeEventsTable",
  inputColumns: [6],
  noteColumns: [8],
  centerColumns: [1],
  rowHeight: 64,
});

guide.showGridLines = false;
guide.freezePanes.freezeRows(3);
guide.getRange("A1:H1").merge();
guide.getRange("A1").values = [["ミミのときめき裏ボス闘技場　テキスト編集台帳"]];
guide.getRange("A2:H2").merge();
guide.getRange("A2").values = [[
  "Wordは通読用、このExcelは検索・比較・修正・再取り込み用です。",
]];
guide.getRange("A1:H2").format = {
  fill: COLORS.charcoal,
  font: { name: "Yu Gothic UI", color: COLORS.white },
  verticalAlignment: "center",
};
guide.getRange("A1").format.font = {
  name: "Yu Gothic UI",
  size: 20,
  bold: true,
  color: COLORS.white,
};
guide.getRange("A1").format.rowHeight = 38;
guide.getRange("A2").format.font = {
  name: "Yu Gothic UI",
  size: 11,
  color: "#DDE7EA",
};
guide.getRange("A2").format.rowHeight = 28;

guide.getRange("A4:H4").merge();
guide.getRange("A4").values = [["最短の編集手順"]];
guide.getRange("A4:H4").format = {
  fill: COLORS.teal,
  font: { name: "Yu Gothic UI", size: 13, bold: true, color: COLORS.white },
  verticalAlignment: "center",
  rowHeight: 28,
};
guide.getRange("A5:H9").values = [
  ["1", "大きく組み直す場面は、先に「場面構成」の黄色欄へ設計を書く", "", "", "", "", "", ""],
  ["2", "「本文編集」で現在文の隣にある黄色の「修正文」だけを書く", "", "", "", "", "", ""],
  ["3", "選ぶ楽しさを直すときは「選択肢編集」で選択肢と結果文を対で直す", "", "", "", "", "", ""],
  ["4", "作業中は「状態」を 要修正／修正済／保留 に変え、フィルターで絞る", "", "", "", "", "", ""],
  ["5", "修正文が空欄なら現在文を維持。不変IDと灰色の参照欄は変更しない", "", "", "", "", "", ""],
];
for (let row = 5; row <= 9; row += 1) {
  guide.getRange(`B${row}:H${row}`).merge();
}
guide.getRange("A5:A9").format = {
  fill: COLORS.gold,
  font: { name: "Yu Gothic UI", size: 12, bold: true, color: COLORS.white },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
guide.getRange("B5:H9").format = {
  fill: COLORS.reference,
  font: { name: "Yu Gothic UI", size: 10, color: COLORS.ink },
  verticalAlignment: "center",
  wrapText: true,
};
guide.getRange("A5:H9").format.rowHeight = 30;
guide.getRange("A5:H9").format.borders = {
  insideHorizontal: { style: "thin", color: COLORS.line },
  outside: { style: "thin", color: COLORS.line },
};

guide.getRange("A11:H11").merge();
guide.getRange("A11").values = [["編集状況"]];
guide.getRange("A11:H11").format = {
  fill: COLORS.teal,
  font: { name: "Yu Gothic UI", size: 13, bold: true, color: COLORS.white },
  verticalAlignment: "center",
  rowHeight: 28,
};
guide.getRange("A12:F12").values = [[
  "シート",
  "件数",
  "未着手",
  "要修正",
  "修正済",
  "保留",
]];
guide.getRange("A12:F12").format = {
  fill: COLORS.charcoal,
  font: { name: "Yu Gothic UI", size: 10, bold: true, color: COLORS.white },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};

const summarySheets = [
  ["本文編集", bodyRowCount],
  ["選択肢編集", choiceRowCount],
  ["場面構成", sceneRowCount],
  ["キャラクター概要", characterRowCount],
  ["大会・ルート", eventRowCount],
];
guide.getRange("A13:A17").values = summarySheets.map(([name]) => [name]);
for (const [index, [name, rowCount]] of summarySheets.entries()) {
  const row = 13 + index;
  guide.getRange(`B${row}`).formulas = [[`=COUNTA('${name}'!$A$2:$A$${rowCount})`]];
  guide.getRange(`C${row}`).formulas = [[`=COUNTIF('${name}'!$B$2:$B$${rowCount},"未着手")`]];
  guide.getRange(`D${row}`).formulas = [[`=COUNTIF('${name}'!$B$2:$B$${rowCount},"要修正")`]];
  guide.getRange(`E${row}`).formulas = [[`=COUNTIF('${name}'!$B$2:$B$${rowCount},"修正済")`]];
  guide.getRange(`F${row}`).formulas = [[`=COUNTIF('${name}'!$B$2:$B$${rowCount},"保留")`]];
}
guide.getRange("A13:F17").format = {
  font: { name: "Yu Gothic UI", size: 10, color: COLORS.ink },
  verticalAlignment: "center",
  borders: {
    insideHorizontal: { style: "thin", color: COLORS.line },
    bottom: { style: "thin", color: COLORS.line },
  },
};
guide.getRange("A13:A17").format.fill = COLORS.reference;
guide.getRange("B13:F17").format.horizontalAlignment = "center";
guide.getRange("B13:F17").format.numberFormat = "0";
guide.getRange("C13:C17").format.fill = COLORS.gray;
guide.getRange("D13:D17").format.fill = COLORS.red;
guide.getRange("E13:E17").format.fill = COLORS.green;
guide.getRange("F13:F17").format.fill = COLORS.orange;
guide.getRange("A13:F17").format.rowHeight = 24;

guide.getRange("A19:H19").merge();
guide.getRange("A19").values = [["色の意味"]];
guide.getRange("A19:H19").format = {
  fill: COLORS.teal,
  font: { name: "Yu Gothic UI", size: 13, bold: true, color: COLORS.white },
  verticalAlignment: "center",
  rowHeight: 28,
};
guide.getRange("A20:B22").values = [
  ["黄色", "ここへ修正文を入力"],
  ["水色", "意図・懸念・要望などの編集メモ"],
  ["灰色", "元ゲームから出した参照情報。原則変更しない"],
];
guide.getRange("A20:A22").format = {
  font: { name: "Yu Gothic UI", size: 10, bold: true, color: COLORS.ink },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
guide.getRange("A20").format.fill = COLORS.input;
guide.getRange("A21").format.fill = COLORS.note;
guide.getRange("A22").format.fill = COLORS.reference;
guide.getRange("B20:B22").format = {
  font: { name: "Yu Gothic UI", size: 10, color: COLORS.ink },
  verticalAlignment: "center",
};
guide.getRange("A20:B22").format.rowHeight = 26;

guide.getRange("A24:H24").merge();
guide.getRange("A24").values = [["返すとき"]];
guide.getRange("A24:H24").format = {
  fill: COLORS.teal,
  font: { name: "Yu Gothic UI", size: 13, bold: true, color: COLORS.white },
  verticalAlignment: "center",
  rowHeight: 28,
};
guide.getRange("A25:H27").merge(true);
guide.getRange("A25:H27").values = [
  ["このファイルをそのまま渡してください。修正文が空欄の行は現在文を残して取り込みます。"],
  ["不変IDを使ってゲーム内データへ戻すため、行の並べ替えやフィルターは問題ありません。行削除とID変更だけは避けてください。"],
  ["通して読んだ印象はWordへ、具体的な差し替え文はこのExcelへ書くと、最も早く正確に反映できます。"],
];
guide.getRange("A25:H27").format = {
  fill: COLORS.reference,
  font: { name: "Yu Gothic UI", size: 10, color: COLORS.ink },
  verticalAlignment: "center",
  wrapText: true,
};
guide.getRange("A25:H27").format.rowHeight = 34;

setWidths(guide, [18, 34, 15, 15, 15, 15, 15, 15], 27);
guide.getRange("A1:H27").format.borders = {
  bottom: { style: "thin", color: COLORS.line },
};

await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(previewDir, { recursive: true });

const inspection = await workbook.inspect({
  kind: "table",
  range: "使い方!A1:H27",
  include: "values,formulas",
  tableMaxRows: 30,
  tableMaxCols: 8,
  maxChars: 12000,
});
console.log("GUIDE_INSPECT");
console.log(inspection.ndjson);

const bodyInspection = await workbook.inspect({
  kind: "table",
  range: "本文編集!A1:R6",
  include: "values,formulas",
  tableMaxRows: 6,
  tableMaxCols: 18,
  maxChars: 10000,
});
console.log("BODY_INSPECT");
console.log(bodyInspection.ndjson);

const errorInspection = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
  maxChars: 6000,
});
console.log("FORMULA_ERRORS");
console.log(errorInspection.ndjson);

const previewSpecs = [
  ["使い方", "A1:H27", "01-guide.png"],
  ["本文編集", "A1:R9", "02-body.png"],
  ["選択肢編集", "A1:M8", "03-choices-edit.png"],
  ["選択肢編集", "N1:Y8", "04-choices-context.png"],
  ["場面構成", "A1:P9", "05-scenes.png"],
  ["キャラクター概要", "A1:Q8", "06-characters.png"],
  ["大会・ルート", "A1:I10", "07-events.png"],
];

for (const [sheetName, range, filename] of previewSpecs) {
  const preview = await workbook.render({
    sheetName,
    range,
    scale: 1,
    format: "png",
  });
  await fs.writeFile(
    path.join(previewDir, filename),
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

console.log(
  JSON.stringify(
    {
      outputPath,
      previewDir,
      counts: {
        body: bodyRows.length,
        choices: choiceRows.length,
        scenes: sceneRows.length,
        characters: characterRows.length,
        events: eventRows.length,
      },
    },
    null,
    2,
  ),
);
