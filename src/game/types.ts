export type WeeklyAction = "work" | "play" | "rest" | "search";
export type Condition = "good" | "normal" | "bad";
export type BattlePlan = "assault" | "balanced" | "guarded";
export type BattleTactic = "signature" | "burst" | "support" | "conserve";
export type FormationSlot = "front" | "middle" | "rear";
export type RallyOrder = "advance" | "endure" | "sync";
export type Element = "neutral" | "flame" | "tide" | "gale" | "star";
export type SkillKind = "damage" | "heal" | "guard" | "buff" | "debuff";
export type TargetKind = "enemy" | "ally" | "allEnemies" | "allAllies" | "self";
export type EnemyIntent = "attack" | "guard" | "skill";
export type BattleRule =
  | "rookie-rally"
  | "closing-shift"
  | "postal-order"
  | "full-course"
  | "ownership-audit"
  | "first-star"
  | "uncontrolled-finale"
  | "scorecard-wall"
  | "moving-standard"
  | "midterm-pressure"
  | "overtime-rush"
  | "optimization-chain";
export type FighterRole =
  | "万能"
  | "攻撃"
  | "守備"
  | "支援"
  | "妨害"
  | "速攻";

export interface Stats {
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  magic: number;
  speed: number;
}

export interface SkillDefinition {
  id: string;
  name: string;
  kind: SkillKind;
  target: TargetKind;
  element: Element;
  power: number;
  mpCost: number;
  note: string;
  mechanics?: {
    defensePierce?: number;
    attackBuff?: number;
    magicBuff?: number;
    defenseBuff?: number;
    speedBuff?: number;
    evasionBuff?: number;
    attackDebuff?: number;
    magicDebuff?: number;
    defenseDebuff?: number;
    speedDebuff?: number;
    barrier?: number;
    criticalBonus?: number;
  };
}

export type SceneSpritePosition = "left" | "center" | "right";
export type SceneEffect = "pulse" | "shake" | "flash";
export type ChoiceTone =
  | "comic"
  | "heroic"
  | "tender"
  | "defiant"
  | "wild"
  | "pragmatic";

export interface SceneSpriteCue {
  asset: string;
  alt: string;
  position?: SceneSpritePosition;
  scale?: "compact" | "standard" | "tall";
}

export interface SceneDirection {
  background?: string;
  sprite?: SceneSpriteCue | null;
  still?: string;
  effect?: SceneEffect;
}

export interface DialogueLine {
  speaker?: string;
  text: string;
  kind?: "dialogue" | "thought";
  beat?: "comic" | "tension" | "tender" | "revelation" | "resolve";
  cue?: string;
  direction?: SceneDirection;
}

export interface SceneChoice {
  label: string;
  result: string;
  outcomeHeadline?: string;
  trust: number;
  ownership: number;
  money?: number;
  sharedPoints?: number;
  fighterPoints?: number;
  condition?: Condition;
  liberationDecision?: "release" | "retain";
  recruitmentDecision?: "join" | "defer" | "decline";
  // 決勝前夜(週25)の本命選択でのみ使う。選ばれた人物IDを記録する。
  honmeiFighterId?: string;
  tone?: ChoiceTone;
  intent?: string;
  promise?: string;
  memory?: string;
  outcomeVisual?: {
    src: string;
    alt: string;
    focusX?: number;
    focusY?: number;
  };
}

export interface CharacterScene {
  id: string;
  title: string;
  location: string;
  actions: WeeklyAction[];
  lines: DialogueLine[];
  background?: string;
  sprite?: SceneSpriteCue | null;
  choices?: SceneChoice[];
}

export interface FighterDefinition {
  id: string;
  name: string;
  reading?: string;
  kind: string;
  role: FighterRole;
  color: string;
  accent: string;
  summary: string;
  currentLimit: string;
  traitName: string;
  traitText: string;
  ai: "aggressive" | "steady" | "careful" | "tricky";
  strong: Element;
  weak: Element;
  stats: Stats;
  skills: [SkillDefinition, SkillDefinition, SkillDefinition, SkillDefinition];
  scenes: {
    meet: CharacterScene;
    join: CharacterScene;
    bond: CharacterScene;
    power: CharacterScene;
    crisis: CharacterScene;
    liberation: CharacterScene;
    epilogue: CharacterScene;
  };
}

export interface FighterRunState {
  id: string;
  recruited: boolean;
  encountered: boolean;
  liberated: boolean;
  trust: number;
  ownership: number;
  storyStage: number;
  liberationEligible: boolean;
  liberationMisses: number;
  contractDecision?: "released" | "retained";
  condition: Condition;
  fighterPoints: number;
  statBoosts: Partial<Stats>;
  equippedItemId?: string;
}

export interface EventChoiceResult {
  choice: SceneChoice;
  fighterId?: string;
}

