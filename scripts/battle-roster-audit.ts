import { fighterDefinitions } from "../src/data/characters";
import { officialMatches } from "../src/data/matches";
import { applyIntervention, createBattle, resolveBattleRound } from "../src/game/battle";
import { createRun } from "../src/game/engine";
import { createRandom } from "../src/game/rng";

const finalMatch = officialMatches.at(-1)!;
const rosterPool = ["gidonozeaas", "minato", "amara"];

const runBattle = (liberated: boolean, index: number, managed: boolean) => {
  const run = createRun("normal", `final-liberation:${liberated}:${index}`);
  rosterPool.forEach((id) => {
    run.fighters[id] = {
      ...run.fighters[id],
      encountered: true,
      recruited: true,
      liberated,
      trust: 72,
      ownership: 54,
      condition: "normal",
      fighterPoints: 0,
      statBoosts: {
        hp: 24,
        mp: 9,
        attack: 7,
        defense: 7,
        magic: 7,
        speed: 4,
      },
    };
  });
  run.week = 26;
  run.roster = [...rosterPool];
  run.activeTeam = [...rosterPool];
  run.battleTactics = Object.fromEntries(
    run.activeTeam.map((id) => [id, "signature"]),
  );

  const random = createRandom(`final-roster-battle:${teamSize}:${index}`);
  let battle = createBattle(run, finalMatch, random);
  let safety = 0;
  while (
    battle.status !== "won" &&
    battle.status !== "lost" &&
    safety < 40
  ) {
    if (battle.status === "decision") {
      battle = managed
        ? applyIntervention(battle, {
            type: "read",
            prediction: battle.enemyTell ?? "attack",
          })
        : applyIntervention(battle, { type: "pass" });
    } else {
      battle = resolveBattleRound(battle, random);
    }
    safety += 1;
  }
  return {
    won: battle.status === "won",
    turns: battle.turn,
    safety,
  };
};

const report = [];
for (const liberated of [false, true]) {
  for (const managed of [false, true]) {
    const results = Array.from({ length: 60 }, (_, index) =>
      runBattle(liberated, index, managed),
    );
    report.push({
      liberated,
      policy: managed ? "managed" : "passive",
      winRate:
        Math.round(
          (results.filter((result) => result.won).length / results.length) *
            10_000,
        ) / 100,
      meanTurns:
        Math.round(
          (results.reduce((sum, result) => sum + result.turns, 0) /
            results.length) *
            100,
        ) / 100,
      unresolved: results.filter((result) => result.safety >= 40).length,
    });
  }
}

console.log(JSON.stringify(report, null, 2));

// Keep the import alive in Vite's audit graph so missing roster definitions fail loudly.
if (fighterDefinitions.length === 0) throw new Error("No fighters loaded.");
