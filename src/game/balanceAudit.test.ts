import { describe, expect, it } from "vitest";
import {
  availableRosterIds,
  chooseWeeklyAction,
  createRun,
  maybeCreateLiberationFollowup,
  nextCampaignWeek,
  resolveCurrentEvent,
} from "./engine";
import {
  dominationAssessmentMatches,
  matchesForRoute,
} from "../data/matches";
import { getRouteDefinition } from "../data/routes";
import {
  applyIntervention,
  createBattle,
  inferEnemyIntentFromCue,
  resolveBattleRound,
} from "./battle";
import { createRandom } from "./rng";
import type { RunState, WeeklyAction } from "./types";

const round = (value: number) => Math.round(value * 100) / 100;

type CampaignPolicy = "no-search" | "search-heavy" | "trust-heavy";

const actionForPolicy = (
  run: RunState,
  policy: CampaignPolicy,
): WeeklyAction => {
  if (policy === "search-heavy") {
    if (availableRosterIds(run).length < 6) {
      return run.money >= 800 && run.week % 2 === 0 ? "search" : "work";
    }
    return run.week % 2 === 0 ? "play" : "rest";
  }
  if (policy === "trust-heavy") {
    return run.money >= 600 && run.week % 3 !== 0 ? "play" : "work";
  }
  return (["work", "play", "rest"] as const)[run.week % 3];
};

const finishWeeklyEvent = (source: RunState) => {
  const sceneId = source.currentEvent?.scene.id ?? "";
  let run = resolveCurrentEvent(source, 0);
  if (!sceneId.endsWith(".liberation")) {
    run = maybeCreateLiberationFollowup(run);
  }
  if (run.currentEvent) {
    run = resolveCurrentEvent(run, 0);
  }
  return run;
};

const simulatePolicy = (policy: CampaignPolicy, index: number) => {
  let run = createRun("normal", `reference-policy:${policy}:${index}`);
  run.ownershipStage = "owner";
  for (let week = 1; week <= 26; week += 1) {
    run = chooseWeeklyAction(run, actionForPolicy(run, policy));
    run = finishWeeklyEvent(run);
    if (week < 26) run = nextCampaignWeek(run);
  }
  return {
    encountered: run.roster.length,
    available: availableRosterIds(run).length,
    liberated: run.roster.filter((id) => run.fighters[id].liberated).length,
    money: run.money,
  };
};

const auditPolicy = (policy: CampaignPolicy, campaigns = 180) => {
  const results = Array.from({ length: campaigns }, (_, index) =>
    simulatePolicy(policy, index),
  );
  const mean = (field: keyof (typeof results)[number]) =>
    round(
      results.reduce((sum, result) => sum + result[field], 0) /
        results.length,
    );
  return {
    policy,
    meanEncountered: mean("encountered"),
    meanAvailable: mean("available"),
    meanLiberated: mean("liberated"),
    meanMoney: mean("money"),
    sixPlusRate: round(
      (results.filter((result) => result.encountered >= 6).length /
        results.length) *
        100,
    ),
  };
};

