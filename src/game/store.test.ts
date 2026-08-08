import { beforeEach, describe, expect, it } from "vitest";
import { getMatchDefinition, officialMatches } from "../data/matches";
import { createBattle } from "./battle";
import { createInitialProfile, createRun } from "./engine";
import { createRandom } from "./rng";
import { useGameStore } from "./store";

describe("persistent run completion", () => {
  beforeEach(() => {
    useGameStore.setState({
      profile: createInitialProfile(),
      run: undefined,
    });
  });

  it("archives the complete team and unlocks the hard route", () => {
    const run = createRun("normal", "ending-audit");
    const roster = ["gidonozeaas", "minato", "amara"];
    roster.forEach((id, index) => {
      run.fighters[id] = {
        ...run.fighters[id],
        recruited: true,
        encountered: true,
        liberated: index < 2,
      };
    });
    run.week = 26;
    run.roster = roster;
    run.activeTeam = roster;
    run.pendingMatchId = officialMatches.at(-1)!.id;
    run.battle = createBattle(
      run,
      officialMatches.at(-1)!,
      createRandom("ending-audit"),
    );
    run.battle.status = "won";

    useGameStore.setState({ run });
    const result = useGameStore.getState().settleBattle();
    const state = useGameStore.getState();

    expect(result.ended).toBe(true);
    expect(state.run?.endingType).toBe("rebuild");
    expect(state.profile.hasFinishedRun).toBe(true);
    expect(state.profile.skipExplanations).toBe(false);
    expect(state.profile.unlockedRoutes).toContain("domination");
    expect(state.profile.hallOfFame).toHaveLength(1);
    expect(state.profile.hallOfFame[0].fighterIds).toEqual(roster);
    expect(state.profile.hallOfFame[0].rosterIds).toEqual(roster);
    expect(state.profile.hallOfFame[0].fighterSnapshots).toHaveLength(3);
    expect(state.profile.hallOfFame[0].fighterSnapshots?.[0]).toMatchObject({
      id: "gidonozeaas",
      trust: run.fighters.gidonozeaas.trust,
      liberated: true,
    });
    expect(state.profile.hallOfFame[0].battlePlan).toBe("balanced");
    expect(state.profile.hallOfFame[0].liberatedIds).toHaveLength(2);
  });

  it("carries the official result into the next week until a new action starts", () => {
    const run = createRun("normal", "result-continuity");
    const fighterId = "gidonozeaas";
    run.fighters[fighterId] = {
      ...run.fighters[fighterId],
      recruited: true,
      encountered: true,
    };
    run.roster = [fighterId];
    run.activeTeam = [fighterId];
    run.week = officialMatches[0].week;
    run.pendingMatchId = officialMatches[0].id;
    run.battle = createBattle(
      run,
      officialMatches[0],
      createRandom("result-continuity"),
    );
    run.battle.status = "lost";

    useGameStore.setState({ run });
    useGameStore.getState().settleBattle();

    expect(useGameStore.getState().run?.week).toBe(run.week + 1);
    expect(useGameStore.getState().run?.lastMatchSummary).toContain("敗戦");
    expect(
      useGameStore.getState().run?.fighters[fighterId].fighterPoints,
    ).toBe(2);

    useGameStore.getState().chooseAction("rest");
    expect(useGameStore.getState().run?.lastMatchSummary).toBeUndefined();
  });

  it("creates a real growth and money gap between victory and defeat", () => {
    const fighterId = "gidonozeaas";
    const settle = (status: "won" | "lost") => {
      const run = createRun("normal", `result-gap-${status}`);
      const match = officialMatches.find(
        (entry) => entry.roundsOnWin === 0 && !entry.final,
      )!;
      run.fighters[fighterId] = {
        ...run.fighters[fighterId],
        recruited: true,
        encountered: true,
      };
      run.roster = [fighterId];
      run.activeTeam = [fighterId];
      run.week = match.week;
      run.pendingMatchId = match.id;
      run.battle = createBattle(
        run,
        match,
        createRandom(`result-gap-${status}`),
      );
      run.battle.status = status;
      useGameStore.setState({
        profile: createInitialProfile(),
        run,
      });
      useGameStore.getState().settleBattle();
      return useGameStore.getState().run!;
    };

    const lost = settle("lost");
    const won = settle("won");
    expect(won.fighters[fighterId].fighterPoints).toBe(4);
    expect(lost.fighters[fighterId].fighterPoints).toBe(2);
    expect(won.money).toBeGreaterThan(lost.money);
    expect(won.pendingMatchId).toBeUndefined();
  });

  it("resolves the current match immediately without changing team parity", () => {
    const run = createRun("normal", "instant-battle-result");
    const roster = ["gidonozeaas", "minato"];
    roster.forEach((id) => {
      run.fighters[id] = {
        ...run.fighters[id],
        recruited: true,
        encountered: true,
      };
    });
    run.roster = roster;
    run.activeTeam = roster;
    run.pendingMatchId = officialMatches[0].id;
    run.battle = createBattle(
      run,
      officialMatches[0],
      createRandom("instant-battle-result"),
    );
    useGameStore.setState({ run });

    useGameStore.getState().finishBattleNow();
    const battle = useGameStore.getState().run?.battle;

    expect(["won", "lost"]).toContain(battle?.status);
    expect(battle?.player).toHaveLength(roster.length);
    expect(battle?.enemy).toHaveLength(roster.length);
    expect(battle?.presentationEvents).toEqual([]);
  });

  it("runs the opening cup as three bouts and awards the hot-spring rank-up", () => {
    const fighterId = "gidonozeaas";
    const run = createRun("normal", "opening-three-bouts");
    run.ownershipStage = "provisional";
    run.arenaRank = "provisional";
    run.week = 4;
    run.fighters[fighterId] = {
      ...run.fighters[fighterId],
      recruited: true,
      encountered: true,
    };
    run.roster = [fighterId];
    run.activeTeam = [fighterId];
    run.pendingMatchId = "opening-cup";
    useGameStore.setState({ run });

    ["bonus:1:opening-cup", "bonus:2:opening-cup", undefined].forEach(
      (expectedNext) => {
        const current = useGameStore.getState().run!;
        const match = getMatchDefinition(current.pendingMatchId!)!;
        current.battle = createBattle(
          current,
          match,
          createRandom(`opening-three-bouts:${match.id}`),
        );
        current.battle.status = "won";
        useGameStore.setState({ run: current });
        useGameStore.getState().settleBattle();
        expect(useGameStore.getState().run?.pendingMatchId).toBe(expectedNext);
      },
    );

    const champion = useGameStore.getState().run!;
    expect(champion.week).toBe(5);
    expect(champion.ownershipStage).toBe("owner");
    expect(champion.arenaRank).toBe("highest");
    expect(champion.flags).toContain("opening-cup:champion");
    expect(champion.lastMatchSummary).toContain("温泉旅行");
  });
});

