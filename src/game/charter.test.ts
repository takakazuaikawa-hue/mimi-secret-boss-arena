import { describe, expect, it } from "vitest";
import { fighterDefinitions } from "../data/characters";
import {
  arenaCharter,
  grandFinaleLines,
  isCharterComplete,
  unlockedCharterArticles,
} from "../data/arenaCharter";
import { createRun } from "./engine";

describe("arena charter (真エンディング基盤)", () => {
  const allIds = fighterDefinitions.map((fighter) => fighter.id);

  it("covers every fighter with at least one article and no strangers", () => {
    const charterIds = new Set(arenaCharter.map((entry) => entry.fighterId));
    expect([...charterIds].sort()).toEqual([...allIds].sort());
    // 条番号は1始まりの連番で重複しない
    expect(arenaCharter.map((entry) => entry.article)).toEqual(
      arenaCharter.map((_, index) => index + 1),
    );
  });

  it("has a grand finale roll-call line for every fighter", () => {
    for (const id of allIds) {
      expect(grandFinaleLines[id], id).toBeTruthy();
    }
  });

  it("completes only when every fighter is liberated across runs", () => {
    expect(isCharterComplete([])).toBe(false);
    expect(isCharterComplete(allIds.slice(0, 14))).toBe(false);
    expect(isCharterComplete(allIds)).toBe(true);
    expect(unlockedCharterArticles(allIds)).toHaveLength(arenaCharter.length);
  });

  it("deprioritizes already-liberated fighters in the encounter deck", () => {
    const liberated = allIds.filter((id) => id !== "gidonozeaas").slice(0, 6);
    const base = createRun("normal", "charter-deck-seed");
    const guided = createRun("normal", "charter-deck-seed", {
      deprioritizedEncounters: liberated,
    });
    // 中身は同一(誰も消えない)
    expect([...guided.encounterDeck].sort()).toEqual(
      [...base.encounterDeck].sort(),
    );
    // 解放済みは全員、未解放より後ろに並ぶ
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