export interface EventOutcome {
  sceneId: string;
  title: string;
  result: string;
  outcomeHeadline?: string;
  visual?: {
    src: string;
    kind: "still" | "background";
    alt: string;
    focusX?: number;
    focusY?: number;
  };
  choiceLabel?: string;
  choiceTone?: ChoiceTone;
  choiceMemory?: string;
  fighterId?: string;
  isLiberation: boolean;
  liberationDecision?: "release" | "retain";
  isRecruitment?: boolean;
  affectedCount: number;
  milestones?: string[];
  before?: {
    trust?: number;
    ownership?: number;
    money: number;
    sharedPoints: number;
    fighterPoints?: number;
  };
  after?: {
    trust?: number;
    ownership?: number;
    money: number;
    sharedPoints: number;
    fighterPoints?: number;
  };
  deltas: {
    trust: number;
    ownership: number;
    money: number;
    sharedPoints: number;
    fighterPoints: number;
  };
}

export interface WeeklyEvent {
  id: string;
  title: string;
  location: string;
  action: WeeklyAction;
  fighterId?: string;
  scene: CharacterScene;
  isRare: boolean;
  narrativeBlockId?: string;
}

export interface MatchDefinition {
  id: string;
  name: string;
  week: number;
  opponentName: string;
  opponentColor: string;
  difficulty: number;
  prize: number;
  roundsOnWin: number;
  story: string;
  opponentIds?: [string, string, string];
  battleRule?: BattleRule;
  battleFeature?: {
    name: string;
    summary: string;
  };
  enemyCues?: Record<
    EnemyIntent,
    [
      { gesture: string; line: string },
      { gesture: string; line: string },
    ]
  >;
  final?: boolean;
}

export interface BattleUnit {
  instanceId: string;
  fighterId: string;
  name: string;
  side: "player" | "enemy";
  stats: Stats;
  maxHp: number;
  hp: number;
  maxMp: number;
  mp: number;
  trust: number;
  ownership: number;
  condition: Condition;
  role: FighterRole;
  position: FormationSlot;
  tactic: BattleTactic;
  strong: Element;
  weak: Element;
  traitName: string;
  traitText: string;
  skills: SkillDefinition[];
  ai: FighterDefinition["ai"];
  guarding: boolean;
  attackBuff: number;
  magicBuff: number;
  defenseBuff: number;
  speedBuff: number;
  evasion: number;
  barrier: number;
  breakGauge: number;
  breakMax: number;
  brokenTurns: number;
  lastSkillId?: string;
  lastTargetId?: string;
  comboCount: number;
  criticalPity: number;
  receivedHits: number;
  traitTriggered: boolean;
  defeatTraitTriggered: boolean;
  defeated: boolean;
}

export interface BattleLogEntry {
  turn: number;
  actor: string;
  text: string;
  tone: "normal" | "good" | "bad" | "system";
}

export type BattlePresentationKind =
  | "damage"
  | "heal"
  | "guard"
  | "buff"
  | "debuff"
  | "trait"
  | "break"
  | "manager"
  | "miss";

export interface BattlePresentationTarget {
  instanceId: string;
  name: string;
  hpBefore: number;
  hpAfter: number;
  breakBefore: number;
  breakAfter: number;
  value?: number;
  tags: string[];
}

export interface BattlePresentationEvent {
  id: string;
  turn: number;
  actorId?: string;
  actorName: string;
  side?: BattleUnit["side"];
  skillName: string;
  kind: BattlePresentationKind;
  element: Element;
  targetIds: string[];
  targets: BattlePresentationTarget[];
  momentumBefore?: number;
  momentumAfter?: number;
  headline: string;
  detail: string;
  spotlight?: "chance" | "crisis";
}

export interface BattleState {
  matchId: string;
  turn: number;
  player: BattleUnit[];
  enemy: BattleUnit[];
  logs: BattleLogEntry[];
  presentationEvents?: BattlePresentationEvent[];
  status: "ready" | "running" | "decision" | "won" | "lost";
  decisionReason?: string;
  decisionKind?: "opening" | "turningPoint" | "final";
  turningPointUsed: boolean;
  turningPointOutcome?: "seized" | "held" | "missed";
  spotlightSide?: BattleUnit["side"];
  cheerUses: number;
  readUses: number;
  forceUses: number;
  shiftUses: number;
  momentum: number;
  momentumMax: number;
  predictedAction?: EnemyIntent;
  /** @deprecated Old saves may still contain this answer-like field. */
  enemyTell?: EnemyIntent;
  enemyIntent?: EnemyIntent;
  enemyCue?: {
    speaker: string;
    gesture: string;
    line: string;
  };
  enemyTellConfidence?: number;
  enemyThreat?: string;
  forcedSkillId?: string;
  forcedFighterId?: string;
  plan: BattlePlan;
  teamTrust: number;
  teamOwnership: number;
  battleRule?: BattleRule;
  battleFeature?: MatchDefinition["battleFeature"];
  metrics: {
    weaknessHits: number;
    criticalHits: number;
    turningPoints: number;
    traitTriggers: number;
    interventions: number;
    damageDealt: number;
    damageTaken: number;
    healingDone: number;
    skillUses: Record<string, number>;
  };
}