describe("player UX defaults and batch growth", () => {
  beforeEach(() => {
    useGameStore.setState({
      profile: createInitialProfile(),
      run: undefined,
    });
  });

  it("starts with staged dialogue and a brisk interruptible battle speed", () => {
    const profile = useGameStore.getState().profile;

    expect(profile.version).toBe(11);
    expect(profile.dialogueMode).toBe("step");
    expect(profile.battleSpeed).toBe("fast");
    expect(profile.battlePlayback).toBe("manual");
  });

  it("persists the player's preferred battle reading mode", () => {
    useGameStore.getState().setBattlePlayback("auto");

    expect(useGameStore.getState().profile.battlePlayback).toBe("auto");
  });

  it("spends five points in one deliberate growth action", () => {
    const run = createRun("normal", "batch-growth");
    const fighterId = "gidonozeaas";
    run.fighters[fighterId] = {
      ...run.fighters[fighterId],
      recruited: true,
      encountered: true,
    };
    run.roster = [fighterId];
    run.activeTeam = [fighterId];
    run.sharedPoints = 6;
    useGameStore.setState({ run });

    useGameStore
      .getState()
      .allocatePoint(fighterId, "attack", "shared", 5);

    const updated = useGameStore.getState().run!;
    expect(updated.sharedPoints).toBe(1);
    expect(updated.fighters[fighterId].statBoosts.attack).toBe(5);
  });

  it("keeps a chosen emotional stance after the result panel closes", () => {
    useGameStore.setState({
      run: createRun("normal", "choice-memory"),
    });

    useGameStore.getState().chooseAction("search");
    useGameStore.getState().resolveEvent(0);

    const resolved = useGameStore.getState().run!;
    expect(resolved.lastEventOutcome?.choiceTone).toBeTruthy();
    expect(resolved.lastChoiceEcho?.memory.length).toBeGreaterThanOrEqual(12);
    expect(
      resolved.flags.some((flag) => flag.startsWith("choice-tone:")),
    ).toBe(true);

    useGameStore.getState().continueEvent();
    const continued = useGameStore.getState().run!;
    expect(continued.lastEventOutcome).toBeUndefined();
    expect(continued.lastChoiceEcho).toEqual(resolved.lastChoiceEcho);
  });
});

