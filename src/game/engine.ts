import { ambientEvents } from "../data/ambientEvents";
import {
  campaignStages,
  type CampaignStageDefinition,
} from "../data/campaignStages";
import { fighterDefinitions } from "../data/characters";
import { matchForWeek } from "../data/matches";
import {
  hotSpringTripScene,
  ownershipTransferScene,
} from "../data/openingEvents";
import { routeEvents } from "../data/routeEvents";
import { getRouteDefinition } from "../data/routes";
import { weeklyNarrativeLines } from "../data/weeklyNarratives";
import { legacyCharacterNarrativeBlockById } from "../narrative/characterBlocks";
import {
  legacyOpeningNarrativeBlockById,
  mainStageOneEveBlocks,
  mainStageOneWeeklyBlocks,
  mainStageThreeWeeklyBlocks,
  mainStageTwoWeeklyBlocks,
  openingHotSpringBlock,
  openingOwnershipBlock,
} from "../narrative/openingBlocks";
import {
  materializeNarrativeBlock,
  resolveNarrativeBlock,
  weeklyEventFromNarrativeBlock,
} from "../narrative/runtime";
import { asEventId } from "../narrative/schema";
import { legacyWorldNarrativeBlockById } from "../narrative/worldBlocks";
import type {
  CarriedAllyState,
  CharacterScene,
  Condition,
  DialogueLine,
  FighterDefinition,
  FighterRunState,
  HallOfFameTeam,
  PlayerProfile,
  RunState,
  SceneChoice,
  Stats,
  WeeklyAction,
  WeeklyEvent,
} from "./types";
import { randomForCursor, type RandomSource } from "./rng";
import { resolveChoiceDesign } from "./choiceDesign";
import { resolveScenePresentation } from "./scenePresentation";

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const LIBERATION_WEEKS = [12, 20, 25] as const;
const fighterNameById = new Map(
  fighterDefinitions.map((fighter) => [fighter.id, fighter.name]),
);

export const availableRosterIds = (run: RunState) =>
  run.roster.filter((id) => {
    const state = run.fighters[id];
    return state?.recruited;
  });

// この周で新しく仲間にした人数(持ち越しは数えない)。
// 勧誘の確率と枠は、この人数で判定する。
const newRecruitCount = (run: RunState) => {
  const carried = new Set(run.carriedIds ?? []);
  return availableRosterIds(run).filter((id) => !carried.has(id)).length;
};

export const workIncomeForCondition = (condition: Condition) =>
  condition === "good" ? 1200 : condition === "bad" ? 750 : 1000;

export const createInitialProfile = (): PlayerProfile => ({
  version: 12,
  hasFinishedRun: false,
  clears: 0,
  unlockedRoutes: ["normal"],
  liberatedCollection: [],
  grandCleared: false,
  seenEvents: [],
  seenChoices: [],
  hallOfFame: [],
  skipExplanations: false,
  textSpeed: "normal",
  dialogueMode: "step",
  battleSpeed: "fast",
  battlePlayback: "manual",
  soundEnabled: true,
});

const initialFighterState = (id: string): FighterRunState => ({
  id,
  recruited: false,
  encountered: false,
  liberated: false,
  trust: 28,
  ownership: 48,
  storyStage: 0,
  liberationEligible: false,
  liberationMisses: 0,
  contractDecision: undefined,
  condition: "normal",
  fighterPoints: 0,
  statBoosts: {},
});

