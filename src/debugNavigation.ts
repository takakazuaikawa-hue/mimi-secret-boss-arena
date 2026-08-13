import { fighterDefinitions } from "./data/characters";
import { officialMatches } from "./data/matches";
import { useGameStore } from "./game/store";
import type { GamePhase } from "./game/machine";

export const DEBUG_NAVIGATION_QUERY = "debugUi";
const GAME_STORAGE_KEY = "mimi-secret-boss-arena";

export type DebugArchiveTab = "hall" | "collection" | "charter" | "gallery";

export type DebugScreenTarget =
  | "title"
  | "prologue"
  | "week"
  | "event"
  | "outcome"
  | "management"
  | "match-prep"
  | "battle"
  | "battle-decision"
  | "battle-victory"
  | "battle-defeat"
  | "ending"
  | `archive-${DebugArchiveTab}`;

export const debugScreenGroups: Array<{
  label: string;
  targets: Array<{ id: DebugScreenTarget; label: string }>;
}> = [
  {
    label: "進行画面",
    targets: [
      { id: "title", label: "タイトル" },
      { id: "prologue", label: "導入" },
      { id: "week", label: "週行動" },
      { id: "event", label: "出来事" },
      { id: "outcome", label: "結果" },
      { id: "management", label: "育成・編成" },
      { id: "match-prep", label: "試合準備" },
      { id: "ending", label: "周回結果" },
    ],
  },
  {
    label: "バトル",
    targets: [
      { id: "battle", label: "通常戦闘" },
      { id: "battle-decision", label: "監督指示" },
      { id: "battle-victory", label: "勝利結果" },
      { id: "battle-defeat", label: "敗北結果" },
    ],
  },
  {
    label: "記録室",
    targets: [
      { id: "archive-hall", label: "殿堂入り" },
      { id: "archive-collection", label: "解放済み" },
      { id: "archive-charter", label: "演目表" },
      { id: "archive-gallery", label: "記憶画廊" },
    ],
  },
];

export const debugScreenTargets = debugScreenGroups.flatMap((group) =>
  group.targets.map((target) => ({ ...target, group: group.label })),
);

