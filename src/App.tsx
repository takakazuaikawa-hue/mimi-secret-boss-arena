import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useMachine } from "@xstate/react";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  Coffee,
  Compass,
  Crosshair,
  Crown,
  Dices,
  Eye,
  EyeOff,
  FastForward,
  Gauge,
  HeartHandshake,
  Home,
  Images,
  ScrollText,
  Info,
  LockKeyhole,
  Maximize2,
  Medal,
  Menu,
  MessageCircle,
  MousePointerClick,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Swords,
  UserRoundCheck,
  UsersRound,
  Volume2,
  VolumeX,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { fighterById, fighterDefinitions } from "./data/characters";
import { characterVisuals } from "./data/characterVisuals";
import {
  arenaCharter,
  grandFinaleLines,
  unlockedCharterArticles,
} from "./data/arenaCharter";
import { opponentVisuals } from "./data/opponentVisuals";
import {
  battleOpponentById,
} from "./data/opponents";
import { itemById, itemDefinitions } from "./data/items";
import {
  getMatchDefinition,
  matchForWeek,
  matchesForRoute,
  parseBonusMatchId,
} from "./data/matches";
import {
  condensedProloguePages,
  fullProloguePages,
} from "./data/prologueV2";
import { getRouteDefinition } from "./data/routes";
import {
  LIBERATION_WEEKS,
  availableRosterIds,
  recruitmentForecastForAction,
  storyProspectsForAction,
  workIncomeForCondition,
} from "./game/engine";
import {
  choiceToneMeta,
  resolveChoiceDesign,
} from "./game/choiceDesign";
import { opponentsForMatch } from "./game/battle";
import { buildBattleBroadcast } from "./game/battleBroadcast";
import { gameMachine, type GamePhase } from "./game/machine";
import { playSound } from "./game/sound";
import { useGameStore } from "./game/store";
import {
  FighterChibi,
  LoadingScreen,
  SceneTransition,
  type TransitionNotice,
} from "./components/GameVisuals";
import type {
  BattleUnit,
  BattlePlan,
  BattlePresentationEvent,
  BattleTactic,
  ChoiceTone,
  Condition,
  PlayerProfile,
  RunState,
  SceneChoice,
  SceneSpriteCue,
  SkillDefinition,
  SpectatorSide,
  Stats,
  WeeklyAction,
} from "./game/types";

const money = (value: number) => `${value.toLocaleString("ja-JP")} G`;

const battleTagLabel = (tag: string) => {
  const labels: Record<string, string> = {
    MISS: "かわした",
    CRITICAL: "強烈",
    GUARD: "防いだ",
    "POWER UP": "勢い上昇",
    DOWN: "動き低下",
    RECOVER: "回復",
    LINK: "連携",
    KO: "戦闘不能",
  };
  return labels[tag] ?? tag;
};

const routeNames: Record<RunState["route"], string> = {
  normal: "通常営業",
  domination: "支配興行",
  chaos: "大混線祭",
};

const conditionLabels: Record<Condition, string> = {
  good: "好調",
  normal: "普通",
  bad: "不調",
};

const battlePlanLabels: Record<BattlePlan, string> = {
  assault: "攻勢",
  balanced: "均衡",
  guarded: "堅守",
};

const statLabels: Record<keyof Stats, string> = {
  hp: "HP",
  mp: "MP",
  attack: "攻撃",
  defense: "防御",
  magic: "魔力",
  speed: "速度",
};

const tacticLabels: Record<BattleTactic, string> = {
  signature: "個性重視",
  burst: "全力",
  support: "支援優先",
  conserve: "温存",
};

const tacticDescriptions: Record<BattleTactic, string> = {
  signature: "味方HPが半分以下なら回復。固有技を軸に、ときどき通常攻撃",
  burst: "MP攻撃技を優先。前衛とHPが減った相手へ決定打を狙う",
  support: "味方HPが半分以下なら回復。防御・強化・弱体を攻撃より優先",
  conserve: "MPが7割を切ると通常攻撃。残り1人か瀕死で大技を解禁",
};

const skillKindLabels: Record<SkillDefinition["kind"], string> = {
  damage: "攻撃",
  heal: "回復",
  guard: "防御",
  buff: "強化",
  debuff: "妨害",
};

const positionLabels = {
  front: "前衛",
  middle: "中衛",
  rear: "後衛",
} as const;

const phaseDetails: Record<
  Exclude<GamePhase, "title" | "prologue">,
  { label: string; step: number }
> = {
  week: { label: "今週を選ぶ", step: 0 },
  event: { label: "出来事", step: 1 },
  outcome: { label: "結果", step: 2 },
  management: { label: "チーム管理", step: 3 },
  matchPrep: { label: "試合準備", step: 4 },
  battle: { label: "公式戦", step: 4 },
  ending: { label: "周回結果", step: 4 },
  archive: { label: "記録室", step: 4 },
};

const weeklyStepLabels = ["行動", "出来事", "結果", "育成", "試合"];

const actionDetails: Array<{
  id: WeeklyAction;
  label: string;
  note: string;
  icon: typeof BriefcaseBusiness;
}> = [
  {
    id: "work",
    label: "働く",
    note: "世界を滅ぼさず稼ぐ。関係は動かない。",
    icon: BriefcaseBusiness,
  },
  {
    id: "play",
    label: "遊ぶ",
    note: "勝敗の外で一緒に過ごし、信頼を育てる。",
    icon: Sparkles,
  },
  {
    id: "rest",
    label: "休む",
    note: "今週を休みに使い、次の勝負へ調子を整える。",
    icon: Coffee,
  },
  {
    id: "search",
    label: "探す",
    note: "資金と体調を賭け、未知の候補と手掛かりを狙う。",
    icon: Compass,
  },
];

const weeklyActionHeadlines: Record<WeeklyAction, string[]> = {
  work: [
    "危険手当を笑顔で回収する",
    "規則の穴を給料へ変える",
    "裏ボス対応で店を回す",
    "今週も世界を滅ぼさず働く",
  ],
  play: [
    "推しと無駄な一日を勝ち取る",
    "試合の外の顔を見に行く",
    "裏ボスを普通に遊ばせる",
    "勝敗では育たない信頼を拾う",
  ],
  rest: [
    "今日は堂々と何もしない",
    "全員を布団へ撤退させる",
    "壊れる前に休ませる",
    "休むことを今週の作戦にする",
  ],
  search: [
    "まだ見ぬ災厄をスカウトする",
    "契約書の裏側へ降りる",
    "危険を払って手掛かりを掘る",
    "次の裏ボスを先に見つける",
  ],
};

const choiceToneIcons: Record<ChoiceTone, typeof Sparkles> = {
  comic: Sparkles,
  heroic: Zap,
  tender: HeartHandshake,
  defiant: Shield,
  wild: WandSparkles,
  pragmatic: BriefcaseBusiness,
};

