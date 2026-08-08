import { fighterDefinitions } from "../src/data/characters";
import { ambientEvents } from "../src/data/ambientEvents";
import { routeEvents } from "../src/data/routeEvents";
import {
  availableRosterIds,
  chooseWeeklyAction,
  createRun,
  maybeCreateLiberationFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "../src/game/engine";
import type { RunState, WeeklyAction } from "../src/game/types";

const actions: WeeklyAction[] = ["work", "play", "rest", "search"];
const sceneStages = [
  "meet",
  "join",
  "bond",
  "power",
  "crisis",
  "liberation",
  "epilogue",
] as const;

const choiceLabels = fighterDefinitions.flatMap((fighter) =>
  sceneStages.flatMap((stage) =>
    (fighter.scenes[stage].choices ?? []).map((choice) => ({
      fighter: fighter.id,
      stage,
      label: choice.label,
    })),
  ),
);
const choiceGroups = new Map<string, typeof choiceLabels>();
for (const choice of choiceLabels) {
  const group = choiceGroups.get(choice.label) ?? [];
  group.push(choice);
  choiceGroups.set(choice.label, group);
}
const repeatedChoices = [...choiceGroups]
  .filter(([, group]) => group.length > 1)
  .map(([label, group]) => ({
    label,
    count: group.length,
    uses: group.map((choice) => `${choice.fighter}.${choice.stage}`),
  }))
  .sort((left, right) => right.count - left.count);

const allScenes = [
  ...fighterDefinitions.flatMap((fighter) =>
    sceneStages.map((stage) => ({
      owner: `${fighter.id}.${stage}`,
      scene: fighter.scenes[stage],
    })),
  ),
  ...Object.values(ambientEvents)
    .flat()
    .map((scene) => ({ owner: scene.id, scene })),
  ...Object.values(routeEvents)
    .flatMap((scenes) => scenes ?? [])
    .map((scene) => ({ owner: scene.id, scene })),
];
const allChoiceUses = allScenes.flatMap(({ owner, scene }) =>
  (scene.choices ?? []).map((choice) => ({ owner, label: choice.label })),
);
const allChoiceGroups = new Map<string, typeof allChoiceUses>();
for (const choice of allChoiceUses) {
  const group = allChoiceGroups.get(choice.label) ?? [];
  group.push(choice);
  allChoiceGroups.set(choice.label, group);
}
const allRepeatedChoices = [...allChoiceGroups]
  .filter(([, group]) => group.length > 1)
  .map(([label, group]) => ({
    label,
    count: group.length,
    uses: group.map((choice) => choice.owner),
  }))
  .sort((left, right) => right.count - left.count);

const sceneInventory = fighterDefinitions.map((fighter) => ({
  fighter: fighter.id,
  scenes: Object.fromEntries(
    sceneStages.map((stage) => {
      const scene = fighter.scenes[stage];
      return [
        stage,
        {
          lines: scene.lines.length,
          characters: scene.lines.reduce(
            (total, line) => total + line.text.length,
            0,
          ),
          stills: [
            ...new Set(
              scene.lines
                .map((line) => line.direction?.still)
                .filter((path): path is string => Boolean(path)),
            ),
          ],
        },
      ];
    }),
  ),
}));

type Policy = "no-search" | "search-heavy" | "focus-first";
const actionForPolicy = (
  run: RunState,
  policy: Policy,
): WeeklyAction => {
  if (policy === "search-heavy") {
    return availableRosterIds(run).length < 6
      ? run.week % 2 === 0
        ? "search"
        : "work"
      : run.week % 2 === 0
        ? "play"
        : "rest";
  }
  if (policy === "focus-first") {
    const focus = run.focusFighterId;
    if (focus) {
      const fighter = fighterDefinitions.find((entry) => entry.id === focus);
      const stage = run.fighters[focus]?.storyStage ?? 0;
      const nextStage =
        stage <= 0
          ? "meet"
          : stage === 1
            ? "join"
            : stage === 2
              ? "bond"
              : stage === 3
                ? "power"
                : "crisis";
      const allowed = fighter?.scenes[nextStage].actions ?? actions;
      return allowed[run.week % allowed.length] ?? "play";
    }
    return run.week === 1 ? "work" : "play";
  }
  return (["work", "play", "rest"] as const)[run.week % 3];
};

const simulate = (policy: Policy, index: number) => {
  let run = createRun("normal", `content-audit:${policy}:${index}`);
  const seen: string[] = [];
  for (let week = 1; week <= 26; week += 1) {
    const action = actionForPolicy(run, policy);
    run = chooseWeeklyAction(run, action);
    if (run.currentEvent) {
      seen.push(run.currentEvent.scene.id);
      const fighterId = run.currentEvent.fighterId;
      run = resolveCurrentEvent(run, 0);
      if (
        policy === "focus-first" &&
        fighterId &&
        !run.focusFighterId &&
        !run.fighters[fighterId].liberated
      ) {
        run = { ...run, focusFighterId: fighterId };
      }
      run = maybeCreateLiberationFollowup(run);
      if (run.currentEvent) {
        seen.push(run.currentEvent.scene.id);
        run = resolveCurrentEvent(run, 0);
      }
    }
    if (week < 26) run = nextCampaignWeek(run);
  }
  return {
    seen,
    roster: run.roster.length,
    available: availableRosterIds(run).length,
    completedCrisis: run.roster.filter(
      (id) => run.fighters[id].storyStage >= 5,
    ).length,
    liberated: run.roster.filter((id) => run.fighters[id].liberated).length,
  };
};

const policyReport = (policy: Policy) => {
  const runs = Array.from({ length: 200 }, (_, index) =>
    simulate(policy, index),
  );
  const mean = (pick: (run: (typeof runs)[number]) => number) =>
    Math.round(
      (runs.reduce((total, run) => total + pick(run), 0) / runs.length) *
        100,
    ) / 100;
  const allSeen = new Set(runs.flatMap((run) => run.seen));
  return {
    policy,
    meanRoster: mean((run) => run.roster),
    meanAvailable: mean((run) => run.available),
    meanCompletedCrisis: mean((run) => run.completedCrisis),
    meanLiberated: mean((run) => run.liberated),
    zeroAvailableRate:
      Math.round(
        (runs.filter((run) => run.available === 0).length / runs.length) *
          10_000,
      ) / 100,
    uniqueScenesReached: allSeen.size,
    epiloguesReached: [...allSeen].filter((id) => id.endsWith(".epilogue")),
  };
};

const report = {
  fighterCount: fighterDefinitions.length,
  fighterScenes: fighterDefinitions.length * sceneStages.length,
  ambientScenes: Object.values(ambientEvents).flat().length,
  choices: {
    fighter: {
      total: choiceLabels.length,
      uniqueLabels: choiceGroups.size,
      repeated: repeatedChoices,
    },
    allContent: {
      total: allChoiceUses.length,
      uniqueLabels: allChoiceGroups.size,
      repeated: allRepeatedChoices,
    },
  },
  sceneInventory,
  campaignReachability: (
    ["no-search", "search-heavy", "focus-first"] as Policy[]
  ).map(policyReport),
};

console.log(JSON.stringify(report, null, 2));
