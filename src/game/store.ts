import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { createBattle, applyIntervention, resolveBattleRound } from "./battle";
import {
  addStatPoint,
  chooseWeeklyAction,
  clearEventOutcome,
  createHallOfFameEntry,
  createInitialProfile,
  createRun,
  maybeCreateOpeningOwnershipFollowup,
  maybeCreateLiberationFollowup,
  maybeCreateMainStoryFollowup,
  nextCampaignWeek,
  nextMatchId,
  resolveCurrentEvent,
  setFocusFighter,
  toggleActiveFighter,
} from "./engine";
import { getMatchDefinition, parseBonusMatchId } from "../data/matches";
import { itemById } from "../data/items";
import { getRouteDefinition } from "../data/routes";
import { fighterDefinitions } from "../data/characters";
import { isProgramComplete } from "../data/openingProgram";
import {
  campaignStages,
  unlockedCampaignStage,
} from "../data/campaignStages";
import { randomForCursor } from "./rng";
import { migrateNarrativeRunState } from "../narrative/saveMigration";
import type {
  BattleIntervention,
  BattleState,
  CarriedAllyState,
  PlayerProfile,
  RunState,
  Stats,
  BattlePlan,
  BattleTactic,
  SpectatorSide,
  WeeklyAction,
} from "./types";

interface GameStore {
  profile: PlayerProfile;
  run?: RunState;
  startRun: (
    route: RunState["route"],
    seed?: string,
    stage?: 1 | 2 | 3,
  ) => void;
  clearRun: () => void;
  chooseAction: (action: WeeklyAction) => void;
  resolveEvent: (choiceIndex?: number) => void;
  continueEvent: () => { followup: boolean };
  allocatePoint: (
    fighterId: string,
    stat: keyof Stats,
    source: "fighter" | "shared",
    amount?: number,
  ) => void;
  toggleActive: (fighterId: string) => void;
  setFocus: (fighterId?: string) => void;
  buyItem: (itemId: string) => boolean;
  equipItem: (fighterId: string, itemId?: string) => boolean;
  queueCurrentMatch: () => boolean;
  advanceWeek: () => void;
  setBet: (amount: number) => void;
  setBattlePlan: (plan: BattlePlan) => void;
  setBattleTactic: (fighterId: string, tactic: BattleTactic) => void;
  moveActive: (fighterId: string, direction: -1 | 1) => void;
  startBattle: () => boolean;
  stepBattle: () => void;
  finishBattleNow: () => void;
  finishBattlePresentation: () => void;
  intervene: (intervention: BattleIntervention) => void;
  prepareSpectatorMatch: () => boolean;
  startSpectatorMatch: (side: SpectatorSide, stake: number) => boolean;
  resolveSpectatorMatch: () => void;
  dismissSpectatorMatch: () => void;
  settleBattle: () => { bonus: boolean; ended: boolean; won: boolean };
  retireRun: () => void;
  setSkipExplanations: (value: boolean) => void;
  setSoundEnabled: (value: boolean) => void;
  setTextSpeed: (value: PlayerProfile["textSpeed"]) => void;
  setDialogueMode: (value: PlayerProfile["dialogueMode"]) => void;
  setBattleSpeed: (value: PlayerProfile["battleSpeed"]) => void;
  setBattlePlayback: (value: PlayerProfile["battlePlayback"]) => void;
}

const nonBrowserStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const gameStateStorage = (): StateStorage => {
  if (typeof window === "undefined") return nonBrowserStorage;
  const params = new URLSearchParams(window.location.search);
  const isDevBuild =
    (import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV === true;
  const isIsolatedDebugSession =
    isDevBuild &&
    (params.has("debugBattle") || params.has("debugUi"));
  return isIsolatedDebugSession ? sessionStorage : localStorage;
};

const finishRun = (
  run: RunState,
  profile: PlayerProfile,
  endingType: NonNullable<RunState["endingType"]>,
): { run: RunState; profile: PlayerProfile } => {
  const liberatedCollection = [
    ...new Set([
      ...profile.liberatedCollection,
      ...run.roster.filter((id) => run.fighters[id].liberated),
    ]),
  ];
  // 周回をまたいで全人物の解放(=演目表の完成)へ到達した再建クリアは、
  // 真エンディング「柿落とし、十五幕」へ昇格する。
  const resolvedEnding: NonNullable<RunState["endingType"]> =
    endingType === "rebuild" && isProgramComplete(liberatedCollection)
      ? "grand"
      : endingType;
  const endedRun: RunState = { ...run, ended: true, endingType: resolvedEnding };
  const hallEntry = createHallOfFameEntry(endedRun);
  const cleared = resolvedEnding !== "retired";
  const unlocked = new Set(profile.unlockedRoutes);
  if (cleared && run.route === "normal") unlocked.add("domination");
  if (cleared && run.route === "domination") unlocked.add("chaos");
  // クリア後の世界では仲間だけが積み重なる: 今周の在籍者を持ち越しへ合流。
  const carriedAllies: CarriedAllyState[] = [
    ...(profile.carriedAllies ?? []).filter(
      (ally) => !run.roster.includes(ally.id),
    ),
    ...run.roster
      .filter((id) => run.fighters[id])
      .map((id) => ({
        id,
        trust: run.fighters[id].trust,
        ownership: run.fighters[id].ownership,
        storyStage: run.fighters[id].storyStage,
        liberated: run.fighters[id].liberated,
      })),
  ];
  return {
    run: endedRun,
    profile: {
      ...profile,
      hasFinishedRun: true,
      clears: profile.clears + (cleared ? 1 : 0),
      completedRuns:
        (profile.completedRuns ?? (profile.hasFinishedRun ? 1 : 0)) + 1,
      carriedAllies,
      unlockedRoutes: [...unlocked],
      liberatedCollection,
      grandCleared: profile.grandCleared || resolvedEnding === "grand",
      hallOfFame: [hallEntry, ...profile.hallOfFame].slice(0, 30),
    },
  };
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      profile: createInitialProfile(),
      startRun: (route, seed, stage) =>
        set((state) => {
          // 旧セーブには持ち越しデータがないため、解放コレクションから合成する
          // (解放済み=物語を終えて在籍し続ける仲間、として復元)。
          const carriedAllies: CarriedAllyState[] =
            state.profile.carriedAllies ??
            state.profile.liberatedCollection.map((id) => ({
              id,
              trust: 90,
              ownership: 0,
              storyStage: 7,
              liberated: true,
            }));
          // 到達済み区分の範囲で、やり直したい勤務週区分を選べる
          // (クリア後の世界は毎回整い直されるため、再訪は世界観どおり)。
          const unlockedStage = unlockedCampaignStage(state.profile);
          const chosenStage =
            campaignStages[Math.min(stage ?? unlockedStage, unlockedStage) - 1];
          // 完走せずに始め直した場合でも、その周で仲間になった人は残る
          // (この世界では、物語は進まなくても仲間だけが積み重なる)。
          const abandoned = state.run;
          const mergedAllies: CarriedAllyState[] = abandoned
            ? [
                ...carriedAllies.filter(
                  (ally) => !abandoned.roster.includes(ally.id),
                ),
                ...abandoned.roster
                  .filter((id) => abandoned.fighters[id])
                  .map((id) => ({
                    id,
                    trust: abandoned.fighters[id].trust,
                    ownership: abandoned.fighters[id].ownership,
                    storyStage: abandoned.fighters[id].storyStage,
                    liberated: abandoned.fighters[id].liberated,
                  })),
              ]
            : carriedAllies;
          return {
            profile: { ...state.profile, carriedAllies: mergedAllies },
            run: createRun(route, seed ?? undefined, {
              deprioritizedEncounters: state.profile.liberatedCollection,
              campaignStage: chosenStage,
              carriedAllies: mergedAllies,
            }),
          };
        }),
      clearRun: () => set({ run: undefined }),
      chooseAction: (action) =>
        set((state) =>
          state.run ? { run: chooseWeeklyAction(state.run, action) } : {},
        ),
      resolveEvent: (choiceIndex = 0) => {
        set((state) => {
          if (!state.run?.currentEvent) return {};
          const sceneId = state.run.currentEvent.scene.id;
          const resolved = resolveCurrentEvent(state.run, choiceIndex);
          return {
            run: resolved,
            profile: {
              ...state.profile,
              seenEvents: [
                ...new Set([...state.profile.seenEvents, sceneId]),
              ],
            },
          };
        });
      },
      continueEvent: () => {
        let followup = false;
        set((state) => {
          if (!state.run?.lastEventOutcome) return {};
          const wasLiberation = state.run.lastEventOutcome.isLiberation;
          const cleared = clearEventOutcome(state.run);
          const openingFollowup = maybeCreateOpeningOwnershipFollowup(cleared);
          const afterLiberation =
            wasLiberation || openingFollowup.currentEvent
              ? openingFollowup
              : maybeCreateLiberationFollowup(openingFollowup);
          // メインストーリー終了直後は、橋先の個別場面へ連続再生する。
          const next = afterLiberation.currentEvent
            ? afterLiberation
            : maybeCreateMainStoryFollowup(afterLiberation);
          followup = Boolean(next.currentEvent);
          return { run: next };
        });
        return { followup };
      },
      allocatePoint: (fighterId, stat, source, amount = 1) =>
        set((state) => {
          if (!state.run) return {};
          let run = state.run;
          for (let index = 0; index < Math.max(1, amount); index += 1) {
            run = addStatPoint(run, fighterId, stat, source);
          }
          return { run };
        }),
      toggleActive: (fighterId) =>
        set((state) =>
          state.run
            ? { run: toggleActiveFighter(state.run, fighterId) }
            : {},
        ),
      setFocus: (fighterId) =>
        set((state) =>
          state.run
            ? { run: setFocusFighter(state.run, fighterId) }
            : {},
        ),
      buyItem: (itemId) => {
        const run = get().run;
        const item = itemById.get(itemId);
        if (!run || !item || run.money < item.cost) return false;
        set({
          run: {
            ...run,
            money: run.money - item.cost,
            inventory: {
              ...run.inventory,
              [itemId]: (run.inventory[itemId] ?? 0) + 1,
            },
          },
        });
        return true;
      },
      equipItem: (fighterId, itemId) => {
        const run = get().run;
        const fighter = run?.fighters[fighterId];
        if (!run || !fighter || !fighter.recruited) {
          return false;
        }
        if (itemId) {
          const owned = run.inventory[itemId] ?? 0;
          const equippedCount = Object.values(run.fighters).filter(
            (state) =>
              state.id !== fighterId && state.equippedItemId === itemId,
          ).length;
          if (owned <= equippedCount) return false;
        }
        set({
          run: {
            ...run,
            fighters: {
              ...run.fighters,
              [fighterId]: { ...fighter, equippedItemId: itemId },
            },
          },
        });
        return true;
      },
      queueCurrentMatch: () => {
        const run = get().run;
        if (!run) return false;
        const id = nextMatchId(run);
        if (!id) return false;
        const activeTeam = run.activeTeam;
        set({
          run: {
            ...run,
            activeTeam,
            pendingMatchId: id,
            currentBet: 0,
          },
        });
        return true;
      },
      advanceWeek: () =>
        set((state) =>
          state.run ? { run: nextCampaignWeek(state.run) } : {},
        ),
      setBet: (amount) =>
        set((state) => {
          if (!state.run) return {};
          const allowed = Math.max(0, Math.min(amount, state.run.money));
          return { run: { ...state.run, currentBet: allowed } };
        }),
      setBattlePlan: (plan) =>
        set((state) =>
          state.run ? { run: { ...state.run, battlePlan: plan } } : {},
        ),
      setBattleTactic: (fighterId, tactic) =>
        set((state) =>
          state.run
            ? {
                run: {
                  ...state.run,
                  battleTactics: {
                    ...(state.run.battleTactics ?? {}),
                    [fighterId]: tactic,
                  },
                },
              }
            : {},
        ),
      moveActive: (fighterId, direction) =>
        set((state) => {
          if (!state.run) return {};
          const activeTeam = [...state.run.activeTeam];
          const index = activeTeam.indexOf(fighterId);
          const nextIndex = index + direction;
          if (index < 0 || nextIndex < 0 || nextIndex >= activeTeam.length) {
            return {};
          }
          [activeTeam[index], activeTeam[nextIndex]] = [
            activeTeam[nextIndex],
            activeTeam[index],
          ];
          return { run: { ...state.run, activeTeam } };
        }),
      startBattle: () => {
        const run = get().run;
        if (!run?.pendingMatchId) return false;
        const match = getMatchDefinition(run.pendingMatchId);
        if (!match) return false;
        const random = randomForCursor(run.seed, run.rngCursor);
        const route = getRouteDefinition(run.route);
        const battle = createBattle(
          run,
          {
            ...match,
            difficulty: match.difficulty * route.battleScale,
          },
          random,
        );
        set({
          run: {
            ...run,
            money: Math.max(0, run.money - run.currentBet),
            rngCursor: run.rngCursor + 1,
            battle,
          },
        });
        return true;
      },
      stepBattle: () =>
        set((state) => {
          if (!state.run?.battle) return {};
          const random = randomForCursor(
            state.run.seed,
            state.run.rngCursor,
          );
          return {
            run: {
              ...state.run,
              rngCursor: state.run.rngCursor + 1,
              battle: resolveBattleRound(state.run.battle, random),
            },
          };
        }),
      finishBattleNow: () =>
        set((state) => {
          if (!state.run?.battle) return {};
          let battle: BattleState = {
            ...state.run.battle,
            presentationEvents: [],
          };
          let cursor = state.run.rngCursor;
          let safety = 0;
          while (battle.status !== "won" && battle.status !== "lost" && safety < 40) {
            if (battle.status === "decision") {
              battle = applyIntervention(battle, { type: "pass" });
            } else {
              battle = resolveBattleRound(
                battle,
                randomForCursor(state.run.seed, cursor),
              );
              cursor += 1;
            }
            battle = { ...battle, presentationEvents: [] };
            safety += 1;
          }
          return {
            run: { ...state.run, rngCursor: cursor, battle },
          };
        }),
      finishBattlePresentation: () =>
        set((state) =>
          state.run?.battle
            ? {
                run: {
                  ...state.run,
                  battle: {
                    ...state.run.battle,
                    presentationEvents: [],
                  },
                },
              }
            : {},
        ),
      intervene: (intervention) =>
        set((state) =>
          state.run?.battle
            ? {
                run: {
                  ...state.run,
                  battle: applyIntervention(state.run.battle, intervention),
                },
              }
            : {},
        ),
      prepareSpectatorMatch: () => {
        const run = get().run;
        if (!run?.battle || run.battle.status !== "lost") return false;
        if (run.spectatorMatch) return true;

        const random = randomForCursor(run.seed, run.rngCursor);
        const inactive = fighterDefinitions.filter(
          (fighter) => !run.activeTeam.includes(fighter.id),
        );
        const pool = inactive.length >= 4 ? inactive : fighterDefinitions;
        const contestants = random.shuffle(pool).slice(0, 4);
        if (contestants.length < 4) return false;

        const azure = [contestants[0], contestants[2]];
        const coral = [contestants[1], contestants[3]];
        const teamPower = (team: typeof azure) =>
          team.reduce(
            (total, fighter) =>
              total +
              fighter.stats.hp * 0.18 +
              fighter.stats.attack * 0.24 +
              fighter.stats.magic * 0.24 +
              fighter.stats.defense * 0.16 +
              fighter.stats.speed * 0.18,
            0,
          );
        const azurePower = teamPower(azure);
        const coralPower = teamPower(coral);
        const rawAzureChance = azurePower / (azurePower + coralPower);
        const azureChance = Math.max(0.34, Math.min(0.66, rawAzureChance));
        const winnerSide: SpectatorSide =
          random.next() < azureChance ? "azure" : "coral";
        const margin = Math.abs(azureChance - 0.5);
        const favoriteOdds = Math.max(1.45, 1.82 - margin * 2.2);
        const underdogOdds = Math.min(2.75, 2.08 + margin * 2.8);
        const azureFavorite = azureChance >= 0.5;

        set({
          run: {
            ...run,
            rngCursor: run.rngCursor + 1,
            spectatorMatch: {
              id: `spectator:${run.battle.matchId}:${run.week}`,
              status: "offer",
              azureFighterIds: azure.map((fighter) => fighter.id),
              coralFighterIds: coral.map((fighter) => fighter.id),
              stake: 0,
              winnerSide,
              odds: {
                azure: Number(
                  (azureFavorite ? favoriteOdds : underdogOdds).toFixed(2),
                ),
                coral: Number(
                  (azureFavorite ? underdogOdds : favoriteOdds).toFixed(2),
                ),
              },
              payout: 0,
            },
          },
        });
        return true;
      },
      startSpectatorMatch: (side, stake) => {
        const run = get().run;
        const spectator = run?.spectatorMatch;
        if (!run || !spectator || spectator.status !== "offer") return false;
        const allowedStake = Math.max(0, Math.min(Math.round(stake), run.money));
        set({
          run: {
            ...run,
            money: run.money - allowedStake,
            spectatorMatch: {
              ...spectator,
              status: "watching",
              selectedSide: side,
              stake: allowedStake,
              payout: 0,
            },
          },
        });
        return true;
      },
      resolveSpectatorMatch: () =>
        set((state) => {
          const run = state.run;
          const spectator = run?.spectatorMatch;
          if (!run || !spectator || spectator.status !== "watching") return {};
          const won = spectator.selectedSide === spectator.winnerSide;
          const payout = won && spectator.selectedSide
            ? Math.round(spectator.stake * spectator.odds[spectator.selectedSide])
            : 0;
          return {
            run: {
              ...run,
              money: run.money + payout,
              spectatorMatch: {
                ...spectator,
                status: "resolved",
                payout,
              },
            },
          };
        }),
      dismissSpectatorMatch: () =>
        set((state) =>
          state.run?.spectatorMatch
            ? {
                run: {
                  ...state.run,
                  spectatorMatch: {
                    ...state.run.spectatorMatch,
                    status: "dismissed",
                  },
                },
              }
            : {},
        ),
      settleBattle: () => {
        const state = get();
        const run = state.run;
        if (
          !run?.battle ||
          (run.battle.status !== "won" && run.battle.status !== "lost")
        ) {
          return { bonus: false, ended: false, won: false };
        }
        const won = run.battle.status === "won";
        const match = getMatchDefinition(run.battle.matchId);
        if (!match) return { bonus: false, ended: false, won };
        const reward = won ? match.prize + run.currentBet * 2 : 0;
        const fighters = { ...run.fighters };
        const activeTeam = run.activeTeam;
        activeTeam.forEach((id) => {
          fighters[id] = {
            ...fighters[id],
            fighterPoints: fighters[id].fighterPoints + (won ? 4 : 2),
          };
        });
        const rngCursor = run.rngCursor;
        let nextRun: RunState = {
          ...run,
          fighters,
          activeTeam,
          rngCursor,
          money: run.money + reward,
          wins: run.wins + (won ? 1 : 0),
          losses: run.losses + (won ? 0 : 1),
          battle: undefined,
          spectatorMatch: undefined,
          currentBet: 0,
          lastMatchSummary: won
            ? `${match.name}に勝利。賞金${reward.toLocaleString("ja-JP")}Gと、出場選手は各4育成ptを獲得。`
            : `${match.name}は敗戦。出場選手は各2育成ptを獲得。試合で見えた弱点を次の編成へ持ち帰った。`,
        };

        if (won && match.roundsOnWin > 0) {
          const currentBonus = parseBonusMatchId(match.id);
          const baseId = currentBonus?.baseId ?? match.id;
          const nextRound = (currentBonus?.round ?? 0) + 1;
          nextRun = {
            ...nextRun,
            pendingMatchId: `bonus:${nextRound}:${baseId}`,
            bonusMatches: nextRun.bonusMatches + 1,
          };
          set({ run: nextRun });
          return { bonus: true, ended: false, won };
        }

        const completedBonus = parseBonusMatchId(match.id);
        const completedBaseId = completedBonus?.baseId ?? match.id;
        nextRun = { ...nextRun, pendingMatchId: undefined };
        if (won && completedBaseId === "opening-cup") {
          nextRun = {
            ...nextRun,
            ownershipStage: "owner",
            arenaRank: "highest",
            flags: [
              ...nextRun.flags.filter(
                (flag) =>
                  flag !== "rank:highest" &&
                  flag !== "opening-cup:champion",
              ),
              "rank:highest",
              "opening-cup:champion",
            ],
            lastMatchSummary:
              "新人向け三連戦を全勝。相手が普通だったため、裏ボス級の仲間たちは一度も本気を出さなかった。規定上の連続圧勝により、チームランクは最上級へ。温泉旅行も獲得した。",
          };
        }
        if (match.final) {
          const liberated = nextRun.roster.filter(
            (id) => nextRun.fighters[id].liberated,
          ).length;
          const endingType = won && liberated >= 2 ? "rebuild" : won ? "company" : "retired";
          const finished = finishRun(nextRun, state.profile, endingType);
          set(finished);
          return { bonus: false, ended: true, won };
        }

        set({
          run: {
            ...nextCampaignWeek(nextRun),
            lastMatchSummary: nextRun.lastMatchSummary,
          },
        });
        return { bonus: false, ended: false, won };
      },
      retireRun: () =>
        set((state) => {
          if (!state.run) return {};
          return finishRun(state.run, state.profile, "retired");
        }),
      setSkipExplanations: (value) =>
        set((state) => ({
          profile: { ...state.profile, skipExplanations: value },
        })),
      setSoundEnabled: (value) =>
        set((state) => ({
          profile: { ...state.profile, soundEnabled: value },
        })),
      setTextSpeed: (value) =>
        set((state) => ({
          profile: { ...state.profile, textSpeed: value },
        })),
      setDialogueMode: (value) =>
        set((state) => ({
          profile: { ...state.profile, dialogueMode: value },
        })),
      setBattleSpeed: (value) =>
        set((state) => ({
          profile: { ...state.profile, battleSpeed: value },
        })),
      setBattlePlayback: (value) =>
        set((state) => ({
          profile: { ...state.profile, battlePlayback: value },
        })),
    }),
    {
      name: "mimi-secret-boss-arena",
      version: 11,
      storage: createJSONStorage(gameStateStorage),
      partialize: (state) => ({ profile: state.profile, run: state.run }),
      migrate: (persisted) => {
        const state = persisted as Partial<GameStore>;
        const defaultProfile = createInitialProfile();
        const profile: PlayerProfile = {
          ...defaultProfile,
          ...(state.profile ?? {}),
          version: 11,
          dialogueMode: "step",
          unlockedRoutes:
            state.profile?.unlockedRoutes ?? defaultProfile.unlockedRoutes,
          liberatedCollection: state.profile?.liberatedCollection ?? [],
          seenEvents: state.profile?.seenEvents ?? [],
          hallOfFame: state.profile?.hallOfFame ?? [],
        };
        let run: RunState | undefined = state.run
          ? {
              ...state.run,
              ownershipStage: state.run.ownershipStage ?? "owner",
              arenaRank: state.run.arenaRank ?? "highest",
              liberationWindowsUsed: state.run.liberationWindowsUsed ?? [],
              battlePlan: state.run.battlePlan ?? "balanced",
              battleTactics: state.run.battleTactics ?? {},
              activeTeam: state.run.activeTeam ?? [],
              focusFighterId: state.run.focusFighterId,
              fighters: Object.fromEntries(
                Object.entries(state.run.fighters).map(([id, fighter]) => [
                  id,
                  {
                    ...fighter,
                    contractDecision:
                      fighter.liberated || fighter.contractDecision === "retained"
                        ? "released"
                        : fighter.contractDecision,
                    liberated:
                      fighter.liberated ||
                      fighter.contractDecision === "retained" ||
                      fighter.storyStage >= 6,
                    ownership:
                      fighter.liberated ||
                      fighter.contractDecision === "retained" ||
                      fighter.storyStage >= 6
                        ? 0
                        : fighter.ownership,
                  },
                ]),
              ),
              battle: state.run.battle?.metrics
                ? {
                    ...state.run.battle,
                    turningPointUsed:
                      state.run.battle.turningPointUsed ?? false,
                    presentationEvents: [],
                    player: state.run.battle.player.map((unit) => ({
                      ...unit,
                      breakGauge: 0,
                      brokenTurns: 0,
                    })),
                    enemy: state.run.battle.enemy.map((unit) => ({
                      ...unit,
                      breakGauge: 0,
                      brokenTurns: 0,
                    })),
                    metrics: {
                      ...state.run.battle.metrics,
                      turningPoints:
                        state.run.battle.metrics.turningPoints ?? 0,
                      damageDealt:
                        state.run.battle.metrics.damageDealt ?? 0,
                      damageTaken:
                        state.run.battle.metrics.damageTaken ?? 0,
                      healingDone:
                        state.run.battle.metrics.healingDone ?? 0,
                      skillUses:
                        state.run.battle.metrics.skillUses ?? {},
                    },
                  }
                : state.run.battle
                  ? undefined
                  : state.run.battle,
            }
          : undefined;
        if (run && state.run?.battle && !state.run.battle.metrics) {
          const match = getMatchDefinition(state.run.battle.matchId);
          if (match) {
            const route = getRouteDefinition(run.route);
            run = {
              ...run,
              pendingMatchId: match.id,
              battle: createBattle(
                run,
                {
                  ...match,
                  difficulty: match.difficulty * route.battleScale,
                },
                randomForCursor(run.seed, run.rngCursor),
              ),
            };
          }
        }
        if (
          run?.battle &&
          run.battle.enemy.length !== run.battle.player.length
        ) {
          run = {
            ...run,
            battle: {
              ...run.battle,
              enemy: run.battle.enemy.slice(0, run.battle.player.length),
              presentationEvents: [],
            },
          };
        }
        if (run) {
          run = migrateNarrativeRunState(run);
        }
        return { ...state, profile, run };
      },
    },
  ),
);