export const isDebugNavigationAvailable =
  (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;

export const debugNavigationTargetFromUrl = (): DebugScreenTarget | undefined => {
  if (!isDebugNavigationAvailable || typeof window === "undefined") return undefined;
  const value = new URLSearchParams(window.location.search).get(
    DEBUG_NAVIGATION_QUERY,
  );
  return debugScreenTargets.some((target) => target.id === value)
    ? (value as DebugScreenTarget)
    : undefined;
};

export const isDebugNavigationSession = () =>
  isDebugNavigationAvailable &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has(DEBUG_NAVIGATION_QUERY);

export const enterDebugNavigationSession = () => {
  if (!isDebugNavigationAvailable || typeof window === "undefined") return;
  const saved = window.localStorage.getItem(GAME_STORAGE_KEY);
  if (saved) window.sessionStorage.setItem(GAME_STORAGE_KEY, saved);

  const targetWindow = window.parent === window ? window : window.parent;
  const url = new URL(targetWindow.location.href);
  url.searchParams.delete("gameCanvas");
  url.searchParams.set(DEBUG_NAVIGATION_QUERY, "1");
  targetWindow.location.assign(url);
};

export const rememberDebugNavigationTarget = (target: DebugScreenTarget) => {
  if (!isDebugNavigationSession()) return;
  const frameUrl = new URL(window.location.href);
  frameUrl.searchParams.set(DEBUG_NAVIGATION_QUERY, target);
  window.history.replaceState(null, "", frameUrl);

  if (window.parent !== window) {
    const hostUrl = new URL(window.parent.location.href);
    hostUrl.searchParams.delete("gameCanvas");
    hostUrl.searchParams.set(DEBUG_NAVIGATION_QUERY, target);
    window.parent.history.replaceState(null, "", hostUrl);
  }
};

const startDebugRun = () => {
  useGameStore.getState().startRun("normal", "debug-screen-navigation", 1);
};

const addDebugRoster = () => {
  const run = useGameStore.getState().run;
  if (!run) return;
  const roster = fighterDefinitions.slice(0, 3).map((fighter) => fighter.id);
  const fighters = { ...run.fighters };
  roster.forEach((id) => {
    fighters[id] = {
      ...fighters[id],
      encountered: true,
      recruited: true,
      trust: 72,
      ownership: 28,
      storyStage: Math.max(1, fighters[id].storyStage),
    };
  });
  useGameStore.setState({
    run: {
      ...run,
      week: officialMatches[0].week,
      ownershipStage: "provisional",
      arenaRank: "provisional",
      fighters,
      roster,
      activeTeam: roster,
    },
  });
};

const settleDebugEvents = () => {
  for (let step = 0; step < 24; step += 1) {
    const state = useGameStore.getState();
    if (state.run?.currentEvent) state.resolveEvent(0);
    const resolved = useGameStore.getState();
    if (resolved.run?.lastEventOutcome) resolved.continueEvent();
    const next = useGameStore.getState().run;
    if (!next?.currentEvent && !next?.lastEventOutcome) return;
  }
};

const prepareArchiveFixture = () => {
  if (useGameStore.getState().profile.hallOfFame.length === 0) {
    startDebugRun();
    addDebugRoster();
    useGameStore.getState().retireRun();
  }
  const profile = useGameStore.getState().profile;
  useGameStore.setState({
    profile: {
      ...profile,
      hasFinishedRun: true,
      completedRuns: Math.max(1, profile.completedRuns ?? 0),
      liberatedCollection: fighterDefinitions.map((fighter) => fighter.id),
    },
  });
};

export const prepareDebugScreen = (
  target: DebugScreenTarget,
): { phase: GamePhase; archiveTab?: DebugArchiveTab } => {
  rememberDebugNavigationTarget(target);

  if (target.startsWith("archive-")) {
    prepareArchiveFixture();
    return {
      phase: "archive",
      archiveTab: target.slice("archive-".length) as DebugArchiveTab,
    };
  }

  if (target === "title") return { phase: "title" };

  startDebugRun();
  if (target === "prologue" || target === "week") return { phase: target };

  if (target === "event" || target === "outcome" || target === "management") {
    useGameStore.getState().chooseAction("search");
    if (target === "event") return { phase: "event" };
    useGameStore.getState().resolveEvent(0);
    if (target === "outcome") return { phase: "outcome" };
    settleDebugEvents();
    return { phase: "management" };
  }

  addDebugRoster();
  const run = useGameStore.getState().run;
  if (!run) return { phase: "title" };

  if (target === "ending") {
    useGameStore.getState().retireRun();
    return { phase: "ending" };
  }

  useGameStore.setState({
    run: {
      ...run,
      weekActionDone: true,
      pendingMatchId: officialMatches[0].id,
    },
  });
  const isBattleTarget = target === "battle" || target.startsWith("battle-");
  if (!isBattleTarget) return { phase: "matchPrep" };

  useGameStore.getState().startBattle();
  if (target === "battle-decision") {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const state = useGameStore.getState();
      const battle = state.run?.battle;
      if (!battle || battle.status === "decision") break;
      if (battle.status === "won" || battle.status === "lost") break;
      if ((battle.presentationEvents?.length ?? 0) > 0) {
        state.finishBattlePresentation();
      }
      useGameStore.getState().stepBattle();
    }
    const decisionRun = useGameStore.getState().run;
    if (decisionRun?.battle) {
      useGameStore.setState({
        run: {
          ...decisionRun,
          battle: { ...decisionRun.battle, presentationEvents: [] },
        },
      });
    }
  }

  if (target === "battle-victory" || target === "battle-defeat") {
    useGameStore.getState().finishBattleNow();
    const resultRun = useGameStore.getState().run;
    if (resultRun?.battle) {
      const won = target === "battle-victory";
      useGameStore.setState({
        run: {
          ...resultRun,
          battle: {
            ...resultRun.battle,
            status: won ? "won" : "lost",
            turn: won ? resultRun.battle.turn : 6,
            presentationEvents: [],
            metrics: won
              ? resultRun.battle.metrics
              : {
                  ...resultRun.battle.metrics,
                  damageDealt: 84,
                  damageTaken: 213,
                  healingDone: 46,
                  criticalHits: 1,
                },
            player: resultRun.battle.player.map((unit) =>
              won ? unit : { ...unit, hp: 0, defeated: true },
            ),
            enemy: resultRun.battle.enemy.map((unit) =>
              won ? { ...unit, hp: 0, defeated: true } : unit,
            ),
          },
        },
      });
    }
  }
  return { phase: "battle" };
};