export type SpectatorSide = "azure" | "coral";

export interface SpectatorMatchState {
  id: string;
  status: "offer" | "watching" | "resolved" | "dismissed";
  azureFighterIds: string[];
  coralFighterIds: string[];
  selectedSide?: SpectatorSide;
  stake: number;
  winnerSide: SpectatorSide;
  odds: Record<SpectatorSide, number>;
  payout: number;
}

export type BattleIntervention =
  | { type: "cheer"; order?: RallyOrder }
  | { type: "read"; prediction: "attack" | "guard" | "skill" }
  | { type: "shift"; plan: BattlePlan }
  | { type: "force"; fighterId: string; skillId: string }
  | { type: "link" }
  | { type: "pass" };

export interface HallOfFameTeam {
  id: string;
  createdAt: string;
  route: string;
  result: string;
  score: number;
  wins: number;
  money: number;
  fighterIds: string[];
  activeFighterIds?: string[];
  rosterIds?: string[];
  fighterSnapshots?: Array<{
    id: string;
    trust: number;
    ownership: number;
    condition: Condition;
    fighterPoints: number;
    statBoosts: Partial<Stats>;
    equippedItemId?: string;
    liberated: boolean;
  }>;
  battlePlan?: BattlePlan;
  battleTactics?: Record<string, BattleTactic>;
  liberatedIds: string[];
}

export interface RunState {
  id: string;
  seed: string;
  rngCursor: number;
  week: number;
  weekActionDone: boolean;
  ownershipStage: "employee" | "provisional" | "owner";
  arenaRank: "unranked" | "provisional" | "highest";
  route: "normal" | "domination" | "chaos";
  money: number;
  mimiCondition: Condition;
  sharedPoints: number;
  fighters: Record<string, FighterRunState>;
  roster: string[];
  activeTeam: string[];
  encounterDeck: string[];
  eventHistory: string[];
  flags: string[];
  lastChoiceEcho?: {
    tone: ChoiceTone;
    label: string;
    memory: string;
  };
  liberationWindowsUsed: number[];
  currentEvent?: WeeklyEvent;
  lastEventOutcome?: EventOutcome;
  recentEventFighterId?: string;
  focusFighterId?: string;
  pendingMatchId?: string;
  currentBet: number;
  battlePlan: BattlePlan;
  battleTactics: Record<string, BattleTactic>;
  battle?: BattleState;
  spectatorMatch?: SpectatorMatchState;
  wins: number;
  losses: number;
  bonusMatches: number;
  lastMatchSummary?: string;
  inventory: Record<string, number>;
  ended: boolean;
  endingType?: "rebuild" | "company" | "retired" | "grand";
  // 三段階キャンペーンの現在区分(1=第一勤務週/2=更新後/3=記録外)。
  // 旧セーブには存在しないため省略可(省略時は従来の全員デッキ挙動)。
  campaignStage?: 1 | 2 | 3;
  // メインストーリー再生中に保持する、その週に選ばれた行動。
  // メイン終了後、同じ行動で人物・世界の場面を続けて選ぶために使う。
  pendingWeeklyAction?: WeeklyAction;
  // 前の勤務週区分から持ち越した仲間。出場枠は使うが、
  // 「この周で新しく出会う人数」の勘定からは外す(新しい5人と会えるように)。
  carriedIds?: string[];
  // 決勝前夜(週25)に選んだ本命の人物ID。前夜シーンの分岐とエンディング判定が参照する。
  // 旧セーブには存在しないため省略可(省略時は前夜選択が未実施として扱われる)。
  honmeiFighterId?: string;
}

// 周回を跨いで持ち越す仲間の状態(クリア後の世界では仲間だけが積み重なる)
export interface CarriedAllyState {
  id: string;
  trust: number;
  ownership: number;
  storyStage: number;
  liberated: boolean;
}

export interface PlayerProfile {
  version: number;
  hasFinishedRun: boolean;
  clears: number;
  unlockedRoutes: Array<RunState["route"]>;
  liberatedCollection: string[];
  // 真エンディング「十五人の開廷日」へ到達済みか(最終条の開示に使う)
  grandCleared?: boolean;
  // 完了した周回数(勝敗を問わず完走した回数)。三段階キャンペーンの区分判定に使う。
  completedRuns?: number;
  // 周回を跨いで在籍し続ける仲間(前区分の主軸たち)。
  carriedAllies?: CarriedAllyState[];
  seenEvents: string[];
  /** Stable narrative choice IDs preserve branch-specific CG unlocks. */
  seenChoices?: string[];
  hallOfFame: HallOfFameTeam[];
  skipExplanations: boolean;
  textSpeed: "slow" | "normal" | "fast" | "instant";
  dialogueMode: "summary" | "step";
  battleSpeed: "normal" | "fast" | "instant";
  battlePlayback: "manual" | "auto";
  soundEnabled: boolean;
}