describe("post-loss spectator betting", () => {
  beforeEach(() => {
    useGameStore.setState({
      profile: createInitialProfile(),
      run: undefined,
    });
  });

  it("locks one bet, resolves one payout, and never charges twice", () => {
    const run = createRun("normal", "spectator-bet-audit");
    const fighterIds = ["gidonozeaas", "shahar"];
    fighterIds.forEach((fighterId) => {
      run.fighters[fighterId] = {
        ...run.fighters[fighterId],
        recruited: true,
        encountered: true,
      };
    });
    run.roster = fighterIds;
    run.activeTeam = fighterIds;
    run.pendingMatchId = officialMatches[0].id;
    run.battle = createBattle(
      run,
      officialMatches[0],
      createRandom("spectator-bet-audit:battle"),
    );
    run.battle.status = "lost";
    useGameStore.setState({ run });

    expect(useGameStore.getState().prepareSpectatorMatch()).toBe(true);
    const offer = useGameStore.getState().run!.spectatorMatch!;
    expect([...offer.azureFighterIds, ...offer.coralFighterIds]).toHaveLength(4);
    expect([...offer.azureFighterIds, ...offer.coralFighterIds]).not.toContain(
      "gidonozeaas",
    );

    const startingMoney = useGameStore.getState().run!.money;
    expect(
      useGameStore
        .getState()
        .startSpectatorMatch(offer.winnerSide, 200),
    ).toBe(true);
    expect(useGameStore.getState().run!.money).toBe(startingMoney - 200);
    expect(
      useGameStore
        .getState()
        .startSpectatorMatch(offer.winnerSide, 200),
    ).toBe(false);
    expect(useGameStore.getState().run!.money).toBe(startingMoney - 200);

    useGameStore.getState().resolveSpectatorMatch();
    const resolved = useGameStore.getState().run!.spectatorMatch!;
    const expectedPayout = Math.round(200 * resolved.odds[offer.winnerSide]);
    expect(resolved.status).toBe("resolved");
    expect(resolved.payout).toBe(expectedPayout);
    expect(useGameStore.getState().run!.money).toBe(
      startingMoney - 200 + expectedPayout,
    );

    useGameStore.getState().resolveSpectatorMatch();
    expect(useGameStore.getState().run!.money).toBe(
      startingMoney - 200 + expectedPayout,
    );
    useGameStore.getState().dismissSpectatorMatch();
    expect(useGameStore.getState().run!.spectatorMatch?.status).toBe(
      "dismissed",
    );
  });
});