const auditBattles = (
  route: RunState["route"],
  managed: boolean,
  campaigns = 120,
) => {
  let battles = 0;
  let wins = 0;
  let turns = 0;
  let decisions = 0;
  const routeDefinition = getRouteDefinition(route);

  for (let index = 0; index < campaigns; index += 1) {
    for (const match of matchesForRoute(route).filter(
      (entry) => entry.id !== "opening-cup",
    )) {
      const run = createRun(route, `battle-audit-${route}-${index}`);
      const roster = ["gidonozeaas", "minato", "amara"];
      const growth = Math.floor(match.week / 4);
      roster.forEach((id) => {
        run.fighters[id] = {
          ...run.fighters[id],
          encountered: true,
          recruited: true,
          trust: 60,
          ownership: 55,
          condition: "normal",
          statBoosts: {
            hp: growth * 4,
            attack: growth,
            defense: growth,
            magic: growth,
            speed: Math.floor(growth / 2),
          },
        };
      });
      run.roster = roster;
      run.activeTeam = roster;
      const random = createRandom(
        `battle-audit:${route}:${index}:${match.id}`,
      );
      let battle = createBattle(
        run,
        {
          ...match,
          difficulty: match.difficulty * routeDefinition.battleScale,
        },
        random,
      );
      while (battle.status !== "won" && battle.status !== "lost") {
        if (battle.status === "decision") {
          decisions += 1;
          battle =
            managed && battle.turn === 1 && battle.cheerUses > 0
              ? applyIntervention(battle, {
                  type: "cheer",
                  order: "advance",
                })
              : managed && battle.enemyCue && battle.readUses > 0
                ? applyIntervention(battle, {
                    type: "read",
                    prediction: inferEnemyIntentFromCue(battle),
                  })
                : applyIntervention(battle, { type: "pass" });
        } else {
          battle = resolveBattleRound(battle, random);
        }
      }
      battles += 1;
      wins += Number(battle.status === "won");
      turns += battle.turn;
    }
  }

  return {
    route,
    policy: managed ? "気配を読む" : "指示なし",
    battles,
    meanTurns: round(turns / battles),
    meanDecisions: round(decisions / battles),
    winRate: round((wins / battles) * 100),
    assessmentMatches:
      route === "domination" ? dominationAssessmentMatches.length : 0,
  };
};

