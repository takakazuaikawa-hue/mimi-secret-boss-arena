import { ambientEvents } from "../data/ambientEvents";
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

export const workIncomeForCondition = (condition: Condition) =>
  condition === "good" ? 1200 : condition === "bad" ? 750 : 1000;

export const createInitialProfile = (): PlayerProfile => ({
  version: 11,
  hasFinishedRun: false,
  clears: 0,
  unlockedRoutes: ["normal"],
  liberatedCollection: [],
  grandCleared: false,
  seenEvents: [],
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
  } = {},
): RunState => {
  const random = randomForCursor(seed, 0);
  const routeDefinition = getRouteDefinition(route);
  const ids = fighterDefinitions.map((fighter) => fighter.id);
  const fighters = Object.fromEntries(
    ids.map((id) => [id, initialFighterState(id)]),
  );
  const deprioritized = new Set(options.deprioritizedEncounters ?? []);

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
    roster: [],
    activeTeam: [],
    encounterDeck: (() => {
      const shuffled = random.shuffle(
        ids.filter((id) => id !== "gidonozeaas"),
      );
      if (deprioritized.size === 0) return shuffled;
      // シャッフル順を保ったまま、未解放を前へ、解放済みを後ろへ。
      return [
        ...shuffled.filter((id) => !deprioritized.has(id)),
        ...shuffled.filter((id) => deprioritized.has(id)),
      ];
    })(),
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
      availableRosterIds(run).length >= getRouteDefinition(run.route).maxRoster
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
  const availableCount = availableRosterIds(run).length;
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
  const recruitmentForecast = recruitmentForecastForAction(source, action);
  const random = randomForCursor(source.seed, source.rngCursor);
  let run = {
    ...applyActionEffects(source, action, random),
    weekActionDone: true,
    rngCursor: source.rngCursor + 1,
  };

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
  const storyCandidates = random.shuffle(
    storyProspectsForAction(run, action),
  );
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
    availableRosterIds(run).length < routeDefinition.maxRoster &&
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