export const createRun = (
  route: RunState["route"],
  seed = `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  options: {
    // 周回をまたいだ解放済み人物。遭遇候補の後方へ回し、
    // 未解放の人物へ先に会える周回誘導を行う(真エンディング条件の到達支援)。
    deprioritizedEncounters?: readonly string[];
    // 三段階キャンペーンの現在区分。指定時、遭遇デッキを主軸5人へ限定する。
    campaignStage?: CampaignStageDefinition;
    // 前区分から在籍し続ける仲間。開始時から加入済みとして復元する。
    carriedAllies?: readonly CarriedAllyState[];
  } = {},
): RunState => {
  const random = randomForCursor(seed, 0);
  const routeDefinition = getRouteDefinition(route);
  const ids = fighterDefinitions.map((fighter) => fighter.id);
  const fighters = Object.fromEntries(
    ids.map((id) => [id, initialFighterState(id)]),
  );
  const deprioritized = new Set(options.deprioritizedEncounters ?? []);
  const stage = options.campaignStage;
  const carried = (options.carriedAllies ?? []).filter((ally) =>
    ids.includes(ally.id),
  );
  carried.forEach((ally) => {
    fighters[ally.id] = {
      ...fighters[ally.id],
      encountered: true,
      recruited: true,
      liberated: ally.liberated,
      trust: ally.trust,
      ownership: ally.liberated ? 0 : ally.ownership,
      storyStage: ally.storyStage,
    };
  });
  const encounterPoolIds = ids.filter((id) => {
    if (id === "gidonozeaas") return false;
    if (carried.some((ally) => ally.id === id)) return false;
    if (stage && !stage.mainFighterIds.includes(id)) return false;
    return true;
  });
  // 区分2以降はギドノが持ち越し在籍のため、週1固定遭遇は自然に発生しない。
  // 区分指定時にギドノが主軸かつ未持ち越しなら、従来どおり週1の固定遭遇が担う。

  return {
    id: `run-${Date.now()}`,
    seed,
    rngCursor: 1,
    week: 1,
    weekActionDone: false,
    ownershipStage: "employee",
    arenaRank: "unranked",
    route,
    money: routeDefinition.startingMoney,
    mimiCondition: "normal",
    sharedPoints: routeDefinition.startingSharedPoints,
    fighters,
    roster: carried.map((ally) => ally.id),
    activeTeam: [],
    encounterDeck: (() => {
      const shuffled = random.shuffle(encounterPoolIds);
      if (deprioritized.size === 0) return shuffled;
      // シャッフル順を保ったまま、未解放を前へ、解放済みを後ろへ。
      return [
        ...shuffled.filter((id) => !deprioritized.has(id)),
        ...shuffled.filter((id) => deprioritized.has(id)),
      ];
    })(),
    campaignStage: stage?.stage,
    carriedIds: carried.map((ally) => ally.id),
    eventHistory: [],
    flags: [],
    liberationWindowsUsed: [],
    currentBet: 0,
    battlePlan: "balanced",
    battleTactics: {},
    wins: 0,
    losses: 0,
    bonusMatches: 0,
    inventory: {},
    ended: false,
  };
};

const applyActionEffects = (
  run: RunState,
  action: WeeklyAction,
  random: RandomSource,
): RunState => {
  const next = {
    ...run,
    lastMatchSummary: undefined,
    fighters: Object.fromEntries(
      Object.entries(run.fighters).map(([id, state]) => [id, { ...state }]),
    ),
  };

  if (run.ownershipStage === "employee") {
    if (action === "rest") {
      next.mimiCondition =
        next.mimiCondition === "bad" ? "normal" : "good";
    } else {
      const firstDayWages: Record<Exclude<WeeklyAction, "rest">, number> = {
        work: 700,
        play: 650,
        search: 750,
      };
      next.money += firstDayWages[action];
    }
    return next;
  }

  if (action === "work") {
    next.money += workIncomeForCondition(next.mimiCondition);
  } else if (action === "play") {
    next.money = Math.max(0, next.money - Math.min(600, next.money));
    const available = availableRosterIds(next);
    const trustTargets =
      next.focusFighterId && available.includes(next.focusFighterId)
        ? [next.focusFighterId]
        : next.activeTeam.filter((id) => available.includes(id));
    trustTargets.forEach((id) => {
      next.fighters[id].trust = clamp(
        next.fighters[id].trust + (next.focusFighterId === id ? 7 : 3),
        0,
        100,
      );
    });
  } else if (action === "rest") {
    const improve = (condition: Condition): Condition =>
      condition === "bad" ? "normal" : "good";
    next.mimiCondition = improve(next.mimiCondition);
    availableRosterIds(next).forEach((id) => {
      next.fighters[id].condition = improve(next.fighters[id].condition);
    });
  } else {
    next.money = Math.max(0, next.money - Math.min(800, next.money));
    next.mimiCondition = "bad";
    const riskTargets = next.activeTeam;
    if (riskTargets.length > 0 && random.next() < 0.35) {
      const targetId = random.pick(riskTargets);
      const condition = next.fighters[targetId].condition;
      next.fighters[targetId].condition =
        condition === "good" ? "normal" : "bad";
    }
  }
  return next;
};

const sceneForStage = (fighterId: string, stage: number) => {
  const fighter = fighterDefinitions.find((entry) => entry.id === fighterId);
  if (!fighter) return undefined;
  if (stage <= 0) return fighter.scenes.meet;
  if (stage === 1) return fighter.scenes.join;
  if (stage === 2) return fighter.scenes.bond;
  if (stage === 3) return fighter.scenes.power;
  if (stage === 4) return fighter.scenes.crisis;
  return undefined;
};

const previousStageByStage: Partial<
  Record<keyof FighterDefinition["scenes"], keyof FighterDefinition["scenes"]>
> = {
  join: "meet",
  bond: "join",
  power: "bond",
  crisis: "power",
  liberation: "crisis",
};

const priorChoiceEchoLine = (
  run: RunState,
  fighterId: string,
  scene: CharacterScene,
): DialogueLine | undefined => {
  const fighter = fighterDefinitions.find((entry) => entry.id === fighterId);
  if (!fighter) return undefined;
  const stage = (
    Object.entries(fighter.scenes) as Array<
      [keyof FighterDefinition["scenes"], CharacterScene]
    >
  ).find(([, candidate]) => candidate.id === scene.id)?.[0];
  const previousStage = stage ? previousStageByStage[stage] : undefined;
  if (!previousStage) return undefined;
  const previousScene = fighter.scenes[previousStage];
  const previousBlock = legacyCharacterNarrativeBlockById.get(
    asEventId(previousScene.id),
  );
  const stableChoiceIndex = previousBlock?.nodes
    .find((node) => node.type === "choice")
    ?.choices.findIndex((choice) =>
      run.flags.includes(`choice:${choice.id}`),
    );
  const legacyChoiceIndex = previousScene.choices?.findIndex((_, index) =>
    run.flags.includes(`choice:${previousScene.id}:${index}`),
  );
  const generatedChoiceIndex = previousScene.choices?.findIndex((_, index) =>
    run.flags.includes(
      `choice:${previousScene.id}.choice.legacy-${index + 1}`,
    ),
  );
  const choiceIndex =
    stableChoiceIndex !== undefined && stableChoiceIndex >= 0
      ? stableChoiceIndex
      : generatedChoiceIndex !== undefined && generatedChoiceIndex >= 0
        ? generatedChoiceIndex
      : legacyChoiceIndex !== undefined && legacyChoiceIndex >= 0
        ? legacyChoiceIndex
        : undefined;
  if (choiceIndex === undefined) return undefined;
  const rawChoice = previousScene?.choices?.[choiceIndex];
  if (!rawChoice) return undefined;
  const choice = resolveChoiceDesign(rawChoice);
  return {
    text: choice.memory,
    kind: "thought",
    beat: "revelation",
    cue: `前に「${choice.label}」を選んだ結果が、今の関係へ続いている。`,
  };
};

export const storyProspectsForAction = (
  run: RunState,
  action: WeeklyAction,
) =>
  fighterDefinitions.map((fighter) => fighter.id).filter((id) => {
    const state = run.fighters[id];
    if (!state.encountered) return false;
    if (
      !state.recruited &&
      newRecruitCount(run) >= getRouteDefinition(run.route).maxRoster
    ) {
      return false;
    }
    if (
      !state.recruited &&
      run.flags.includes(`recruitment-declined:${id}`)
    ) {
      return false;
    }
    const nextScene = sceneForStage(id, state.storyStage);
    return Boolean(nextScene?.actions.includes(action));
  });

export const recruitmentForecastForAction = (
  run: RunState,
  action: WeeklyAction,
) => {
  if (run.week === 1 && !run.fighters.gidonozeaas.encountered) {
    return {
      chance: 1,
      belowTarget: true,
      openingGuarantee: true,
      funded: true,
    };
  }

  const routeDefinition = getRouteDefinition(run.route);
  const availableCount = newRecruitCount(run);
  const belowTarget = availableCount < 3;
  const openingGuarantee = run.week <= 3 && belowTarget;
  const funded = action !== "search" || run.money >= 800;
  const baseByAction: Record<WeeklyAction, number> = {
    work: 0.04,
    play: 0.07,
    rest: 0.02,
    search: 0.48,
  };
  const rosterPenalty =
    action === "search" ? Math.max(0, availableCount - 3) * 0.08 : 0;
  const conditionAdjustment =
    action === "search"
      ? run.mimiCondition === "good"
        ? 0.05
        : run.mimiCondition === "bad"
          ? -0.07
          : 0
      : 0;
  const fundingScale = funded ? 1 : 0.55;
  const chance =
    availableCount < routeDefinition.maxRoster &&
    run.encounterDeck.length > 0
      ? openingGuarantee
        ? 1
        : clamp(
            (baseByAction[action] - rosterPenalty + conditionAdjustment) *
              routeDefinition.recruitmentScale *
              fundingScale,
            action === "search" ? 0.08 : 0,
            0.68,
          )
      : 0;
  return { chance, belowTarget, openingGuarantee, funded };
};

const weeklyEvent = (
  scene: CharacterScene,
  action: WeeklyAction,
  fighterId?: string,
  isRare = false,
  week?: number,
  context: {
    leadLineText?: string;
    priorChoiceEcho?: DialogueLine;
  } = {},
): WeeklyEvent => {
  const narrativeBlock =
    legacyCharacterNarrativeBlockById.get(asEventId(scene.id)) ??
    legacyWorldNarrativeBlockById.get(asEventId(scene.id));
  const materializedScene = narrativeBlock
    ? materializeNarrativeBlock(narrativeBlock)
    : undefined;
  const blockScene =
    narrativeBlock && materializedScene
      ? narrativeBlock.debug.legacyGeneratedIds
        ? {
            ...materializedScene,
            // Compatibility blocks still depend on runtime-authored legacy lines.
            lines: scene.lines,
          }
        : materializedScene
      : scene;
  const leadAdjustedLines =
    context.leadLineText && blockScene.lines.length > 0
    ? [
        { ...blockScene.lines[0], text: context.leadLineText },
        ...blockScene.lines.slice(1),
      ]
    : blockScene.lines;
  const contextualLines =
    context.priorChoiceEcho && leadAdjustedLines.length > 0
      ? [
          leadAdjustedLines[0],
          context.priorChoiceEcho,
          ...leadAdjustedLines.slice(1),
        ]
      : leadAdjustedLines;
  const narrative =
    week && week > 1 ? weeklyNarrativeLines(week, action) : [];
  const presentedScene =
    narrative.length > 0
      ? { ...blockScene, lines: [...narrative, ...contextualLines] }
      : { ...blockScene, lines: contextualLines };
  return {
    id: `${scene.id}:week`,
    title: scene.title,
    location: scene.location,
    action,
    fighterId,
    scene: presentedScene,
    isRare,
    ...(narrativeBlock ? { narrativeBlockId: narrativeBlock.id } : {}),
  };
};

export const chooseWeeklyAction = (
  source: RunState,
  action: WeeklyAction,
): RunState => {
  const random = randomForCursor(source.seed, source.rngCursor);
  const run = {
    ...applyActionEffects(source, action, random),
    weekActionDone: true,
    rngCursor: source.rngCursor + 1,
  };

  // 毎週、まずメインストーリー(この街の一年)を再生する。
  // 終了後の followup で、その週の人物の場面へ続けて進む(二段再生)。
  // 区分情報のない保存データ(この機能より前に始めた周回)は第一勤務週として扱う。
  const mainEpisode = mainStoryEpisodes.find(
    (episode) =>
      (run.campaignStage ?? 1) === episode.stage &&
      run.week === episode.week &&
      !run.eventHistory.includes(episode.block.id),
  );
  if (mainEpisode) {
    return {
      ...run,
      pendingWeeklyAction: action,
      currentEvent: weeklyEventFromNarrativeBlock(
        mainEpisode.block,
        action,
        undefined,
        true,
      ),
    };
  }

  return selectWeeklyEvent(run, action);
};

// 週行動の効果適用後、その週に再生する人物・世界の場面を選ぶ。
// メインストーリーの後にも同じ選択を使うため、独立した関数にしてある。
const selectWeeklyEvent = (
  source: RunState,
  action: WeeklyAction,
): RunState => {
  const recruitmentForecast = recruitmentForecastForAction(source, action);
  const random = randomForCursor(source.seed, source.rngCursor);
  let run = { ...source, pendingWeeklyAction: undefined };

  if (run.week === 1 && !run.fighters.gidonozeaas.encountered) {
    const scene = fighterDefinitions[0].scenes.meet;
    const openingMeetLeads: Record<WeeklyAction, string> = {
      work: "働くと決めた私は、併設カフェのフロアへ入った。初日の仕事は、驚くほどいつもの接客と変わらなかった。",
      play: "場内を知るためカジノ棟を一周し、閉店前のカフェへ戻ると、最後の注文を任された。",
      rest: "初日くらい頭を整理しようと休憩を選んだのに、従業員室へ戻る途中で「最後の注文だけ」と呼び止められた。",
      search: "契約の手掛かりを探して予約端末を調べると、三百年前から残っている注文が一件だけ見つかった。",
    };
    return {
      ...run,
      currentEvent: weeklyEvent(
        scene,
        action,
        "gidonozeaas",
        true,
        run.week,
        { leadLineText: openingMeetLeads[action] },
      ),
    };
  }

  if (
    run.week === 5 &&
    run.flags.includes("opening-cup:champion") &&
    !run.eventHistory.includes(hotSpringTripScene.id)
  ) {
    return {
      ...run,
      currentEvent: weeklyEventFromNarrativeBlock(
        openingHotSpringBlock,
        action,
        undefined,
        true,
      ),
    };
  }

  const routeDefinition = getRouteDefinition(run.route);
  const previousTone = source.lastChoiceEcho?.tone;
  const responsiveFocusChance = clamp(
    routeDefinition.focusChance +
      (previousTone === "tender"
        ? 0.12
        : previousTone === "heroic"
          ? 0.06
          : 0),
    0,
    0.95,
  );
  const storyCandidates = (() => {
    const shuffled = random.shuffle(storyProspectsForAction(run, action));
    // 三段階キャンペーンでは、その周の主軸5人の物語を常に優先する。
    // 持ち越し仲間の続きは、主軸の候補がない週だけ進む(枠の食い合い防止)。
    if (!run.campaignStage) return shuffled;
    const mains = new Set(
      campaignStages[run.campaignStage - 1]?.mainFighterIds ?? [],
    );
    return [
      ...shuffled.filter((id) => mains.has(id)),
      ...shuffled.filter((id) => !mains.has(id)),
    ];
  })();
  const focusCandidate =
    run.focusFighterId &&
    storyCandidates.includes(run.focusFighterId) &&
    run.fighters[run.focusFighterId]?.recruited
      ? run.focusFighterId
      : undefined;

  if (focusCandidate && random.next() < responsiveFocusChance) {
    const scene = sceneForStage(
      focusCandidate,
      run.fighters[focusCandidate].storyStage,
    );
    if (scene) {
      return {
        ...run,
        currentEvent: weeklyEvent(
          scene,
          action,
          focusCandidate,
          false,
          run.week,
          {
            priorChoiceEcho: priorChoiceEchoLine(
              run,
              focusCandidate,
              scene,
            ),
          },
        ),
      };
    }
  }

  const pendingRecruitmentId = storyCandidates.find(
    (id) => !run.fighters[id].recruited,
  );
  if (pendingRecruitmentId) {
    const scene = sceneForStage(
      pendingRecruitmentId,
      run.fighters[pendingRecruitmentId].storyStage,
    );
    if (scene) {
      return {
        ...run,
        currentEvent: weeklyEvent(
          scene,
          action,
          pendingRecruitmentId,
          false,
          run.week,
          {
            priorChoiceEcho: priorChoiceEchoLine(
              run,
              pendingRecruitmentId,
              scene,
            ),
          },
        ),
      };
    }
  }

  const { chance: recruitChance } = recruitmentForecast;
  const shouldRecruit =
    newRecruitCount(run) < routeDefinition.maxRoster &&
    run.encounterDeck.length > 0 &&
    random.next() < recruitChance;

  if (shouldRecruit) {
    const [fighterId, ...rest] = run.encounterDeck;
    const scene = sceneForStage(fighterId, 0);
    if (scene) {
      return {
        ...run,
        encounterDeck: rest,
        currentEvent: weeklyEvent(
          scene,
          action,
          fighterId,
          action === "search",
          run.week,
        ),
      };
    }
  }

  const routePool = routeEvents[run.route] ?? [];
  const matchingRouteEvents = routePool.filter((event) =>
    event.actions.includes(action),
  );
  const unseenRouteEvents = matchingRouteEvents.filter(
    (event) => !run.eventHistory.includes(event.id),
  );
  const routeEventPool =
    unseenRouteEvents.length > 0 ? unseenRouteEvents : matchingRouteEvents;
  const surpriseChance = clamp(
    (run.route === "chaos" ? 0.07 : run.route === "domination" ? 0.035 : 0) +
      (previousTone === "wild"
        ? 0.1
        : previousTone === "defiant"
          ? 0.06
          : 0),
    0,
    0.35,
  );
  if (
    matchingRouteEvents.length > 0 &&
    random.next() < surpriseChance
  ) {
    return {
      ...run,
      currentEvent: weeklyEvent(
        random.pick(routeEventPool),
        action,
        undefined,
        true,
        run.week,
      ),
    };
  }

  const storyId = storyCandidates[0];
  if (storyId) {
    const scene = sceneForStage(storyId, run.fighters[storyId].storyStage);
    if (scene) {
      return {
        ...run,
        currentEvent: weeklyEvent(
          scene,
          action,
          storyId,
          false,
          run.week,
          {
            priorChoiceEcho: priorChoiceEchoLine(run, storyId, scene),
          },
        ),
      };
    }
  }

  if (
    matchingRouteEvents.length > 0 &&
    random.next() <
      clamp(
        routeDefinition.routeEventChance +
          (previousTone === "defiant"
            ? 0.1
            : previousTone === "wild"
              ? 0.06
              : 0),
        0,
        0.6,
      )
  ) {
    return {
      ...run,
      currentEvent: weeklyEvent(
        random.pick(routeEventPool),
        action,
        undefined,
        true,
        run.week,
      ),
    };
  }

  const ambientPool = ambientEvents[action];
  const unseenAmbient = ambientPool.filter(
    (event) => !run.eventHistory.includes(event.id),
  );
  const scene = random.pick(
    unseenAmbient.length > 0 ? unseenAmbient : ambientPool,
  );
  return {
    ...run,
    currentEvent: weeklyEvent(
      scene,
      action,
      undefined,
      action === "search",
      run.week,
    ),
  };
};

const updateFighterFromChoice = (
  state: FighterRunState,
  choice: SceneChoice,
): FighterRunState => ({
  ...state,
  trust: clamp(state.trust + choice.trust, 0, 100),
  ownership: clamp(state.ownership + choice.ownership, 0, 100),
  fighterPoints: Math.max(
    0,
    state.fighterPoints + (choice.fighterPoints ?? 0),
  ),
  condition: choice.condition ?? state.condition,
});

export const resolveCurrentEvent = (
  source: RunState,
  choiceIndex = 0,
): RunState => {
  const event = source.currentEvent;
  if (!event) return source;
  const finalPresentation = resolveScenePresentation(
    event.scene.lines,
    event.scene.lines.length - 1,
    { background: event.scene.background, sprite: event.scene.sprite },
  );
  const lastStill = event.scene.lines
    .map((line) => line.direction?.still)
    .filter((still): still is string => Boolean(still))
    .at(-1);
  const narrativeBlock = event.narrativeBlockId
    ? legacyOpeningNarrativeBlockById.get(asEventId(event.narrativeBlockId)) ??
      legacyCharacterNarrativeBlockById.get(asEventId(event.narrativeBlockId)) ??
      legacyWorldNarrativeBlockById.get(asEventId(event.narrativeBlockId))
    : undefined;
  if (event.narrativeBlockId && !narrativeBlock) {
    throw new Error(
      `Narrative block is not registered: ${event.narrativeBlockId}`,
    );
  }
  const rawChoice = event.scene.choices?.[choiceIndex];
  const choice = rawChoice ? resolveChoiceDesign(rawChoice) : undefined;
  const outcomeVisual =
    choice?.outcomeVisual?.src ?? lastStill ?? finalPresentation.background;
  const narrativeChoice =
    narrativeBlock?.nodes
      .find((node) => node.type === "choice")
      ?.choices.at(choiceIndex);
  const beforeMoney = source.money;
  const beforeSharedPoints = source.sharedPoints;
  const previousFighterState = event.fighterId
    ? source.fighters[event.fighterId]
    : undefined;
  const sceneKind =
    narrativeBlock?.ownership.stage ?? event.scene.id.split(".").at(-1);
  let run: RunState = {
    ...source,
    fighters: Object.fromEntries(
      Object.entries(source.fighters).map(([id, state]) => [id, { ...state }]),
    ),
    roster: [...source.roster],
    activeTeam: [...source.activeTeam],
    eventHistory: [...source.eventHistory, event.scene.id],
    flags: choice
      ? narrativeChoice
        ? [
            ...source.flags,
            `choice:${narrativeChoice.id}`,
            `choice-tone:${choice.tone}:${event.scene.id}`,
          ]
        : [
            ...source.flags,
            `choice:${event.scene.id}:${choiceIndex}`,
            `choice-tone:${choice.tone}:${event.scene.id}`,
          ]
      : [...source.flags],
    lastChoiceEcho: choice
      ? {
          tone: choice.tone,
          label: choice.label,
          memory: choice.memory,
        }
      : source.lastChoiceEcho,
    currentEvent: undefined,
  };

  if (choice && !narrativeBlock) {
    run.money = Math.max(0, run.money + (choice.money ?? 0));
    run.sharedPoints = Math.max(
      0,
      run.sharedPoints + (choice.sharedPoints ?? 0),
    );
    const targets = event.fighterId
      ? [event.fighterId]
      : availableRosterIds(run);
    targets.forEach((id) => {
      run.fighters[id] = updateFighterFromChoice(run.fighters[id], choice);
    });
  }

  if (narrativeBlock) {
    run = resolveNarrativeBlock(run, narrativeBlock, choiceIndex).run;
  }

  if (event.fighterId && !narrativeBlock) {
    const fighterState = { ...run.fighters[event.fighterId] };
    if (sceneKind === "meet") {
      fighterState.encountered = true;
      fighterState.storyStage = 1;
    } else if (sceneKind === "join") {
      if (choice?.recruitmentDecision === "decline") {
        run.flags.push(`recruitment-declined:${event.fighterId}`);
        fighterState.storyStage = 1;
      } else {
        fighterState.recruited = true;
        fighterState.storyStage = Math.max(2, fighterState.storyStage + 1);
        if (!run.roster.includes(event.fighterId)) {
          run.roster.push(event.fighterId);
        }
        if (
          run.activeTeam.length < 3 &&
          !run.activeTeam.includes(event.fighterId)
        ) {
          run.activeTeam.push(event.fighterId);
        }
      }
    } else if (sceneKind === "bond") {
      fighterState.storyStage = Math.max(3, fighterState.storyStage + 1);
    } else if (sceneKind === "power") {
      fighterState.storyStage = Math.max(4, fighterState.storyStage + 1);
    } else if (sceneKind === "crisis") {
      fighterState.storyStage = 5;
      fighterState.liberationEligible = true;
    } else if (sceneKind === "liberation") {
      fighterState.storyStage = 6;
      fighterState.liberationEligible = false;
      fighterState.liberationMisses = 0;
      fighterState.liberated = true;
      fighterState.contractDecision = "released";
      fighterState.ownership = 0;
    }
    run.fighters[event.fighterId] = fighterState;
  }

  if (!narrativeBlock && event.scene.id === ownershipTransferScene.id) {
    run.ownershipStage = "provisional";
    run.arenaRank = "provisional";
    if (!run.flags.includes("opening:owner-transfer-complete")) {
      run.flags.push("opening:owner-transfer-complete");
    }
  }

  if (!narrativeBlock && choice?.honmeiFighterId) {
    run.honmeiFighterId = choice.honmeiFighterId;
    const honmeiFlag = `honmei:${choice.honmeiFighterId}`;
    if (!run.flags.includes(honmeiFlag)) {
      run.flags.push(honmeiFlag);
    }
  }

  const fighterName = event.fighterId
    ? fighterNameById.get(event.fighterId)
    : undefined;
  const isRecruitment = Boolean(
    event.fighterId &&
      sceneKind === "join" &&
      !previousFighterState?.recruited &&
      run.fighters[event.fighterId].recruited,
  );
  const milestones = [
    event.scene.id === ownershipTransferScene.id
      ? "ミミが暫定オーナーとして誤登録された"
      : "",
    sceneKind === "meet" && fighterName
      ? `${fighterName}と知り合った`
      : "",
    isRecruitment && fighterName
      ? `${fighterName}が所属選手になった`
      : "",
    sceneKind === "join" &&
    choice?.recruitmentDecision === "decline" &&
    fighterName
      ? `${fighterName}を今回は勧誘しなかった`
      : "",
    sceneKind === "bond" && fighterName
      ? `${fighterName}との信頼が深まった`
      : "",
    sceneKind === "power" && fighterName
      ? `${fighterName}の封印がひとつ緩んだ`
      : "",
    sceneKind === "crisis" && fighterName
      ? `${fighterName}の契約を解く糸口が見えた`
      : "",
    sceneKind === "liberation" && fighterName
      ? `${fighterName}の契約を解除し、本人の意思で共に戦う仲間になった`
      : "",
    event.isRare ? "珍しい出来事として記録された" : "",
  ].filter(Boolean);
  const currentFighterState = event.fighterId
    ? run.fighters[event.fighterId]
    : undefined;

  return {
    ...run,
    recentEventFighterId: event.fighterId,
    lastEventOutcome: {
      sceneId: event.scene.id,
      title: event.title,
      result:
        choice?.result ??
        (sceneKind === "liberation"
          ? "契約の効力が消えた。次の試合へ出るかは、もう本人が決める。"
          : "出来事は、次の週へ続いていく。"),
      outcomeHeadline: choice?.outcomeHeadline,
      visual: outcomeVisual
        ? {
            src: outcomeVisual,
            kind: choice?.outcomeVisual || lastStill ? "still" : "background",
            alt:
              choice?.outcomeVisual?.alt ??
              `${event.title}の${lastStill ? "一枚絵" : "舞台"}`,
            focusX: choice?.outcomeVisual?.focusX,
            focusY: choice?.outcomeVisual?.focusY,
          }
        : undefined,
      choiceLabel: choice?.label,
      choiceTone: choice?.tone,
      choiceMemory: choice?.memory,
      fighterId: event.fighterId,
      isLiberation: sceneKind === "liberation",
      liberationDecision: choice?.liberationDecision,
      isRecruitment,
      affectedCount: event.fighterId ? 1 : run.roster.length,
      milestones,
      before: {
        trust: previousFighterState?.trust,
        ownership: previousFighterState?.ownership,
        money: beforeMoney,
        sharedPoints: beforeSharedPoints,
        fighterPoints: previousFighterState?.fighterPoints,
      },
      after: {
        trust: currentFighterState?.trust,
        ownership: currentFighterState?.ownership,
        money: run.money,
        sharedPoints: run.sharedPoints,
        fighterPoints: currentFighterState?.fighterPoints,
      },
      deltas: {
        trust: choice?.trust ?? 0,
        ownership:
          sceneKind === "liberation"
          ? -source.fighters[event.fighterId!].ownership
          : (choice?.ownership ?? 0),
        money: run.money - beforeMoney,
        sharedPoints: run.sharedPoints - beforeSharedPoints,
        fighterPoints: choice?.fighterPoints ?? 0,
      },
    },
  };
};

export const clearEventOutcome = (source: RunState): RunState => ({
  ...source,
  lastEventOutcome: undefined,
});

export const maybeCreateOpeningOwnershipFollowup = (
  source: RunState,
): RunState => {
  if (
    source.currentEvent ||
    source.ownershipStage !== "employee" ||
    source.week !== 1 ||
    !source.eventHistory.includes("gidonozeaas.meet") ||
    source.flags.includes("opening:owner-transfer-complete")
  ) {
    return source;
  }
  return {
    ...source,
    currentEvent: weeklyEventFromNarrativeBlock(
      openingOwnershipBlock,
      "work",
      undefined,
      false,
    ),
  };
};

// メインストーリーの対応表: 区分と週。物語はこの闘技場の一シーズン(26週)を
// 追うもので、人物の場面は followup で別に再生する(キャラ紹介の前座にしない)。
const mainStoryEpisodes: ReadonlyArray<{
  stage: 1 | 2 | 3;
  week: number;
  block: (typeof mainStageOneWeeklyBlocks)[number];
}> = [
  // 台本正本: docs/MAIN_STORY_SCRIPT.md。週1〜7は改稿済み(幕零+幕一)。
  // 週5のメインは道中で暖簾の前まで。宿の中は既存の温泉イベントが担う(重複防止)。
  { stage: 1, week: 1, block: mainStageOneWeeklyBlocks[21] },
  { stage: 1, week: 2, block: mainStageOneWeeklyBlocks[22] },
  { stage: 1, week: 3, block: mainStageOneWeeklyBlocks[23] },
  { stage: 1, week: 6, block: mainStageOneWeeklyBlocks[24] },
  { stage: 1, week: 7, block: mainStageOneWeeklyBlocks[25] },
  { stage: 1, week: 4, block: mainStageOneWeeklyBlocks[0] },
  { stage: 1, week: 5, block: mainStageOneWeeklyBlocks[1] },
  { stage: 1, week: 8, block: mainStageOneWeeklyBlocks[2] },
  { stage: 1, week: 9, block: mainStageOneWeeklyBlocks[3] },
  { stage: 1, week: 10, block: mainStageOneWeeklyBlocks[4] },
  { stage: 1, week: 11, block: mainStageOneWeeklyBlocks[5] },
  { stage: 1, week: 12, block: mainStageOneWeeklyBlocks[6] },
  { stage: 1, week: 13, block: mainStageOneWeeklyBlocks[7] },
  { stage: 1, week: 14, block: mainStageOneWeeklyBlocks[8] },
  { stage: 1, week: 15, block: mainStageOneWeeklyBlocks[9] },
  { stage: 1, week: 16, block: mainStageOneWeeklyBlocks[10] },
  { stage: 1, week: 17, block: mainStageOneWeeklyBlocks[11] },
  { stage: 1, week: 18, block: mainStageOneWeeklyBlocks[12] },
  { stage: 1, week: 19, block: mainStageOneWeeklyBlocks[13] },
  { stage: 1, week: 20, block: mainStageOneWeeklyBlocks[14] },
  { stage: 1, week: 21, block: mainStageOneWeeklyBlocks[15] },
  { stage: 1, week: 22, block: mainStageOneWeeklyBlocks[16] },
  { stage: 1, week: 23, block: mainStageOneWeeklyBlocks[17] },
  { stage: 1, week: 24, block: mainStageOneWeeklyBlocks[18] },
  { stage: 1, week: 25, block: mainStageOneWeeklyBlocks[19] },
  { stage: 1, week: 26, block: mainStageOneWeeklyBlocks[20] },
  // 第二区分「更新週間」
  { stage: 2, week: 1, block: mainStageTwoWeeklyBlocks[0] },
  { stage: 2, week: 2, block: mainStageTwoWeeklyBlocks[1] },
  { stage: 2, week: 3, block: mainStageTwoWeeklyBlocks[2] },
  { stage: 2, week: 4, block: mainStageTwoWeeklyBlocks[3] },
  { stage: 2, week: 5, block: mainStageTwoWeeklyBlocks[4] },
  { stage: 2, week: 6, block: mainStageTwoWeeklyBlocks[5] },
  { stage: 2, week: 7, block: mainStageTwoWeeklyBlocks[6] },
  { stage: 2, week: 8, block: mainStageTwoWeeklyBlocks[7] },
  { stage: 2, week: 9, block: mainStageTwoWeeklyBlocks[8] },
  { stage: 2, week: 10, block: mainStageTwoWeeklyBlocks[9] },
  { stage: 2, week: 11, block: mainStageTwoWeeklyBlocks[10] },
  { stage: 2, week: 12, block: mainStageTwoWeeklyBlocks[11] },
  { stage: 2, week: 13, block: mainStageTwoWeeklyBlocks[12] },
  { stage: 2, week: 14, block: mainStageTwoWeeklyBlocks[13] },
  { stage: 2, week: 15, block: mainStageTwoWeeklyBlocks[14] },
  { stage: 2, week: 16, block: mainStageTwoWeeklyBlocks[15] },
  { stage: 2, week: 17, block: mainStageTwoWeeklyBlocks[16] },
  { stage: 2, week: 18, block: mainStageTwoWeeklyBlocks[17] },
  { stage: 2, week: 19, block: mainStageTwoWeeklyBlocks[18] },
  { stage: 2, week: 20, block: mainStageTwoWeeklyBlocks[19] },
  { stage: 2, week: 21, block: mainStageTwoWeeklyBlocks[20] },
  { stage: 2, week: 22, block: mainStageTwoWeeklyBlocks[21] },
  { stage: 2, week: 23, block: mainStageTwoWeeklyBlocks[22] },
  { stage: 2, week: 24, block: mainStageTwoWeeklyBlocks[23] },
  { stage: 2, week: 25, block: mainStageTwoWeeklyBlocks[24] },
  { stage: 2, week: 26, block: mainStageTwoWeeklyBlocks[25] },
  // 第三区分「祭りの準備週間」
  { stage: 3, week: 1, block: mainStageThreeWeeklyBlocks[0] },
  { stage: 3, week: 2, block: mainStageThreeWeeklyBlocks[1] },
  { stage: 3, week: 3, block: mainStageThreeWeeklyBlocks[2] },
  { stage: 3, week: 4, block: mainStageThreeWeeklyBlocks[3] },
  { stage: 3, week: 5, block: mainStageThreeWeeklyBlocks[4] },
  { stage: 3, week: 6, block: mainStageThreeWeeklyBlocks[5] },
  { stage: 3, week: 7, block: mainStageThreeWeeklyBlocks[6] },
  { stage: 3, week: 8, block: mainStageThreeWeeklyBlocks[7] },
  { stage: 3, week: 9, block: mainStageThreeWeeklyBlocks[8] },
  { stage: 3, week: 10, block: mainStageThreeWeeklyBlocks[9] },
  { stage: 3, week: 11, block: mainStageThreeWeeklyBlocks[10] },
  { stage: 3, week: 12, block: mainStageThreeWeeklyBlocks[11] },
  { stage: 3, week: 13, block: mainStageThreeWeeklyBlocks[12] },
];

// メインストーリーの直後に、その週の人物・世界の場面を続けて再生する(二段再生)。
export const maybeCreateMainStoryFollowup = (
  source: RunState,
): RunState => {
  if (source.currentEvent) return source;
  const action = source.pendingWeeklyAction;
  if (!action) return source;
  return selectWeeklyEvent(source, action);
};

// 週3のメイン話のあと、その区分の主軸のうち未遭遇の全員と、続けて顔合わせする。
// 加入(join)は自動化しない(正典で禁止)。ここは出会い(meet)だけを保証し、
// 第4週の初心者大会までに全員と面識がある状態を作る。1人ずつ、
// continueEvent の連鎖で呼ばれるたびに次の未遭遇者を返す。
export const maybeCreateCastIntroductionFollowup = (
  source: RunState,
): RunState => {
  if (source.currentEvent) return source;
  if (source.week !== 3) return source;
  const stageNumber = source.campaignStage ?? 1;
  const week3Episode = mainStoryEpisodes.find(
    (episode) => episode.stage === stageNumber && episode.week === 3,
  );
  if (!week3Episode || !source.eventHistory.includes(week3Episode.block.id)) {
    return source;
  }
  const stageDefinition = campaignStages[stageNumber - 1];
  const nextUnmetId = stageDefinition?.mainFighterIds.find(
    (id) => !source.fighters[id]?.encountered,
  );
  if (!nextUnmetId) return source;
  const fighter = fighterDefinitions.find(
    (entry) => entry.id === nextUnmetId,
  );
  if (!fighter) return source;
  return {
    ...source,
    currentEvent: weeklyEvent(
      fighter.scenes.meet,
      "work",
      nextUnmetId,
      false,
      source.week,
    ),
  };
};

// 第4週(初心者大会の週)、加入済みが3人未満なら、既に出会った(encountered)が
// 未加入の主軸の join場面を、一人ずつ続けて再生する。docs/MIMI_COMMON_STORY_ARC.md
// Scene 6「大会だけなら協力する者へ頼める形」の最小実装で、join場面自体が本人との
// 対話・選択を経るため「meetだけで自動加入」の禁止には抵触しない。
// roster⊆recruited の前提は変えない(暫定ヘルパー概念は導入しない)。
// 加入が3人に達するか、頼める相手がいなくなったら連鎖を止める(無限ループ防止)。
export const maybeCreateOpeningCupRosterFollowup = (
  source: RunState,
): RunState => {
  if (source.currentEvent) return source;
  if (source.week !== 4) return source;
  if (availableRosterIds(source).length >= 3) return source;
  const stageNumber = source.campaignStage ?? 1;
  const stageDefinition = campaignStages[stageNumber - 1];
  const nextPendingId = stageDefinition?.mainFighterIds.find((id) => {
    const state = source.fighters[id];
    return (
      state?.encountered &&
      !state.recruited &&
      !source.flags.includes(`recruitment-declined:${id}`)
    );
  });
  if (!nextPendingId) return source;
  const scene = sceneForStage(
    nextPendingId,
    source.fighters[nextPendingId].storyStage,
  );
  if (!scene) return source;
  return {
    ...source,
    currentEvent: weeklyEvent(scene, "work", nextPendingId, false, source.week),
  };
};

export const maybeCreateLiberationFollowup = (
  source: RunState,
): RunState => {
  if (source.currentEvent) return source;
  const liberationWindowsUsed = source.liberationWindowsUsed ?? [];
  if (
    !LIBERATION_WEEKS.includes(source.week as (typeof LIBERATION_WEEKS)[number]) ||
    liberationWindowsUsed.includes(source.week)
  ) {
    return source;
  }
  const eligible = source.roster
    .filter((id) => {
      const state = source.fighters[id];
      return (
        state.liberationEligible &&
        !state.liberated
      );
    })
    .sort((left, right) => {
      if (left === source.focusFighterId) return -1;
      if (right === source.focusFighterId) return 1;
      return source.fighters[right].trust - source.fighters[left].trust;
    });
  const withConsumedWindow = {
    ...source,
    liberationWindowsUsed: [...liberationWindowsUsed, source.week],
  };
  if (eligible.length === 0) {
    return withConsumedWindow;
  }

  const fighterId = eligible[0];
  const fighter = fighterDefinitions.find((entry) => entry.id === fighterId);
  if (!fighter) {
    return withConsumedWindow;
  }
  const liberationScene = fighter.scenes.liberation;
  return {
    ...withConsumedWindow,
    currentEvent: weeklyEvent(
      liberationScene,
      "rest",
      fighterId,
      true,
      undefined,
      {
        priorChoiceEcho: priorChoiceEchoLine(
          source,
          fighterId,
          liberationScene,
        ),
      },
    ),
  };
};

// 決勝前夜(週25)、本命を一人選ぶ。乙女ゲーム文法の「本命」選択で、
// 選んだ相手との前夜シーン(mainStageOneEveBlocks)へ続く。一度きり(once-per-run)。
// 現状は第一勤務週(1周目)の週25にだけ固定する。通常の週次選択(selectWeeklyEvent)
// からは発火しない(mainStoryEpisodes に載せていないため)。
const HONMEI_SELECT_SCENE_ID = "main.s1.honmei-select";
const HONMEI_WEEK = 25;

const buildHonmeiSelectScene = (
  candidateIds: readonly string[],
): CharacterScene => ({
  id: HONMEI_SELECT_SCENE_ID,
  title: "前夜祭、誰と回る?",
  location: "前夜祭の夜店通り",
  actions: ["work", "play", "rest", "search"],
  background: "/assets/story/bg-casino-cafe-night.png",
  lines: [
    {
      kind: "thought",
      text: "決勝前夜、通りには屋台の明かりが一列に並んだ。今夜だけは監督の采配も指示書もいらない。誰と一緒にこの夜店通りを歩くか、それだけを決めればよかった。",
    },
  ],
  choices: candidateIds.map((id) => {
    const name = fighterNameById.get(id) ?? id;
    return {
      label: name,
      result: `${name}を誘って、前夜祭の夜店通りへ向かった。`,
      trust: 0,
      ownership: 0,
      tone: "tender" as const,
      honmeiFighterId: id,
    };
  }),
});

export const maybeCreateHonmeiFollowup = (source: RunState): RunState => {
  if (source.currentEvent) return source;
  if ((source.campaignStage ?? 1) !== 1) return source;
  if (source.week !== HONMEI_WEEK) return source;

  if (source.honmeiFighterId) {
    const eveBlock = mainStageOneEveBlocks.get(source.honmeiFighterId);
    if (!eveBlock || source.eventHistory.includes(eveBlock.id)) return source;
    return {
      ...source,
      currentEvent: weeklyEventFromNarrativeBlock(
        eveBlock,
        "work",
        source.honmeiFighterId,
        false,
      ),
    };
  }

  if (source.eventHistory.includes(HONMEI_SELECT_SCENE_ID)) return source;

  const stageDefinition = campaignStages[(source.campaignStage ?? 1) - 1];
  const candidateIds = (stageDefinition?.mainFighterIds ?? []).filter(
    (id) => source.fighters[id]?.recruited,
  );
  if (candidateIds.length === 0) return source;

  return {
    ...source,
    currentEvent: weeklyEvent(buildHonmeiSelectScene(candidateIds), "work"),
  };
};

const driftCondition = (
  current: Condition,
  random: RandomSource,
): Condition => {
  const roll = random.next();
  if (current === "good") {
    return roll < 0.35 ? "good" : roll < 0.9 ? "normal" : "bad";
  }
  if (current === "bad") {
    return roll < 0.1 ? "good" : roll < 0.55 ? "normal" : "bad";
  }
  return roll < 0.2 ? "good" : roll < 0.8 ? "normal" : "bad";
};

export const nextCampaignWeek = (source: RunState): RunState => {
  const random = randomForCursor(source.seed, source.rngCursor);
  const fighters = Object.fromEntries(
    Object.entries(source.fighters).map(([id, state]) => [
      id,
      {
        ...state,
        condition: driftCondition(state.condition, random),
      },
    ]),
  );
  return {
    ...source,
    week: Math.min(26, source.week + 1),
    weekActionDone: false,
    rngCursor: source.rngCursor + 1,
    currentBet: 0,
    lastMatchSummary: undefined,
    recentEventFighterId: undefined,
    mimiCondition: driftCondition(source.mimiCondition, random),
    fighters,
  };
};

export const nextMatchId = (run: RunState) =>
  matchForWeek(run.week, run.route)?.id;

export const setFocusFighter = (
  source: RunState,
  fighterId?: string,
): RunState => {
  if (
    fighterId &&
    !source.roster.includes(fighterId)
  ) {
    return source;
  }
  return {
    ...source,
    focusFighterId:
      source.focusFighterId === fighterId ? undefined : fighterId,
  };
};

export const addStatPoint = (
  source: RunState,
  fighterId: string,
  stat: keyof Stats,
  sourceKind: "fighter" | "shared",
): RunState => {
  const fighter = source.fighters[fighterId];
  if (!fighter || !fighter.recruited) return source;
  if (sourceKind === "fighter" && fighter.fighterPoints <= 0) return source;
  if (sourceKind === "shared" && source.sharedPoints <= 0) return source;
  const amount = stat === "hp" ? 4 : stat === "mp" ? 3 : 1;
  return {
    ...source,
    sharedPoints:
      sourceKind === "shared" ? source.sharedPoints - 1 : source.sharedPoints,
    fighters: {
      ...source.fighters,
      [fighterId]: {
        ...fighter,
        fighterPoints:
          sourceKind === "fighter"
            ? fighter.fighterPoints - 1
            : fighter.fighterPoints,
        statBoosts: {
          ...fighter.statBoosts,
          [stat]: (fighter.statBoosts[stat] ?? 0) + amount,
        },
      },
    },
  };
};

export const toggleActiveFighter = (
  source: RunState,
  fighterId: string,
): RunState => {
  if (!source.roster.includes(fighterId)) {
    return source;
  }
  if (source.activeTeam.includes(fighterId)) {
    if (source.activeTeam.length === 1) return source;
    return {
      ...source,
      activeTeam: source.activeTeam.filter((id) => id !== fighterId),
    };
  }
  if (source.activeTeam.length >= 3) return source;
  return { ...source, activeTeam: [...source.activeTeam, fighterId] };
};

export const runScore = (run: RunState) => {
  const statScore = run.roster.reduce((sum, id) => {
    const state = run.fighters[id];
    return (
      sum +
      Object.values(state.statBoosts).reduce(
        (boostSum, boost) => boostSum + (boost ?? 0),
        0,
      ) +
      state.trust
    );
  }, 0);
  return Math.round(
    run.wins * 420 +
      run.bonusMatches * 160 +
      run.money / 20 +
      statScore,
  );
};

export const createHallOfFameEntry = (
  run: RunState,
): HallOfFameTeam => ({
  id: `hall-${run.id}`,
  createdAt: new Date().toISOString(),
  route: run.route,
  result:
    run.endingType === "rebuild"
      ? "闘技場再構築"
      : run.endingType === "company"
        ? "中央選手権制覇"
        : "今期終了",
  score: runScore(run),
  wins: run.wins,
  money: run.money,
  fighterIds: [...run.activeTeam],
  activeFighterIds: [...run.activeTeam],
  rosterIds: [...run.roster],
  fighterSnapshots: run.roster.map((id) => {
    const fighter = run.fighters[id];
    return {
      id,
      trust: fighter.trust,
      ownership: fighter.ownership,
      condition: fighter.condition,
      fighterPoints: fighter.fighterPoints,
      statBoosts: { ...fighter.statBoosts },
      equippedItemId: fighter.equippedItemId,
      liberated: fighter.liberated,
    };
  }),
  battlePlan: run.battlePlan,
  battleTactics: { ...run.battleTactics },
  liberatedIds: run.roster.filter((id) => run.fighters[id].liberated),
});
