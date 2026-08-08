import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  availableRosterIds,
  chooseWeeklyAction,
  clearEventOutcome,
  createRun,
  maybeCreateLiberationFollowup,
  maybeCreateOpeningOwnershipFollowup,
  nextCampaignWeek,
  recruitmentForecastForAction,
  resolveCurrentEvent,
} from "./engine";
import type { RunState, WeeklyAction } from "./types";

const actions: WeeklyAction[] = ["work", "play", "rest", "search"];

const simulateCampaign = (seed: string) => {
  let run = createRun("normal", seed);
  const eventCounts: number[] = [];

  for (let week = 1; week <= 26; week += 1) {
    const action = actions[(week + seed.length) % actions.length];
    run = chooseWeeklyAction(run, action);
    let count = 0;
    expect(run.currentEvent).toBeDefined();
    const normalSceneId = run.currentEvent!.scene.id;
    run = resolveCurrentEvent(run, week % 2);
    count += 1;
    run = clearEventOutcome(run);
    run = maybeCreateOpeningOwnershipFollowup(run);
    if (run.currentEvent) {
      expect(run.currentEvent.scene.id).toBe("opening.owner-transfer");
      run = resolveCurrentEvent(run, 0);
      run = clearEventOutcome(run);
      count += 1;
    }
    if (!normalSceneId.endsWith(".liberation")) {
      run = maybeCreateLiberationFollowup(run);
    }
    if (run.currentEvent) {
      expect(run.currentEvent.scene.id.endsWith(".liberation")).toBe(true);
      run = resolveCurrentEvent(run, 0);
      count += 1;
    }
    eventCounts.push(count);
    if (week < 26) run = nextCampaignWeek(run);
  }

  return { run, eventCounts };
};