function FighterMark({
  id,
  size = "normal",
}: {
  id: string;
  size?: "small" | "normal" | "large";
}) {
  const fighter = fighterById.get(id);
  const opponent = battleOpponentById.get(id);
  if (!fighter && !opponent) return null;
  const visual = characterVisuals[id];
  const opponentVisual = opponentVisuals[id];
  return (
    <span
      className={`fighter-mark fighter-mark--${size}`}
      style={
        {
          backgroundColor: fighter?.color ?? opponent?.color,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {opponentVisual ? (
        <img
          src={opponentVisual.battle}
          alt=""
          className="fighter-mark__opponent-art"
        />
      ) : visual ? (
        <img
          src={visual.portrait}
          alt=""
          style={{ objectPosition: `${visual.focusX}% center` }}
        />
      ) : (
        fighter?.name.slice(0, 1) ?? opponent?.name.slice(0, 1)
      )}
    </span>
  );
}

interface SceneImageView {
  src: string;
  alt: string;
  title: string;
  caption?: string;
}

function SceneImageLightbox({
  image,
  onClose,
}: {
  image?: SceneImageView;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!image) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [image, onClose]);

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="scene-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${image.title}の画像`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onClose}
        >
          <motion.figure
            initial={{ opacity: 0, scale: 0.975 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <img src={image.src} alt={image.alt} />
            <figcaption>
              <span>SCENE VIEW</span>
              <strong>{image.title}</strong>
              {image.caption && <p>{image.caption}</p>}
            </figcaption>
            <button
              className="icon-button scene-image-lightbox__close"
              onClick={onClose}
              title="閉じる"
              aria-label="画像を閉じる"
              autoFocus
            >
              <X size={20} />
            </button>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function AppHeader({
  phase,
  onTitle,
  onArchive,
}: {
  phase: GamePhase;
  onTitle: () => void;
  onArchive: () => void;
}) {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  const setSoundEnabled = useGameStore((state) => state.setSoundEnabled);
  const setTextSpeed = useGameStore((state) => state.setTextSpeed);
  const setBattleSpeed = useGameStore((state) => state.setBattleSpeed);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    if (!settingsOpen && !menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
        setMenuOpen(false);
      }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen, settingsOpen]);
  if (phase === "title" || phase === "prologue") return null;
  const detail = phaseDetails[phase];

  return (
    <>
      <header className="app-header">
        <button className="icon-button" onClick={onTitle} title="タイトルへ">
          <Home size={19} />
        </button>
        <div className="wordmark">
          <span>ミミの</span>
          <strong>ときめき裏ボス闘技場</strong>
        </div>
        <div className="header-progress" aria-label={`現在地: ${detail.label}`}>
          <div className="header-progress__current">
            {run && !run.ended && <span>第{run.week}週</span>}
            <strong>{detail.label}</strong>
          </div>
          <div className="header-progress__steps" aria-hidden="true">
            {weeklyStepLabels.map((label, index) => (
              <span
                key={label}
                className={
                  index === detail.step
                    ? "is-current"
                    : index < detail.step
                      ? "is-done"
                      : ""
                }
              >
                {label}
              </span>
            ))}
          </div>
        </div>
        {run && !run.ended && (
          <div className="header-status" aria-label="現在の周回状況">
            <span>
              <CircleDollarSign size={16} /> {money(run.money)}
            </span>
            <span className={`condition condition--${run.mimiCondition}`}>
              {conditionLabels[run.mimiCondition]}
            </span>
            <span className="save-status">
              <Save size={15} /> 保存済み
            </span>
          </div>
        )}
        <div className="header-actions">
          <button
            className="icon-button"
            onClick={() => setSoundEnabled(!profile.soundEnabled)}
            title={profile.soundEnabled ? "音を消す" : "音を出す"}
          >
            {profile.soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <button
            className="icon-button"
            onClick={() => setSettingsOpen(true)}
            title="表示と試合の設定"
          >
            <Settings size={19} />
          </button>
          <button className="icon-button" onClick={onArchive} title="殿堂と解放記録">
            <Archive size={19} />
          </button>
          <button
            className="icon-button"
            onClick={() => setMenuOpen(true)}
            title="ゲームメニュー"
            aria-label="ゲームメニュー"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      {menuOpen && (
        <div
          className="game-menu-backdrop"
          onMouseDown={() => setMenuOpen(false)}
        >
          <section
            className="game-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="game-menu-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="game-menu__visual">
              <img src="/assets/ui/week-transition-cg.png" alt="" />
              <div className="game-menu__visual-copy">
                <span>TEAM LOUNGE</span>
                <strong>今日も全員、だいたい勤務中。</strong>
              </div>
            </div>
            <div className="game-menu__body">
              <header>
                <div>
                  <span>GAME MENU</span>
                  <h2 id="game-menu-title">闘技場メニュー</h2>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setMenuOpen(false)}
                  title="閉じる"
                  autoFocus
                >
                  <X size={20} />
                </button>
              </header>
              {run && !run.ended && (
                <>
                  <div className="game-menu__run">
                    <span>第{run.week}週</span>
                    <strong>{routeNames[run.route]}</strong>
                    <small>
                      {run.wins}勝 {run.losses}敗・{money(run.money)}
                    </small>
                  </div>
                  <div className="game-menu__chibis" aria-label="現在の所属選手">
                    <FighterChibi id="mimi" showName />
                    {availableRosterIds(run)
                      .slice(0, 4)
                      .map((id) => (
                        <FighterChibi id={id} key={id} showName />
                      ))}
                  </div>
                </>
              )}
              <nav className="game-menu__nav" aria-label="ゲームメニュー">
                <button onClick={() => setMenuOpen(false)}>
                  <Play size={20} fill="currentColor" />
                  <span>
                    <strong>プレイを続ける</strong>
                    <small>いまの場面へ戻る</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive();
                  }}
                >
                  <Images size={20} />
                  <span>
                    <strong>記録室と記憶画廊</strong>
                    <small>解放した人物・一枚絵・殿堂入り</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setSettingsOpen(true);
                  }}
                >
                  <Settings size={20} />
                  <span>
                    <strong>プレイ設定</strong>
                    <small>文章・試合速度・効果音</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onTitle();
                  }}
                >
                  <Home size={20} />
                  <span>
                    <strong>タイトルへ戻る</strong>
                    <small>進行状況は自動保存されています</small>
                  </span>
                  <ChevronRight size={19} />
                </button>
              </nav>
            </div>
          </section>
        </div>
      )}
      {settingsOpen && (
        <div
          className="settings-backdrop"
          onMouseDown={() => setSettingsOpen(false)}
        >
          <section
            className="settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-dialog__heading">
              <div>
                <span>SETTINGS</span>
                <h2 id="settings-title">プレイ設定</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setSettingsOpen(false)}
                title="閉じる"
                autoFocus
              >
                <X size={20} />
              </button>
            </div>
            <div className="settings-row">
              <div>
                <strong>メッセージ速度</strong>
                <span>台詞が切り替わるときの表示速度です。</span>
              </div>
              <div className="segmented-control">
                {(
                  [
                    ["slow", "ゆっくり"],
                    ["normal", "標準"],
                    ["fast", "速い"],
                    ["instant", "瞬時"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    className={profile.textSpeed === value ? "is-selected" : ""}
                    onClick={() => setTextSpeed(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div>
                <strong>バトル再生速度</strong>
                <span>技名と結果を表示する長さを調整します。</span>
              </div>
              <div className="segmented-control">
                {(
                  [
                    ["normal", "1倍"],
                    ["fast", "2倍"],
                    ["instant", "高速"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    className={profile.battleSpeed === value ? "is-selected" : ""}
                    onClick={() => setBattleSpeed(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <div>
                <strong>効果音</strong>
                <span>選択、賭け、勝利などの音をまとめて切り替えます。</span>
              </div>
              <label className="settings-switch">
                <input
                  type="checkbox"
                  aria-label="効果音"
                  checked={profile.soundEnabled}
                  onChange={(event) => setSoundEnabled(event.target.checked)}
                />
                <span aria-hidden="true" />
                <strong>{profile.soundEnabled ? "オン" : "オフ"}</strong>
              </label>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

const titleAttractors = [
  "限定パフェの待機列に、世界滅亡後の裏ボスがいた。",
  "今週の予定。働く、休む、災厄をスカウトする。",
  "自由にしたら、次の試合には好きで来てくれた。",
  "カジノ勤務の帰り道、派遣先が増えた。",
];

const titleCast = [
  "mimi",
  "gidonozeaas",
  "amara",
  "shahar",
  "night-eater",
] as const;

function TitleScreen({
  onStart,
  onContinue,
  onArchive,
}: {
  onStart: (route: RunState["route"]) => void;
  onContinue: () => void;
  onArchive: () => void;
}) {
  const profile = useGameStore((state) => state.profile);
  const run = useGameStore((state) => state.run);
  const setSkip = useGameStore((state) => state.setSkipExplanations);
  const setSoundEnabled = useGameStore((state) => state.setSoundEnabled);
  const [route, setRoute] = useState<RunState["route"]>("normal");
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [attractorIndex, setAttractorIndex] = useState(0);
  const selectedRoute = getRouteDefinition(route);
  const continueLabel =
    run?.ownershipStage === "employee"
      ? "派遣初日から続ける"
      : run?.ownershipStage === "provisional"
        ? "暫定オーナーとして続ける"
        : run
          ? `第${run.week}週から続ける`
          : "";

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const timer = window.setInterval(() => {
      setAttractorIndex((current) => (current + 1) % titleAttractors.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const soundAnd = (action: () => void) => {
    playSound("ui", profile.soundEnabled);
    action();
  };

  return (
    <main className="title-screen title-screen--attract">
      <img
        src="/assets/ui/title-key-visual.png"
        alt=""
        className="title-screen__image"
      />
      <div className="title-screen__wash" />
      <div className="title-confetti" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <motion.section
        className="title-stage"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <header className="title-logo">
          <span className="title-logo__series">
            <Crown size={15} />
            MIMI'S SECRET BOSS ARENA
          </span>
          <h1 aria-label="ミミのときめき裏ボス闘技場">
            <span className="title-logo__mimi">ミミの</span>
            <span className="title-logo__heart">ときめき</span>
            <span className="title-logo__boss">裏ボス</span>
            <span className="title-logo__arena">闘技場</span>
          </h1>
          <p className="title-logo__promise">
            週にひとつ選んで、規格外の仲間と自由を勝ち取る
          </p>
        </header>

        <div className="title-attractor">
          <span>NEXT WEEK</span>
          <AnimatePresence mode="wait">
            <motion.strong
              key={attractorIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26 }}
            >
              {titleAttractors[attractorIndex]}
            </motion.strong>
          </AnimatePresence>
        </div>

        <nav className="title-main-menu" aria-label="タイトルメニュー">
          {run && (
            <button
              className="title-menu-button title-menu-button--continue"
              onClick={() => soundAnd(onContinue)}
            >
              <span className="title-menu-button__icon">
                <Play size={22} fill="currentColor" />
              </span>
              <span>
                <small>CONTINUE</small>
                <strong>{continueLabel}</strong>
              </span>
              <em>AUTO SAVE・{money(run.money)}</em>
              <ChevronRight size={21} />
            </button>
          )}
          <button
            className={`title-menu-button ${
              run ? "" : "title-menu-button--continue"
            }`}
            onClick={() =>
              soundAnd(() => {
                if (run) setShowRestartConfirm(true);
                else onStart("normal");
              })
            }
          >
            <span className="title-menu-button__icon">
              <Sparkles size={22} />
            </span>
            <span>
              <small>NEW GAME</small>
              <strong>派遣初日から始める</strong>
            </span>
            <ChevronRight size={21} />
          </button>
          <button
            className="title-menu-button title-menu-button--small"
            onClick={() => soundAnd(onArchive)}
          >
            <Archive size={19} />
            <span>
              <small>MEMORIES</small>
              <strong>記録室</strong>
            </span>
          </button>
          <button
            className="title-sound-button"
            onClick={() => setSoundEnabled(!profile.soundEnabled)}
            aria-label={profile.soundEnabled ? "効果音を消す" : "効果音を出す"}
            title={profile.soundEnabled ? "効果音を消す" : "効果音を出す"}
          >
            {profile.soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
        </nav>

        <AnimatePresence>
          {showRestartConfirm && run && (
            <motion.div
              className="title-restart-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRestartConfirm(false)}
            >
              <motion.section
                className="title-restart-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="restart-confirm-title"
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                onClick={(event) => event.stopPropagation()}
              >
                <Save size={28} />
                <div>
                  <span>AUTO SAVE</span>
                  <h2 id="restart-confirm-title">第{run.week}週の続きがあります</h2>
                  <p>
                    派遣初日から始めると、現在の周回は終了します。
                    解放記録と殿堂入り記録は残ります。
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>現在</dt>
                    <dd>{continueLabel}</dd>
                  </div>
                  <div>
                    <dt>所持金</dt>
                    <dd>{money(run.money)}</dd>
                  </div>
                </dl>
                <footer>
                  <button
                    className="secondary-button"
                    onClick={() => setShowRestartConfirm(false)}
                    autoFocus
                  >
                    今の続きへ戻る
                  </button>
                  <button
                    className="primary-button title-restart-dialog__confirm"
                    onClick={() => {
                      setShowRestartConfirm(false);
                      soundAnd(() => onStart("normal"));
                    }}
                  >
                    派遣初日から始め直す
                  </button>
                </footer>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="title-cast-parade" aria-label="スカウトできる仲間たち">
          <span className="title-cast-parade__label">
            <Sparkles size={13} />
            SECRET BOSS FILE
          </span>
          <div>
            {titleCast.map((id, index) => (
              <FighterChibi
                id={id}
                key={id}
                mood={index === 1 ? "cheer" : "idle"}
              />
            ))}
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {showRoutePicker && (
          <motion.div
            className="title-route-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRoutePicker(false)}
          >
            <motion.section
              className="title-route-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="title-route-heading"
              initial={{ opacity: 0, x: -36 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -28 }}
              transition={{ type: "spring", stiffness: 330, damping: 31 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="title-route-sheet__close"
                onClick={() => setShowRoutePicker(false)}
                aria-label="興行選択を閉じる"
                title="閉じる"
              >
                <X size={21} />
              </button>
              <header>
                <span>ARENA PROGRAM</span>
                <h2 id="title-route-heading">今回の興行を選ぶ</h2>
                <p>選ぶのは遊び方。出会う裏ボスは、毎回変わります。</p>
              </header>
              <div className="route-picker" aria-label="周回ルート">
                {(["normal", "domination", "chaos"] as const).map(
                  (id, index) => {
                    const unlocked = profile.unlockedRoutes.includes(id);
                    return (
                      <button
                        key={id}
                        className={route === id ? "is-selected" : ""}
                        disabled={!unlocked}
                        onClick={() => {
                          setRoute(id);
                          playSound("ui", profile.soundEnabled);
                        }}
                        aria-label={
                          unlocked
                            ? routeNames[id]
                            : `${routeNames[id]}・前のルートをクリアすると解放`
                        }
                        title={
                          unlocked
                            ? undefined
                            : "前のルートをクリアすると解放されます"
                        }
                      >
                        <span>0{index + 1}</span>
                        <strong>{routeNames[id]}</strong>
                        {!unlocked && <LockKeyhole size={15} />}
                      </button>
                    );
                  },
                )}
              </div>
              {profile.unlockedRoutes.length < 3 && (
                <p className="route-unlock-note">
                  <LockKeyhole size={14} />
                  {profile.unlockedRoutes.includes("domination")
                    ? "支配興行を終えると、大混線祭が開きます。"
                    : "通常営業を終えると、支配興行が開きます。"}
                </p>
              )}
              <div className="route-explainer">
                <span>PLAY STYLE</span>
                <strong>{selectedRoute.kicker}</strong>
                <p>{selectedRoute.description}</p>
                <div>
                  {selectedRoute.rules.map((rule) => (
                    <small key={rule}>{rule}</small>
                  ))}
                </div>
              </div>
              {profile.hasFinishedRun && (
                <label className="skip-toggle">
                  <input
                    type="checkbox"
                    checked={profile.skipExplanations}
                    onChange={(event) => setSkip(event.target.checked)}
                  />
                  <FastForward size={17} />
                  周回用の短い導入にする
                </label>
              )}
              <footer>
                <span>全26週・想定プレイ時間 約90分</span>
                <button
                  className="primary-button primary-button--large"
                  onClick={() => soundAnd(() => onStart(route))}
                >
                  <Play size={21} fill="currentColor" />
                  この興行で26週を始める
                </button>
              </footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function LegacyTitleScreen({
  onStart,
  onContinue,
  onArchive,
}: {
  onStart: (route: RunState["route"]) => void;
  onContinue: () => void;
  onArchive: () => void;
}) {
  const profile = useGameStore((state) => state.profile);
  const run = useGameStore((state) => state.run);
  const setSkip = useGameStore((state) => state.setSkipExplanations);
  const [route, setRoute] = useState<RunState["route"]>("normal");
  const selectedRoute = getRouteDefinition(route);

  return (
    <main className="title-screen">
      <img
        src="/assets/event-casino-cafe.png"
        alt=""
        className="title-screen__image"
      />
      <div className="title-screen__wash" />
      <motion.section
        className="title-copy"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="title-brand">
          <span className="title-series">
            <Crown size={15} />
            MIMI'S SECRET BOSS ARENA
          </span>
          <p className="title-kicker">
            毎週ひとつ選んで、規格外の選手と自由を勝ち取る
          </p>
          <h1>
            <span className="title-prefix">ミミの</span>
            <span className="title-core">ときめき裏ボス</span>
            <span className="title-tail">闘技場</span>
          </h1>
          <p className="title-lead">
            派遣先は、アットホームな闘技場でした。
            <br />
            勝って、稼いで、契約の外まで一緒に行きます。
          </p>
        </div>

        <div className="title-command">
          <div className="title-command__heading">
            <div>
              <span>ARENA PROGRAM</span>
              <strong>今回の興行を選ぶ</strong>
            </div>
            {run && (
              <small>
                AUTO SAVE・第{run.week}週・{money(run.money)}
              </small>
            )}
          </div>
          <div className="route-picker" aria-label="周回ルート">
            {(["normal", "domination", "chaos"] as const).map((id) => {
              const unlocked = profile.unlockedRoutes.includes(id);
              return (
                <button
                  key={id}
                  className={route === id ? "is-selected" : ""}
                  disabled={!unlocked}
                  onClick={() => setRoute(id)}
                  aria-label={
                    unlocked
                      ? routeNames[id]
                      : `${routeNames[id]}・前のルートをクリアすると解放`
                  }
                  title={
                    unlocked
                      ? undefined
                      : "前のルートをクリアすると解放されます"
                  }
                >
                  {!unlocked && <LockKeyhole size={15} />}
                  <span>0{(["normal", "domination", "chaos"] as const).indexOf(id) + 1}</span>
                  <strong>{routeNames[id]}</strong>
                </button>
              );
            })}
          </div>
          {profile.unlockedRoutes.length < 3 && (
            <p className="route-unlock-note">
              <LockKeyhole size={14} />
              {profile.unlockedRoutes.includes("domination")
                ? "支配興行を終えると、大混線祭が開きます。"
                : "通常営業を終えると、支配興行が開きます。"}
            </p>
          )}
          <div className="route-explainer">
            <strong>{selectedRoute.kicker}</strong>
            <span>{selectedRoute.description}</span>
            <div>
              {selectedRoute.rules.map((rule) => (
                <small key={rule}>{rule}</small>
              ))}
            </div>
          </div>

          <div className="title-actions">
            <button
              className="primary-button primary-button--large"
              onClick={() => onStart(route)}
            >
              <Play size={21} fill="currentColor" />
              この興行で26週を始める
            </button>
            {run && (
              <button className="secondary-button" onClick={onContinue}>
                第{run.week}週から続ける
                <ChevronRight size={19} />
              </button>
            )}
            <button className="text-button" onClick={onArchive}>
              <Archive size={18} />
              記録室
            </button>
          </div>

          {profile.hasFinishedRun && (
            <label className="skip-toggle">
              <input
                type="checkbox"
                checked={profile.skipExplanations}
                onChange={(event) => setSkip(event.target.checked)}
              />
              <FastForward size={17} />
              周回用の短い導入にする
            </label>
          )}
        </div>
      </motion.section>
    </main>
  );
}

const textTransitionDuration: Record<PlayerProfile["textSpeed"], number> = {
  slow: 0.28,
  normal: 0.18,
  fast: 0.1,
  instant: 0,
};

function PrologueScreen({
  condensed,
  onDone,
}: {
  condensed: boolean;
  onDone: () => void;
}) {
  const [page, setPage] = useState(0);
  const [showLog, setShowLog] = useState(false);
  const [viewingImage, setViewingImage] = useState<SceneImageView>();
  const textSpeed = useGameStore((state) => state.profile.textSpeed);
  const pages = condensed ? condensedProloguePages : fullProloguePages;
  const current = pages[page];
  const currentKind = current.kind ?? "dialogue";
  useEffect(() => {
    const assets = new Set<string>();
    pages.forEach((entry) => {
      if (entry.direction?.background) assets.add(entry.direction.background);
      if (entry.direction?.sprite?.asset) assets.add(entry.direction.sprite.asset);
      if (entry.direction?.still) assets.add(entry.direction.still);
    });
    assets.forEach((asset) => {
      const image = new Image();
      image.src = asset;
      void image.decode?.().catch(() => undefined);
    });
  }, [pages]);
  let background = "/assets/story/bg-casino-dressing-room.png";
  let sprite: SceneSpriteCue | null | undefined = null;
  for (let index = 0; index <= page; index += 1) {
    const direction = pages[index]?.direction;
    if (direction?.background) background = direction.background;
    if (
      direction &&
      Object.prototype.hasOwnProperty.call(direction, "sprite")
    ) {
      sprite = direction.sprite;
    }
  }
  const currentStill = current.direction?.still;
  const advance = () => {
    if (page < pages.length - 1) setPage(page + 1);
    else onDone();
  };
  return (
    <main className="scene-screen scene-screen--prologue">
      <AnimatePresence initial={false}>
        <motion.img
          key={background}
          src={background}
          alt=""
          className="scene-backdrop"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
        />
      </AnimatePresence>
      <div className="scene-light" />
      {!currentStill && (
        <button
          className="scene-background-view"
          onClick={() =>
            setViewingImage({
              src: background,
              alt: `${current.sceneLabel}の背景`,
              title: current.sceneLabel,
              caption: "プロローグの背景を大きく表示しています。",
            })
          }
          title="背景を大きく見る"
          aria-label="背景を大きく見る"
        >
          <Maximize2 size={18} />
        </button>
      )}
      <AnimatePresence mode="wait">
        {currentStill ? (
          <motion.button
            key={currentStill}
            type="button"
            className="scene-still-trigger"
            onClick={() =>
              setViewingImage({
                src: currentStill,
                alt: `${current.sceneLabel}の一枚絵`,
                title: current.sceneLabel,
                caption: current.text,
              })
            }
            title="一枚絵を大きく見る"
            aria-label="一枚絵を大きく見る"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <img src={currentStill} alt={`${current.sceneLabel}の一枚絵`} />
            <span>
              <Maximize2 size={18} />
              大きく見る
            </span>
          </motion.button>
        ) : sprite ? (
          <motion.button
            key={sprite.asset}
            type="button"
            className={[
              "scene-sprite-trigger",
              `scene-sprite--${sprite.position ?? "right"}`,
              `scene-sprite--${sprite.scale ?? "standard"}`,
            ].join(" ")}
            onClick={() =>
              setViewingImage({
                src: sprite.asset,
                alt: sprite.alt,
                title: current.speaker ?? current.sceneLabel,
                caption: current.text,
              })
            }
            title="立ち絵を大きく見る"
            aria-label="立ち絵を大きく見る"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
          >
            <img src={sprite.asset} alt={sprite.alt} />
            <span className="scene-image-expand">
              <Maximize2 size={17} />
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
      <div className="prologue-label">
        <span>{current.sceneLabel}</span>
        {condensed && <strong>周回用あらすじ</strong>}
      </div>
      <motion.div
        className={`dialogue-panel dialogue-panel--${currentKind}`}
        key={page}
        role="button"
        tabIndex={0}
        onClick={advance}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") advance();
        }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: textTransitionDuration[textSpeed] }}
      >
        {current.speaker && (
          <div className="dialogue-speaker">{current.speaker}</div>
        )}
        <p>{current.text}</p>
        <div className="dialogue-tools">
          <button
            className="icon-button icon-button--light"
            onClick={(event) => {
              event.stopPropagation();
              setShowLog(true);
            }}
            title="ここまでの物語を読む"
            aria-label="ここまでの物語を読む"
          >
            <BookOpen size={18} />
          </button>
        </div>
        <span className="prologue-progress" aria-hidden="true">
          {page + 1} / {pages.length}
        </span>
        <span className="dialogue-advance" aria-hidden="true">
          <ChevronRight size={21} />
        </span>
      </motion.div>
      <AnimatePresence>
        {showLog && (
          <motion.div
            className="dialogue-log-backdrop"
            role="presentation"
            onClick={() => setShowLog(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="dialogue-log"
              role="dialog"
              aria-modal="true"
              aria-label="プロローグの読了記録"
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <header>
                <div>
                  <span>PROLOGUE LOG</span>
                  <h2>ここまでの物語</h2>
                  <p>{current.sceneLabel}</p>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setShowLog(false)}
                  title="物語の記録を閉じる"
                  aria-label="物語の記録を閉じる"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="dialogue-log__entries">
                {pages.slice(0, page + 1).map((entry, index) => (
                  <article
                    key={`prologue-log:${index}`}
                    className={
                      entry.kind === "thought"
                        ? "dialogue-log__thought"
                        : undefined
                    }
                  >
                    <span>
                      {entry.speaker ??
                        (entry.kind === "thought"
                          ? "ミミの心の声"
                          : "語り")}
                    </span>
                    <p>{entry.text}</p>
                  </article>
                ))}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <SceneImageLightbox
        image={viewingImage}
        onClose={() => setViewingImage(undefined)}
      />
    </main>
  );
}

function CampaignTimeline({
  week,
  route = "normal",
}: {
  week: number;
  route?: RunState["route"];
}) {
  const matchWeeks = new Set(
    matchesForRoute(route).map((match) => match.week),
  );
  const liberationWeeks = new Set<number>(LIBERATION_WEEKS);
  return (
    <div className="timeline" aria-label={`全26週中${week}週目`}>
      {Array.from({ length: 26 }, (_, index) => {
        const value = index + 1;
        return (
          <span
            key={value}
            className={[
              value < week ? "is-past" : "",
              value === week ? "is-current" : "",
              matchWeeks.has(value) ? "is-match" : "",
              liberationWeeks.has(value) ? "is-liberation" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={`${value}週${matchWeeks.has(value) ? "・公式戦" : ""}${
              liberationWeeks.has(value) ? "・契約判断の機会" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

function TeamStrip({ run }: { run: RunState }) {
  return (
    <div className="team-strip">
      {run.activeTeam.map((id) => {
        const fighter = fighterById.get(id)!;
        const state = run.fighters[id];
        return (
          <div className="team-strip__member" key={id}>
            <FighterMark id={id} />
            <div>
              <strong>{fighter.name}</strong>
              <span>
                信頼 {state.trust} / 所有 {state.ownership}
              </span>
            </div>
            <span className={`condition condition--${state.condition}`}>
              {conditionLabels[state.condition]}
            </span>
          </div>
        );
      })}
      {run.activeTeam.length === 0 && (
        <p className="empty-note">まだ選手はいません。最初の行動で出会います。</p>
      )}
    </div>
  );
}

function WeekScreen({
  onChoose,
}: {
  onChoose: (action: WeeklyAction) => void;
}) {
  const run = useGameStore((state) => state.run);
  const soundEnabled = useGameStore((state) => state.profile.soundEnabled);
  const [previewAction, setPreviewAction] = useState<WeeklyAction>("work");
  const [statusFighterId, setStatusFighterId] = useState<string>();
  useEffect(() => {
    actionDetails.forEach(({ id }) => {
      const image = new Image();
      image.src = `/assets/ui/weekly-hub/${id}.webp`;
    });
  }, []);
  if (!run) return null;
  const route = getRouteDefinition(run.route);
  const nextMatch =
    matchesForRoute(run.route).find((match) => match.week >= run.week) ??
    matchesForRoute(run.route).at(-1)!;
  const weeksToMatch = Math.max(0, nextMatch.week - run.week);
  const focusFighter = run.focusFighterId
    ? fighterById.get(run.focusFighterId)
    : undefined;
  const availableRoster = availableRosterIds(run);
  const preOwnership = run.ownershipStage === "employee";
  const openingWeek = preOwnership && run.week === 1;
  const badConditionCount = availableRoster.filter(
    (id) => run.fighters[id].condition === "bad",
  ).length;
  const averageTrust =
    availableRoster.length > 0
      ? Math.round(
          availableRoster.reduce(
            (sum, id) => sum + run.fighters[id].trust,
            0,
          ) / availableRoster.length,
        )
      : 0;
  const actionEffects: Record<WeeklyAction, string> = preOwnership
    ? {
        work: "日給 +700 G",
        play: "案内手当 +650 G",
        rest: "ミミの体調を1段階改善",
        search: "倉庫手当 +750 G",
      }
    : {
        work: `資金 +${money(workIncomeForCondition(run.mimiCondition))}`,
        play: run.focusFighterId
          ? "注目選手の信頼 +7 / 最大600 G"
          : "出場選手の信頼 +3 / 最大600 G",
        rest: "ミミと所属選手の体調を1段階改善",
        search: "最大800 G / 出場者1人が不調になる場合あり",
      };
  const actionContexts: Record<WeeklyAction, string> = {
    work: `所持 ${money(run.money)}・ミミは${conditionLabels[run.mimiCondition]}`,
    play:
      availableRoster.length > 0
        ? `出場可能${availableRoster.length}人・信頼平均${averageTrust}`
        : "最初の出会いが起こる",
    rest:
      badConditionCount > 0
        ? `不調の選手 ${badConditionCount}人`
        : "好調は維持、普通は好調へ",
    search:
      availableRoster.length < route.maxRoster
        ? `出場可能 ${availableRoster.length}/${route.maxRoster}・未知の縁あり`
        : "珍しい出来事を探す",
  };
  const openingActionHooks: Record<WeeklyAction, string> = {
    work: "観客ラウンジで給仕。注文と笑顔を間違えない",
    play: "登録窓口で受付補助。迷子と書類を正しい列へ",
    rest: "従業員休憩室でひと息。初日は休むのも仕事",
    search: "東倉庫の備品確認。危険物の棚には触らない予定",
  };
  const openingActionHeadlines: Record<WeeklyAction, string> = {
    work: "観客ラウンジで、最初の注文を受ける",
    play: "登録窓口で、来場者を案内する",
    rest: "休憩室で制服と呼吸を整える",
    search: "東倉庫で、備品の数を確かめる",
  };
  const openingActionLabels: Record<WeeklyAction, string> = {
    work: "給仕",
    play: "受付補助",
    rest: "休憩",
    search: "倉庫確認",
  };
  const loungeIds =
    run.activeTeam.length > 0
      ? run.activeTeam
      : availableRoster.slice(0, 3);
  const loungeLines = [
    "開場前のラウンジには、お茶の音と、世界を滅ぼせる人たちの小さな相談が混じっている。",
    "窓の外では次の興行準備。室内では、誰が最後の焼き菓子を取るかという重要会議が続いている。",
    "裏ボス級の気配が三つ並んでいるのに、今日いちばん危険なのは提出期限の近い勤務報告書だ。",
    "静かな朝ほど、誰かがよく分からない封印を拾ってくる。私は先にお茶を淹れることにした。",
  ];
  const loungeLine = openingWeek
    ? "まだ誰もいない待機室では、私の足音だけが少し立派に響いている。"
    : loungeLines[(run.week - 1) % loungeLines.length];
  const previousChoiceTone = run.lastChoiceEcho?.tone;
  const PreviousChoiceIcon = previousChoiceTone
    ? choiceToneIcons[previousChoiceTone]
    : Sparkles;
  const previewProspects = storyProspectsForAction(run, previewAction).slice(
    0,
    3,
  );
  const previewRecruitment = recruitmentForecastForAction(run, previewAction);
  const actionPreviewData = actionDetails.map((action, index) => {
    const prospects = storyProspectsForAction(run, action.id);
    const recruitment = recruitmentForecastForAction(run, action.id);
    const focusFits = Boolean(
      run.focusFighterId && prospects.includes(run.focusFighterId),
    );
    const prospectNames = prospects
      .slice(0, 2)
      .map((id) => fighterById.get(id)?.name)
      .filter(Boolean)
      .join("・");
    const storyForecast =
      prospects.length > 0
        ? focusFits && focusFighter
          ? `★ ${focusFighter.name}の続き`
          : `続き候補 ${prospectNames}${
              prospects.length > 2 ? ` ほか${prospects.length - 2}人` : ""
            }`
        : "";
    const eventForecast = openingWeek
      ? openingActionHooks[action.id]
      : recruitment.openingGuarantee
        ? `出場3人までは遭遇確定${
            storyForecast ? ` / ${storyForecast}` : ""
          }`
        : recruitment.chance > 0
          ? `新しい遭遇 約${Math.round(recruitment.chance * 100)}%${
              !recruitment.funded ? "・路銀不足" : ""
            }${storyForecast ? ` / ${storyForecast}` : ""}`
          : storyForecast || "今週は新規候補なし";
    return {
      action: openingWeek
        ? { ...action, label: openingActionLabels[action.id] }
        : action,
      eventForecast,
      headline: openingWeek
        ? openingActionHeadlines[action.id]
        : weeklyActionHeadlines[action.id][
            (run.week + index - 1) %
              weeklyActionHeadlines[action.id].length
          ],
      index,
    };
  });
  const selectedPreview = actionPreviewData.find(
    (entry) => entry.action.id === previewAction,
  )!;
  const SelectedActionIcon = selectedPreview.action.icon;
  const selectedMimiLine: Record<WeeklyAction, string> = {
    work: openingWeek
      ? "初勤務。笑顔、伝票、それから世界を滅ぼしそうなお客様。うん、順番にいこう。"
      : "稼ぐ週は、次の勝負の選択肢が増える。伝票の山は見なかったことにしたい。",
    play: openingWeek
      ? "受付は得意。『迷子です』って顔の人を見つけるのも得意。たぶん。"
      : "遊びに出るだけ。たぶん。封印指定の人がついて来なければ。",
    rest: openingWeek
      ? "初日から休憩？　違います。制服の安全確認と深呼吸です。"
      : "今日は勝たなくていい日。お茶が冷める前なら、きっと間に合う。",
    search: openingWeek
      ? "備品表に『封印用・大』が十二個。大きさの基準だけ聞いておきたい。"
      : "危ない記録ほど、きれいな封蝋で閉じてある。会社って不思議。",
  };
  const selectedEncounterLabel =
    previewProspects.length > 0
      ? "誰かの物語が動きそう"
      : previewRecruitment.chance > 0
        ? `新しい出会い 約${Math.round(previewRecruitment.chance * 100)}%`
        : "日常イベントが起こる";
  const scenePath = `/assets/ui/weekly-hub/${previewAction}.webp`;

  return (
    <>
    <main className={`week-hub week-hub--${previewAction}`}>
      <AnimatePresence initial={false}>
        <motion.img
          key={scenePath}
          src={scenePath}
          alt=""
          className="week-hub__scene"
          initial={{ opacity: 0, scale: 1.025 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </AnimatePresence>
      <div className="week-hub__shade" />
      <div className="week-hub__sparkles" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <header className="week-hud" aria-label="今週の状況">
        <div className="week-hud__week">
          <span>WEEK</span>
          <strong>{String(run.week).padStart(2, "0")}</strong>
          <em>{preOwnership ? "派遣初日" : routeNames[run.route]}</em>
        </div>
        <div className="week-hud__figure">
          <CircleDollarSign size={21} />
          <span>所持金</span>
          <strong>{money(run.money)}</strong>
        </div>
        <div className={`week-hud__figure is-${run.mimiCondition}`}>
          <HeartHandshake size={21} />
          <span>ミミの調子</span>
          <strong>{conditionLabels[run.mimiCondition]}</strong>
        </div>
        <div className="week-hud__fixture">
          {preOwnership ? <BriefcaseBusiness size={22} /> : <Swords size={22} />}
          <span>{openingWeek ? "最初の依頼" : nextMatch.name}</span>
          <strong>
            {openingWeek
              ? openingActionLabels[previewAction]
              : weeksToMatch === 0
                ? "今週、公式戦"
                : `あと ${weeksToMatch} 週`}
          </strong>
        </div>
        <div className="week-hud__progress">
          <div>
            <span>{openingWeek ? "派遣業務" : "今期の進行"}</span>
            <strong>
              {openingWeek ? "仕事を一つ終える" : `${run.week} / 26週`}
            </strong>
          </div>
          {openingWeek ? (
            <ol aria-label="導入の進行">
              <li className="is-complete">
                <Check size={12} /> 到着
              </li>
              <li className="is-current">
                <BriefcaseBusiness size={12} /> 初仕事
              </li>
              <li>
                <Sparkles size={12} /> 事件
              </li>
            </ol>
          ) : (
            <div className="week-hud__season-track" aria-hidden="true">
              <i style={{ width: `${Math.min(100, (run.week / 26) * 100)}%` }} />
            </div>
          )}
        </div>
        {loungeIds.length > 0 && (
          <div className="week-hud__team" aria-label="今週の出場候補">
            {loungeIds.slice(0, 3).map((id) => (
              <button
                key={id}
                onClick={() => setStatusFighterId(id)}
                title={`${fighterById.get(id)?.name}の現在を見る`}
                aria-label={`${fighterById.get(id)?.name}の現在を見る`}
              >
                <FighterMark id={id} />
              </button>
            ))}
          </div>
        )}
      </header>

      <section className="week-mission" aria-label="今週の物語">
        {openingWeek ? (
          <>
            <img src="/assets/story/nono-welcome.png" alt="" />
            <div>
              <span>派遣初日の目標</span>
              <strong>仕事を一つ選んで、無事に終える</strong>
              <p>給仕・受付補助・倉庫確認。疲れたら休憩を選んでもいい。</p>
            </div>
          </>
        ) : (
          <>
            <PreviousChoiceIcon size={20} />
            <div>
              <span>{route.kicker}</span>
              <strong>
                {run.lastChoiceEcho?.memory ??
                  run.lastMatchSummary ??
                  loungeLine}
              </strong>
            </div>
          </>
        )}
      </section>

      <section className="week-stage" aria-live="polite">
        <motion.article
          key={previewAction}
          className="week-stage__selection"
          initial={{ opacity: 0.4, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div className="week-stage__action-heading">
            <span>0{selectedPreview.index + 1}</span>
            <SelectedActionIcon size={36} />
            <div>
              <small>今週の予定</small>
              <h2>{selectedPreview.action.label}</h2>
            </div>
          </div>
          <p>{selectedPreview.headline}</p>
          <div className="week-stage__payoff">
            <div>
              <span>得られるもの</span>
              <strong>{actionEffects[previewAction]}</strong>
              <small>{actionContexts[previewAction]}</small>
            </div>
            <div>
              <span>物語の気配</span>
              <strong>{selectedEncounterLabel}</strong>
              <small>{selectedPreview.eventForecast}</small>
            </div>
          </div>
          {previewProspects.length > 0 && (
            <div className="week-stage__prospects">
              <span>続きが起こりそう</span>
              {previewProspects.map((id) => (
                <figure key={id}>
                  <FighterMark id={id} />
                  <figcaption>{fighterById.get(id)?.name}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </motion.article>

        <motion.aside
          key={`line-${previewAction}`}
          className="week-mimi-line"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span>ミミ</span>
          <p>{selectedMimiLine[previewAction]}</p>
        </motion.aside>
      </section>

      <section className="week-command-dock" aria-labelledby="weekly-action-title">
        <div className="week-command-dock__heading">
          <div>
            <span>WEEKLY ACTION</span>
            <h3 id="weekly-action-title">今週を選ぶ</h3>
          </div>
          <div className="week-command-dock__utilities">
            {run.roster.length > 0 && (
              <button
                onClick={() =>
                  setStatusFighterId(
                    run.focusFighterId ??
                      run.activeTeam[0] ??
                      run.roster[0],
                  )
                }
              >
                <BookOpen size={16} />
                選手名鑑
                <span>{run.roster.length}</span>
              </button>
            )}
            <p>
              <Sparkles size={15} />
              {openingWeek
                ? "どの仕事を選んでも、その場所で出来事がひとつ起こる"
                : "どの予定でも、出来事がひとつ起こる"}
            </p>
          </div>
        </div>
        <div className="week-command-dock__body">
          <div className="week-action-tickets">
            {actionPreviewData.map(({ action, headline, index }) => {
              const Icon = action.icon;
              const selected = previewAction === action.id;
              return (
                <motion.button
                  key={action.id}
                  className={`week-action-ticket week-action-ticket--${action.id} ${
                    selected ? "is-selected" : ""
                  }`}
                  style={
                    {
                      "--ticket-image": `url("/assets/ui/weekly-hub/${action.id}.webp")`,
                    } as CSSProperties
                  }
                  onClick={() => {
                    playSound("ui", soundEnabled);
                    setPreviewAction(action.id);
                  }}
                  aria-pressed={selected}
                  animate={{ y: selected ? -8 : 0 }}
                  whileHover={{ y: -8 }}
                  whileTap={{ y: -2, scale: 0.99 }}
                >
                  <span className="week-action-ticket__number">
                    0{index + 1}
                  </span>
                  <span className="week-action-ticket__icon">
                    <Icon size={24} />
                  </span>
                  <span className="week-action-ticket__copy">
                    <strong>{action.label}</strong>
                    <small>{selected ? headline : actionEffects[action.id]}</small>
                  </span>
                  <span className="week-action-ticket__state">
                    {selected ? "SELECTED" : "見る"}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <motion.button
            className="week-action-confirm"
            onClick={() => onChoose(previewAction)}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.985 }}
          >
            <span>{selectedPreview.action.label}を実行</span>
            <strong>この予定で進める</strong>
            <ChevronRight size={26} />
          </motion.button>
        </div>
      </section>
    </main>
    <AnimatePresence>
      {statusFighterId && (
        <CharacterStatusOverlay
          initialId={statusFighterId}
          onClose={() => setStatusFighterId(undefined)}
        />
      )}
    </AnimatePresence>
    </>
  );
}

const describeChoiceLean = (choice: SceneChoice) => {
  const effects = [
    choice.liberationDecision === "release"
      ? "契約解除 / 以後も本人の意思で参加"
      : choice.liberationDecision === "retain"
        ? "契約解除 / 今後の距離を本人に委ねる"
        : "",
    choice.money
      ? `資金 ${choice.money > 0 ? "+" : ""}${choice.money.toLocaleString("ja-JP")} G`
      : "",
    choice.fighterPoints ? `本人の成長 +${choice.fighterPoints}` : "",
    choice.sharedPoints ? `チームの成長 +${choice.sharedPoints}` : "",
    choice.condition ? `体調 ${conditionLabels[choice.condition]}` : "",
  ].filter(Boolean);
  return effects.slice(0, 3).join(" / ") || "この返事を、相手が後まで覚えている";
};

const choiceQuestionForEvent = (
  event: NonNullable<RunState["currentEvent"]>,
) => {
  const stage = event.scene.id.split(".").at(-1);
  const stageQuestions: Record<string, string> = {
    meet: "この出会いを、何に変える？",
    join: "この人を、どんな仲間として迎える？",
    bond: "今ここで、相手と何をしてみる？",
    power: "目の前の問題を、どんな方法で越える？",
    crisis: "この人が抱えた問題に、どう手を伸ばす？",
    liberation: "自由になった相手へ、次は何を伝える？",
  };
  if (stage && stageQuestions[stage]) return stageQuestions[stage];
  const actionQuestions: Record<WeeklyAction, string> = {
    work: "勤務報告書に、どちらの前例を残す？",
    play: "今日の思い出を、どちらへ転がす？",
    rest: "何を休ませて、何を持ち帰る？",
    search: "どこまで踏み込み、何を証拠にする？",
  };
  return actionQuestions[event.action];
};

const dialogueBeatLabels: Record<
  NonNullable<import("./game/types").DialogueLine["beat"]>,
  string
> = {
  comic: "息を抜く",
  tension: "胸が騒ぐ",
  tender: "距離が近づく",
  revelation: "本音に触れる",
  resolve: "答えを決める",
};

function EventScreen({ onResolved }: { onResolved: () => void }) {
  const event = useGameStore((state) => state.run?.currentEvent);
  const profile = useGameStore((state) => state.profile);
  const resolveEvent = useGameStore((state) => state.resolveEvent);
  const [lineIndex, setLineIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [viewingImage, setViewingImage] = useState<SceneImageView>();
  if (!event) return null;
  const atChoices = lineIndex >= event.scene.lines.length;
  const visibleLineIndex = Math.min(
    lineIndex,
    event.scene.lines.length - 1,
  );
  const line = event.scene.lines[visibleLineIndex];
  const lineKind = line.kind ?? "dialogue";
  const fighter = event.fighterId ? fighterById.get(event.fighterId) : undefined;
  const fighterVisual = event.fighterId
    ? characterVisuals[event.fighterId]
    : undefined;

  let stageBackground = event.scene.background;
  let stageSprite: SceneSpriteCue | null | undefined = event.scene.sprite;
  for (let index = 0; index <= visibleLineIndex; index += 1) {
    const direction = event.scene.lines[index]?.direction;
    if (direction?.background) stageBackground = direction.background;
    if (
      direction &&
      Object.prototype.hasOwnProperty.call(direction, "sprite")
    ) {
      stageSprite = direction.sprite;
    }
  }
  const currentStill = atChoices ? undefined : line.direction?.still;
  const currentEffect = atChoices ? undefined : line.direction?.effect;
  const visibleSprite =
    stageSprite === null
      ? undefined
      : stageSprite ??
        (fighterVisual
          ? {
              asset: fighterVisual.standing,
              alt: `${fighter?.name ?? "登場人物"}の立ち絵`,
              position: "right" as const,
              scale: "tall" as const,
            }
          : undefined);

  const finish = (choiceIndex = 0) => {
    resolveEvent(choiceIndex);
    onResolved();
  };

  const choices = event.scene.choices ? (
    <div className="choice-list">
      {event.scene.choices.map((rawChoice, index) => {
        const choice = resolveChoiceDesign(rawChoice);
        const ToneIcon = choiceToneIcons[choice.tone];
        return (
          <button
            key={choice.label}
            className={`choice-option choice-option--${choice.tone}`}
            onClick={() => finish(index)}
          >
            <span className="choice-option__number">0{index + 1}</span>
            <span className="choice-option__tone">
              <ToneIcon size={17} />
              {choice.intent}
            </span>
            <strong>{choice.label}</strong>
            <p>{choice.promise}</p>
            <small>{describeChoiceLean(choice)}</small>
            <ChevronRight size={21} className="choice-option__arrow" />
          </button>
        );
      })}
    </div>
  ) : (
    <button className="primary-button" onClick={() => finish()}>
      <Check size={19} />
      続ける
    </button>
  );

  return (
    <main
      className={[
        "scene-screen",
        event.isRare ? "scene-screen--rare" : "",
        atChoices ? "scene-screen--choices" : "",
        currentEffect ? `scene-screen--${currentEffect}` : "",
        !atChoices && line.beat ? `scene-screen--beat-${line.beat}` : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {stageBackground ? (
        <img src={stageBackground} alt="" className="scene-backdrop" />
      ) : (
        <div
          className={`scene-atlas scene-atlas--${event.action}`}
          aria-hidden="true"
        />
      )}
      <div className="scene-light" />
      {stageBackground && (
        <button
          className="scene-background-view"
          onClick={() =>
            setViewingImage({
              src: stageBackground,
              alt: `${event.location}の背景`,
              title: event.location,
              caption: "背景だけを大きく表示しています。",
            })
          }
          title="背景を大きく見る"
          aria-label="背景を大きく見る"
        >
          <Maximize2 size={18} />
        </button>
      )}
      <AnimatePresence mode="wait">
        {currentStill ? (
          <motion.button
            key={currentStill}
            type="button"
            className="scene-still-trigger"
            onClick={() =>
              setViewingImage({
                src: currentStill,
                alt: `${event.title}の一枚絵`,
                title: event.title,
                caption: line.text,
              })
            }
            title="一枚絵を大きく見る"
            aria-label="一枚絵を大きく見る"
            initial={{ opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            <img src={currentStill} alt={`${event.title}の一枚絵`} />
            <span>
              <Maximize2 size={18} />
              大きく見る
            </span>
          </motion.button>
        ) : visibleSprite ? (
          <motion.button
            key={visibleSprite.asset}
            type="button"
            className={[
              "scene-sprite-trigger",
              `scene-sprite--${visibleSprite.position ?? "right"}`,
              `scene-sprite--${visibleSprite.scale ?? "standard"}`,
            ].join(" ")}
            onClick={() =>
              setViewingImage({
                src: visibleSprite.asset,
                alt: visibleSprite.alt,
                title: fighter?.name ?? event.title,
                caption: fighter?.kind,
              })
            }
            title={`${fighter?.name ?? "立ち絵"}を大きく見る`}
            aria-label={`${fighter?.name ?? "立ち絵"}を大きく見る`}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.18 }}
          >
            <img src={visibleSprite.asset} alt={visibleSprite.alt} />
            <span className="scene-image-expand">
              <Maximize2 size={17} />
            </span>
          </motion.button>
        ) : null}
      </AnimatePresence>
      <div className="event-meta">
        <span>{event.location}</span>
        {event.isRare && (
          <strong>
            <Star size={15} fill="currentColor" /> 希少な出来事
          </strong>
        )}
      </div>
      {!atChoices && (
        <div className="event-chapter">
          <strong>{event.title}</strong>
          <small>
            {fighter ? `${fighter.kind}・${fighter.name}` : "今週の出来事"}
          </small>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!hidden && !atChoices && (
          <motion.div
            className={[
              "dialogue-panel",
              `dialogue-panel--${lineKind}`,
              line.beat ? `dialogue-panel--beat-${line.beat}` : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={`${event.id}:${lineIndex}`}
            role="button"
            tabIndex={0}
            onClick={() => setLineIndex(lineIndex + 1)}
            onKeyDown={(keyboardEvent) => {
              if (
                keyboardEvent.key === "Enter" ||
                keyboardEvent.key === " "
              ) {
                setLineIndex(lineIndex + 1);
              }
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: textTransitionDuration[profile.textSpeed],
            }}
          >
            <div className="dialogue-progress" aria-label="場面の進行">
              <span>
                {line.beat
                  ? dialogueBeatLabels[line.beat]
                  : lineKind === "thought"
                    ? "ミミの心の声"
                    : "会話"}
              </span>
              <i>
                <b
                  style={{
                    width: `${((lineIndex + 1) / event.scene.lines.length) * 100}%`,
                  }}
                />
              </i>
              <small>
                {lineIndex + 1}/{event.scene.lines.length}
              </small>
            </div>
            {line.speaker && (
              <div className="dialogue-speaker">{line.speaker}</div>
            )}
            <p>
              {line.text}
              {line.cue ? ` ${line.cue}` : ""}
            </p>
            <div className="dialogue-tools">
              <button
                className="icon-button icon-button--light"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  setShowLog(true);
                }}
                title="ここまでの会話を読む"
                aria-label="ここまでの会話を読む"
              >
                <BookOpen size={18} />
              </button>
              <button
                className="icon-button icon-button--light"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  setHidden(true);
                }}
                title="メッセージを隠す"
                aria-label="メッセージを隠す"
              >
                <EyeOff size={18} />
              </button>
              <button
                className="icon-button icon-button--light"
                onClick={(clickEvent) => {
                  clickEvent.stopPropagation();
                  setLineIndex(event.scene.lines.length);
                }}
                title="選択肢まで送る"
                aria-label="選択肢まで送る"
              >
                <FastForward size={18} />
              </button>
            </div>
            <span className="dialogue-advance" aria-hidden="true">
              <ChevronRight size={21} />
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {hidden && (
        <button
          className="restore-dialogue"
          onClick={() => setHidden(false)}
          title="メッセージを表示"
          aria-label="メッセージを表示"
        >
          <Eye size={20} />
        </button>
      )}
      {atChoices && !hidden && (
        <motion.div
          className="choice-panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="choice-panel__header">
            <div className="choice-panel__scene">
              {fighter ? (
                <FighterMark id={fighter.id} size="large" />
              ) : (
                <span className="choice-panel__scene-mark">
                  <Sparkles size={22} />
                </span>
              )}
              <div>
                <span>{event.location}</span>
                <strong>{event.title}</strong>
                <small>
                  {fighter
                    ? `${fighter.kind}・${fighter.name}`
                    : "今週の出来事"}
                </small>
              </div>
            </div>
            <div className="choice-panel__question">
              <span>YOUR DECISION</span>
              <h3>
                {event.scene.choices
                  ? choiceQuestionForEvent(event)
                  : "この出来事を終える"}
              </h3>
            </div>
          </div>
          {choices}
        </motion.div>
      )}
      <AnimatePresence>
        {showLog && (
          <motion.div
            className="dialogue-log-backdrop"
            role="presentation"
            onClick={() => setShowLog(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.section
              className="dialogue-log"
              role="dialog"
              aria-modal="true"
              aria-label={`${event.title}の会話記録`}
              onClick={(clickEvent) => clickEvent.stopPropagation()}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <header>
                <div>
                  <span>SCENE LOG</span>
                  <h2>{event.title}</h2>
                  <p>{event.location}</p>
                </div>
                <button
                  className="icon-button"
                  onClick={() => setShowLog(false)}
                  title="会話記録を閉じる"
                  aria-label="会話記録を閉じる"
                >
                  <X size={20} />
                </button>
              </header>
              <div className="dialogue-log__entries">
                {event.scene.lines
                  .slice(0, atChoices ? undefined : lineIndex + 1)
                  .map((entry, index) => (
                    <article
                      key={`${event.id}:log:${index}`}
                      className={
                        entry.kind === "thought"
                          ? "dialogue-log__thought"
                          : undefined
                      }
                    >
                      <span>
                        {entry.speaker ??
                          (entry.kind === "thought"
                            ? "ミミの心の声"
                            : "語り")}
                      </span>
                      <p>{entry.text}</p>
                    </article>
                  ))}
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      <SceneImageLightbox
        image={viewingImage}
        onClose={() => setViewingImage(undefined)}
      />
    </main>
  );
}

const deltaLabel = (value: number) =>
  value > 0 ? `+${value}` : value === 0 ? "±0" : `${value}`;

function OutcomeScreen({
  onContinue,
}: {
  onContinue: (followup: boolean) => void;
}) {
  const run = useGameStore((state) => state.run);
  const continueEvent = useGameStore((state) => state.continueEvent);
  const outcome = run?.lastEventOutcome;
  if (!run || !outcome) return null;
  const fighter = outcome.fighterId
    ? fighterById.get(outcome.fighterId)
    : undefined;
  const OutcomeMemoryIcon = outcome.choiceTone
    ? choiceToneIcons[outcome.choiceTone]
    : Sparkles;
  const deltas = [
    {
      label: "資金",
      value: outcome.deltas.money,
      show: outcome.deltas.money !== 0,
      before: outcome.before?.money,
      after: outcome.after?.money,
    },
    {
      label: "共有P",
      value: outcome.deltas.sharedPoints,
      show: outcome.deltas.sharedPoints !== 0,
      before: outcome.before?.sharedPoints,
      after: outcome.after?.sharedPoints,
    },
    {
      label: "固有P",
      value: outcome.deltas.fighterPoints,
      show: outcome.deltas.fighterPoints !== 0,
      before: outcome.before?.fighterPoints,
      after: outcome.after?.fighterPoints,
    },
  ].filter((delta) => delta.show);
  const outcomeKicker = outcome.isLiberation
    ? "CONTRACT RELEASED"
    : outcome.isRecruitment
      ? "NEW SECRET BOSS"
      : "DECISION RECORDED";
  const outcomeLabel = outcome.isLiberation
    ? "契約から自由になり、自分の意思でチームに残った"
    : outcome.isRecruitment
      ? "新しい出場者が所属"
      : "今週の選択が記録された";
  const nextLabel =
    outcome.isLiberation
      ? "自由な仲間として、編成と育成を続けられる"
      : outcome.isRecruitment
        ? "新しい選手を編成し、最初の育成を決める"
        : "得られたポイントと次の編成を確認";

  return (
    <main
      className={[
        "outcome-screen",
        outcome.isRecruitment ? "outcome-screen--recruitment" : "",
        outcome.isLiberation ? "outcome-screen--liberation" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src="/assets/ui/screen-scenes/weekly-result.webp"
        alt=""
        className="outcome-screen__scene"
      />
      <div className="outcome-screen__wash" />
      <div className="outcome-stage">
        <header className="outcome-stage__header">
          <div className="outcome-stage__week">
            <span>WEEK</span>
            <strong>{String(run.week).padStart(2, "0")}</strong>
          </div>
          <div>
            <span>{outcomeKicker}</span>
            <strong>{outcomeLabel}</strong>
          </div>
          <div className="outcome-stage__seal" aria-hidden="true">
            <Check size={23} strokeWidth={3} />
          </div>
        </header>

        <section className="outcome-ticket">
          <div className="outcome-ticket__story">
            <div className="outcome-ticket__identity">
              <div className="outcome-card__mark">
                {fighter ? (
                  <FighterMark id={fighter.id} size="large" />
                ) : (
                  <Sparkles size={34} />
                )}
              </div>
              <div>
                <span>{fighter?.kind ?? "今週の記録"}</span>
                <strong>{fighter?.name ?? "ミミの選択"}</strong>
              </div>
            </div>
            <p className="eyebrow">{outcomeKicker}</p>
            <h2>{outcome.title}</h2>
            {outcome.choiceLabel && (
              <p className="outcome-choice">「{outcome.choiceLabel}」</p>
            )}
            <p className="outcome-result">{outcome.result}</p>
            {outcome.choiceMemory && (
              <div
                className={`outcome-memory ${
                  outcome.choiceTone
                    ? `outcome-memory--${outcome.choiceTone}`
                    : ""
                }`}
              >
                <OutcomeMemoryIcon size={20} />
                <div>
                  <span>この選択が残したもの</span>
                  <strong>{outcome.choiceMemory}</strong>
                </div>
              </div>
            )}
          </div>

          <aside className="outcome-ticket__receipt">
            <header>
              <span>CHANGE REPORT</span>
              <strong>今週、動いたもの</strong>
            </header>
            {deltas.length > 0 ? (
              <div className="outcome-deltas" aria-label="選択による変化">
                {deltas.map((delta) => (
                  <div
                    key={delta.label}
                    className={
                      delta.label === "所有" && delta.value < 0
                        ? "is-positive"
                        : delta.label === "所有" && delta.value > 0
                          ? "is-negative"
                          : delta.value > 0
                            ? "is-positive"
                            : delta.value < 0
                              ? "is-negative"
                              : ""
                    }
                  >
                    <span>{delta.label}</span>
                    <strong>
                      {delta.before !== undefined &&
                      delta.after !== undefined ? (
                        <>
                          <em>{delta.before.toLocaleString("ja-JP")}</em>
                          <ChevronRight size={15} />
                          <b>{delta.after.toLocaleString("ja-JP")}</b>
                        </>
                      ) : (
                        deltaLabel(delta.value)
                      )}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="outcome-ticket__quiet">
                <HeartHandshake size={22} />
                <strong>数値には出ない余韻が残った</strong>
              </div>
            )}
            {(outcome.milestones?.length ?? 0) > 0 && (
              <div className="outcome-milestones" role="status">
                {outcome.milestones?.map((milestone) => (
                  <div key={milestone}>
                    {outcome.isRecruitment ? (
                      <UserRoundCheck size={20} />
                    ) : (
                      <Sparkles size={20} />
                    )}
                    <strong>{milestone}</strong>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </section>

        <footer className="outcome-stage__footer">
          <div>
            <span>NEXT / TEAM OFFICE</span>
            <strong>{nextLabel}</strong>
          </div>
          <button
            className="outcome-continue"
            onClick={() => onContinue(continueEvent().followup)}
          >
            <span>
              {outcome.isLiberation
                ? "自由になった仲間を確認"
                : outcome.isRecruitment && fighter
                  ? `${fighter.name}を育成`
                  : "編成と育成へ"}
            </span>
            <ChevronRight size={22} />
          </button>
        </footer>
      </div>
    </main>
  );
}

function StatBar({
  label,
  value,
  max = 100,
  tone = "trust",
}: {
  label: string;
  value: number;
  max?: number;
  tone?: "trust" | "ownership" | "stat";
}) {
  return (
    <div className={`stat-bar stat-bar--${tone}`}>
      <span>{label}</span>
      <div>
        <i style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

const storyMilestones = [
  "出会い",
  "登録",
  "信頼",
  "覚醒",
  "決断",
  "解放",
] as const;

const roleBattleTips: Record<string, string> = {
  万能: "敵の隙と味方の不足を見て、攻撃と支援を切り替える。編成の最後の一枠に置くと仕事が多い。",
  攻撃: "前衛から高威力技を通す主砲。防御役や回復役と組ませ、MPを勝負所へ残すと伸びる。",
  支援: "味方全体の生存と火力を底上げする。速度を伸ばすと、敵が動く前に戦況を作りやすい。",
  守備: "敵の大技を受け止め、攻撃役が動く時間を作る。HPと防御を優先すると役割が安定する。",
  妨害: "弱体化と行動阻害で強敵の予定を崩す。速度と魔力を伸ばし、先手で仕事を終えたい。",
  速攻: "敵の隙や崩れた瞬間へ最初に飛び込む。速度を軸に、攻撃か魔力の得意側を伸ばす。",
};

const storyStatusText = (state: RunState["fighters"][string]) => {
  if (state.contractDecision === "released") return "契約から解放・本人の意思で在籍";
  if (state.contractDecision === "retained") return "契約から解放・本人の意思で在籍";
  if (state.liberationEligible) return "解放条件成立・次の窓を待つ";
  const next = storyMilestones[Math.min(state.storyStage, 5)];
  return `次の節目「${next}」へ`;
};

function CharacterStatusOverlay({
  initialId,
  onClose,
}: {
  initialId: string;
  onClose: () => void;
}) {
  const run = useGameStore((state) => state.run);
  const setFocus = useGameStore((state) => state.setFocus);
  const [selectedId, setSelectedId] = useState(initialId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  if (!run || run.roster.length === 0) return null;
  const fighter = fighterById.get(selectedId) ?? fighterById.get(run.roster[0]);
  if (!fighter) return null;
  const fighterState = run.fighters[fighter.id];
  const visual = characterVisuals[fighter.id];
  const equippedItem = fighterState.equippedItemId
    ? itemById.get(fighterState.equippedItemId)
    : undefined;
  const statEntries = (Object.keys(statLabels) as Array<keyof Stats>).map(
    (stat) => ({
      id: stat,
      label: statLabels[stat],
      base: fighter.stats[stat],
      growth: fighterState.statBoosts[stat] ?? 0,
      equipment: equippedItem?.statBoosts[stat] ?? 0,
      total:
        fighter.stats[stat] +
        (fighterState.statBoosts[stat] ?? 0) +
        (equippedItem?.statBoosts[stat] ?? 0),
    }),
  );
  const recommended = rolePriorities[fighter.role] ?? [];
  const completedMilestones = Math.min(6, fighterState.storyStage);
  const relationshipLead =
    fighterState.trust >= fighterState.ownership ? "信頼優勢" : "所有優勢";

  return (
    <motion.div
      className="character-status-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="選手名鑑"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="character-status-backdrop" onClick={onClose} />
      <motion.section
        className="character-status-shell"
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <header className="character-status-header">
          <div>
            <BookOpen size={21} />
            <span>FIGHTER ARCHIVE</span>
            <h2>選手名鑑</h2>
          </div>
          <div className="character-status-header__run">
            <span>第{run.week}週</span>
            <strong>{run.activeTeam.length}/3 出場中</strong>
          </div>
          <button
            className="character-status-close"
            onClick={onClose}
            title="選手名鑑を閉じる"
            aria-label="選手名鑑を閉じる"
            autoFocus
          >
            <X size={24} />
          </button>
        </header>

        <aside className="character-status-roster" aria-label="所属選手">
          <div className="character-status-roster__title">
            <span>ROSTER</span>
            <strong>所属選手 {run.roster.length}</strong>
          </div>
          <div className="character-status-roster__list">
            {run.roster.map((id, index) => {
              const entry = fighterById.get(id);
              const state = run.fighters[id];
              if (!entry) return null;
              const selected = fighter.id === id;
              return (
                <button
                  key={id}
                  className={selected ? "is-selected" : ""}
                  onClick={() => setSelectedId(id)}
                  aria-pressed={selected}
                >
                  <span className="character-status-roster__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <FighterMark id={id} />
                  <span className="character-status-roster__copy">
                    <strong>{entry.name}</strong>
                    <small>
                      {entry.role}・{conditionLabels[state.condition]}
                    </small>
                  </span>
                  {run.activeTeam.includes(id) && (
                    <i title="出場中" aria-label="出場中" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className="character-status-hero"
          style={
            {
              "--fighter-color": fighter.color,
              "--fighter-accent": fighter.accent,
              "--fighter-portrait": `url("${visual?.portrait ?? ""}")`,
            } as CSSProperties
          }
        >
          <div className="character-status-hero__wash" />
          {visual && (
            <motion.img
              key={visual.standing}
              src={visual.standing}
              alt={`${fighter.name}の立ち絵`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          )}
          <div className="character-status-hero__identity">
            <span>{fighter.kind}</span>
            <h3>{fighter.name}</h3>
            {fighter.reading && <small>{fighter.reading}</small>}
            <p>{fighter.summary}</p>
          </div>
          <div className="character-status-hero__tags">
            <span>{fighter.role}</span>
            <span className={`condition condition--${fighterState.condition}`}>
              {conditionLabels[fighterState.condition]}
            </span>
            {fighterState.liberated && <span>解放済み</span>}
          </div>
        </section>

        <section className="character-status-detail">
          <div className="character-status-progress">
            <div className="character-status-section-title">
              <div>
                <span>LIBERATION STORY</span>
                <h3>解放進行</h3>
              </div>
              <strong>{storyStatusText(fighterState)}</strong>
            </div>
            <ol>
              {storyMilestones.map((label, index) => {
                const complete = index < completedMilestones;
                const current =
                  !fighterState.liberated && index === completedMilestones;
                return (
                  <li
                    key={label}
                    className={[
                      complete ? "is-complete" : "",
                      current ? "is-current" : "",
                    ].join(" ")}
                  >
                    <i>{complete ? <Check size={13} /> : index + 1}</i>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="character-status-relationship">
            <div>
              <span>現在の関係</span>
              <strong>{relationshipLead}</strong>
            </div>
            <StatBar label="信頼" value={fighterState.trust} tone="trust" />
            <StatBar
              label="所有"
              value={fighterState.ownership}
              tone="ownership"
            />
          </div>

          <div className="character-status-columns">
            <section className="character-status-stats">
              <div className="character-status-section-title">
                <div>
                  <span>CURRENT PARAMETERS</span>
                  <h3>現在の能力</h3>
                </div>
                <Gauge size={21} />
              </div>
              <div className="character-status-stat-grid">
                {statEntries.map((stat) => (
                  <div
                    key={stat.id}
                    className={
                      recommended.includes(stat.id) ? "is-recommended" : ""
                    }
                  >
                    <span>
                      {stat.label}
                      {recommended.includes(stat.id) && <small>適性</small>}
                    </span>
                    <strong>{stat.total}</strong>
                    <i>
                      <b style={{ width: `${Math.min(100, (stat.total / 120) * 100)}%` }} />
                    </i>
                    {(stat.growth > 0 || stat.equipment > 0) && (
                      <small>
                        基礎{stat.base} +育成{stat.growth} +装備{stat.equipment}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="character-status-trait">
              <div className="character-status-section-title">
                <div>
                  <span>SIGNATURE TRAIT</span>
                  <h3>固有特性</h3>
                </div>
                <Crown size={21} />
              </div>
              <strong>{fighter.traitName}</strong>
              <p>{fighter.traitText}</p>
              <div>
                <Shield size={17} />
                <span>装備</span>
                <b>{equippedItem?.name ?? "なし"}</b>
              </div>
            </section>
          </div>

          <section className="character-status-skills">
            <div className="character-status-section-title">
              <div>
                <span>COMMAND LIBRARY</span>
                <h3>技一覧</h3>
              </div>
              <Zap size={21} />
            </div>
            <div className="character-status-skill-list">
              {fighter.skills.map((skill, index) => (
                <article key={skill.id}>
                  <span className={`skill-order element--${skill.element}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <strong>{skill.name}</strong>
                    <small>
                      {skillKindLabels[skill.kind]}
                    </small>
                  </div>
                  <b>{skill.mpCost === 0 ? "通常" : `MP ${skill.mpCost}`}</b>
                  <p>{skill.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="character-status-tips">
            <div>
              <Crosshair size={22} />
              <span>戦い方のTIPS</span>
              <strong>{fighter.role}型 / {fighter.ai === "aggressive" ? "攻めを優先" : fighter.ai === "careful" ? "慎重に判断" : fighter.ai === "tricky" ? "意表を突く" : "状況に合わせる"}</strong>
              <p>{roleBattleTips[fighter.role]}</p>
            </div>
            <div>
              <Info size={22} />
              <span>次の成長目標</span>
              <strong>
                {recommended.length > 0
                  ? recommended.map((stat) => statLabels[stat]).join("・")
                  : "編成に合わせて育成"}
              </strong>
              <p>{fighter.currentLimit}</p>
            </div>
          </section>

          <footer className="character-status-actions">
            <button
              className={
                run.focusFighterId === fighter.id
                  ? "is-focus"
                  : ""
              }
              onClick={() => setFocus(fighter.id)}
            >
              <Star
                size={19}
                fill={
                  run.focusFighterId === fighter.id ? "currentColor" : "none"
                }
              />
              {run.focusFighterId === fighter.id
                  ? "注目選手に設定中"
                  : "注目選手にする"}
            </button>
            <button onClick={onClose}>
              今週の予定へ戻る <ChevronRight size={19} />
            </button>
          </footer>
        </section>
      </motion.section>
    </motion.div>
  );
}

const rolePriorities: Record<string, Array<keyof Stats>> = {
  万能: ["hp", "magic"],
  攻撃: ["attack", "hp"],
  支援: ["mp", "magic"],
  守備: ["defense", "hp"],
  妨害: ["speed", "magic"],
  速攻: ["speed", "attack"],
};

function ManagementScreen({
  onProceed,
  onRetire,
}: {
  onProceed: () => void;
  onRetire: () => void;
}) {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  const toggleActive = useGameStore((state) => state.toggleActive);
  const setFocus = useGameStore((state) => state.setFocus);
  const allocate = useGameStore((state) => state.allocatePoint);
  const buyItem = useGameStore((state) => state.buyItem);
  const equipItem = useGameStore((state) => state.equipItem);
  const initialSelectedId =
    run?.recentEventFighterId ?? run?.activeTeam[0] ?? run?.roster[0];
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const [pointSource, setPointSource] = useState<"fighter" | "shared">(
    initialSelectedId && run?.fighters[initialSelectedId]?.fighterPoints
      ? "fighter"
      : run?.sharedPoints
        ? "shared"
        : "fighter",
  );
  const [tab, setTab] = useState<"growth" | "shop">("growth");
  if (!run) return null;
  if (run.ownershipStage === "provisional" && run.roster.length === 0) {
    return (
      <main className="opening-management-screen content-page">
        <section className="opening-management__heading">
          <div>
            <p className="eyebrow">ACCIDENTAL HANDOVER</p>
            <h2>暫定オーナーになってしまった</h2>
            <p>
              社員証を置いただけなのに、受付端末はミミを責任者として受理した。
              取り消し申請は準備中。まずは、何ができるのかをノノと確かめる。
            </p>
          </div>
          <div className="opening-management__access" role="status">
            <Clock3 size={20} />
            <span>所有者区分</span>
            <strong>暫定</strong>
          </div>
        </section>

        <div className="opening-management__layout">
          <section className="opening-fighter-sheet">
            <div className="opening-fighter-sheet__identity">
              <img src="/assets/story/nono-welcome.png" alt="案内係ノノ" />
              <div>
                <span>受付端末から分かったこと</span>
                <h3>権限は、まだ説明書の途中</h3>
                <p>
                  今わかるのは、闘技場への問い合わせと参加申請ができることだけ。
                  チーム編成も育成も、仲間になってくれる選手が見つかってからだ。
                </p>
              </div>
            </div>
          </section>

          <section className="opening-growth-choice">
            <div className="section-title section-title--compact">
              <div>
                <span>CURRENT STATUS</span>
                <h3>今日の確認事項</h3>
              </div>
              <ClipboardCheck size={22} />
            </div>
            <p>
              名義はミミ、引き継いだチームは空っぽ、訂正の所要日数は不明。
              窓口で出会った妙なお客様だけが、少し気にかかっている。
            </p>
            <div className="opening-growth-complete" role="status">
              <Check size={20} />
              <div>
                <strong>勝手に選手登録はされていません</strong>
                <span>誰かを誘うかどうかは、ミミが話をしてから決められる。</span>
              </div>
            </div>
          </section>
        </div>

        <section className="opening-management__footer">
          <div>
            <span>NEXT</span>
            <strong>翌週・暫定オーナーの仕事を確かめる</strong>
            <small>説明は物語の進行に合わせて、必要な分だけ増えていく。</small>
          </div>
          <button className="primary-button" onClick={onProceed}>
            翌週へ <ChevronRight size={19} />
          </button>
        </section>
      </main>
    );
  }
  if (!selectedId) return null;
  const fighter = fighterById.get(selectedId)!;
  const fighterVisual = characterVisuals[fighter.id];
  const fighterState = run.fighters[selectedId];
  const isLiberated = fighterState.liberated;
  const availableRoster = availableRosterIds(run);
  const selectedItem = fighterState.equippedItemId
    ? itemById.get(fighterState.equippedItemId)
    : undefined;
  const match = matchForWeek(run.week, run.route);
  const nextWeek = Math.min(26, run.week + 1);
  const focusFighter = run.focusFighterId
    ? fighterById.get(run.focusFighterId)
    : undefined;
  const fighterPointTotal = availableRoster.reduce(
    (total, id) => total + run.fighters[id].fighterPoints,
    0,
  );
  const equippedCount = availableRoster.filter(
    (id) => run.fighters[id].equippedItemId,
  ).length;
  const recommendedStats = rolePriorities[fighter.role] ?? [];
  const selectedPointBalance =
    pointSource === "fighter" ? fighterState.fighterPoints : run.sharedPoints;
  const recommendedStat = recommendedStats.reduce<keyof Stats | undefined>(
    (lowest, stat) => {
      if (!lowest) return stat;
      const totalFor = (key: keyof Stats) =>
        fighter.stats[key] +
        (fighterState.statBoosts[key] ?? 0) +
        (selectedItem?.statBoosts[key] ?? 0);
      return totalFor(stat) < totalFor(lowest) ? stat : lowest;
    },
    undefined,
  );
  const selectFighter = (id: string) => {
    setSelectedId(id);
    setPointSource(
      run.fighters[id].fighterPoints > 0
        ? "fighter"
        : run.sharedPoints > 0
          ? "shared"
        : "fighter",
    );
  };
  const openingManagement =
    !profile.hasFinishedRun &&
    run.week === 1 &&
    run.roster.length === 1 &&
    run.eventHistory.includes("gidonozeaas.meet");
  const canSpendOpeningPoints = run.sharedPoints >= 2;

  if (openingManagement) {
    return (
      <main className="opening-management-screen content-page">
        <section className="opening-management__heading">
          <div>
            <p className="eyebrow">FIRST REGISTRATION</p>
            <h2>最初の選手登録が完了</h2>
            <p>
              受付端末に新しい権限が一つ増えた。ミミの契約原本には、
              まだ届かない。
            </p>
          </div>
          <div className="opening-management__access" role="status">
            <Check size={20} />
            <span>契約記録室</span>
            <strong>仮承認</strong>
          </div>
        </section>

        <div className="opening-management__layout">
          <section className="opening-fighter-sheet">
            <div className="opening-fighter-sheet__identity">
              <FighterMark id={selectedId} size="large" />
              <div>
                <span>{fighter.kind}</span>
                <h3>{fighter.name}</h3>
                <p>{fighter.summary}</p>
              </div>
            </div>
            <div className="opening-relationship">
              <div>
                <StatBar
                  label="信頼・頼みとして届く力"
                  value={fighterState.trust}
                  tone="trust"
                />
              </div>
              <div>
                <StatBar
                  label="所有・契約で命じられる力"
                  value={fighterState.ownership}
                  tone="ownership"
                />
              </div>
            </div>
          </section>

          <section className="opening-growth-choice">
            <div className="section-title section-title--compact">
              <div>
                <span>FIRST GROWTH</span>
                <h3>最初の2Pを預ける</h3>
              </div>
              <WandSparkles size={22} />
            </div>
            <p>
              登録報酬の共有育成Pは、誰にでも使える。
              今回はギドノゼアースの封印へ回す。
            </p>
            {canSpendOpeningPoints ? (
              <div className="opening-growth-buttons">
                <button
                  onClick={() => allocate(selectedId, "hp", "shared", 2)}
                >
                  <Shield size={22} />
                  <span>
                    <strong>封印の器を安定させる</strong>
                    <small>HP +8</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={() => allocate(selectedId, "magic", "shared", 2)}
                >
                  <Sparkles size={22} />
                  <span>
                    <strong>黒い星の出力を育てる</strong>
                    <small>魔力 +2</small>
                  </span>
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : (
              <div className="opening-growth-complete" role="status">
                <Check size={20} />
                <div>
                  <strong>2Pを配分しました</strong>
                  <span>細かな育成と装備は、次からいつでも変更できます。</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="opening-management__footer">
          <div>
            <span>NEXT</span>
            <strong>第2週・次の予定を選ぶ</strong>
            <small>
              選手登録を重ねれば、契約原本へ続く記録が開いていく。
            </small>
          </div>
          <button className="primary-button" onClick={onProceed}>
            第2週の予定へ <ChevronRight size={19} />
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="management-screen content-page">
      <section className="management-heading">
        <div>
          <p className="eyebrow">TEAM OFFICE</p>
          <h2>チーム編成と育成</h2>
          <p>
            出場 {run.activeTeam.length}/3 ・ 共有P {run.sharedPoints}
          </p>
        </div>
        <div className="management-heading__focus">
          <FighterMark id={selectedId} size="large" />
          <div>
            <span>NOW REVIEWING / {fighter.role}</span>
            <strong>{fighter.name}に、どの強さを残す？</strong>
            <small>
              {recommendedStats.length > 0
                ? `${recommendedStats
                    .map((stat) => statLabels[stat])
                    .join("・")}が、この選手の持ち味`
                : "能力と特性を見比べて育成方針を決める"}
            </small>
          </div>
        </div>
      </section>

      <section className="management-nextbar" aria-label="次の予定">
        <div>
          <span>NEXT</span>
          <strong>{match ? match.name : `第${nextWeek}週`}</strong>
          <small>
            {match
              ? `${run.activeTeam.length}人で出場予定`
              : "編成と育成は自動保存されています"}
          </small>
        </div>
        <button className="primary-button" onClick={onProceed}>
          {match ? (
            <>
              <Swords size={19} /> {match.name}へ
            </>
          ) : (
            <>
              次の週へ <ChevronRight size={19} />
            </>
          )}
        </button>
      </section>

      {run.lastMatchSummary && (
        <div className="result-banner">
          <Medal size={21} />
          {run.lastMatchSummary}
        </div>
      )}

      <section className="management-status" aria-label="チームの準備状況">
        <div>
          <UsersRound size={18} />
          <span>出場枠</span>
          <strong>{run.activeTeam.length}/3</strong>
        </div>
        <div>
          <Star size={18} fill={focusFighter ? "currentColor" : "none"} />
          <span>注目</span>
          <strong>{focusFighter?.name ?? "未設定"}</strong>
        </div>
        <div>
          <WandSparkles size={18} />
          <span>保有育成P</span>
          <strong>
            共有{run.sharedPoints}・固有{fighterPointTotal}
          </strong>
        </div>
        <div>
          <Shield size={18} />
          <span>装備中</span>
          <strong>
            {equippedCount}/{availableRoster.length}
          </strong>
        </div>
      </section>

      <div className="management-layout">
        <aside className="roster-panel">
          <div className="section-title section-title--compact">
            <div>
              <span>
                AVAILABLE {availableRoster.length}/
                {getRouteDefinition(run.route).maxRoster}
              </span>
              <h3>所属選手</h3>
            </div>
            <UsersRound size={21} />
          </div>
          <div className="roster-list">
            {run.roster.map((id) => {
              const entry = fighterById.get(id)!;
              const state = run.fighters[id];
              const active = run.activeTeam.includes(id);
              return (
                <button
                  key={id}
                  className={[
                    "roster-row",
                    selectedId === id ? "is-selected" : "",
                  ].join(" ")}
                  onClick={() => selectFighter(id)}
                >
                  <FighterMark id={id} />
                  <span>
                    <strong>{entry.name}</strong>
                    <small>
                      {state.liberated
                        ? `${entry.role}・自由契約`
                        : `${entry.role}・${conditionLabels[state.condition]}`}
                    </small>
                    <small className="roster-row__meta">
                      {state.liberated
                        ? `本人の意思で在籍・固有P ${state.fighterPoints}${
                            active ? "・出場中" : ""
                          }`
                        : `固有P ${state.fighterPoints}${
                            active ? "・出場中" : ""
                          }`}
                    </small>
                  </span>
                  {state.liberated && (
                    <HeartHandshake size={17} className="liberated-icon" />
                  )}
                  <i className={active ? "active-dot is-on" : "active-dot"} />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="fighter-sheet">
          <div className="fighter-sheet__identity">
            <figure className="fighter-sheet__art" aria-hidden="true">
              <img src={fighterVisual.battle} alt="" />
              <FighterMark id={selectedId} size="small" />
            </figure>
            <div className="fighter-sheet__copy">
              <span>{fighter.kind}</span>
              <h3>{fighter.name}</h3>
              <p>{fighter.summary}</p>
            </div>
            <div className="fighter-sheet__commands">
              <button
                className={
                  run.focusFighterId === selectedId
                    ? "focus-toggle is-active"
                    : "focus-toggle"
                }
                onClick={() => setFocus(selectedId)}
              >
                <Star size={18} fill={run.focusFighterId === selectedId ? "currentColor" : "none"} />
                {run.focusFighterId === selectedId
                    ? "注目中"
                    : "注目選手"}
              </button>
              <button
                className={
                  run.activeTeam.includes(selectedId)
                    ? "team-toggle is-active"
                    : "team-toggle"
                }
                onClick={() => toggleActive(selectedId)}
                disabled={
                  (!run.activeTeam.includes(selectedId) &&
                    run.activeTeam.length >= 3)
                }
              >
                <UserRoundCheck size={18} />
                {run.activeTeam.includes(selectedId)
                  ? "出場中"
                  : run.activeTeam.length >= 3
                    ? "先に1人を控えへ"
                    : "出場させる"}
              </button>
            </div>
          </div>

          <div className="trust-grid">
            <StatBar label="信頼" value={fighterState.trust} tone="trust" />
            <StatBar
              label="所有"
              value={fighterState.ownership}
              tone="ownership"
            />
          </div>

          {isLiberated && (
            <div className="released-notice" role="status">
              <HeartHandshake size={20} />
              <div>
                <strong>契約から自由になり、本人の意思でチームに残っています</strong>
                <span>これまでどおり育成・装備・出場ができ、今後の協力を断る自由も本人にあります。</span>
              </div>
            </div>
          )}

          <div className="sheet-tabs" role="tablist">
            <button
              className={tab === "growth" ? "is-selected" : ""}
              onClick={() => setTab("growth")}
            >
              <WandSparkles size={18} /> 育成
            </button>
            <button
              className={tab === "shop" ? "is-selected" : ""}
              onClick={() => setTab("shop")}
            >
              <ShoppingBag size={18} /> 装備店
            </button>
          </div>

          {tab === "growth" ? (
            <div className="growth-panel">
              <div className="point-source">
                <button
                  className={pointSource === "fighter" ? "is-selected" : ""}
                  disabled={
                    fighterState.fighterPoints === 0 && run.sharedPoints > 0
                  }
                  onClick={() => setPointSource("fighter")}
                >
                  固有P {fighterState.fighterPoints}
                </button>
                <button
                  className={pointSource === "shared" ? "is-selected" : ""}
                  disabled={
                    run.sharedPoints === 0 && fighterState.fighterPoints > 0
                  }
                  onClick={() => setPointSource("shared")}
                >
                  共有P {run.sharedPoints}
                </button>
              </div>
              <div className="growth-guidance">
                <div>
                  <span>{fighter.role}型の注目能力</span>
                  <strong>
                    {recommendedStats.map((stat) => statLabels[stat]).join("・")}
                  </strong>
                </div>
                <button
                  className="secondary-button secondary-button--small"
                  disabled={
                    !recommendedStat || selectedPointBalance <= 0
                  }
                  onClick={() => {
                    if (!recommendedStat) return;
                    allocate(
                      selectedId,
                      recommendedStat,
                      pointSource,
                      Math.min(5, selectedPointBalance),
                    );
                  }}
                >
                  <Sparkles size={16} />
                  おすすめへ{Math.min(5, selectedPointBalance)}P
                </button>
              </div>
              <div className="stats-grid">
                {(Object.keys(statLabels) as Array<keyof Stats>).map((stat) => {
                  const base = fighter.stats[stat];
                  const boost = fighterState.statBoosts[stat] ?? 0;
                  const equipment = selectedItem?.statBoosts[stat] ?? 0;
                  const hasPoint =
                    pointSource === "fighter"
                      ? fighterState.fighterPoints > 0
                      : run.sharedPoints > 0;
                  const availablePoints =
                    pointSource === "fighter"
                      ? fighterState.fighterPoints
                      : run.sharedPoints;
                  return (
                    <div
                      className={`stat-control ${
                        recommendedStats.includes(stat) ? "is-recommended" : ""
                      }`}
                      key={stat}
                    >
                      <span>
                        {statLabels[stat]}
                        {recommendedStats.includes(stat) && <small>注目</small>}
                      </span>
                      <strong>
                        {base + boost + equipment}
                        {(boost > 0 || equipment > 0) && (
                          <small> +{boost + equipment}</small>
                        )}
                      </strong>
                      <div className="stat-control__actions">
                        <button
                          onClick={() => allocate(selectedId, stat, pointSource)}
                          disabled={!hasPoint}
                          title={`${statLabels[stat]}を1上げる`}
                          aria-label={`${statLabels[stat]}を1上げる`}
                        >
                          <Plus size={18} />
                        </button>
                        <button
                          className="stat-control__batch"
                          onClick={() =>
                            allocate(selectedId, stat, pointSource, 5)
                          }
                          disabled={availablePoints < 5}
                          title={`${statLabels[stat]}を5上げる`}
                          aria-label={`${statLabels[stat]}を5上げる`}
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="trait-note">
                <Crown size={19} />
                <div>
                  <strong>{fighter.traitName}</strong>
                  <span>{fighter.traitText}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="shop-panel">
              <div className="equipped-line">
                <Shield size={18} />
                装備中: {selectedItem?.name ?? "なし"}
                {selectedItem && (
                  <button
                    onClick={() => equipItem(selectedId, undefined)}
                  >
                    外す
                  </button>
                )}
              </div>
              <div className="shop-list">
                {itemDefinitions.map((item) => {
                  const owned = run.inventory[item.id] ?? 0;
                  const available =
                    owned -
                    Object.values(run.fighters).filter(
                      (state) =>
                        state.id !== selectedId &&
                        state.equippedItemId === item.id,
                    ).length;
                  return (
                    <div className="shop-item" key={item.id}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.note}</span>
                      </div>
                      <small>所持 {owned}</small>
                      {fighterState.equippedItemId === item.id ? (
                        <button
                          className="secondary-button secondary-button--small"
                          disabled
                        >
                          <Check size={15} />
                          装備中
                        </button>
                      ) : available > 0 ? (
                        <button
                          className="secondary-button secondary-button--small"
                          onClick={() => equipItem(selectedId, item.id)}
                        >
                          装備
                        </button>
                      ) : (
                        <button
                          className="secondary-button secondary-button--small"
                          disabled={run.money < item.cost}
                          onClick={() => {
                            if (buyItem(item.id)) {
                              equipItem(selectedId, item.id);
                              playSound("reward", profile.soundEnabled);
                            }
                          }}
                        >
                          購入 {money(item.cost)}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {run.route === "domination" && run.losses >= 3 && (
        <button className="retire-button" onClick={onRetire}>
          今期をここで切り上げる
        </button>
      )}
    </main>
  );
}

function MatchPrepScreen({ onStart }: { onStart: () => void }) {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  const setBet = useGameStore((state) => state.setBet);
  const toggleActive = useGameStore((state) => state.toggleActive);
  const setBattlePlan = useGameStore((state) => state.setBattlePlan);
  const setBattleTactic = useGameStore((state) => state.setBattleTactic);
  const moveActive = useGameStore((state) => state.moveActive);
  const [prepView, setPrepView] = useState<"lineup" | "strategy">("lineup");
  if (!run?.pendingMatchId) return null;
  const match = getMatchDefinition(run.pendingMatchId)!;
  const bonusMatch = parseBonusMatchId(match.id);
  const tournamentId = bonusMatch?.baseId ?? match.id;
  const tournamentDefinition = getMatchDefinition(tournamentId) ?? match;
  const tournamentRound = (bonusMatch?.round ?? 0) + 1;
  const tournamentTotal = tournamentDefinition.roundsOnWin + 1;
  const isOpeningTournament = tournamentId === "opening-cup";
  const availableRoster = availableRosterIds(run);
  const opponents = opponentsForMatch(run, match);
  const selectedStates = run.activeTeam.map((id) => run.fighters[id]);
  const average = (field: "trust" | "ownership") =>
    selectedStates.length > 0
      ? Math.round(
          selectedStates.reduce((sum, state) => sum + state[field], 0) /
            selectedStates.length,
        )
      : 0;
  const averageTrust = average("trust");
  const averageOwnership = average("ownership");
  const expectedCheerUses =
    averageTrust >= 68 ? 3 : averageTrust < 38 ? 1 : 2;
  const expectedForceUses = averageOwnership >= 68 ? 2 : 1;
  const bets = [0, 500, 1500, 3000].filter(
    (value) => value === 0 || value <= run.money,
  );
  const conditionPower: Record<Condition, number> = {
    good: 1.08,
    normal: 1,
    bad: 0.92,
  };
  const teamPower = run.activeTeam.reduce((total, id) => {
    const definition = fighterById.get(id)!;
    const state = run.fighters[id];
    const item = state.equippedItemId
      ? itemById.get(state.equippedItemId)
      : undefined;
    const value = (Object.keys(statLabels) as Array<keyof Stats>).reduce(
      (sum, stat) =>
        sum +
        definition.stats[stat] +
        (state.statBoosts[stat] ?? 0) +
        (item?.statBoosts[stat] ?? 0),
      0,
    );
    return total + value * conditionPower[state.condition];
  }, 0);
  const routeDifficulty =
    match.difficulty * getRouteDefinition(run.route).battleScale;
  const enemyScale =
    routeDifficulty <= 1
      ? routeDifficulty
      : 1 + (routeDifficulty - 1) * 0.42;
  const enemyPower = opponents.reduce(
    (total, opponent) =>
      total +
      Object.values(opponent.stats).reduce((sum, value) => sum + value, 0),
    0,
  );
  const powerRatio = teamPower / Math.max(1, enemyPower * enemyScale);
  const matchup =
    powerRatio >= 1.65
      ? "圧倒的有利"
      : powerRatio >= 1.08
      ? "有利"
      : powerRatio >= 0.9
        ? "互角"
        : powerRatio >= 0.68
          ? "不利"
          : "かなり不利";
  const matchupWidth = Math.max(8, Math.min(100, powerRatio * 50));
  const fighterMatchupHint = (fighterId: string) => {
    const fighter = fighterById.get(fighterId)!;
    const { attack, defense, magic, speed } = fighter.stats;
    const best = Math.max(attack, defense, magic, speed);
    if (defense === best) return "前で味方を守る";
    if (speed === best) return "先に動いて流れを作る";
    if (magic === best) return "強力な技で攻める";
    return "大きな一撃を狙う";
  };
  const rankedSkillsFor = (fighterId: string) => {
    const fighter = fighterById.get(fighterId)!;
    return [...fighter.skills]
      .sort((left, right) => {
        const score = (entry: SkillDefinition) => {
          return (
            (entry.target === "allEnemies" ? 22 : 0) +
            (entry.kind === "heal" || entry.kind === "guard" ? 18 : 0) +
            entry.power -
            entry.mpCost
          );
        };
        return score(right) - score(left);
      })
      .slice(0, 2);
  };
  const skillMatchupNote = (entry: SkillDefinition) => {
    if (entry.kind === "heal") return "崩れた味方を立て直す";
    if (entry.kind === "guard") return "大技を受け止めて流れを残す";
    if (entry.kind === "debuff") return "敵の能力と判断を乱す";
    if (entry.kind === "buff") return "味方の能力を底上げ";
    if (entry.target === "allEnemies") return "敵全体へ攻撃する";
    if (entry.mpCost === 0) return "MPを使わず攻撃する";
    return `MP ${entry.mpCost}で大きな一撃を狙う`;
  };
  const selectedKeySkills = run.activeTeam.flatMap((id) => {
    const keySkill = rankedSkillsFor(id)[0];
    return keySkill ? [`${fighterById.get(id)!.name}「${keySkill.name}」`] : [];
  });

  return (
    <main className="match-prep match-prep--v2">
      <img
        src="/assets/ui/screen-scenes/match-prep.webp"
        alt=""
        className="arena-backdrop"
      />
      <div className="arena-light" />
      <div className="match-prep-v2__layout">
        <section className="match-brief-v2">
          <header>
            <span>WEEK {run.week} / OFFICIAL MATCH</span>
            <b>第{tournamentRound}試合 / 全{tournamentTotal}試合</b>
          </header>
          <h1>{match.name}</h1>
          <p>{match.story}</p>

          {isOpeningTournament && (
            <div className="match-prize-v2">
              <Crown size={26} />
              <div>
                <span>優勝賞品</span>
                <strong>アルデバラン湯けむり温泉 二泊三日</strong>
              </div>
              <small>館内着と朝食ビュッフェつき</small>
            </div>
          )}

          <div className="match-versus-v2" aria-label="対戦カード">
            <div>
              <span>OWNER</span>
              <strong>ミミのチーム</strong>
              <small>{run.activeTeam.length}人で出場予定</small>
            </div>
            <b>VS</b>
            <div>
              <span>CHALLENGER</span>
              <strong>{match.opponentName}</strong>
              <small>{opponents.length}体編成</small>
            </div>
          </div>

          <div className="opponent-scout-v2">
            <span>対戦記録から分かったこと</span>
            <div>
              {opponents.map((fighter, index) => (
                <article key={fighter.id}>
                  <FighterMark id={fighter.id} size="small" />
                  <div>
                    <b>{fighter.name}</b>
                    <small>
                      {positionLabels[["front", "middle", "rear"][index] as keyof typeof positionLabels]}
                      ・{fighter.role}
                    </small>
                  </div>
                  <em>HP {fighter.stats.hp}</em>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="prep-console-v2">
          <header className="prep-console-v2__summary">
            <div>
              <span>出場準備</span>
              <strong>{run.activeTeam.length}/3人・{battlePlanLabels[run.battlePlan]}・{run.currentBet > 0 ? money(run.currentBet) : "賭けなし"}</strong>
            </div>
            <div className={`prep-matchup-v2 is-${matchup}`}>
              <small>戦力目安</small>
              <strong>{matchup}</strong>
            </div>
          </header>

          <nav className="prep-tabs-v2" aria-label="試合準備メニュー">
            <button
              className={prepView === "lineup" ? "is-selected" : ""}
              onClick={() => setPrepView("lineup")}
            >
              <UsersRound size={18} />
              出場メンバー
              <b>{run.activeTeam.length}/3</b>
            </button>
            <button
              className={prepView === "strategy" ? "is-selected" : ""}
              onClick={() => setPrepView("strategy")}
            >
              <Shield size={18} />
              作戦・賭け
              <b>{battlePlanLabels[run.battlePlan]}</b>
            </button>
          </nav>

          <div className="prep-console-v2__body">
            {prepView === "lineup" ? (
              <div className="prep-lineup-v2">
                <div className="prep-panel-title-v2">
                  <div>
                    <span>LINEUP</span>
                    <h2>誰に任せる？</h2>
                  </div>
                  <p>選んだ順に前衛・中衛・後衛へ並びます。</p>
                </div>

                <div className="lineup-picker-v2">
                  {availableRoster.map((id) => {
                    const fighter = fighterById.get(id)!;
                    const selected = run.activeTeam.includes(id);
                    return (
                      <button
                        key={id}
                        className={selected ? "is-selected" : ""}
                        onClick={() => toggleActive(id)}
                        disabled={!selected && run.activeTeam.length >= 3}
                      >
                        <FighterMark id={id} />
                        <span>
                          <strong>{fighter.name}</strong>
                          <small>
                            {conditionLabels[run.fighters[id].condition]}・{fighterMatchupHint(id)}
                          </small>
                        </span>
                        {selected ? <Check size={17} /> : <Plus size={17} />}
                      </button>
                    );
                  })}
                </div>

                <div className="formation-list-v2">
                  {run.activeTeam.length === 0 ? (
                    <div className="formation-empty-v2">
                      <UsersRound size={24} />
                      <strong>まず一人、出場選手を選びましょう</strong>
                      <span>選手を選ぶと、ここで並び順と戦い方を決められます。</span>
                    </div>
                  ) : (
                    run.activeTeam.map((id, index) => {
                      const fighter = fighterById.get(id)!;
                      const position = ["front", "middle", "rear"][index] as
                        | "front"
                        | "middle"
                        | "rear";
                      const keySkill = rankedSkillsFor(id)[0];
                      return (
                        <article className="formation-card-v2" key={id}>
                          <b>{positionLabels[position]}</b>
                          <FighterMark id={id} />
                          <div className="formation-card-v2__identity">
                            <strong>{fighter.name}</strong>
                            <small>{fighter.role}・{fighterMatchupHint(id)}</small>
                            {keySkill && (
                              <em>
                                有効技「{keySkill.name}」 {skillMatchupNote(keySkill)}
                              </em>
                            )}
                          </div>
                          <label>
                            <span>戦い方</span>
                            <select
                              aria-label={`${fighter.name}の戦い方`}
                              value={run.battleTactics?.[id] ?? "signature"}
                              onChange={(event) =>
                                setBattleTactic(id, event.target.value as BattleTactic)
                              }
                            >
                              {(Object.keys(tacticLabels) as BattleTactic[]).map((tactic) => (
                                <option value={tactic} key={tactic}>
                                  {tacticLabels[tactic]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="formation-card-v2__order">
                            <button
                              title="前へ移動"
                              aria-label={`${fighter.name}を前へ移動`}
                              disabled={index === 0}
                              onClick={() => moveActive(id, -1)}
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              title="後ろへ移動"
                              aria-label={`${fighter.name}を後ろへ移動`}
                              disabled={index === run.activeTeam.length - 1}
                              onClick={() => moveActive(id, 1)}
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="prep-strategy-v2">
                <div className="prep-panel-title-v2">
                  <div>
                    <span>GAME PLAN</span>
                    <h2>どう勝ちにいく？</h2>
                  </div>
                  <p>迷ったら「均衡」のままで大丈夫です。</p>
                </div>

                <div className="plan-picker-v2">
                  {(
                    [
                      ["assault", "攻勢", "先に崩す", "攻撃・魔力↑ / 防御↓"],
                      ["balanced", "均衡", "普段どおり", "能力補正なし"],
                      ["guarded", "堅守", "耐えて返す", "防御↑ / 攻撃・速度↓"],
                    ] as Array<[BattlePlan, string, string, string]>
                  ).map(([id, label, catchcopy, note]) => (
                    <button
                      key={id}
                      className={run.battlePlan === id ? "is-selected" : ""}
                      onClick={() => setBattlePlan(id)}
                    >
                      <strong>{label}</strong>
                      <b>{catchcopy}</b>
                      <span>{note}</span>
                    </button>
                  ))}
                </div>

                <div className="strategy-readout-v2">
                  <section>
                    <span>今回の勝ち筋</span>
                    <strong>
                      {selectedKeySkills.length > 0
                        ? "役割をつないで主力技を通す"
                        : "耐えて大技の機会を作る"}
                    </strong>
                    <p>
                      {selectedKeySkills.length > 0
                        ? selectedKeySkills.slice(0, 2).join("、")
                        : "出場選手を選ぶと、主力技と役割をここへ表示します。"}
                    </p>
                  </section>
                  <section aria-label={`戦力目安は${matchup}`}>
                    <span>戦力目安</span>
                    <strong>{matchup}</strong>
                    <div className="matchup-meter-v2">
                      <i style={{ width: `${matchupWidth}%` }} />
                    </div>
                    <p>体調・人数・装備を含む目安です。</p>
                  </section>
                  <section>
                    <span>監督ができること</span>
                    <strong>声掛け{expectedCheerUses}・強制{expectedForceUses}・読む2</strong>
                    <p>重要局面だけ、ミミが指示できます。</p>
                  </section>
                </div>

                <div className="bet-panel-v2">
                  <header>
                    <Dices size={20} />
                    <div>
                      <span>OPTIONAL BET</span>
                      <strong>この試合に賭ける</strong>
                    </div>
                    <small>負けても周回は続きます</small>
                  </header>
                  <div>
                    {bets.map((value) => (
                      <button
                        key={value}
                        className={run.currentBet === value ? "is-selected" : ""}
                        onClick={() => {
                          setBet(value);
                          playSound("bet", profile.soundEnabled);
                        }}
                      >
                        {value === 0 ? "賭けない" : money(value)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="prep-console-v2__footer">
            <div>
              <span>READY</span>
              <strong>
                {run.activeTeam.length === 0
                  ? "出場選手を選んでください"
                  : `${run.activeTeam.map((id) => fighterById.get(id)!.name).join("・")}で挑む`}
              </strong>
            </div>
            <button disabled={run.activeTeam.length === 0} onClick={onStart}>
              <Swords size={21} />
              試合開始
              <ChevronRight size={18} />
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

function groupBattlePresentationEvents(
  events: BattlePresentationEvent[],
): BattlePresentationEvent[] {
  return events.reduce<BattlePresentationEvent[]>((grouped, event) => {
    const previous = grouped.at(-1);
    const mergeable =
      previous &&
      (event.kind === "damage" || event.kind === "heal") &&
      previous.kind === event.kind &&
      previous.turn === event.turn &&
      previous.actorId === event.actorId &&
      previous.skillName === event.skillName;
    if (!mergeable) {
      grouped.push({
        ...event,
        targetIds: [...event.targetIds],
        targets: event.targets.map((target) => ({
          ...target,
          tags: [...target.tags],
        })),
      });
      return grouped;
    }

    previous.id = `${previous.id}+${event.id}`;
    previous.targetIds = [...new Set([...previous.targetIds, ...event.targetIds])];
    previous.targets = [...previous.targets, ...event.targets];
    previous.momentumAfter = event.momentumAfter ?? previous.momentumAfter;
    const total = previous.targets.reduce(
      (sum, target) => sum + (target.value ?? 0),
      0,
    );
    previous.detail =
      previous.kind === "heal"
        ? `味方${previous.targets.length}体のHPを合計${total}回復`
        : `${previous.targets.length}体に合計${total}ダメージ`;
    return grouped;
  }, []);
}

const presentationTone = (event: BattlePresentationEvent) => {
  if (event.kind === "trait" || event.kind === "manager") return "system";
  return event.side === "player" ? "good" : "bad";
};

type BattleStatusChip = {
  id: string;
  label: string;
  tone: "up" | "down" | "guard";
};

const persistentBattleStatuses = (unit: BattleUnit): BattleStatusChip[] => {
  const stats = [
    ["attack", "攻撃", unit.attackBuff],
    ["magic", "魔力", unit.magicBuff],
    ["defense", "防御", unit.defenseBuff],
    ["speed", "速度", unit.speedBuff],
  ] as const;
  const chips: BattleStatusChip[] = stats.flatMap(([id, label, value]) =>
    Math.abs(value) < 0.01
      ? []
      : [{ id, label: `${label}${value > 0 ? "↑" : "↓"}`, tone: value > 0 ? "up" as const : "down" as const }],
  );
  if (unit.guarding) chips.push({ id: "guard", label: "防御中", tone: "guard" });
  if (unit.barrier > 0) chips.push({ id: "barrier", label: `障壁 ${Math.round(unit.barrier)}`, tone: "guard" });
  return chips.slice(0, 5);
};

const presentedBattleStatuses = (
  event: BattlePresentationEvent | undefined,
  targeted: boolean,
  impacted: boolean,
): BattleStatusChip[] => {
  if (!event || !targeted || !impacted) return [];
  if (event.kind === "guard") {
    return [{ id: "guard", label: "防御↑", tone: "guard" }];
  }
  if (event.kind === "buff") {
    return [
      { id: "attack", label: "攻撃↑", tone: "up" },
      { id: "magic", label: "魔力↑", tone: "up" },
    ];
  }
  if (event.kind === "debuff") {
    return [
      { id: "attack", label: "攻撃↓", tone: "down" },
      { id: "defense", label: "防御↓", tone: "down" },
    ];
  }
  if (event.kind === "manager") {
    if (event.detail.includes("攻撃と速度")) {
      return [
        { id: "attack", label: "攻撃↑", tone: "up" },
        { id: "speed", label: "速度↑", tone: "up" },
      ];
    }
    if (event.detail.includes("防御")) {
      return [{ id: "defense", label: "防御↑", tone: "guard" }];
    }
    if (event.detail.includes("魔力")) {
      return [{ id: "magic", label: "魔力↑", tone: "up" }];
    }
  }
  return [];
};

const opponentBattleSizes: Record<
  string,
  "small" | "standard" | "large" | "giant"
> = {
  "rookie-piyo-slime": "small",
  "rookie-kobold": "standard",
  "rookie-bat-mage": "small",
};

function BattleTechniqueShowcase({
  unit,
  event,
}: {
  unit: BattleUnit;
  event: BattlePresentationEvent;
}) {
  const playerVisual =
    unit.side === "player" ? characterVisuals[unit.fighterId] : undefined;
  const visual = playerVisual ?? opponentVisuals[unit.fighterId];
  const hasKeyArt = Boolean(playerVisual?.battleCutIn);

  return (
    <motion.div
      className={`battle-technique-showcase battle-technique-showcase--${unit.side} battle-technique-showcase--${event.element} ${
        hasKeyArt ? "has-key-art" : "has-live-art"
      }`}
      initial={{
        opacity: 0,
        clipPath:
          unit.side === "player"
            ? "polygon(0 0, 0 0, 0 100%, 0 100%)"
            : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
      }}
      animate={{
        opacity: 1,
        clipPath: "polygon(0 0, 100% 0, 94% 100%, 6% 100%)",
      }}
      exit={{ opacity: 0, scale: 1.025 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
      aria-label={`${unit.name}が${event.skillName}を発動`}
    >
      <motion.div
        className="battle-technique-showcase__art"
        initial={{ scale: 1.08, x: unit.side === "player" ? 20 : -20 }}
        animate={{ scale: 1, x: 0 }}
        transition={{ duration: 0.68, ease: "easeOut" }}
      >
        {playerVisual?.battleCutIn ? (
          <img
            src={playerVisual.battleCutIn}
            alt=""
            style={{ objectPosition: playerVisual.battleCutInPosition ?? "center" }}
          />
        ) : visual ? (
          <img src={visual.battle} alt="" className="is-standing-art" />
        ) : (
          <FighterChibi id={unit.fighterId} mood="cheer" />
        )}
      </motion.div>
      <span className="battle-technique-showcase__speedline" aria-hidden="true" />
      <div className="battle-technique-showcase__copy">
        <span>{unit.side === "player" ? "SECRET BOSS ARTS" : "RIVAL ACTION"}</span>
        <strong>{event.skillName}</strong>
        <small>{unit.name}</small>
      </div>
    </motion.div>
  );
}

function BattleCombatant({
  unit,
  displayHp,
  displayMp,
  event,
  striking,
  impacted,
}: {
  unit: BattleUnit;
  displayHp: number;
  displayMp: number;
  event?: BattlePresentationEvent;
  striking: boolean;
  impacted: boolean;
}) {
  const hpPercent = Math.max(0, (displayHp / unit.maxHp) * 100);
  const mpPercent = Math.max(0, (displayMp / unit.maxMp) * 100);
  const acting = event?.actorId === unit.instanceId;
  const targeted = event?.targetIds.includes(unit.instanceId) ?? false;
  const offensiveAction =
    event?.kind === "damage" ||
    event?.kind === "debuff" ||
    event?.kind === "miss";
  const visualDefeated = displayHp <= 0;
  const change = event?.targets.find(
    (target) => target.instanceId === unit.instanceId,
  );
  const impactClass =
    event?.kind === "heal"
      ? "is-healed"
      : event?.kind === "buff" ||
          event?.kind === "guard" ||
          event?.kind === "trait" ||
          event?.kind === "manager"
        ? "is-supported"
        : targeted
          ? "is-hit"
          : "";
  const standingVisual =
    unit.side === "player"
      ? characterVisuals[unit.fighterId]
      : opponentVisuals[unit.fighterId];
  const battleSize =
    standingVisual?.battleSize ?? opponentBattleSizes[unit.fighterId] ?? "standard";
  const attackDirection = unit.side === "player" ? 1 : -1;
  const recoilDirection = -attackDirection;
  const statusChips = event
    ? presentedBattleStatuses(event, targeted, impacted)
    : persistentBattleStatuses(unit);
  const portraitAnimation = acting
    ? offensiveAction
      ? striking
        ? {
            x: [
              attackDirection * -12,
              attackDirection * -18,
              attackDirection * 140,
              attackDirection * 92,
              0,
            ],
            y: [-8, -11, -22, -7, 0],
            scale: [1.03, 1.02, 1.1, 1.05, 1],
            rotate: [0, attackDirection * -1.4, attackDirection * 1.8, 0, 0],
          }
        : impacted
          ? { x: 0, y: 0, scale: 1, rotate: 0 }
        : {
            x: attackDirection * -12,
            y: -8,
            scale: 1.03,
            rotate: attackDirection * -1,
          }
      : { x: 0, y: [0, -11, -5], scale: [1, 1.045, 1.02], rotate: 0 }
    : targeted && impacted && offensiveAction
      ? {
          x: [0, recoilDirection * 25, recoilDirection * 13, 0],
          y: [0, 4, -2, 0],
          scale: [1, 0.97, 1.015, 1],
          rotate: [0, recoilDirection * 2.2, recoilDirection * -0.8, 0],
        }
      : { x: 0, y: 0, scale: 1, rotate: 0 };
  return (
    <motion.article
      layout
      className={`battle-combatant battle-combatant--${unit.side} ${
        visualDefeated ? "is-defeated" : ""
      } ${acting ? "is-acting" : ""
      } ${targeted ? `is-targeted ${impactClass}` : ""}`}
      data-battle-size={battleSize}
    >
      <motion.div
        className="battle-combatant__portrait"
        aria-hidden="true"
        animate={portraitAnimation}
        transition={
          acting && offensiveAction && striking
            ? {
                duration: 0.68,
                times: [0, 0.18, 0.5, 0.76, 1],
                ease: "easeOut",
              }
            : targeted && impacted && offensiveAction
              ? { duration: 0.42, times: [0, 0.34, 0.68, 1], ease: "easeOut" }
              : { duration: 0.34, ease: "easeOut" }
        }
      >
        <span className="battle-combatant__ground" />
        <span className="battle-combatant__aura" />
        {standingVisual ? (
          <img
            src={standingVisual.battle}
            alt=""
            className={`battle-character-art battle-character-art--${unit.fighterId}`}
          />
        ) : (
          <FighterChibi
            id={unit.fighterId}
            mood={acting ? "cheer" : visualDefeated ? "rest" : "idle"}
          />
        )}
        <span className="battle-position-badge">
          {positionLabels[unit.position]}
        </span>
        {targeted && offensiveAction && !impacted && !striking && (
          <motion.span
            className="battle-target-reticle"
            initial={{ opacity: 0, scale: 1.25 }}
            animate={{ opacity: 1, scale: 1 }}
          />
        )}
        {targeted && impacted && offensiveAction && (
          <motion.span
            className="battle-impact-sigil battle-impact-sigil--neutral"
            key={`impact-${event?.id}-${unit.instanceId}`}
            initial={{ opacity: 0, scale: 0.25, rotate: -28 }}
            animate={{ opacity: [0, 1, 0], scale: [0.25, 1.25, 1.8], rotate: 8 }}
            transition={{ duration: 0.48, ease: "easeOut" }}
          >
            ✦
          </motion.span>
        )}
        {acting && striking && <span className="battle-combatant__action-trail" />}
      </motion.div>
      <div className="battle-combatant__body">
        <div className="battle-card-identity">
          <FighterMark id={unit.fighterId} size="normal" />
          <div className="battle-combatant__name">
            <strong>{unit.name}</strong>
            <small>{unit.role}</small>
          </div>
          <span className={`battle-card-side battle-card-side--${unit.side}`}>
            {unit.side === "player" ? "味方" : "相手"}
          </span>
        </div>
        <div className="battle-resource battle-resource--hp">
          <span style={{ width: `${hpPercent}%` }} />
          <b>HP {Math.round(displayHp)}/{unit.maxHp}</b>
        </div>
        <div className="battle-resource battle-resource--mp">
          <span style={{ width: `${mpPercent}%` }} />
          <b>MP {Math.round(displayMp)}/{unit.maxMp}</b>
        </div>
        <AnimatePresence mode="popLayout">
          {statusChips.length > 0 && (
            <motion.div
              className="battle-status-ribbon"
              key={`${event?.id ?? "persistent"}:${statusChips.map((chip) => chip.id).join("-")}`}
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              aria-label={`状態変化 ${statusChips.map((chip) => chip.label).join("、")}`}
            >
              {statusChips.map((chip) => (
                <span
                  className={`battle-status-chip battle-status-chip--${chip.tone}`}
                  key={chip.id}
                >
                  <b aria-hidden="true">{chip.tone === "down" ? "↓" : chip.tone === "up" ? "↑" : "◆"}</b>
                  {chip.label}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="battle-combatant__states">
          {!event && unit.barrier > 0 && <span>障壁 {Math.round(unit.barrier)}</span>}
          {event?.kind === "guard" && targeted && <span>防御</span>}
          {event?.kind === "trait" && acting && <span>{unit.traitName}</span>}
        </div>
      </div>
      <AnimatePresence>
        {targeted &&
          impacted &&
          (event?.kind === "damage" ||
            event?.kind === "heal" ||
            event?.kind === "miss") && (
            <motion.div
              className={`battle-float battle-float--${event?.kind ?? "damage"}`}
              key={`${event?.id}:${unit.instanceId}`}
              initial={{ opacity: 0, y: 18, scale: 0.8 }}
              animate={{ opacity: 1, y: -24, scale: 1 }}
              exit={{ opacity: 0, y: -42 }}
            >
              {event?.kind === "miss"
                ? "かわした"
                : event?.kind === "heal"
                  ? `回復 +${change?.value ?? 0}`
                  : `-${change?.value ?? 0}`}
              {change?.tags.map((tag) => <b key={tag}>{battleTagLabel(tag)}</b>)}
            </motion.div>
          )}
      </AnimatePresence>
    </motion.article>
  );
}

const spectatorTeamMeta: Record<
  SpectatorSide,
  { name: string; label: string; short: string }
> = {
  azure: { name: "蒼天サイド", label: "AZURE SIDE", short: "蒼" },
  coral: { name: "珊瑚サイド", label: "CORAL SIDE", short: "珊" },
};

function SpectatorFighter({
  fighterId,
  side,
  acting,
  hit,
}: {
  fighterId: string;
  side: SpectatorSide;
  acting: boolean;
  hit: boolean;
}) {
  const fighter = fighterById.get(fighterId);
  const visual = characterVisuals[fighterId];
  if (!fighter || !visual) return null;
  return (
    <motion.article
      className={`spectator-fighter spectator-fighter--${side} ${
        acting ? "is-acting" : ""
      } ${hit ? "is-hit" : ""}`}
      data-battle-size={visual.battleSize}
      animate={
        acting
          ? { x: side === "azure" ? [0, 52, 22] : [0, -52, -22], y: [0, -13, 0] }
          : hit
            ? { x: [0, -10, 8, 0], opacity: [1, 0.7, 1] }
            : { x: 0, y: 0, opacity: 1 }
      }
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="spectator-fighter__art">
        <span className="spectator-fighter__halo" />
        <img src={visual.battle} alt={visual.alt} />
      </div>
      <div className="spectator-fighter__name">
        <strong>{fighter.name}</strong>
        <small>{fighter.role}</small>
      </div>
    </motion.article>
  );
}

function SpectatorBattleScreen() {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  const startSpectatorMatch = useGameStore(
    (state) => state.startSpectatorMatch,
  );
  const resolveSpectatorMatch = useGameStore(
    (state) => state.resolveSpectatorMatch,
  );
  const dismissSpectatorMatch = useGameStore(
    (state) => state.dismissSpectatorMatch,
  );
  const setBattleSpeed = useGameStore((state) => state.setBattleSpeed);
  const [selectedSide, setSelectedSide] = useState<SpectatorSide>();
  const [stake, setStake] = useState(() => Math.min(200, run?.money ?? 0));
  const [revealStep, setRevealStep] = useState(() =>
    run?.spectatorMatch?.status === "resolved" ? 3 : 0,
  );
  const resolvedRef = useRef(false);
  const spectator = run?.spectatorMatch;

  useEffect(() => {
    if (spectator?.status !== "watching") return;
    if (resolvedRef.current) return;
    const delay = profile.battleSpeed === "fast" ? 460 : 880;
    const timer = window.setTimeout(() => {
      if (revealStep < 3) {
        setRevealStep((step) => Math.min(3, step + 1));
        return;
      }
      resolvedRef.current = true;
      resolveSpectatorMatch();
    }, revealStep === 0 ? delay * 0.72 : delay);
    return () => window.clearTimeout(timer);
  }, [
    profile.battleSpeed,
    revealStep,
    resolveSpectatorMatch,
    spectator?.id,
    spectator?.status,
  ]);

  useEffect(() => {
    if (spectator?.status === "resolved") setRevealStep(3);
  }, [spectator?.status]);

  useEffect(() => {
    if (revealStep === 0) return;
    playSound(
      revealStep === 3 ? "battleBreak" : revealStep === 2 ? "battleSkill" : "battleHit",
      profile.soundEnabled,
    );
  }, [profile.soundEnabled, revealStep]);

  if (!run || !spectator) return null;
  const teams: Record<SpectatorSide, string[]> = {
    azure: spectator.azureFighterIds,
    coral: spectator.coralFighterIds,
  };
  const definitions = Object.fromEntries(
    (["azure", "coral"] as SpectatorSide[]).map((side) => [
      side,
      teams[side]
        .map((id) => fighterById.get(id))
        .filter((fighter): fighter is NonNullable<typeof fighter> => Boolean(fighter)),
    ]),
  ) as Record<SpectatorSide, Array<NonNullable<ReturnType<typeof fighterById.get>>>>;
  const allFighters = [...definitions.azure, ...definitions.coral];
  const winnerFighters = definitions[spectator.winnerSide];
  const loserSide: SpectatorSide =
    spectator.winnerSide === "azure" ? "coral" : "azure";
  const fastest = [...allFighters].sort(
    (left, right) => right.stats.speed - left.stats.speed,
  )[0];
  const finisher = [...winnerFighters].sort(
    (left, right) =>
      right.stats.attack + right.stats.magic -
      (left.stats.attack + left.stats.magic),
  )[0];
  const support = winnerFighters.find((fighter) => fighter.id !== finisher?.id) ?? finisher;
  const decisiveSkill = [...(finisher?.skills ?? [])].sort(
    (left, right) => right.power - left.power,
  )[0];
  const supportSkill = support?.skills.find((skill) => skill.mpCost > 0) ?? support?.skills[0];
  const openingSkill = fastest?.skills[0];
  const activeFighterId =
    revealStep === 1
      ? fastest?.id
      : revealStep === 2
        ? support?.id
        : revealStep >= 3
          ? finisher?.id
          : undefined;
  const activeSide: SpectatorSide | undefined = activeFighterId
    ? definitions.azure.some((fighter) => fighter.id === activeFighterId)
      ? "azure"
      : "coral"
    : undefined;
  const actionCopy =
    revealStep === 0
      ? { phase: "MATCH READY", title: "歓声が満ちる。勝負はまだ、どちらにも転ぶ", detail: "両チーム、入場完了" }
      : revealStep === 1
        ? { phase: "FIRST MOVE", title: `${fastest?.name ?? "先鋒"}が先手を奪う`, detail: `${openingSkill?.name ?? "通常攻撃"}・速度差が最初の一手を決めた` }
        : revealStep === 2
          ? { phase: "CHAIN CHECK", title: `${spectatorTeamMeta[spectator.winnerSide].name}の連携が通る`, detail: `${supportSkill?.name ?? "連携技"}・役割の噛み合わせで勝負どころをつかむ` }
          : { phase: "FINAL DRAW", title: `${finisher?.name ?? "決着役"}、${decisiveSkill?.name ?? "決着技"}`, detail: `${spectatorTeamMeta[spectator.winnerSide].name}が決着を引き寄せた` };
  const teamHp = (side: SpectatorSide) => {
    if (revealStep === 0) return 100;
    if (revealStep === 1) return side === activeSide ? 94 : 82;
    if (revealStep === 2) return side === spectator.winnerSide ? 76 : 38;
    return side === spectator.winnerSide ? 58 : 0;
  };
  const selectedWon = spectator.selectedSide === spectator.winnerSide;
  const stakeOptions = [...new Set([0, Math.min(200, run.money), Math.min(500, run.money)])]
    .filter((value) => value >= 0)
    .sort((left, right) => left - right);

  if (spectator.status === "offer") {
    return (
      <main className="spectator-screen spectator-screen--offer">
        <img src="/assets/battle/arena-daylight-v2.png" alt="" className="arena-backdrop" />
        <div className="battle-shade" />
        <header className="spectator-heading">
          <div>
            <span>AFTER MATCH / SPECIAL CARD</span>
            <h1>次の試合で、取り返す？</h1>
            <p>準決勝・他選手二対二。観戦だけでも構いません。</p>
          </div>
          <div className="spectator-wallet">
            <CircleDollarSign size={20} />
            <span>所持金</span>
            <strong>{money(run.money)}</strong>
          </div>
        </header>
        <section className="spectator-card-select" aria-label="応援するチームを選択">
          {(["azure", "coral"] as SpectatorSide[]).map((side) => (
            <button
              key={side}
              className={`spectator-team-card spectator-team-card--${side} ${
                selectedSide === side ? "is-selected" : ""
              }`}
              onClick={() => setSelectedSide(side)}
              aria-pressed={selectedSide === side}
            >
              <div className="spectator-team-card__title">
                <span>{spectatorTeamMeta[side].label}</span>
                <strong>{spectatorTeamMeta[side].name}</strong>
                <b>{spectator.odds[side].toFixed(2)}倍</b>
              </div>
              <div className="spectator-team-card__fighters">
                {teams[side].map((fighterId) => {
                  const fighter = fighterById.get(fighterId);
                  const visual = characterVisuals[fighterId];
                  if (!fighter || !visual) return null;
                  return (
                    <div key={fighterId} data-battle-size={visual.battleSize}>
                      <img src={visual.battle} alt={visual.alt} />
                      <span>
                        <strong>{fighter.name}</strong>
                        <small>{fighter.role}</small>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="spectator-team-card__read">
                <Gauge size={17} />
                <span>
                  {side === (spectator.odds.azure <= spectator.odds.coral ? "azure" : "coral")
                    ? "本命・安定した総合力"
                    : "対抗・決まれば高配当"}
                </span>
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
        </section>
        <footer className="spectator-bet-dock">
          <div>
            <span>BET</span>
            <strong>{stake === 0 ? "観戦のみ" : money(stake)}</strong>
          </div>
          <div className="segmented-control spectator-stakes">
            {stakeOptions.map((value) => (
              <button
                key={value}
                className={stake === value ? "is-selected" : ""}
                onClick={() => setStake(value)}
              >
                {value === 0 ? "賭けない" : `${value} G`}
              </button>
            ))}
          </div>
          <button
            className="spectator-start"
            disabled={!selectedSide}
            onClick={() => selectedSide && startSpectatorMatch(selectedSide, stake)}
          >
            <Eye size={19} />
            {stake > 0 ? "このチームに賭けて観戦" : "このチームを応援して観戦"}
          </button>
        </footer>
      </main>
    );
  }

  const skipResolution = () => {
    if (resolvedRef.current || spectator.status !== "watching") return;
    resolvedRef.current = true;
    setRevealStep(3);
    window.setTimeout(resolveSpectatorMatch, 180);
  };

  return (
    <main className={`spectator-screen spectator-screen--battle spectator-screen--${spectator.status}`}>
      <img src="/assets/battle/arena-daylight-v2.png" alt="" className="arena-backdrop" />
      <div className="battle-shade" />
      <header className="spectator-battle-top">
        <div>
          <span>他選手試合・準決勝</span>
          <strong>二対二 / 観戦席</strong>
        </div>
        <div className="spectator-auto">
          <Eye size={16} />
          <span>観戦AUTO</span>
          <div className="segmented-control segmented-control--dark">
            <button
              className={profile.battleSpeed === "normal" ? "is-selected" : ""}
              onClick={() => setBattleSpeed("normal")}
            >
              1x
            </button>
            <button
              className={profile.battleSpeed === "fast" ? "is-selected" : ""}
              onClick={() => setBattleSpeed("fast")}
            >
              2x
            </button>
          </div>
          {spectator.status === "watching" && (
            <button className="spectator-skip" onClick={skipResolution}>
              <FastForward size={16} /> SKIP
            </button>
          )}
        </div>
      </header>
      <section className="spectator-arena">
        {(["azure", "coral"] as SpectatorSide[]).map((side) => (
          <div className={`spectator-side spectator-side--${side}`} key={side}>
            <header>
              <span>{spectatorTeamMeta[side].label}</span>
              <strong>{spectatorTeamMeta[side].name}</strong>
              <div className="spectator-team-hp">
                <i style={{ width: `${teamHp(side)}%` }} />
                <b>TEAM HP {teamHp(side)}%</b>
              </div>
            </header>
            <div className="spectator-lineup">
              {teams[side].map((fighterId) => (
                <SpectatorFighter
                  key={fighterId}
                  fighterId={fighterId}
                  side={side}
                  acting={activeFighterId === fighterId && revealStep > 0}
                  hit={side === loserSide && revealStep >= 2}
                />
              ))}
            </div>
          </div>
        ))}
        <div className={`spectator-action-focus spectator-action-focus--step-${revealStep}`}>
          <div>
            <span>{actionCopy.phase}</span>
            <strong>{actionCopy.title}</strong>
            <small>{actionCopy.detail}</small>
          </div>
          <div className="spectator-resolution-lamps" aria-label={`判定 ${revealStep}/3`}>
            <b className={revealStep >= 1 ? "is-on" : ""}>先手</b>
            <b className={revealStep >= 2 ? "is-on" : ""}>連携</b>
            <b className={revealStep >= 3 ? "is-on is-fate" : ""}>決着</b>
          </div>
        </div>
      </section>
      <footer className={`spectator-ticket spectator-ticket--${spectator.status}`}>
        <div>
          <span>MY TICKET</span>
          <strong>{spectatorTeamMeta[spectator.selectedSide ?? "azure"].name}</strong>
          <b>{spectator.stake === 0 ? "応援のみ" : `${money(spectator.stake)} → ${money(spectator.payout)}`}</b>
        </div>
        {spectator.status === "resolved" ? (
          <div className="spectator-payout">
            <span>
              {spectator.stake === 0
                ? selectedWon
                  ? "応援勝利"
                  : "応援惜敗"
                : selectedWon
                  ? "的中"
                  : "惜敗"}
            </span>
            <strong>
              {spectator.stake === 0
                ? "観戦のみ"
                : selectedWon
                  ? `払戻 ${money(spectator.payout)}`
                  : "払戻 0 G"}
            </strong>
            <button onClick={dismissSpectatorMatch}>
              自分の試合結果へ <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <div className="spectator-live-mark">
            <span />
            LIVE
          </div>
        )}
      </footer>
    </main>
  );
}

function BattleEntryFighter({ unit }: { unit?: BattleUnit }) {
  if (!unit) return null;
  const visual =
    unit.side === "player"
      ? characterVisuals[unit.fighterId]
      : opponentVisuals[unit.fighterId];
  return (
    <figure className="battle-entry-fighter">
      {visual ? (
        <img
          src={visual.battle}
          alt={visual.alt}
          style={{ objectPosition: `${visual.focusX}% bottom` }}
        />
      ) : (
        <FighterChibi id={unit.fighterId} />
      )}
      <figcaption>{unit.name}</figcaption>
    </figure>
  );
}

type BattleIntroductionLine = {
  label: string;
  headline: string;
  body: string;
};

const battleSlotLabel = (index: number, total: number) => {
  if (total === 1) return "先鋒";
  if (index === total - 1) return "大将";
  return index === 0 ? "先鋒" : "次鋒";
};

const battleAnnouncedName = (unit: BattleUnit, index: number, total: number) => {
  const name = unit.name.replace(/^(代表|先鋒|次鋒|大将)・/, "");
  return `${battleSlotLabel(index, total)}・${name}`;
};

const buildBattleIntroductionLines = (
  matchName: string,
  opponentName: string,
  player: BattleUnit[],
  enemy: BattleUnit[],
): BattleIntroductionLine[] => [
  {
    label: "開会宣言",
    headline: `「お待たせしました！　${matchName}、これより試合開始です！」`,
    body: `${opponentName}とミミのチーム。両チームの選手をご紹介します。`,
  },
  ...enemy.map((unit, index) => ({
    label: `${opponentName}・選手紹介`,
    headline: `「東門より、${battleAnnouncedName(unit, index, enemy.length)}！」`,
    body: `${unit.role}として出場。HPは${unit.maxHp}です。`,
  })),
  ...player.map((unit, index) => ({
    label: "ミミのチーム・選手紹介",
    headline: `「対する西門、${battleAnnouncedName(unit, index, player.length)}！」`,
    body: `${unit.role}として出場。HPは${unit.maxHp}です。`,
  })),
  {
    label: "試合開始",
    headline: "「両チーム、出そろいました！　第1ターン、開始！」",
    body: "選手は自分で行動します。技が決まるたび、結果を一つずつお伝えします。",
  },
];

function BattleScreen({
  onSettled,
  onRecover,
}: {
  onSettled: (result: { bonus: boolean; ended: boolean; won: boolean }) => void;
  onRecover: () => void;
}) {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  const stepBattle = useGameStore((state) => state.stepBattle);
  const finishBattlePresentation = useGameStore(
    (state) => state.finishBattlePresentation,
  );
  const finishBattleNow = useGameStore((state) => state.finishBattleNow);
  const intervene = useGameStore((state) => state.intervene);
  const settleBattle = useGameStore((state) => state.settleBattle);
  const prepareSpectatorMatch = useGameStore(
    (state) => state.prepareSpectatorMatch,
  );
  const setBattleSpeed = useGameStore((state) => state.setBattleSpeed);
  const [command, setCommand] = useState<
    "main" | "read" | "force" | "rally" | "shift"
  >("main");
  const [battleStarted, setBattleStarted] = useState(false);
  const [battleIntroIndex, setBattleIntroIndex] = useState<number | null>(null);
  const [battlePlayback, setBattlePlayback] = useState<
    "manual" | "auto" | "highlights"
  >("manual");
  const [paused, setPaused] = useState(true);
  const [presentationIndex, setPresentationIndex] = useState(0);
  const [presentationStriking, setPresentationStriking] = useState(false);
  const [presentationImpacted, setPresentationImpacted] = useState(false);
  const [resolutionStep, setResolutionStep] = useState(0);
  const [visualHp, setVisualHp] = useState<Record<string, number>>({});
  const [visualMp, setVisualMp] = useState<Record<string, number>>({});
  const soundedEventRef = useRef<string>();
  const soundedImpactRef = useRef<string>();
  const soundedResolutionRef = useRef<string>();
  const battle = run?.battle;
  const battleIntroLineCount = battle
    ? battle.player.length + battle.enemy.length + 2
    : 0;
  const presentationEvents = useMemo(
    () => groupBattlePresentationEvents(battle?.presentationEvents ?? []),
    [battle?.presentationEvents],
  );
  const presentationKey = presentationEvents
    .map((event) => event.id)
    .join("|");
  const presentationMpTimeline = useMemo(() => {
    if (!battle) {
      return {
        initial: {} as Record<string, number>,
        after: {} as Record<string, Record<string, number>>,
      };
    }
    const units = [...battle.player, ...battle.enemy];
    const byId = new Map(units.map((unit) => [unit.instanceId, unit]));
    const initial = Object.fromEntries(
      units.map((unit) => [unit.instanceId, unit.mp]),
    );
    const chargedActors = new Set<string>();
    const costByEvent = Object.fromEntries(
      presentationEvents.map((event) => {
        const cost =
          byId
            .get(event.actorId ?? "")
            ?.skills.find((skill) => skill.name === event.skillName)?.mpCost ?? 0;
        if (!event.actorId || cost <= 0 || chargedActors.has(event.actorId)) {
          return [event.id, 0];
        }
        chargedActors.add(event.actorId);
        return [event.id, cost];
      }),
    );
    presentationEvents.forEach((event) => {
      if (!event.actorId) return;
      initial[event.actorId] =
        (initial[event.actorId] ?? 0) + (costByEvent[event.id] ?? 0);
    });
    const running = { ...initial };
    const after: Record<string, Record<string, number>> = {};
    presentationEvents.forEach((event) => {
      if (event.actorId) {
        running[event.actorId] = Math.max(
          0,
          (running[event.actorId] ?? 0) - (costByEvent[event.id] ?? 0),
        );
      }
      after[event.id] = { ...running };
    });
    return { initial, after };
  }, [battle?.matchId, battle?.turn, presentationKey]);
  const activePresentationIndex = Math.min(
    presentationIndex,
    Math.max(0, presentationEvents.length - 1),
  );
  const activePresentation = presentationEvents[activePresentationIndex];
  const activeNeedsResolution = Boolean(
    activePresentation &&
      (activePresentation.spotlight ||
        activePresentation.skillName === "黒星" ||
        activePresentation.targets.some((target) =>
          target.tags.includes("CRITICAL"),
      )),
  );
  const activeResolutionHasCritical =
    activePresentation?.targets.some((target) =>
      target.tags.includes("CRITICAL"),
    ) ?? false;

  useEffect(() => {
    if (
      !battleStarted ||
      !battle ||
      paused ||
      battleIntroIndex !== null ||
      presentationEvents.length > 0 ||
      (battle.status !== "ready" && battle.status !== "running")
    ) {
      return;
    }
    const delay =
      profile.battleSpeed === "normal"
        ? 360
        : profile.battleSpeed === "fast"
          ? 180
          : 40;
    const timer = window.setTimeout(stepBattle, delay);
    return () => window.clearTimeout(timer);
  }, [
    battleStarted,
    battleIntroIndex,
    battle?.status,
    battle?.turn,
    paused,
    presentationEvents.length,
    profile.battleSpeed,
    stepBattle,
  ]);

  useEffect(() => {
    if (!battle || presentationEvents.length === 0) return;
    const units = [...battle.player, ...battle.enemy];
    const nextHp = Object.fromEntries(
      units.map((unit) => [unit.instanceId, unit.hp]),
    );
    const seenHp = new Set<string>();
    presentationEvents.forEach((event) => {
      event.targets.forEach((target) => {
        if (!seenHp.has(target.instanceId)) {
          nextHp[target.instanceId] = target.hpBefore;
          seenHp.add(target.instanceId);
        }
      });
    });
    setVisualHp(nextHp);
    setVisualMp(presentationMpTimeline.initial);
    setPresentationIndex(0);
  }, [battle?.turn, presentationKey, presentationMpTimeline.initial]);

  useEffect(() => {
    setPresentationStriking(false);
    setPresentationImpacted(false);
    setResolutionStep(0);
  }, [activePresentation?.id]);

  useEffect(() => {
    if (!activePresentation || !presentationImpacted || !activeNeedsResolution) {
      return;
    }
    setResolutionStep(1);
    const secondDelay = profile.battleSpeed === "normal" ? 420 : 270;
    const thirdDelay = profile.battleSpeed === "normal" ? 1050 : 660;
    const second = window.setTimeout(() => setResolutionStep(2), secondDelay);
    const third = window.setTimeout(() => setResolutionStep(3), thirdDelay);
    return () => {
      window.clearTimeout(second);
      window.clearTimeout(third);
    };
  }, [
    activeNeedsResolution,
    activePresentation?.id,
    presentationImpacted,
    profile.battleSpeed,
  ]);

  useEffect(() => {
    if (!activePresentation || resolutionStep < 2) return;
    const key = `${activePresentation.id}:${resolutionStep}`;
    if (soundedResolutionRef.current === key) return;
    soundedResolutionRef.current = key;
    playSound(
      resolutionStep === 2
        ? "battleSkill"
        : activeResolutionHasCritical || activePresentation.spotlight
          ? "battleBreak"
          : "battleHit",
      profile.soundEnabled,
    );
  }, [
    activePresentation?.id,
    activeResolutionHasCritical,
    activePresentation?.spotlight,
    profile.soundEnabled,
    resolutionStep,
  ]);

  useEffect(() => {
    if (
      !activePresentation ||
      paused ||
      battleIntroIndex !== null ||
      soundedEventRef.current === activePresentation.id
    ) {
      return;
    }
    soundedEventRef.current = activePresentation.id;
    playSound(
      activePresentation.kind === "trait" ||
        activePresentation.kind === "manager"
        ? "battleSkill"
        : "battleMove",
      profile.soundEnabled,
    );
  }, [activePresentation?.id, battleIntroIndex, paused, profile.soundEnabled]);

  useEffect(() => {
    if (
      !activePresentation ||
      !presentationImpacted ||
      soundedImpactRef.current === activePresentation.id
    ) {
      return;
    }
    soundedImpactRef.current = activePresentation.id;
    playSound(
      activePresentation.spotlight ? "battleBreak" : "battleHit",
      profile.soundEnabled,
    );
  }, [
    activePresentation?.id,
    activePresentation?.kind,
    activePresentation?.spotlight,
    presentationImpacted,
    profile.soundEnabled,
  ]);

  const commitPresentationImpact = useCallback(() => {
    if (!activePresentation) return;
    setPresentationImpacted(true);
    setVisualHp((current) => {
      const next = { ...current };
      activePresentation.targets.forEach((target) => {
        next[target.instanceId] = target.hpAfter;
      });
      return next;
    });
    setVisualMp(
      presentationMpTimeline.after[activePresentation.id] ??
        presentationMpTimeline.initial,
    );
  }, [
    activePresentation,
    presentationMpTimeline.after,
    presentationMpTimeline.initial,
  ]);

  const startPresentationStrike = useCallback(() => {
    if (!activePresentation || presentationImpacted) return;
    setPresentationStriking(true);
  }, [activePresentation, presentationImpacted]);

  useEffect(() => {
    if (!activePresentation || !presentationStriking) return;
    const offensive =
      activePresentation.kind === "damage" ||
      activePresentation.kind === "debuff" ||
      activePresentation.kind === "miss";
    const impactDelay = offensive
      ? profile.battleSpeed === "normal"
        ? 320
        : 180
      : profile.battleSpeed === "normal"
        ? 180
        : 110;
    const settleDelay = offensive
      ? profile.battleSpeed === "normal"
        ? 760
        : 440
      : profile.battleSpeed === "normal"
        ? 420
        : 260;
    const impactTimer = window.setTimeout(
      commitPresentationImpact,
      impactDelay,
    );
    const settleTimer = window.setTimeout(
      () => setPresentationStriking(false),
      settleDelay,
    );
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(settleTimer);
    };
  }, [
    activePresentation,
    commitPresentationImpact,
    presentationStriking,
    profile.battleSpeed,
  ]);

  useEffect(() => {
    if (
      !battle ||
      !activePresentation ||
      paused ||
      battleIntroIndex !== null ||
      battlePlayback === "manual"
    ) {
      return;
    }
    const duration =
      profile.battleSpeed === "normal"
        ? 1700
        : profile.battleSpeed === "fast"
          ? 1050
          : 500;
    const impactTimer = window.setTimeout(
      startPresentationStrike,
      duration * 0.4,
    );
    return () => {
      window.clearTimeout(impactTimer);
    };
  }, [
    activePresentation?.id,
    battle?.matchId,
    battleIntroIndex,
    finishBattlePresentation,
    paused,
    presentationEvents.length,
    presentationIndex,
    battlePlayback,
    profile.battleSpeed,
    startPresentationStrike,
    presentationMpTimeline.after,
    presentationMpTimeline.initial,
  ]);

  const advanceBattleText = useCallback(() => {
    if (!activePresentation) return;
    if (presentationStriking) return;
    if (!presentationImpacted) {
      startPresentationStrike();
      return;
    }
    if (activeNeedsResolution && resolutionStep < 3) return;
    if (activePresentationIndex < presentationEvents.length - 1) {
      setPresentationIndex((index) => {
        if (battlePlayback !== "highlights") {
          return Math.min(index + 1, presentationEvents.length - 1);
        }
        const nextImportant = presentationEvents.findIndex(
          (event, eventIndex) =>
            eventIndex > index &&
            (Boolean(event.spotlight) ||
              event.kind === "trait" ||
              event.kind === "manager" ||
              event.targets.some((target) =>
                target.tags.some((tag) => tag === "CRITICAL" || tag === "KO"),
              )),
        );
        return nextImportant >= 0
          ? nextImportant
          : presentationEvents.length - 1;
      });
    } else {
      finishBattlePresentation();
    }
  }, [
    activePresentation,
    activePresentationIndex,
    finishBattlePresentation,
    presentationEvents.length,
    presentationImpacted,
    presentationStriking,
    startPresentationStrike,
    activeNeedsResolution,
    resolutionStep,
    battlePlayback,
  ]);

  useEffect(() => {
    if (
      battlePlayback === "manual" ||
      paused ||
      !activePresentation ||
      !presentationImpacted ||
      presentationStriking ||
      (activeNeedsResolution && resolutionStep < 3)
    ) {
      return;
    }
    const delay =
      profile.battleSpeed === "normal"
        ? 1700
        : profile.battleSpeed === "fast"
          ? 950
          : 420;
    const timer = window.setTimeout(advanceBattleText, delay);
    return () => window.clearTimeout(timer);
  }, [
    activePresentation?.id,
    advanceBattleText,
    paused,
    presentationImpacted,
    presentationStriking,
    activeNeedsResolution,
    resolutionStep,
    battlePlayback,
    profile.battleSpeed,
  ]);

  useEffect(() => {
    if (
      battleIntroIndex === null ||
      battlePlayback === "manual" ||
      paused ||
      battleIntroLineCount === 0
    ) {
      return;
    }
    const delay = profile.battleSpeed === "normal" ? 1900 : 1050;
    const timer = window.setTimeout(() => {
      setBattleIntroIndex((index) => {
        if (index === null || index >= battleIntroLineCount - 1) return null;
        return index + 1;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [
    battleIntroIndex,
    battleIntroLineCount,
    battlePlayback,
    paused,
    profile.battleSpeed,
  ]);

  useEffect(() => {
    if (battle?.status !== "decision") setCommand("main");
  }, [battle?.status, battle?.turn]);

  if (!run) return null;
  if (!battle) {
    return (
      <main className="battle-recovery">
        <RefreshCw size={31} />
        <h2>試合データを準備し直します</h2>
        <p>対戦カードと編成は残っています。試合準備から再開できます。</p>
        <button className="primary-button" onClick={onRecover}>
          試合準備へ戻る
        </button>
      </main>
    );
  }
  if (
    run.spectatorMatch &&
    run.spectatorMatch.status !== "dismissed"
  ) {
    return <SpectatorBattleScreen />;
  }
  const match = getMatchDefinition(battle.matchId)!;
  const battleIntroLines = buildBattleIntroductionLines(
    match.name,
    match.opponentName,
    battle.player,
    battle.enemy,
  );
  const introducing =
    battleStarted &&
    battleIntroIndex !== null &&
    battleIntroIndex < battleIntroLines.length;
  const activeIntroduction = introducing
    ? battleIntroLines[battleIntroIndex]
    : undefined;
  const visiblePresentation = introducing ? undefined : activePresentation;
  const advanceBattleIntroduction = () => {
    setBattleIntroIndex((index) => {
      if (index === null || index >= battleIntroLines.length - 1) return null;
      return index + 1;
    });
  };
  const presenting = presentationEvents.length > 0;
  const narrating = introducing || presenting;
  const finished =
    !narrating && (battle.status === "won" || battle.status === "lost");
  const visiblePresentationFeed = activePresentation
    ? [
        presentationEvents[activePresentationIndex - 1],
        activePresentation,
      ].filter((event): event is BattlePresentationEvent => Boolean(event))
    : [];
  const battleUnits = [...battle.player, ...battle.enemy];
  const activeActor = activePresentation?.actorId
    ? battleUnits.find(
        (unit) => unit.instanceId === activePresentation.actorId,
      )
    : undefined;
  const activeResultTags = [
    ...new Set(
      activePresentation?.targets.flatMap((target) => target.tags) ?? [],
    ),
  ];
  const activeIsOffensive =
    activePresentation?.kind === "damage" ||
    activePresentation?.kind === "debuff" ||
    activePresentation?.kind === "miss";
  const activeTargetNames =
    activePresentation?.targets.map((target) => target.name).join("・") ||
    activePresentation?.targetIds
      .map((targetId) =>
        battleUnits.find((unit) => unit.instanceId === targetId),
      )
      .filter((unit): unit is BattleUnit => Boolean(unit))
      .map((unit) => unit.name)
      .join("・") ||
    "戦況全体";
  const activeIsSpotlight = Boolean(
    activePresentation?.spotlight ||
      (match.id === "opening-cup" && activePresentation?.skillName === "黒星"),
  );
  const activeHasCritical = activeResultTags.includes("CRITICAL");
  const activeDamageAmount =
    activePresentation?.targets.reduce(
      (total, target) => total + (target.value ?? 0),
      0,
    ) ?? 0;
  const activeDefeated = activeResultTags.includes("KO");
  const visibleHpRatio = (units: BattleUnit[]) => {
    const current = units.reduce(
      (total, unit) => total + (visualHp[unit.instanceId] ?? unit.hp),
      0,
    );
    const maximum = units.reduce((total, unit) => total + unit.maxHp, 0);
    return maximum > 0 ? current / maximum : 0;
  };
  const playerHpRatio = visibleHpRatio(battle.player);
  const enemyHpRatio = visibleHpRatio(battle.enemy);
  const advantageGap = playerHpRatio - enemyHpRatio;
  const flowLabel =
    advantageGap > 0.18
      ? "押している"
      : advantageGap < -0.18
        ? "押されている"
        : "互角";
  const playbackGuide =
    battlePlayback === "highlights"
      ? paused
        ? "重要場面モード・一時停止中"
        : "会心・決着・特性を中心に再生"
      : battlePlayback === "auto"
      ? paused
        ? "AUTO一時停止中"
        : "AUTOで観戦中"
      : "クリックで一手ずつ進む";
  const commentary = activePresentation
    ? buildBattleBroadcast({
        actorName: activePresentation.actorName,
        targetNames: activeTargetNames,
        skillName: activePresentation.skillName,
        kind: activePresentation.kind,
        impacted: presentationImpacted,
        critical: activeHasCritical,
        detail: activePresentation.detail,
        amount: activeDamageAmount,
        defeated: activeDefeated,
      })
    : undefined;
  const topSkillUse = Object.entries(battle.metrics.skillUses ?? {}).sort(
    (left, right) => right[1] - left[1],
  )[0];
  const topSkill = topSkillUse
    ? battle.player
        .flatMap((unit) => unit.skills)
        .find((entry) => entry.id === topSkillUse[0])
    : undefined;
  const resultStar =
    (topSkillUse
      ? battle.player.find((unit) =>
          unit.skills.some((skill) => skill.id === topSkillUse[0]),
        )
      : undefined) ?? battle.player[0];
  const resultStarVisual = resultStar
    ? characterVisuals[resultStar.fighterId]
    : undefined;
  const battleLessons = [
    (battle.metrics.criticalHits ?? 0) >= 2
      ? {
          tone: "good",
          title: "会心の一撃が勝ち筋になった",
          text: `${battle.metrics.criticalHits}回の会心で大きくHPを削りました。速度と攻撃力を伸ばすと、次も決定打を狙えます。`,
        }
      : {
          tone: "good",
          title: topSkill ? `主力技「${topSkill.name}」が働いた` : "役割どおりに戦い抜いた",
          text: topSkill && topSkillUse
            ? `${topSkillUse[1]}回使われました。次は攻撃役を伸ばすか、守備・回復役で使う時間を作ると狙いがはっきりします。`
            : "HP、攻撃、防御、回復のどこが足りなかったかを次の育成目標にできます。",
        },
    (battle.metrics.turningPoints ?? 0) === 0
      ? {
          tone: "good",
          title: "監督指示を待たずに決着した",
          text: `第${battle.turn}ターンで勝負が決まりました。短期決戦では、攻撃役の主力技がそのまま結果へつながります。`,
        }
      : battle.turningPointOutcome === "seized"
      ? {
          tone: "good",
          title: "勝負どころをつかんだ",
          text: "予兆を見て選んだ指示が、その後の一手へつながりました。どの判断が通ったかを次戦でも狙えます。",
        }
      : battle.turningPointOutcome === "held"
        ? {
            tone: "good",
            title: "流れを渡さず踏みとどまった",
            text: "派手な逆転ではなくても、守りと信頼で相手の決め手を耐えました。編成の安定感が出ています。",
          }
      : {
          tone: "warn",
          title: "勝負どころでは相手が先に動いた",
          text: "予兆と読みが噛み合いませんでした。次は相手の構えか、任せられる信頼のどちらかを育成目標にできます。",
        },
    (battle.metrics.damageTaken ?? 0) <=
    (battle.metrics.damageDealt ?? 0) * 0.72
      ? {
          tone: "good",
          title: "攻守の交換で優位を取った",
          text: `与ダメージ${battle.metrics.damageDealt ?? 0}に対し、被ダメージ${battle.metrics.damageTaken ?? 0}。編成と方針が噛み合っています。`,
        }
      : {
          tone: "warn",
          title: "被害が大きい試合だった",
          text: `被ダメージ${battle.metrics.damageTaken ?? 0}。守備役、回復技、堅守方針のどれか一つを次の育成目標にできます。`,
        },
  ];
  const startBattle = (mode: "manual" | "auto") => {
    setBattlePlayback(mode);
    setPaused(false);
    setBattleIntroIndex(0);
    setBattleStarted(true);
    playSound("battleMove", profile.soundEnabled);
  };

  return (
    <main
      className={`battle-screen ${
        visiblePresentation
          ? `battle-screen--element-${visiblePresentation.element}`
          : ""
      } ${visiblePresentation && !presentationImpacted ? "is-forecasting" : ""} ${
        visiblePresentation && activeIsOffensive && presentationImpacted ? "is-impacting" : ""
      } ${visiblePresentation && activeNeedsResolution && resolutionStep > 0 && resolutionStep < 3 ? "is-resolving" : ""} ${
        battle.status === "decision" && !narrating ? "is-awaiting-command" : ""
      } ${narrating ? "is-presenting-action" : ""} ${
        visiblePresentation && presentationStriking ? "is-striking" : ""
      }`}
    >
      <img
        src="/assets/battle/arena-daylight-v2.png"
        alt=""
        className="arena-backdrop"
      />
      <div className="battle-shade" />
      <AnimatePresence>
        {!battleStarted && !finished && (
          <motion.section
            className="battle-entry-gate"
            role="dialog"
            aria-modal="true"
            aria-labelledby="battle-entry-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="battle-entry-gate__scene" aria-hidden="true">
              <div className="battle-entry-gate__fighter battle-entry-gate__fighter--ally">
                <BattleEntryFighter unit={battle.player[0]} />
              </div>
              <b>VS</b>
              <div className="battle-entry-gate__fighter battle-entry-gate__fighter--enemy">
                <BattleEntryFighter unit={battle.enemy[0]} />
              </div>
            </div>

            <div className="battle-entry-gate__content">
              <header>
                <span>{match.name}</span>
                <h1 id="battle-entry-title">ゴングの前に、これだけ。</h1>
                <p>
                  選手たちは自分で戦う。技名が出たら画面は止まるから、
                  私は実況と結果を一つずつ見届ければいい。歓声が止まった時だけ、監督の出番だ。
                </p>
              </header>

              <ol className="battle-entry-gate__steps">
                <li>
                  <b>1</b>
                  <div>
                    <strong>まず選手紹介を聞く</strong>
                    <span>相手と味方の名前、役割、HPを実況が順に紹介。</span>
                  </div>
                </li>
                <li>
                  <b>2</b>
                  <div>
                    <strong>攻撃と結果を一つずつ見る</strong>
                    <span>誰の攻撃か、何ダメージか、能力がどう変わったかを追う。</span>
                  </div>
                </li>
                <li>
                  <b>3</b>
                  <div>
                    <strong>静寂が来たら指示する</strong>
                    <span>「勝負どころ」だけ、ミミが一度声を届ける。</span>
                  </div>
                </li>
              </ol>

              <footer>
                <div>
                  <MousePointerClick size={19} />
                  <span>
                    AUTOなら選手紹介から技、ダメージ、決着まで自動で進みます。いつでも止められます。
                  </span>
                </div>
                <div className="battle-entry-gate__actions">
                  <button onClick={() => startBattle("auto")}>
                    <Play size={21} fill="currentColor" />
                    AUTOで試合を見る
                    <ChevronRight size={19} />
                  </button>
                  <button onClick={() => startBattle("manual")}>
                    <MousePointerClick size={20} />
                    一手ずつ自分で送る
                    <ChevronRight size={19} />
                  </button>
                </div>
              </footer>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
      <div className="battle-topline">
        <span>{match.name}</span>
        <strong>
          {battle.turn === 0 ? "開始前" : `第${battle.turn}ターン`}・戦型 {" "}
          {battle.plan === "assault"
            ? "攻勢"
            : battle.plan === "guarded"
              ? "堅守"
              : "均衡"}
        </strong>
        <span>{match.opponentName}</span>
      </div>
      <div
        className={`battle-flow-state battle-flow-state--${
          flowLabel === "押している"
            ? "ahead"
            : flowLabel === "押されている"
              ? "behind"
              : "even"
        }`}
        aria-label={`試合の流れ ${flowLabel}。${playbackGuide}`}
      >
        <Zap size={15} />
        <span>試合の流れ</span>
        <div aria-hidden="true">
          <i className={flowLabel === "押されている" ? "is-active" : ""} />
          <i className={flowLabel === "互角" ? "is-active" : ""} />
          <i className={flowLabel === "押している" ? "is-active" : ""} />
        </div>
        <strong>{flowLabel}</strong>
        <small>{playbackGuide}</small>
      </div>
      <motion.section
        className="battle-stage"
        aria-label="戦闘フィールド"
        animate={
          visiblePresentation && activeIsOffensive && presentationImpacted
            ? { x: [0, -5, 4, -2, 0], y: [0, 2, -1, 0] }
            : { x: 0, y: 0 }
        }
        transition={{ duration: 0.24 }}
      >
        <div className="battle-stage__environment" aria-hidden="true">
          <span className="battle-stage__horizon" />
          <span className="battle-stage__floor battle-stage__floor--one" />
          <span className="battle-stage__floor battle-stage__floor--two" />
          <span className="battle-stage__center" />
        </div>
        <AnimatePresence>
          {battle.status === "decision" && !narrating && battle.enemyTell && (
            <motion.aside
              className={`battle-enemy-tell-cinematic battle-enemy-tell-cinematic--${battle.enemyTell}`}
              initial={{ opacity: 0, x: -24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -12 }}
              aria-label="相手の予兆"
            >
              <Compass size={22} />
              <div>
                <span>相手の構え</span>
                <strong>
                  {battle.enemyTell === "attack"
                    ? "正面から踏み込んでくる"
                    : battle.enemyTell === "guard"
                      ? "重心を落として待っている"
                      : "魔力を隠すように息を止めた"}
                </strong>
                {battle.enemyThreat && <small>{battle.enemyThreat}</small>}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {visiblePresentation && activeIsOffensive && (
            <motion.div
              className={`battle-skill-echo battle-skill-echo--${visiblePresentation.element}`}
              key={`echo-${visiblePresentation.id}`}
              initial={{ opacity: 0, scale: 0.82, x: visiblePresentation.side === "player" ? -60 : 60 }}
              animate={{ opacity: [0, 0.18, 0.08], scale: [0.82, 1.08, 1], x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.62, ease: "easeOut" }}
              aria-hidden="true"
            >
              {visiblePresentation.skillName}
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className={`battle-playback battle-playback--manual ${
            battlePlayback !== "manual" ? "is-auto" : ""
          }`}
          aria-label="バトル再生設定"
        >
          <button
            className="icon-button"
            onClick={() => setPaused(!paused)}
            title={paused ? "バトルを再開" : "バトルを一時停止"}
            aria-pressed={paused}
          >
            {paused ? <Play size={17} fill="currentColor" /> : <Pause size={17} />}
          </button>
          <span className="battle-playback__label">文字送り</span>
          <div className="segmented-control segmented-control--dark battle-playback__mode">
            {(
              [
                ["manual", "一手"],
                ["auto", "AUTO"],
                ["highlights", "重要場面"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={
                  battlePlayback === value ? "is-selected" : ""
                }
                onClick={() => setBattlePlayback(value)}
                aria-pressed={battlePlayback === value}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="segmented-control segmented-control--dark battle-playback__speed">
            {(
              [
                ["normal", "1x"],
                ["fast", "2x"],
                ["instant", "最速"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={profile.battleSpeed === value ? "is-selected" : ""}
                onClick={() => setBattleSpeed(value)}
                aria-pressed={profile.battleSpeed === value}
                title={`再生速度 ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="battle-skip-result"
            onClick={() => {
              setBattleIntroIndex(null);
              setPresentationIndex(0);
              finishBattleNow();
            }}
            title="演出を省略して勝敗を表示"
          >
            <FastForward size={16} /> 即時結果
          </button>
        </div>
        <div className="battle-turn-order" aria-label="行動順">
          <span>NEXT</span>
          {[...battle.player, ...battle.enemy]
            .filter((unit) => unit.hp > 0)
            .sort((left, right) => right.stats.speed - left.stats.speed)
            .map((unit, index) => (
              <div
                key={unit.instanceId}
                className={`battle-turn-order__unit battle-turn-order__unit--${unit.side} ${
                  unit.instanceId === visiblePresentation?.actorId
                    ? "is-current"
                    : ""
                }`}
              >
                <small>{index + 1}</small>
                <FighterMark id={unit.fighterId} size="small" />
                <b>{unit.name}</b>
              </div>
            ))}
        </div>
        <AnimatePresence>
          {visiblePresentation &&
            presentationStriking &&
            (visiblePresentation.kind === "damage" ||
              visiblePresentation.kind === "debuff" ||
              visiblePresentation.kind === "break" ||
              visiblePresentation.kind === "miss") && (
              <motion.div
                className={`battle-technique-streak battle-technique-streak--${visiblePresentation.side} battle-technique-streak--${visiblePresentation.element}`}
                key={`streak-${visiblePresentation.id}`}
                initial={{ opacity: 0, scaleX: 0.15, x: visiblePresentation.side === "player" ? 190 : -190 }}
                animate={{
                  opacity: [0, 0.95, 0],
                  scaleX: [0.15, 1.35, 0.45],
                  x:
                    visiblePresentation.side === "player"
                      ? [190, -100, -260]
                      : [-190, 100, 260],
                }}
                transition={{ duration: profile.battleSpeed === "normal" ? 0.72 : 0.42, ease: "easeOut" }}
              >
                <i />
                <i />
                <i />
              </motion.div>
            )}
        </AnimatePresence>
        <AnimatePresence>
          {visiblePresentation && activeActor && !presentationImpacted && !presentationStriking && (
            activeIsSpotlight ? (
              <BattleTechniqueShowcase
                key={`showcase-${visiblePresentation.id}`}
                unit={activeActor}
                event={visiblePresentation}
              />
            ) : (
              <motion.div
                className={`battle-skill-cut-in battle-skill-cut-in--${visiblePresentation.side} battle-skill-cut-in--${visiblePresentation.element}`}
                key={`cutin-${visiblePresentation.id}`}
                initial={{
                  opacity: 0,
                  x: visiblePresentation.side === "player" ? -120 : 120,
                }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <FighterMark id={activeActor.fighterId} size="large" />
                <div>
                  <span>
                    {visiblePresentation.side === "player"
                      ? "ミミのチーム"
                      : "相手チーム"}
                  </span>
                  <strong>{visiblePresentation.skillName}</strong>
                  <small>{visiblePresentation.actorName}</small>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
        <div className={`battle-side battle-side--player battle-side--count-${battle.player.length}`}>
          <header>
            <span>PLAYER TEAM</span>
            <strong>ミミのチーム</strong>
          </header>
          <div className="battle-squad">
            {battle.player.map((unit) => (
              <BattleCombatant
                key={unit.instanceId}
                unit={unit}
                displayHp={visualHp[unit.instanceId] ?? unit.hp}
                displayMp={visualMp[unit.instanceId] ?? unit.mp}
                event={visiblePresentation}
                striking={Boolean(visiblePresentation && presentationStriking)}
                impacted={Boolean(visiblePresentation && presentationImpacted)}
              />
            ))}
          </div>
        </div>

        <div
          className={`battle-action-lane ${
            activePresentation || introducing ? "is-clickable" : ""
          }`}
          aria-live="assertive"
          onClick={
            introducing
              ? advanceBattleIntroduction
              : activePresentation
                ? advanceBattleText
                : undefined
          }
        >
          <AnimatePresence mode="wait">
            {activeIntroduction ? (
              <motion.div
                className="battle-action-focus battle-action-focus--introduction"
                key={`introduction-${battleIntroIndex}`}
                initial={{ opacity: 0, x: 34, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="battle-commentary__speaker">
                  <MessageCircle size={23} />
                  <div>
                    <strong>実況・審判席</strong>
                  </div>
                </div>
                <motion.div
                  className="battle-commentary__copy"
                  key={`introduction-copy-${battleIntroIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>{activeIntroduction.label}</span>
                  <h3>{activeIntroduction.headline}</h3>
                  <p>{activeIntroduction.body}</p>
                </motion.div>
                <button
                  className="battle-text-advance"
                  onClick={(event) => {
                    event.stopPropagation();
                    advanceBattleIntroduction();
                  }}
                  aria-label="次の選手紹介へ進む"
                >
                  <ChevronRight size={18} />
                </button>
                {battlePlayback !== "manual" && !paused && (
                  <span
                    className={`battle-auto-progress is-counting battle-auto-progress--${profile.battleSpeed}`}
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            ) : activePresentation ? (
              <motion.div
                className={`battle-action-focus battle-action-focus--${activePresentation.kind} ${
                  presentationImpacted ? "is-resolved" : "is-forecast"
                } ${activePresentation.spotlight ? "is-spotlight-event" : ""}`}
                key={activePresentation.id}
                initial={{
                  opacity: 0,
                  x: activePresentation.side === "player" ? 48 : -48,
                  scale: 0.96,
                }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="battle-commentary__speaker">
                  <MessageCircle size={23} />
                  <div>
                    <strong>実況・審判席</strong>
                  </div>
                </div>
                <motion.div
                  className="battle-commentary__copy"
                  key={`${activePresentation.id}:${presentationImpacted ? "result" : "forecast"}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span>
                    {activePresentation.turn === 0
                      ? "試合開始"
                      : `第${activePresentation.turn}ターン`}・{activePresentation.side === "player" ? "ミミのチーム" : "相手チーム"}
                  </span>
                  <h3>{commentary?.headline}</h3>
                  <p>{commentary?.body}</p>
                </motion.div>
                <button
                  className="battle-text-advance"
                  disabled={
                    presentationStriking ||
                    presentationImpacted &&
                    activeNeedsResolution &&
                    resolutionStep < 3
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    advanceBattleText();
                  }}
                  aria-label={
                    presentationStriking ||
                    (presentationImpacted && activeNeedsResolution && resolutionStep < 3)
                      ? "演出が終わるまで待つ"
                      : "続きを読む"
                  }
                >
                  <ChevronRight size={18} />
                </button>
                {battlePlayback !== "manual" && !paused && (
                  <span
                    className={`battle-auto-progress ${
                      presentationImpacted ? "is-counting" : ""
                    } battle-auto-progress--${profile.battleSpeed}`}
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            ) : battle.status === "decision" ? (
              <motion.div
                className="battle-action-focus battle-action-focus--decision"
                key="decision"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span>
                  {battle.decisionKind === "turningPoint"
                    ? "TURNING POINT"
                    : "MANAGER WINDOW"}
                </span>
                <strong>
                  {battle.decisionKind === "turningPoint"
                    ? "場内が静まり、ミミの声だけが届く"
                    : "ミミの指示を待っています"}
                </strong>
              </motion.div>
            ) : (
              <motion.div
                className="battle-action-focus battle-action-focus--waiting"
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span>第{battle.turn + 1}ターン</span>
                <strong>{paused ? "一時停止中" : "場内が次の一手を待っている"}</strong>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={`battle-side battle-side--enemy battle-side--count-${battle.enemy.length}`}>
          <header>
            <span>OPPONENT</span>
            <strong>{match.opponentName}</strong>
          </header>
          <div className="battle-squad">
            {battle.enemy.map((unit) => (
              <BattleCombatant
                key={unit.instanceId}
                unit={unit}
                displayHp={visualHp[unit.instanceId] ?? unit.hp}
                displayMp={visualMp[unit.instanceId] ?? unit.mp}
                event={visiblePresentation}
                striking={Boolean(visiblePresentation && presentationStriking)}
                impacted={Boolean(visiblePresentation && presentationImpacted)}
              />
            ))}
          </div>
        </div>
      </motion.section>

      <div
        className={`battle-feed ${narrating ? "is-presenting" : ""}`}
        aria-hidden={narrating}
        aria-live={narrating ? "off" : "polite"}
      >
        <span>戦況</span>
        {visiblePresentation
          ? visiblePresentationFeed.map((event) => (
              <p
                className={`tone-${presentationTone(event)}`}
                key={event.id}
              >
                <strong>{event.actorName}</strong>
                {event.id === visiblePresentation.id && !presentationImpacted
                  ? `${event.skillName}を発動`
                  : event.detail}
              </p>
            ))
          : battle.logs.slice(-2).map((entry, index) => (
              <p className={`tone-${entry.tone}`} key={`${entry.turn}:${index}`}>
                <strong>{entry.actor}</strong>
                {entry.text}
              </p>
            ))}
      </div>

      {battle.status === "decision" && !narrating && (
        <motion.section
          className={`command-panel ${
            battle.decisionKind === "turningPoint" ? "is-turning-point" : ""
          }`}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="command-heading">
            <div>
              <span>
                {battle.decisionKind === "turningPoint"
                  ? "ONE CALL ONLY"
                  : "MANAGER CALL"}
              </span>
              <h3>{battle.decisionReason}</h3>
            </div>
            {command !== "main" && (
              <button
                className="icon-button"
                onClick={() => setCommand("main")}
                title="指示一覧へ戻る"
                aria-label="指示一覧へ戻る"
              >
                <ArrowLeft size={18} />
              </button>
            )}
          </div>
          {command === "main" && (
            <div className="command-grid">
              <button
                disabled={battle.cheerUses <= 0}
                onClick={() => setCommand("rally")}
              >
                <MessageCircle size={23} />
                <strong>声をかける</strong>
                <span>攻め・耐久・連携を選ぶ</span>
                <small>残り {battle.cheerUses}</small>
              </button>
              <button
                disabled={battle.readUses <= 0}
                onClick={() => setCommand("read")}
              >
                <Compass size={23} />
                <strong>読む</strong>
                <span>攻撃・防御・技を見切る</span>
                <small>残り {battle.readUses}</small>
              </button>
              <button
                disabled={battle.shiftUses <= 0}
                onClick={() => setCommand("shift")}
              >
                <RefreshCw size={23} />
                <strong>戦型変更</strong>
                <span>攻勢・均衡・堅守を切替</span>
                <small>残り {battle.shiftUses}</small>
              </button>
              <button
                disabled={battle.forceUses <= 0}
                onClick={() => setCommand("force")}
              >
                <LockKeyhole size={23} />
                <strong>強制指示</strong>
                <span>技を指定。反動あり</span>
                <small>残り {battle.forceUses}</small>
              </button>
              <button onClick={() => intervene({ type: "pass" })}>
                <UserRoundCheck size={23} />
                <strong>任せる</strong>
                <span>本人たちの判断を信じる</span>
                <small>信頼 {battle.teamTrust}</small>
              </button>
            </div>
          )}
          {command === "rally" && (
            <div className="prediction-grid prediction-grid--orders">
              <button
                onClick={() =>
                  intervene({ type: "cheer", order: "advance" })
                }
              >
                <strong>前へ出る</strong>
                <span>攻撃・速度を大きく上げる</span>
              </button>
              <button
                onClick={() =>
                  intervene({ type: "cheer", order: "endure" })
                }
              >
                <strong>耐える</strong>
                <span>防御と障壁で次を残す</span>
              </button>
              <button
                onClick={() => intervene({ type: "cheer", order: "sync" })}
              >
                <strong>合わせる</strong>
                <span>魔力と勢いを連携へつなぐ</span>
              </button>
            </div>
          )}
          {command === "read" && (
            <div className="prediction-grid">
              {(["attack", "guard", "skill"] as const).map((prediction) => (
                <button
                  key={prediction}
                  onClick={() => intervene({ type: "read", prediction })}
                >
                  {prediction === "attack"
                    ? "通常攻撃"
                    : prediction === "guard"
                      ? "防御"
                      : "技・妨害"}
                </button>
              ))}
            </div>
          )}
          {command === "shift" && (
            <div className="prediction-grid prediction-grid--orders">
              {(
                [
                  ["assault", "攻勢", "火力と速度 / 防御低下"],
                  ["balanced", "均衡", "補正なし"],
                  ["guarded", "堅守", "防御重視 / 火力低下"],
                ] as Array<[BattlePlan, string, string]>
              ).map(([plan, label, note]) => (
                <button
                  key={plan}
                  disabled={battle.plan === plan}
                  onClick={() => intervene({ type: "shift", plan })}
                >
                  <strong>{label}</strong>
                  <span>{note}</span>
                </button>
              ))}
            </div>
          )}
          {command === "force" && (
            <div className="force-list">
              {battle.player
                .filter((unit) => !unit.defeated)
                .map((unit) => (
                  <div key={unit.instanceId}>
                    <strong>{unit.name}</strong>
                    <div>
                      {unit.skills.map((skill) => (
                        <button
                          key={skill.id}
                          disabled={skill.mpCost > unit.mp}
                          onClick={() =>
                            intervene({
                              type: "force",
                              fighterId: unit.fighterId,
                              skillId: skill.id,
                            })
                          }
                        >
                          {skill.name}
                          <small>MP {skill.mpCost}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </motion.section>
      )}

      {finished && (
        <motion.section
          className={`battle-result battle-result--v2 battle-result--${battle.status}`}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <header className="result-hero-v2">
            {battle.status === "won" && resultStarVisual && (
              <motion.figure
                className={`result-star-art-v3 ${
                  resultStarVisual.battleCutIn ? "has-key-art" : "has-standing-art"
                }`}
                initial={{ opacity: 0, x: 34, scale: 1.05 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.72, ease: "easeOut" }}
              >
                <img
                  src={
                    resultStarVisual.battleCutIn ?? resultStarVisual.battle
                  }
                  alt={`${resultStar.name}の勝利イラスト`}
                  style={{
                    objectPosition:
                      resultStarVisual.battleCutInPosition ?? "center bottom",
                  }}
                />
                <figcaption>
                  <span>MATCH STAR</span>
                  <strong>{resultStar.name}</strong>
                </figcaption>
              </motion.figure>
            )}
            <div className="result-crest-v2">
              {battle.status === "won" ? (
                <Crown size={39} />
              ) : (
                <Shield size={39} />
              )}
            </div>
            <div className="result-title-v2">
              <span>
                {battle.status === "won" ? "OFFICIAL VICTORY" : "MATCH ENDED"}
              </span>
              <h2>{battle.status === "won" ? "勝利" : "敗北"}</h2>
              <p>
                {battle.status === "won"
                  ? "実況「勝者、ミミのチーム！　驚きの戦いでした！」"
                  : `実況「勝者、${match.opponentName}！　最後まで目の離せない戦いでした！」`}
              </p>
            </div>
            <div className="result-match-v2">
              <span>{match.name}</span>
              <b>ミミのチーム</b>
              <small>vs {match.opponentName}</small>
            </div>
          </header>
          <div className="result-insights-v2 result-insights-v2--compact">
            <section className="result-highlight-v2">
              <header>
                <span>{battle.status === "won" ? "勝因・次の一手" : "敗因・立て直し"}</span>
                <strong>{battle.status === "won" ? "この試合から分かった3つ" : "負けたから見えた3つ"}</strong>
              </header>
              <ol className="result-lesson-list">
                {battleLessons.slice(0, 3).map((lesson) => (
                  <li className={`tone-${lesson.tone}`} key={lesson.title}>
                    <strong>{lesson.title}</strong>
                    <span>{lesson.text}</span>
                  </li>
                ))}
              </ol>
              {battle.status === "lost" && (
                <p className="result-comeback-line">
                  {resultStar.name}「次は、今見えた弱点から潰そう。出場した全員に育成ポイントが残る」
                </p>
              )}
              {topSkill && topSkillUse && (
                <div className="result-technique-v2">
                  <Sparkles size={19} />
                  <span>最も働いた技</span>
                  <strong>{topSkill.name}</strong>
                  <small>{topSkillUse[1]}回使用・{topSkill.note}</small>
                </div>
              )}
            </section>
          </div>
          <footer className="result-footer-v2">
            <div>
              <span>NEXT</span>
              <strong>
                {battle.status === "lost" && !run.spectatorMatch
                  ? "敗戦の学びを持ち帰り、次の育成と編成へ"
                  : "報酬と次週の育成記録へ"}
              </strong>
              {run.spectatorMatch?.status === "dismissed" && (
                <small>
                  観戦結果: {run.spectatorMatch.payout > 0
                    ? `${money(run.spectatorMatch.payout)}払戻し`
                    : run.spectatorMatch.stake > 0
                      ? "払戻しなし"
                      : "賭けずに観戦"}
                </small>
              )}
            </div>
            <div className="result-actions-v2">
              {battle.status === "lost" && !run.spectatorMatch && (
                <button
                  className="result-spectate-v2"
                  onClick={prepareSpectatorMatch}
                >
                  <Eye size={18} /> 他選手試合を見る
                </button>
              )}
              <button onClick={() => onSettled(settleBattle())}>
                {battle.status === "lost" ? "学びを持ち帰る" : "結果を確定"}
                <ChevronRight size={19} />
              </button>
            </div>
          </footer>
        </motion.section>
      )}
    </main>
  );
}

function EndingScreen({ onTitle, onArchive }: { onTitle: () => void; onArchive: () => void }) {
  const run = useGameStore((state) => state.run);
  const profile = useGameStore((state) => state.profile);
  if (!run?.ended) return null;
  const liberated = run.roster.filter((id) => run.fighters[id].liberated);
  const hallEntry =
    profile.hallOfFame.find((team) => team.id === `hall-${run.id}`) ??
    profile.hallOfFame[0];
  const nextRouteName =
    run.route === "normal" && profile.unlockedRoutes.includes("domination")
      ? routeNames.domination
      : run.route === "domination" && profile.unlockedRoutes.includes("chaos")
        ? routeNames.chaos
        : undefined;
  const copy =
    run.endingType === "grand"
      ? {
          kicker: "THE GRAND REOPENING",
          title: "十五人の開廷日",
          text: "再建した闘技場の柿落とし。歴代の周回で自由になった全員が、今日は自分の意思で集まった。掲示板には、みんなが一条ずつ残した条文が、一枚の紙に清書されている。物語資産管理部の席は、用意していない。",
        }
      : run.endingType === "rebuild"
      ? {
          kicker: "ARENA REBUILT",
          title: "闘技場は、誰かの持ち物ではなくなった",
          text: "最強大魔王の暴走が止まったあと、私たちは契約台帳を開いた。消すだけではなく、出場する者が規則を決め直すために。",
        }
      : run.endingType === "company"
        ? {
            kicker: "CHAMPIONS",
            title: "中央選手権を勝ち抜いた",
            text: "会社が用意した表彰状。その裏に、まだ埋まっていない空欄を見つけた。自由への仕事は、次の周回にも残っている。",
          }
        : {
            kicker: "SEASON CLOSED",
            title: "今期の派遣は、ここで終了",
            text: "勝てなかった試合も、出会いも消えない。完成しなかったチームを、そのまま殿堂へ残した。",
          };

  return (
    <main className="ending-screen">
      <img src="/assets/event-casino-cafe.png" alt="" className="ending-image" />
      <div className="ending-copy">
        <p className="eyebrow">{copy.kicker}</p>
        <h1>{copy.title}</h1>
        <p>{copy.text}</p>
        {run.endingType === "grand" && (
          <section className="grand-finale">
            <div className="grand-finale__charter">
              <span>ARENA CHARTER</span>
              <h2>再建闘技場・全十六条</h2>
              <ol>
                {arenaCharter.map((entry) => (
                  <li key={entry.article}>
                    <b>第{entry.article}条</b>
                    <span>{entry.text}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="grand-finale__cast">
              <span>ROLL CALL</span>
              <h2>開場前の点呼</h2>
              {fighterDefinitions.map((fighter) => (
                <article key={fighter.id}>
                  <FighterMark id={fighter.id} />
                  <div>
                    <strong>{fighter.name}</strong>
                    <p>{grandFinaleLines[fighter.id]}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        <dl className="ending-score">
          <div>
            <dt>戦績</dt>
            <dd>
              {run.wins}勝 {run.losses}敗
            </dd>
          </div>
          <div>
            <dt>解放</dt>
            <dd>{liberated.length}人</dd>
          </div>
          <div>
            <dt>最終資金</dt>
            <dd>{money(run.money)}</dd>
          </div>
          <div>
            <dt>チームスコア</dt>
            <dd>{hallEntry?.score.toLocaleString("ja-JP") ?? "記録中"}</dd>
          </div>
        </dl>
        <section className="ending-lineup">
          <div>
            <span>FINAL LINEUP</span>
            <h2>最後まで戦った3人</h2>
          </div>
          <div className="ending-lineup__members">
            {run.activeTeam.map((id, index) => {
              const fighter = fighterById.get(id)!;
              const state = run.fighters[id];
              return (
                <article key={id}>
                  <b>{positionLabels[["front", "middle", "rear"][index] as keyof typeof positionLabels]}</b>
                  <FighterMark id={id} size="large" />
                  <div>
                    <strong>{fighter.name}</strong>
                    <span>
                      信頼{state.trust}・所有{state.ownership}
                    </span>
                    <small>
                      {state.liberated
                        ? "解放済み"
                        : conditionLabels[state.condition]}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
          <p>
            控えを含む所属{run.roster.length}人の能力、装備、戦術を殿堂へ保存しました。
          </p>
        </section>
        {nextRouteName && (
          <div className="ending-unlock">
            <Sparkles size={20} />
            <div>
              <span>NEXT ROUTE</span>
              <strong>次の周回で「{nextRouteName}」を選べます</strong>
            </div>
          </div>
        )}
        {liberated.length > 0 && (
          <section className="epilogue-list">
            <h2>解放後の話</h2>
            {liberated.map((id) => {
              const fighter = fighterById.get(id)!;
              return (
                <article key={id}>
                  <FighterMark id={id} />
                  <div>
                    <h3>{fighter.name}</h3>
                    <p>
                      {fighter.scenes.epilogue.lines
                        .map((line) => line.text)
                        .join(" ")}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
        <div className="ending-actions">
          <button className="primary-button" onClick={onTitle}>
            <Home size={18} /> タイトルへ
          </button>
          <button className="secondary-button" onClick={onArchive}>
            <Archive size={18} /> 殿堂を見る
          </button>
        </div>
      </div>
    </main>
  );
}

type MemoryGalleryEntry = {
  id: string;
  title: string;
  caption: string;
  image: string;
  unlock: "always" | "started" | "arena" | "gidono" | "gidono-free";
};

const memoryGalleryEntries: MemoryGalleryEntry[] = [
  {
    id: "team-lounge",
    title: "朝のチームラウンジ",
    caption: "出勤前だけは、裏ボスたちも少しだけ普通の同僚に見える。",
    image: "/assets/ui/team-lounge-day.png",
    unlock: "always",
  },
  {
    id: "first-shift",
    title: "最初の派遣先",
    caption: "限定メニューと契約書。優先順位は、まだ決めかねている。",
    image: "/assets/story/bg-casino-cafe-morning.png",
    unlock: "always",
  },
  {
    id: "working-parade",
    title: "本日の出場者ご一行",
    caption: "世界の危機を連れて、ミミは今日もサービス通路を急ぐ。",
    image: "/assets/ui/week-transition-cg.png",
    unlock: "started",
  },
  {
    id: "reception",
    title: "第三闘技場・派遣受付",
    caption: "ここで渡された予定表から、二十六週間が始まった。",
    image: "/assets/story/bg-arena-reception.png",
    unlock: "started",
  },
  {
    id: "arena-day",
    title: "陽光の公式戦",
    caption: "勝っても負けても次は来る。だから、この一戦は選べる。",
    image: "/assets/arena-daylight.png",
    unlock: "arena",
  },
  {
    id: "gidono-sealed",
    title: "三百年前の限定予約",
    caption: "見た目は封印されたスライム。予約名は、裏ボスのそれだった。",
    image: "/assets/story/gidono-sealed-neutral.png",
    unlock: "gidono",
  },
  {
    id: "gidono-soft",
    title: "食べたかったもの",
    caption: "大魔王の後に現れるはずの存在にも、楽しみにしていた味がある。",
    image: "/assets/story/gidono-sealed-soft.png",
    unlock: "gidono",
  },
  {
    id: "gidono-free",
    title: "封印の外側",
    caption: "命令ではなく、本人が選んだ姿で隣に立つ。",
    image: "/assets/story/gidono-unsealed-soft.png",
    unlock: "gidono-free",
  },
];

function ArchiveScreen({ onClose }: { onClose: () => void }) {
  const profile = useGameStore((state) => state.profile);
  const run = useGameStore((state) => state.run);
  const [tab, setTab] = useState<"hall" | "collection" | "charter" | "gallery">("hall");
  const [selectedTeamId, setSelectedTeamId] = useState(
    profile.hallOfFame[0]?.id,
  );
  const [selectedCollectionId, setSelectedCollectionId] = useState(
    profile.liberatedCollection[0],
  );
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>();
  const selectedTeam =
    profile.hallOfFame.find((team) => team.id === selectedTeamId) ??
    profile.hallOfFame[0];
  const selectedCollection = selectedCollectionId
    ? fighterById.get(selectedCollectionId)
    : undefined;
  const selectedActiveIds =
    selectedTeam?.activeFighterIds ??
    selectedTeam?.fighterIds.slice(0, 3) ??
    [];
  const selectedRosterIds =
    selectedTeam?.rosterIds ?? selectedTeam?.fighterIds ?? [];
  const snapshotById = new Map(
    selectedTeam?.fighterSnapshots?.map((snapshot) => [
      snapshot.id,
      snapshot,
    ]) ?? [],
  );
  const hasSeenGidono = Boolean(
    run?.roster.includes("gidono") ||
      profile.liberatedCollection.includes("gidono"),
  );
  const isGalleryUnlocked = (entry: MemoryGalleryEntry) => {
    if (entry.unlock === "always") return true;
    if (entry.unlock === "started") return Boolean(run || profile.hasFinishedRun);
    if (entry.unlock === "arena") {
      return Boolean(profile.hasFinishedRun || (run && run.week >= 4));
    }
    if (entry.unlock === "gidono") return hasSeenGidono;
    return profile.liberatedCollection.includes("gidono");
  };
  const selectedGallery = memoryGalleryEntries.find(
    (entry) =>
      entry.id === selectedGalleryId && isGalleryUnlocked(entry),
  );
  useEffect(() => {
    if (!selectedGallery) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedGalleryId(undefined);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedGallery]);
  return (
    <main className="archive-screen content-page">
      <section className="archive-heading">
        <button className="icon-button" onClick={onClose} title="戻る">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">PERMANENT RECORD</p>
          <h2>殿堂と解放記録</h2>
        </div>
      </section>
      <div className="archive-tabs">
        <button
          className={tab === "hall" ? "is-selected" : ""}
          onClick={() => setTab("hall")}
        >
          <Medal size={18} /> 殿堂入りチーム
        </button>
        <button
          className={tab === "collection" ? "is-selected" : ""}
          onClick={() => setTab("collection")}
        >
          <HeartHandshake size={18} /> 解放済み
        </button>
        <button
          className={tab === "charter" ? "is-selected" : ""}
          onClick={() => setTab("charter")}
        >
          <ScrollText size={18} /> 条文集
        </button>
        <button
          className={tab === "gallery" ? "is-selected" : ""}
          onClick={() => setTab("gallery")}
        >
          <Images size={18} /> 記憶画廊
        </button>
      </div>
      {tab === "hall" ? (
        <>
          <section className="hall-list">
            {profile.hallOfFame.length === 0 ? (
              <div className="empty-archive">
                <Medal size={34} />
                <h3>まだ殿堂入りチームはありません</h3>
                <p>26週を終えると、その時点のチームが完全保存されます。</p>
              </div>
            ) : (
              profile.hallOfFame.map((team) => (
                <article
                  key={team.id}
                  className={
                    selectedTeam?.id === team.id
                      ? "hall-entry is-selected"
                      : "hall-entry"
                  }
                >
                  <div className="hall-entry__score">
                    <span>SCORE</span>
                    <strong>{team.score.toLocaleString("ja-JP")}</strong>
                  </div>
                  <div>
                    <span>{routeNames[team.route as RunState["route"]] ?? team.route}</span>
                    <h3>{team.result}</h3>
                    <p>
                      {team.wins}勝・{money(team.money)}・解放
                      {team.liberatedIds.length}人
                    </p>
                  </div>
                  <div className="hall-team">
                    {(team.activeFighterIds ?? team.fighterIds.slice(0, 3)).map(
                      (id) => (
                        <FighterMark id={id} key={id} />
                      ),
                    )}
                  </div>
                  <button
                    className="secondary-button secondary-button--small"
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    詳細
                    <ChevronRight size={16} />
                  </button>
                </article>
              ))
            )}
          </section>
          {selectedTeam && (
            <section className="hall-detail" aria-label="殿堂入りチーム詳細">
              <header>
                <div>
                  <span>保存された最終編成</span>
                  <h3>{selectedTeam.result}</h3>
                </div>
                <strong>
                  {selectedTeam.score.toLocaleString("ja-JP")} SCORE
                </strong>
              </header>
              <div className="hall-detail__lineup">
                {selectedActiveIds.map((id, index) => {
                  const fighter = fighterById.get(id);
                  const snapshot = snapshotById.get(id);
                  if (!fighter) return null;
                  const boostTotal = snapshot
                    ? Object.values(snapshot.statBoosts).reduce(
                        (sum, value) => sum + (value ?? 0),
                        0,
                      )
                    : undefined;
                  const item = snapshot?.equippedItemId
                    ? itemById.get(snapshot.equippedItemId)
                    : undefined;
                  return (
                    <article key={id}>
                      <b>
                        {
                          positionLabels[
                            ["front", "middle", "rear"][
                              index
                            ] as keyof typeof positionLabels
                          ]
                        }
                      </b>
                      <FighterMark id={id} size="large" />
                      <div>
                        <strong>{fighter.name}</strong>
                        {snapshot ? (
                          <>
                            <span>
                              信頼{snapshot.trust}・所有{snapshot.ownership}
                            </span>
                            <small>
                              能力 +{boostTotal}・{item?.name ?? "装備なし"}
                            </small>
                            <em>
                              {
                                tacticLabels[
                                  selectedTeam.battleTactics?.[id] ?? "signature"
                                ]
                              }
                            </em>
                          </>
                        ) : (
                          <small>旧形式のため能力記録なし</small>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hall-detail__record">
                <span>
                  戦型{" "}
                  <strong>
                    {selectedTeam.battlePlan === "assault"
                      ? "攻勢"
                      : selectedTeam.battlePlan === "guarded"
                        ? "堅守"
                        : "均衡"}
                  </strong>
                </span>
                <span>
                  所属 <strong>{selectedRosterIds.length}人</strong>
                </span>
                <span>
                  解放 <strong>{selectedTeam.liberatedIds.length}人</strong>
                </span>
                <span>
                  最終資金 <strong>{money(selectedTeam.money)}</strong>
                </span>
              </div>
              {selectedRosterIds.length > selectedActiveIds.length && (
                <div className="hall-detail__bench">
                  <span>控え</span>
                  {selectedRosterIds
                    .filter((id) => !selectedActiveIds.includes(id))
                    .map((id) => (
                      <FighterMark id={id} key={id} />
                    ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : tab === "charter" ? (
        <section className="charter-list">
          <header className="charter-list__head">
            <p className="eyebrow">ARENA CHARTER</p>
            <h3>再建闘技場・新条文集</h3>
            <p>
              自由になった人が、一条ずつ条文を残していく。
              {(() => {
                const unlocked = unlockedCharterArticles(
                  profile.liberatedCollection,
                );
                return `現在 ${unlocked.length} / ${arenaCharter.length} 条。全条がそろった周回のクリアで、特別な柿落としが待っている。`;
              })()}
            </p>
          </header>
          <ol>
            {arenaCharter.map((entry) => {
              const unlocked = profile.liberatedCollection.includes(
                entry.fighterId,
              );
              const fighter = fighterById.get(entry.fighterId);
              return (
                <li
                  key={entry.article}
                  className={unlocked ? "is-unlocked" : "is-locked"}
                >
                  <b>第{entry.article}条</b>
                  {unlocked ? (
                    <>
                      <span>{entry.text}</span>
                      <small>{fighter?.name ?? entry.fighterId}</small>
                    </>
                  ) : (
                    <>
                      <span className="charter-locked-text">
                        ——まだ、書かれていない
                      </span>
                      <small>
                        <LockKeyhole size={13} /> 解放で開示
                      </small>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ) : tab === "collection" ? (
        <>
          <section className="collection-grid">
            {fighterDefinitions.map((fighter) => {
              const unlocked = profile.liberatedCollection.includes(fighter.id);
              return (
                <article
                  className={[
                    unlocked ? "is-unlocked" : "",
                    selectedCollectionId === fighter.id ? "is-selected" : "",
                  ].join(" ")}
                  key={fighter.id}
                >
                  {unlocked ? (
                    <FighterMark id={fighter.id} size="large" />
                  ) : (
                    <span className="locked-mark">
                      <LockKeyhole size={22} />
                    </span>
                  )}
                  <div>
                    <strong>{unlocked ? fighter.name : "未解放"}</strong>
                    <span>{unlocked ? fighter.kind : "今後の周回で出会う"}</span>
                  </div>
                  {unlocked && (
                    <button
                      className="icon-button"
                      onClick={() => setSelectedCollectionId(fighter.id)}
                      title={`${fighter.name}の記録を見る`}
                      aria-label={`${fighter.name}の記録を見る`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                </article>
              );
            })}
          </section>
          {selectedCollection && (
            <section className="collection-detail">
              <FighterMark id={selectedCollection.id} size="large" />
              <div>
                <span>{selectedCollection.kind}</span>
                <h3>{selectedCollection.name}</h3>
                <p>{selectedCollection.summary}</p>
              </div>
              <div>
                <strong>{selectedCollection.traitName}</strong>
                <span>{selectedCollection.traitText}</span>
              </div>
              <p>
                {selectedCollection.scenes.epilogue.lines
                  .map((line) => line.text)
                  .join(" ")}
              </p>
            </section>
          )}
        </>
      ) : (
        <>
          <section className="memory-gallery-heading">
            <div>
              <span>MEMORY GALLERY</span>
              <h3>物語の景色</h3>
            </div>
            <p>
              出会いや試合を進めると、ラウンジに持ち帰った景色が増えていく。
            </p>
          </section>
          <section className="memory-gallery-grid">
            {memoryGalleryEntries.map((entry, index) => {
              const unlocked = isGalleryUnlocked(entry);
              return (
                <button
                  className={unlocked ? "is-unlocked" : "is-locked"}
                  key={entry.id}
                  disabled={!unlocked}
                  onClick={() => setSelectedGalleryId(entry.id)}
                  aria-label={
                    unlocked
                      ? `${entry.title}を大きく見る`
                      : `未解放の記憶 ${index + 1}`
                  }
                >
                  {unlocked ? (
                    <img src={entry.image} alt="" />
                  ) : (
                    <span className="memory-gallery-grid__locked">
                      <LockKeyhole size={25} />
                    </span>
                  )}
                  <span className="memory-gallery-grid__index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="memory-gallery-grid__copy">
                    <strong>{unlocked ? entry.title : "まだ見ていない景色"}</strong>
                    <small>
                      {unlocked ? entry.caption : "物語を進めると解放"}
                    </small>
                  </span>
                </button>
              );
            })}
          </section>
          <p className="memory-gallery-count">
            {
              memoryGalleryEntries.filter((entry) =>
                isGalleryUnlocked(entry),
              ).length
            }
            /{memoryGalleryEntries.length} 解放
          </p>
        </>
      )}
      <AnimatePresence>
        {selectedGallery && (
          <motion.div
            className="memory-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={selectedGallery.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setSelectedGalleryId(undefined)}
          >
            <motion.figure
              initial={{ opacity: 0, scale: 0.975 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <img src={selectedGallery.image} alt={selectedGallery.title} />
              <figcaption>
                <span>MEMORY</span>
                <strong>{selectedGallery.title}</strong>
                <p>{selectedGallery.caption}</p>
              </figcaption>
              <button
                className="icon-button memory-lightbox__close"
                onClick={() => setSelectedGalleryId(undefined)}
                title="閉じる"
                autoFocus
              >
                <X size={20} />
              </button>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export function App() {
  const [state, send] = useMachine(gameMachine);
  const phase = state.value as GamePhase;
  const [archiveReturnPhase, setArchiveReturnPhase] =
    useState<GamePhase>("title");
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetProgress, setAssetProgress] = useState(0);
  const [transitionNotice, setTransitionNotice] =
    useState<TransitionNotice>();
  const transitionTimers = useRef<number[]>([]);
  const profile = useGameStore((store) => store.profile);
  const run = useGameStore((store) => store.run);
  const startRun = useGameStore((store) => store.startRun);
  const chooseAction = useGameStore((store) => store.chooseAction);
  const queueMatch = useGameStore((store) => store.queueCurrentMatch);
  const advanceWeek = useGameStore((store) => store.advanceWeek);
  const startBattle = useGameStore((store) => store.startBattle);
  const retireRun = useGameStore((store) => store.retireRun);

  useEffect(() => {
    const criticalAssets = [
      "/assets/event-casino-cafe.png",
      "/assets/ui/team-lounge-day.png",
      "/assets/ui/week-transition-cg.png",
      "/assets/ui/chibi-atlas.png",
      "/assets/arena-daylight.png",
    ];
    const startedAt = performance.now();
    let cancelled = false;
    let settled = 0;
    const loadAsset = (src: string) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        const done = () => {
          settled += 1;
          if (!cancelled) {
            setAssetProgress((settled / criticalAssets.length) * 100);
          }
          resolve();
        };
        image.onload = done;
        image.onerror = done;
        image.src = src;
      });
    Promise.all(criticalAssets.map(loadAsset)).then(() => {
      const remaining = Math.max(0, 720 - (performance.now() - startedAt));
      window.setTimeout(() => {
        if (!cancelled) setAssetsReady(true);
      }, remaining);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () => () => {
      transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  useEffect(() => {
    if (phase === "title" || phase === "prologue" || phase === "archive") return;
    const expected: GamePhase = !run
      ? "title"
      : run.ended
        ? "ending"
        : run.battle
          ? "battle"
          : run.currentEvent
            ? "event"
            : run.lastEventOutcome
              ? "outcome"
              : run.pendingMatchId
                ? "matchPrep"
                : run.weekActionDone
                  ? "management"
                  : "week";
    if (expected === phase) return;
    if (expected === "title") send({ type: "RECOVER_TITLE" });
    else if (expected === "ending") send({ type: "RECOVER_ENDING" });
    else if (expected === "battle") send({ type: "RECOVER_BATTLE" });
    else if (expected === "event") send({ type: "RECOVER_EVENT" });
    else if (expected === "outcome") send({ type: "RECOVER_OUTCOME" });
    else if (expected === "matchPrep") send({ type: "RECOVER_MATCH" });
    else if (expected === "management") send({ type: "RECOVER_MANAGEMENT" });
    else send({ type: "RECOVER_WEEK" });
  }, [
    phase,
    run?.battle,
    run?.currentEvent,
    run?.ended,
    run?.lastEventOutcome,
    run?.pendingMatchId,
    run?.weekActionDone,
    send,
  ]);

  const goTitle = () => send({ type: "TO_TITLE" });
  const playTransition = (
    notice: TransitionNotice,
    task: () => void,
    actionDelay = 620,
  ) => {
    transitionTimers.current.forEach((timer) => window.clearTimeout(timer));
    setTransitionNotice(notice);
    transitionTimers.current = [
      window.setTimeout(task, actionDelay),
      window.setTimeout(
        () => setTransitionNotice(undefined),
        actionDelay + 360,
      ),
    ];
  };
  const openArchive = () => {
    if (phase !== "archive") setArchiveReturnPhase(phase);
    send({ type: "OPEN_ARCHIVE" });
  };
  const closeArchive = () => {
    if (archiveReturnPhase === "week") send({ type: "RECOVER_WEEK" });
    else if (archiveReturnPhase === "event") send({ type: "RECOVER_EVENT" });
    else if (archiveReturnPhase === "outcome") {
      send({ type: "RECOVER_OUTCOME" });
    } else if (archiveReturnPhase === "management") {
      send({ type: "RECOVER_MANAGEMENT" });
    } else if (archiveReturnPhase === "matchPrep") {
      send({ type: "RECOVER_MATCH" });
    } else if (archiveReturnPhase === "battle") {
      send({ type: "RECOVER_BATTLE" });
    } else if (archiveReturnPhase === "ending") {
      send({ type: "RECOVER_ENDING" });
    } else {
      send({ type: "RECOVER_TITLE" });
    }
  };

  const resume = () => {
    if (!run) return;
    if (run.ended) send({ type: "RESUME_ENDING" });
    else if (run.battle) send({ type: "RESUME_BATTLE" });
    else if (run.currentEvent) send({ type: "RESUME_EVENT" });
    else if (run.lastEventOutcome) send({ type: "RESUME_OUTCOME" });
    else if (run.pendingMatchId) send({ type: "RESUME_MATCH" });
    else if (run.weekActionDone) send({ type: "RESUME_MANAGEMENT" });
    else send({ type: "RESUME_WEEK" });
  };

  const start = (route: RunState["route"]) => {
    playTransition(
      {
        title: "派遣先へ向かっています",
        detail: "制服、派遣票、今日の仕事内容を確認中",
        tip: "今日の仕事は給仕、受付補助、倉庫確認。大会運営とは書かれていません。",
      },
      () => {
        startRun(route);
        playSound("ui", profile.soundEnabled);
        send({ type: "NEW_GAME" });
      },
      760,
    );
  };

  const proceedFromManagement = () => {
    playTransition(
      {
        title: "次の予定を準備しています",
        detail: "育成記録を閉じ、闘技場の掲示板を確認中",
        tip: "強いチームほど、待機室のお菓子が早くなくなります。",
      },
      () => {
        if (queueMatch()) send({ type: "MATCH_QUEUED" });
        else {
          advanceWeek();
          send({ type: "WEEK_ADVANCED" });
        }
      },
    );
  };

  if (!assetsReady) {
    return <LoadingScreen progress={assetProgress} />;
  }

  const screen = (() => {
    switch (phase) {
      case "title":
        return (
          <TitleScreen
            onStart={start}
            onContinue={() =>
              playTransition(
                {
                  title: "勤務記録を開いています",
                  detail: "中断した週と、全員の所在を照合中",
                  tip: "自動保存は几帳面です。契約書より信用できます。",
                },
                resume,
              )
            }
            onArchive={openArchive}
          />
        );
      case "prologue":
        return (
          <PrologueScreen
            condensed={profile.hasFinishedRun && profile.skipExplanations}
            onDone={() => send({ type: "SKIP_PROLOGUE" })}
          />
        );
      case "week":
        return (
          <WeekScreen
            onChoose={(action) => {
              const actionName =
                actionDetails.find((entry) => entry.id === action)?.label ??
                "今週の予定";
              playTransition(
                {
                  title: `「${actionName}」の支度中`,
                  detail: "行き先と、そこで起こりそうな出来事を確認しています",
                  tip:
                    action === "search"
                      ? "探し物が見つかる保証はありません。裏ボスが見つかることはあります。"
                      : "どの予定を選んでも、今週の出来事は必ずひとつ起こります。",
                },
                () => {
                  chooseAction(action);
                  playSound("ui", profile.soundEnabled);
                  send({ type: "ACTION_CHOSEN" });
                },
              );
            }}
          />
        );
      case "event":
        return (
          <EventScreen
            key={run?.currentEvent?.id}
            onResolved={() => send({ type: "CHOICE_RESOLVED" })}
          />
        );
      case "outcome":
        return (
          <OutcomeScreen
            onContinue={(followup) =>
              send({
                type: followup ? "OUTCOME_FOLLOWUP" : "OUTCOME_DONE",
              })
            }
          />
        );
      case "management":
        return (
          <ManagementScreen
            onProceed={proceedFromManagement}
            onRetire={() => {
              retireRun();
              send({ type: "RUN_ENDED" });
            }}
          />
        );
      case "matchPrep":
        return (
          <MatchPrepScreen
            onStart={() => {
              playTransition(
                {
                  title: "出場ゲートを開いています",
                  detail: "三人の配置と、対戦相手の契約印を最終確認中",
                  tip: "ミミは戦いません。声は届きます。請求書も後から届きます。",
                },
                () => {
                  if (startBattle()) send({ type: "BATTLE_STARTED" });
                },
                760,
              );
            }}
          />
        );
      case "battle":
        return (
          <BattleScreen
            onRecover={() =>
              send({
                type: run?.pendingMatchId ? "RECOVER_MATCH" : "RECOVER_WEEK",
              })
            }
            onSettled={(result) => {
              if (result.ended) send({ type: "RUN_ENDED" });
              else if (result.bonus) send({ type: "BONUS_MATCH" });
              else send({ type: "BATTLE_DONE" });
            }}
          />
        );
      case "ending":
        return <EndingScreen onTitle={goTitle} onArchive={openArchive} />;
      case "archive":
        return <ArchiveScreen onClose={closeArchive} />;
      default:
        return null;
    }
  })();

  return (
    <div className="app">
      <AppHeader phase={phase} onTitle={goTitle} onArchive={openArchive} />
      <AnimatePresence mode="wait">
        <motion.div
          className="screen-frame"
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>
      <AnimatePresence>
        {transitionNotice && (
          <SceneTransition notice={transitionNotice} />
        )}
      </AnimatePresence>
    </div>
  );
}
