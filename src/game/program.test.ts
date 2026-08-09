import { describe, expect, it } from "vitest";
import { fighterDefinitions } from "../data/characters";
import {
  finalAct,
  grandFinaleLines,
  isProgramComplete,
  openingProgram,
  unlockedProgramActs,
} from "../data/openingProgram";
import { createRun } from "./engine";

describe("opening program (真エンディング基盤)", () => {
  const allIds = fighterDefinitions.map((fighter) => fighter.id);

  it("gives every fighter exactly one act and no strangers", () => {
    const actIds = openingProgram.map((entry) => entry.fighterId);
    expect([...actIds].sort()).toEqual([...allIds].sort());
    // 幕番号は1始まりの連番で重複しない
    expect(openingProgram.map((entry) => entry.act)).toEqual(
      openingProgram.map((_, index) => index + 1),
    );
    // 大取りは人物の幕と番号が重ならない
    expect(finalAct.act).toBe(openingProgram.length + 1);
  });

  it("has a grand finale line for every fighter", () => {
    for (const id of allIds) {
      expect(grandFinaleLines[id], id).toBeTruthy();
    }
  });

  it("completes only when every fighter is liberated across runs", () => {
    expect(isProgramComplete([])).toBe(false);
    expect(isProgramComplete(allIds.slice(0, 14))).toBe(false);
    expect(isProgramComplete(allIds)).toBe(true);
    expect(unlockedProgramActs(allIds)).toHaveLength(openingProgram.length);
  });

  it("deprioritizes already-liberated fighters in the encounter deck", () => {
    const liberated = allIds.filter((id) => id !== "gidonozeaas").slice(0, 6);
    const base = createRun("normal", "program-deck-seed");
    const guided = createRun("normal", "program-deck-seed", {
      deprioritizedEncounters: liberated,
    });
    expect([...guided.encounterDeck].sort()).toEqual(
      [...base.encounterDeck].sort(),
    );
    const firstDeprioritized = guided.encounterDeck.findIndex((id) =>
      liberated.includes(id),
    );
    const lastFresh = guided.encounterDeck.reduce(
      (last, id, index) => (liberated.includes(id) ? last : index),
      -1,
    );
    expect(firstDeprioritized).toBeGreaterThan(lastFresh);
  });
});
