import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { fighterDefinitions } from "../data/characters";
import { officialMatches } from "../data/matches";
import { createBattle, applyIntervention, resolveBattleRound } from "./battle";
import { createRun } from "./engine";
import { createRandom } from "./rng";

const battleReadyRun = (seed: string) => {
  const run = createRun("normal", seed);
  const roster = ["gidonozeaas", "minato", "amara"];
  roster.forEach((id) => {
    run.fighters[id] = {
      ...run.fighters[id],
      encountered: true,
      recruited: true,
      trust: 50,
    };
  });
  run.roster = roster;
  run.activeTeam = roster;
  return run;
};

describe("battle audit", () => {
  it.each([1, 2, 3])(
    "matches a %s-fighter player team with the same number of opponents",
    (teamSize) => {
      const run = battleReadyRun(`matched-team-size-${teamSize}`);
      run.activeTeam = run.activeTeam.slice(0, teamSize);

      const battle = createBattle(
        run,
        officialMatches[0],
        createRandom(`matched-team-size-${teamSize}`),
      );

      expect(battle.player).toHaveLength(teamSize);
      expect(battle.enemy).toHaveLength(teamSize);
      expect(battle.enemy.map((unit) => unit.fighterId)).toEqual(
        ["rookie-piyo-slime", "rookie-kobold", "rookie-bat-mage"].slice(
          0,
          teamSize,
        ),
      );
      if (teamSize === 1) expect(battle.enemy[0].name).toContain("代表・");
      if (teamSize === 2) expect(battle.enemy[1].name).toContain("大将・");
    },
  );

  it("rotates the opening tournament's rookie opponents between rounds", () => {
    const run = battleReadyRun("opening-opponent-rotation");
    run.activeTeam = run.activeTeam.slice(0, 1);

    expect(
      createBattle(run, officialMatches[0], createRandom("opening-round-1"))
        .enemy[0].fighterId,
    ).toBe("rookie-piyo-slime");
    expect(
      createBattle(
        run,
        { ...officialMatches[0], id: "bonus:1:opening-cup" },
        createRandom("opening-round-2"),
      ).enemy[0].fighterId,
    ).toBe("rookie-kobold");
    expect(
      createBattle(
        run,
        { ...officialMatches[0], id: "bonus:2:opening-cup" },
        createRandom("opening-round-3"),
      ).enemy[0].fighterId,
    ).toBe("rookie-bat-mage");
  });

  it("opens the tutorial match with Gidonozeaas's Black Star", () => {
    const run = battleReadyRun("opening-black-star");
    run.activeTeam = ["gidonozeaas"];
    const random = createRandom("opening-black-star");
    const battle = resolveBattleRound(
      createBattle(run, officialMatches[0], random),
      random,
    );

    expect(battle.metrics.skillUses["gido.blackstar"]).toBe(1);
    expect(
      battle.presentationEvents?.some(
        (event) => event.skillName === "黒星" && event.side === "player",
      ),
    ).toBe(true);
  });

  it("ignores legacy elemental fields when choosing and resolving damage", () => {
    const play = (weak: "star" | "gale", strong: "star" | "tide") => {
      const run = battleReadyRun("attribute-free-battle");
      run.activeTeam = ["gidonozeaas"];
      const random = createRandom("attribute-free-round");
      const battle = createBattle(run, officialMatches[0], random);
      battle.enemy[0].weak = weak;
      battle.enemy[0].strong = strong;
      const resolved = resolveBattleRound(battle, random);
      const blackStar = resolved.presentationEvents?.find(
        (event) => event.skillName === "黒星" && event.kind === "damage",
      );
      return {
        skill: blackStar?.skillName,
        damage: blackStar?.targets[0]?.value,
      };
    };

    expect(play("star", "tide")).toEqual(play("gale", "star"));
  });

  it("resolves an automatic 3v3 battle in at most twelve rounds", () => {
    const run = battleReadyRun("fixed-battle");
    const random = createRandom("fixed-battle");
    let battle = createBattle(run, officialMatches[0], random);
    while (
      battle.status !== "won" &&
      battle.status !== "lost" &&
      battle.turn <= 12
    ) {
      if (battle.status === "decision") {
        battle = applyIntervention(battle, { type: "pass" });
      } else {
        battle = resolveBattleRound(battle, random);
      }
    }
    expect(["won", "lost"]).toContain(battle.status);
    expect(battle.turn).toBeLessThanOrEqual(12);
    expect(battle.logs.length).toBeGreaterThan(3);
  });

  it("terminates across varied seeds and tournament difficulties", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 40 }), (seed) => {
        const run = battleReadyRun(seed);
        const random = createRandom(`battle:${seed}`);
        const match =
          officialMatches[
            Math.abs(seed.length * 17 + seed.charCodeAt(0)) %
              officialMatches.length
          ];
        let battle = createBattle(run, match, random);
        let safety = 0;
        while (
          battle.status !== "won" &&
          battle.status !== "lost" &&
          safety < 30
        ) {
          battle =
            battle.status === "decision"
              ? applyIntervention(battle, { type: "pass" })
              : resolveBattleRound(battle, random);
          safety += 1;
        }
        expect(["won", "lost"]).toContain(battle.status);
        expect(safety).toBeLessThan(30);
      }),
      { numRuns: 300 },
    );
  });

  it("keeps forced commands temporary and does not reduce trust", () => {
    const run = battleReadyRun("force-command");
    const random = createRandom("force-command");
    let battle = createBattle(run, officialMatches[0], random);
    while (battle.status !== "decision") {
      battle = resolveBattleRound(battle, random);
    }
    const unit = battle.player[0];
    const trust = unit.trust;
    battle = applyIntervention(battle, {
      type: "force",
      fighterId: unit.fighterId,
      skillId: unit.skills[0].id,
    });
    expect(battle.forceUses).toBe(0);
    expect(battle.player[0].trust).toBe(trust);
    expect(battle.player[0].hp).toBeLessThan(unit.hp);
  });

  it("emits a causally replayable action sequence for the battle viewer", () => {
    const run = battleReadyRun("presentation-order");
    const random = createRandom("presentation-order");
    const battle = resolveBattleRound(
      createBattle(run, officialMatches[1], random),
      random,
    );
    const events = battle.presentationEvents ?? [];
    const units = [...battle.player, ...battle.enemy];
    const unitIds = new Set(units.map((unit) => unit.instanceId));
    const hpCursor = new Map<string, number>();
    let momentumCursor: number | undefined;

    expect(events.length).toBeGreaterThan(0);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    events.forEach((event) => {
      expect(event.headline.length).toBeGreaterThan(0);
      expect(event.detail.length).toBeGreaterThan(0);
      if (event.actorId) expect(unitIds.has(event.actorId)).toBe(true);
      event.targetIds.forEach((id) => expect(unitIds.has(id)).toBe(true));
      event.targets.forEach((target) => {
        expect(event.targetIds).toContain(target.instanceId);
        if (hpCursor.has(target.instanceId)) {
          expect(target.hpBefore).toBe(hpCursor.get(target.instanceId));
        }
        hpCursor.set(target.instanceId, target.hpAfter);
      });
      if (event.momentumBefore !== undefined) {
        if (momentumCursor !== undefined) {
          expect(event.momentumBefore).toBe(momentumCursor);
        }
        momentumCursor = event.momentumAfter;
      }
    });

    hpCursor.forEach((hp, id) => {
      expect(units.find((unit) => unit.instanceId === id)?.hp).toBe(hp);
    });
    if (momentumCursor !== undefined) {
      expect(battle.momentum).toBe(momentumCursor);
    }
    const presentedPlayerDamage = events
      .filter((event) => event.side === "player" && event.kind === "damage")
      .flatMap((event) => event.targets)
      .reduce((sum, target) => sum + (target.value ?? 0), 0);
    expect(battle.metrics.damageDealt).toBe(presentedPlayerDamage);
    expect(
      Object.values(battle.metrics.skillUses).reduce(
        (sum, uses) => sum + uses,
        0,
      ),
    ).toBeGreaterThan(0);
  });

  it("is deterministic and keeps tactical resources inside their bounds", () => {
    const play = () => {
      const run = battleReadyRun("deterministic");
      const random = createRandom("deterministic-rounds");
      let battle = createBattle(run, officialMatches[2], random);
      while (battle.status !== "won" && battle.status !== "lost") {
        battle =
          battle.status === "decision"
            ? applyIntervention(battle, {
                type: "read",
                prediction: battle.enemyTell ?? "attack",
              })
            : resolveBattleRound(battle, random);
        expect(battle.momentum).toBeGreaterThanOrEqual(0);
        expect(battle.momentum).toBeLessThanOrEqual(100);
        expect(battle.metrics.turningPoints).toBeLessThanOrEqual(1);
      }
      return battle;
    };
    expect(play()).toEqual(play());
  });

  it("opens at most one turning point and spotlights its decisive action", () => {
    const run = battleReadyRun("turning-point");
    const random = createRandom("turning-point");
    let battle = createBattle(run, officialMatches[2], random);
    battle = resolveBattleRound(battle, random);
    battle = applyIntervention(battle, { type: "shift", plan: "assault" });
    expect(battle.plan).toBe("assault");
    expect(battle.shiftUses).toBe(0);

    while (
      battle.decisionKind !== "turningPoint" &&
      battle.status !== "won" &&
      battle.status !== "lost"
    ) {
      battle =
        battle.status === "decision"
          ? applyIntervention(battle, { type: "pass" })
          : resolveBattleRound(battle, random);
    }
    expect(battle.decisionKind).toBe("turningPoint");
    battle = applyIntervention(battle, { type: "cheer", order: "sync" });
    expect(battle.turningPointOutcome).toBe("seized");
    expect(battle.metrics.turningPoints).toBe(1);

    battle = resolveBattleRound(battle, random);
    expect(
      battle.presentationEvents?.some(
        (event) => event.side === "player" && event.spotlight === "chance",
      ),
    ).toBe(true);

    while (battle.status !== "won" && battle.status !== "lost") {
      battle =
        battle.status === "decision"
          ? applyIntervention(battle, { type: "pass" })
          : resolveBattleRound(battle, random);
    }
    expect(battle.metrics.turningPoints).toBe(1);
  });

  it("gives every roster trait a reachable mechanical trigger", () => {
    const triggered = new Set<string>();
    for (let index = 0; index < 360; index += 1) {
      const run = createRun("normal", `trait-coverage-${index}`);
      const roster = Array.from({ length: 3 }, (_, offset) =>
        fighterDefinitions[(index + offset * 5) % fighterDefinitions.length].id,
      );
      roster.forEach((id) => {
        run.fighters[id] = {
          ...run.fighters[id],
          encountered: true,
          recruited: true,
          trust: 58,
          ownership: 46,
        };
      });
      run.roster = roster;
      run.activeTeam = roster;
      const random = createRandom(`trait-rounds-${index}`);
      let battle = createBattle(
        run,
        officialMatches[index % officialMatches.length],
        random,
      );
      while (battle.status !== "won" && battle.status !== "lost") {
        battle =
          battle.status === "decision"
            ? applyIntervention(battle, { type: "pass" })
            : resolveBattleRound(battle, random);
      }
      [...battle.player, ...battle.enemy].forEach((unit) => {
        if (unit.traitTriggered) triggered.add(unit.fighterId);
      });
    }
    expect(
      fighterDefinitions
        .map((fighter) => fighter.id)
        .filter((id) => !triggered.has(id)),
    ).toEqual([]);
  });

  it("makes burst AI spend more MP than conserve AI over repeated battles", () => {
    const spent = { burst: 0, conserve: 0 };
    (["burst", "conserve"] as const).forEach((tactic) => {
      for (let index = 0; index < 80; index += 1) {
        const run = battleReadyRun(`tactic-${index}`);
        run.battleTactics = Object.fromEntries(
          run.activeTeam.map((id) => [id, tactic]),
        );
        const random = createRandom(`tactic-rounds-${index}`);
        let battle = createBattle(run, officialMatches[1], random);
        while (battle.status !== "won" && battle.status !== "lost") {
          battle =
            battle.status === "decision"
              ? applyIntervention(battle, { type: "pass" })
              : resolveBattleRound(battle, random);
        }
        spent[tactic] += battle.player.reduce(
          (total, unit) => total + unit.maxMp - unit.mp,
          0,
        );
      }
    });
    expect(spent.burst).toBeGreaterThan(spent.conserve * 1.18);
  });

  it("treats the enemy tell as a useful clue rather than a guaranteed answer", () => {
    let correct = 0;
    const samples = 400;
    for (let index = 0; index < samples; index += 1) {
      const run = battleReadyRun(`tell-${index}`);
      const random = createRandom(`tell-round-${index}`);
      const battle = resolveBattleRound(
        createBattle(run, officialMatches[index % officialMatches.length], random),
        random,
      );
      correct += Number(battle.enemyTell === battle.enemyIntent);
    }
    const accuracy = correct / samples;
    expect(accuracy).toBeGreaterThan(0.68);
    expect(accuracy).toBeLessThan(0.84);
  });
});