describe("reference-model balance audit", () => {
  it("makes campaign strategy produce a different final roster", () => {
    const report = (
      ["no-search", "search-heavy", "trust-heavy"] as CampaignPolicy[]
    ).map((policy) => auditPolicy(policy));
    console.table(report);

    const noSearch = report.find((entry) => entry.policy === "no-search")!;
    const search = report.find((entry) => entry.policy === "search-heavy")!;
    expect(noSearch.meanEncountered).toBeLessThan(5);
    expect(noSearch.sixPlusRate).toBeLessThan(15);
    expect(search.meanEncountered - noSearch.meanEncountered).toBeGreaterThan(
      1,
    );
    expect(search.meanAvailable).toBeGreaterThan(noSearch.meanAvailable);
    expect(search.meanMoney).toBeLessThan(noSearch.meanMoney);
  }, 60_000);

  it("keeps weekly action rewards exclusive", () => {
    const base = createRun("normal", "exclusive-actions");
    base.ownershipStage = "owner";
    base.week = 5;
    base.roster = ["gidonozeaas", "minato", "amara"];
    base.activeTeam = [...base.roster];
    base.focusFighterId = "gidonozeaas";
    base.roster.forEach((id) => {
      base.fighters[id] = {
        ...base.fighters[id],
        recruited: true,
        encountered: true,
      };
    });

    const work = chooseWeeklyAction(base, "work");
    expect(work.money).toBeGreaterThan(base.money);
    expect(work.sharedPoints).toBe(base.sharedPoints);
    expect(work.fighters.gidonozeaas.fighterPoints).toBe(0);
    expect(work.fighters.gidonozeaas.trust).toBe(
      base.fighters.gidonozeaas.trust,
    );

    const play = chooseWeeklyAction(base, "play");
    expect(play.money).toBeLessThan(base.money);
    expect(play.fighters.gidonozeaas.trust).toBe(
      base.fighters.gidonozeaas.trust + 7,
    );
    expect(play.sharedPoints).toBe(base.sharedPoints);

    const search = chooseWeeklyAction(base, "search");
    expect(search.money).toBeLessThan(base.money);
    expect(search.sharedPoints).toBe(base.sharedPoints);
    expect(search.fighters.gidonozeaas.fighterPoints).toBe(0);
  });

  it("ends ownership without taking a favorite fighter away", () => {
    let run = createRun("normal", "liberation-voluntary-team");
    run.week = 12;
    run.roster = ["gidonozeaas", "minato", "amara", "rinne"];
    run.activeTeam = ["gidonozeaas", "minato", "amara"];
    run.roster.forEach((id) => {
      run.fighters[id] = {
        ...run.fighters[id],
        recruited: true,
        encountered: true,
      };
    });
    run.fighters.gidonozeaas = {
      ...run.fighters.gidonozeaas,
      liberationEligible: true,
      storyStage: 5,
      equippedItemId: "pearl-pin",
    };

    run = maybeCreateLiberationFollowup(run);
    expect(run.currentEvent?.fighterId).toBe("gidonozeaas");
    expect(run.liberationWindowsUsed).toEqual([12]);
    run = resolveCurrentEvent(run, 0);

    expect(run.fighters.gidonozeaas.liberated).toBe(true);
    expect(run.fighters.gidonozeaas.contractDecision).toBe("released");
    expect(run.fighters.gidonozeaas.ownership).toBe(0);
    expect(run.fighters.gidonozeaas.equippedItemId).toBe("pearl-pin");
    expect(run.activeTeam).toContain("gidonozeaas");
    expect(availableRosterIds(run)).toHaveLength(4);
    expect(maybeCreateLiberationFollowup(run).currentEvent).toBeUndefined();
  });

  it("counts either post-release relationship choice as liberation", () => {
    let run = createRun("normal", "liberation-second-choice");
    run.week = 20;
    run.roster = ["gidonozeaas", "minato", "amara"];
    run.activeTeam = [...run.roster];
    run.roster.forEach((id) => {
      run.fighters[id] = {
        ...run.fighters[id],
        recruited: true,
        encountered: true,
      };
    });
    run.fighters.gidonozeaas = {
      ...run.fighters.gidonozeaas,
      liberationEligible: true,
      storyStage: 5,
    };
    run.flags.push("choice:gidonozeaas.crisis:1");

    run = maybeCreateLiberationFollowup(run);
    expect(run.currentEvent?.scene.lines[1]?.text).toContain("ベル");
    run = resolveCurrentEvent(run, 1);

    expect(run.fighters.gidonozeaas.liberated).toBe(true);
    expect(run.fighters.gidonozeaas.contractDecision).toBe("released");
    expect(run.fighters.gidonozeaas.ownership).toBe(0);
    expect(run.activeTeam).toContain("gidonozeaas");
    expect(run.sharedPoints).toBe(
      getRouteDefinition("normal").startingSharedPoints + 4,
    );
  });

  it("keeps tactical management materially stronger than passive viewing", () => {
    const routes: RunState["route"][] = [
      "normal",
      "domination",
      "chaos",
    ];
    const report = routes.flatMap((route) => [
      auditBattles(route, false),
      auditBattles(route, true),
    ]);
    console.table(report);
    report.forEach((metrics) => {
      expect(metrics.meanTurns).toBeGreaterThanOrEqual(4);
      expect(metrics.meanDecisions).toBeGreaterThanOrEqual(1);
    });
    const normalPassive = report.find(
      (metrics) =>
        metrics.route === "normal" && metrics.policy === "指示なし",
    )!;
    const normalManaged = report.find(
      (metrics) =>
        metrics.route === "normal" && metrics.policy === "気配を読む",
    )!;
    const dominationManaged = report.find(
      (metrics) =>
        metrics.route === "domination" && metrics.policy === "気配を読む",
    )!;
    expect(normalManaged.winRate).toBeGreaterThan(normalPassive.winRate);
    expect(normalManaged.winRate - normalPassive.winRate).toBeGreaterThan(10);
    expect(normalManaged.winRate).toBeGreaterThanOrEqual(35);
    expect(dominationManaged.winRate).toBeGreaterThanOrEqual(15);
    expect(dominationManaged.winRate).toBeLessThan(normalManaged.winRate);
  }, 60_000);
});
