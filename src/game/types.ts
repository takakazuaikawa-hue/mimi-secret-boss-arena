export type WeeklyAction = "work" | "play" | "rest" | "search";
export type Condition = "good" | "normal" | "bad";
export type BattlePlan = "assault" | "balanced" | "guarded";
export type BattleTactic = "signature" | "burst" | "support" | "conserve";
export type FormationSlot = "front" | "middle" | "rear";
export type RallyOrder = "advance" | "endure" | "sync";
export type Element = "neutral" | "flame" | "tide" | "gale" | "star";
export type SkillKind = "damage" | "heal" | "guard" | "buff" | "debuff";
export type TargetKind = "enemy" | "ally" | "allEnemies" | "allAllies" | "self";
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
  trust: number;
  ownership: number;
  money?: number;
  sharedPoints?: number;
  fighterPoints?: number;
  condition?: Condition;
  liberationDecision?: "release" | "retain";
  recruitmentDecision?: "join" | "defer" | "decline";
  tone?: ChoiceTone;
  intent?: string;
  promise?: string;
  memory?: string;
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
  predictedAction?: "attack" | "guard" | "skill";
  enemyTell?: "attack" | "guard" | "skill";
  enemyIntent?: "attack" | "guard" | "skill";
  enemyTellConfidence?: number;
  enemyThreat?: string;
  forcedSkillId?: string;
  forcedFighterId?: string;
  plan: BattlePlan;
  teamTrust: number;
  teamOwnership: number;
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
  endingType?: "rebuild" | "company" | "retired";
}

export interface PlayerProfile {
  version: number;
  hasFinishedRun: boolean;
  clears: number;
  unlockedRoutes: Array<RunState["route"]>;
  liberatedCollection: string[];
  seenEvents: string[];
  hallOfFame: HallOfFameTeam[];
  skipExplanations: boolean;
  textSpeed: "slow" | "normal" | "fast" | "instant";
  dialogueMode: "summary" | "step";
  battleSpeed: "normal" | "fast" | "instant";
  battlePlayback: "manual" | "auto";
  soundEnabled: boolean;
}