describe("campaign simulation audit", () => {
  it("separates the fixed first encounter from later recruitment", () => {
    let run = createRun("normal", "first-scout-feedback");
    run = chooseWeeklyAction(run, "work");
    expect(run.currentEvent?.fighterId).toBe("gidonozeaas");

    run = resolveCurrentEvent(run, 0);

    expect(run.fighters.gidonozeaas.encountered).toBe(true);
    expect(run.fighters.gidonozeaas.recruited).toBe(false);
    expect(run.roster).not.toContain("gidonozeaas");
    expect(run.recentEventFighterId).toBe("gidonozeaas");
    expect(run.lastEventOutcome).toMatchObject({
      fighterId: "gidonozeaas",
      isRecruitment: false,
    });
    expect(run.lastEventOutcome?.milestones?.join(" ")).toContain(
      "ギドノゼアースと知り合った",
    );
    expect(run.lastEventOutcome?.before).toBeDefined();
    expect(run.lastEventOutcome?.after).toBeDefined();

    run = clearEventOutcome(run);
    run = maybeCreateOpeningOwnershipFollowup(run);
    expect(run.currentEvent?.scene.id).toBe("opening.owner-transfer");
    run = resolveCurrentEvent(run, 0);
    expect(run.ownershipStage).toBe("provisional");
    expect(run.flags).toContain("opening:owner-transfer-complete");
    run = clearEventOutcome(run);
    expect(maybeCreateOpeningOwnershipFollowup(run)).toBe(run);

    run = nextCampaignWeek(run);
    run = chooseWeeklyAction(run, "work");
    expect(run.currentEvent?.scene.id).toBe("gidonozeaas.join");
    run = resolveCurrentEvent(run, 0);

    expect(run.fighters.gidonozeaas.recruited).toBe(true);
    expect(run.roster).toContain("gidonozeaas");
    expect(run.lastEventOutcome?.isRecruitment).toBe(true);
    expect(run.lastEventOutcome?.milestones?.join(" ")).toContain(
      "ギドノゼアースが所属選手になった",
    );
  });

  it("carries every opening action into the context of the fixed encounter", () => {
    const leads = actions.map((action) => {
      const run = chooseWeeklyAction(
        createRun("normal", `opening-${action}`),
        action,
      );
      expect(run.currentEvent?.fighterId).toBe("gidonozeaas");
      expect(run.currentEvent?.action).toBe(action);
      return run.currentEvent?.scene.lines[0]?.text;
    });

    expect(new Set(leads).size).toBe(actions.length);
    expect(leads[0]).toContain("働くと決めた");
    expect(leads[1]).toContain("場内を知る");
    expect(leads[2]).toContain("休憩を選んだ");
    expect(leads[3]).toContain("予約端末");
  });

  it("presents first-week actions as paid dispatch work, not owner spending", () => {
    const expectedChange: Record<WeeklyAction, number> = {
      work: 700,
      play: 650,
      rest: 0,
      search: 750,
    };

    actions.forEach((action) => {
      const initial = createRun("normal", `dispatch-pay-${action}`);
      const run = chooseWeeklyAction(initial, action);
      expect(run.ownershipStage).toBe("employee");
      expect(run.money - initial.money).toBe(expectedChange[action]);
      if (action === "rest") expect(run.mimiCondition).toBe("good");
    });
  });

  it("makes search the main route to a fourth scout without hiding the odds", () => {
    const run = createRun("normal", "forecast-priority");
    run.week = 14;
    run.roster = ["gidonozeaas", "minato", "amara", "rinne", "peony"];
    run.roster.forEach((id) => {
      run.fighters[id] = {
        ...run.fighters[id],
        encountered: true,
        recruited: true,
      };
    });

    const work = recruitmentForecastForAction(run, "work");
    const search = recruitmentForecastForAction(run, "search");
    expect(work.chance).toBeLessThanOrEqual(0.07);
    expect(search.chance).toBeGreaterThanOrEqual(0.25);
    expect(search.chance).toBeGreaterThanOrEqual(work.chance * 5);
  });

  it("plays the earned hot-spring trip between the first two tournaments", () => {
    const run = createRun("normal", "earned-hot-spring");
    run.week = 5;
    run.ownershipStage = "owner";
    run.arenaRank = "highest";
    run.flags.push("opening-cup:champion");

    const scheduled = chooseWeeklyAction(run, "rest");
    expect(scheduled.currentEvent?.scene.id).toBe(
      "opening.hot-spring-trip",
    );
    expect(scheduled.currentEvent?.scene.background).toBe(
      "/assets/story/bg-hot-spring-ryokan.png",
    );
  });

  it("plays all 26 weekly actions without a dead end", () => {
    const { run, eventCounts } = simulateCampaign("twenty-six-weeks");
    expect(run.week).toBe(26);
    expect(eventCounts).toHaveLength(26);
    expect(eventCounts.every((count) => count >= 1 && count <= 2)).toBe(true);
    expect(run.eventHistory.length).toBeGreaterThanOrEqual(26);
  });

  it("never uses money as a game-over state", () => {
    let run = createRun("normal", "zero-money");
    run = { ...run, money: 0, ownershipStage: "owner" };
    run = chooseWeeklyAction(run, "search");
    expect(run.money).toBe(0);
    expect(run.currentEvent).toBeDefined();
  });

  it("holds roster, funds, weeks, and event guarantees across random seeds", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 48 }), (seed) => {
        const { run, eventCounts } = simulateCampaign(seed);
        expect(run.money).toBeGreaterThanOrEqual(0);
        expect(run.week).toBe(26);
        expect(run.roster.length).toBeGreaterThanOrEqual(1);
        expect(availableRosterIds(run).length).toBeLessThanOrEqual(
          run.route === "chaos" ? 8 : 7,
        );
        expect(new Set(run.roster).size).toBe(run.roster.length);
        expect(eventCounts.every((count) => count >= 1)).toBe(true);
        Object.values(run.fighters).forEach(
          (fighter: RunState["fighters"][string]) => {
            expect(fighter.trust).toBeGreaterThanOrEqual(0);
            expect(fighter.trust).toBeLessThanOrEqual(100);
            expect(fighter.ownership).toBeGreaterThanOrEqual(0);
            expect(fighter.ownership).toBeLessThanOrEqual(100);
          },
        );
      }),
      { numRuns: 100 },
    );
  });
});
