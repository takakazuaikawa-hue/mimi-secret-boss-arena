import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fighterDefinitions } from "../data/characters";
import { characterVisuals, encounterCgs } from "../data/characterVisuals";
import { ambientEvents } from "../data/ambientEvents";
import { matchesForRoute, officialMatches } from "../data/matches";
import { routeEvents } from "../data/routeEvents";
import {
  condensedProloguePages,
  fullProloguePages,
} from "../data/prologue";
import {
  weeklyNarrativeLines,
  weeklyNarratives,
} from "../data/weeklyNarratives";
import { validateContent } from "./content";

describe("content audit", () => {
  it("validates every launch definition", () => {
    expect(validateContent()).toBe(true);
  });

  it("ships exactly fifteen distinct fighters", () => {
    expect(fighterDefinitions).toHaveLength(15);
    expect(new Set(fighterDefinitions.map((fighter) => fighter.id)).size).toBe(
      15,
    );
  });

  it("uses one canonical visual identity for every fighter", () => {
    expect(Object.keys(characterVisuals).sort()).toEqual(
      fighterDefinitions.map((fighter) => fighter.id).sort(),
    );
    fighterDefinitions.forEach((fighter) => {
      const visual = characterVisuals[fighter.id];
      expect(visual.alt).toContain(fighter.name);
      expect(visual.focusX).toBeGreaterThanOrEqual(0);
      expect(visual.focusX).toBeLessThanOrEqual(100);
      expect(
        existsSync(
          join(process.cwd(), "public", visual.portrait.slice(1)),
        ),
      ).toBe(true);
      // 立ち絵は全身・真形態で統一した戦場用v1アセットを正本にする。
      expect(visual.standing).toMatch(/\/assets\/battle\/fighters\//);
      expect(
        existsSync(
          join(process.cwd(), "public", visual.standing.slice(1)),
        ),
      ).toBe(true);
      const standingPng = readFileSync(
        join(process.cwd(), "public", visual.standing.slice(1)),
      );
      expect(standingPng[25]).toBe(6);
      if (fighter.id !== "gidonozeaas") {
        expect(encounterCgs[fighter.id]).toBeTruthy();
        expect(
          existsSync(
            join(process.cwd(), "public", encounterCgs[fighter.id].slice(1)),
          ),
        ).toBe(true);
      }
    });
    ["shahar", "sazanami", "mumyo"].forEach((id) => {
      expect(characterVisuals[id].standing).not.toBe(encounterCgs[id]);
    });
  });

  it("never assigns another fighter's named artwork to a story", () => {
    const idsByLength = fighterDefinitions
      .map((fighter) => fighter.id)
      .sort((a, b) => b.length - a.length);

    fighterDefinitions.forEach((fighter) => {
      Object.values(fighter.scenes)
        .flatMap((scene) => scene.lines)
        .flatMap((line) => line.direction?.still ?? [])
        .forEach((path) => {
          const namedFighter = idsByLength.find((id) =>
            path.includes(`/${id}-`) || path.includes(`/${id}.`),
          );
          if (namedFighter) expect(namedFighter).toBe(fighter.id);
        });
    });
  });

  it("ships twenty authored everyday events for every weekly action", () => {
    const events = Object.values(ambientEvents).flat();
    Object.values(ambientEvents).forEach((pool) => {
      expect(pool.length).toBeGreaterThanOrEqual(20);
    });
    expect(events.length).toBeGreaterThanOrEqual(80);
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length);
    events.forEach((event) => {
      expect(event.lines.length).toBeGreaterThanOrEqual(3);
      expect(event.choices).toHaveLength(2);
    });
  });

  it("gives every decision a distinct emotional promise and remembered consequence", () => {
    const scenes = [
      ...Object.values(ambientEvents).flat(),
      ...fighterDefinitions.flatMap((fighter) =>
        Object.values(fighter.scenes),
      ),
      ...Object.values(routeEvents).flatMap((events) => events ?? []),
    ];
    const choices = scenes.flatMap((scene) => scene.choices ?? []);
    const tones = new Set(choices.map((choice) => choice.tone));

    expect(choices.length).toBeGreaterThanOrEqual(200);
    expect(tones.size).toBe(6);
    choices.forEach((choice) => {
      expect(choice.intent?.length).toBeGreaterThanOrEqual(5);
      expect(choice.promise?.length).toBeGreaterThanOrEqual(10);
      expect(choice.memory?.length).toBeGreaterThanOrEqual(10);
      expect(`${choice.intent} ${choice.promise}`).not.toMatch(
        /信頼(?:を|か|と|へ)|所有(?:を|か|と|へ)|信頼型|所有型/,
      );
    });
  });

  it("makes crisis decisions concrete actions instead of a repeated ideology quiz", () => {
    const crisisChoices = fighterDefinitions.flatMap((fighter) =>
      fighter.scenes.crisis.choices!.map((choice) => ({
        fighterId: fighter.id,
        ...choice,
      })),
    );

    expect(crisisChoices).toHaveLength(fighterDefinitions.length * 2);
    expect(new Set(crisisChoices.map((choice) => choice.label)).size).toBe(
      crisisChoices.length,
    );
    crisisChoices.forEach((choice) => {
      expect(choice.intent).not.toMatch(/信頼|所有|自由を選ぶ/);
      expect(
        (choice.fighterPoints ?? 0) > 0 ||
          (choice.sharedPoints ?? 0) > 0 ||
          (choice.money ?? 0) !== 0,
      ).toBe(true);
    });
  });

  it("gives every character-specific story decision its own action and outcome", () => {
    const stages = ["meet", "join", "bond", "power", "crisis", "liberation"] as const;
    stages.forEach((stage) => {
      const choices = fighterDefinitions.flatMap(
        (fighter) => fighter.scenes[stage].choices ?? [],
      );
      expect(choices).toHaveLength(
        fighterDefinitions.length * (stage === "join" ? 3 : 2),
      );
      expect(new Set(choices.map((choice) => choice.label)).size, `${stage} labels`).toBe(
        choices.length,
      );
      expect(new Set(choices.map((choice) => choice.result)).size, `${stage} results`).toBe(
        choices.length,
      );
    });
  });

  it("gives every fighter a complete independent story spine", () => {
    const sceneIds = fighterDefinitions.flatMap((fighter) =>
      Object.values(fighter.scenes).map((scene) => scene.id),
    );
    expect(new Set(sceneIds).size).toBe(sceneIds.length);
    fighterDefinitions.forEach((fighter) => {
      expect(fighter.skills).toHaveLength(4);
      Object.values(fighter.scenes).forEach((scene) => {
        expect(scene.lines.length).toBeGreaterThanOrEqual(
          fighter.id === "gidonozeaas" ? 10 : 17,
        );
        expect(scene.lines[0]?.kind).toBe("thought");
        expect(
          scene.lines.filter((entry) => entry.beat !== undefined).length,
        ).toBeGreaterThanOrEqual(fighter.id === "gidonozeaas" ? 0 : 3);
      });
    });
    const openingChoiceLabels = fighterDefinitions.flatMap((fighter) =>
      fighter.scenes.meet.choices!.map((choice) => choice.label),
    );
    expect(new Set(openingChoiceLabels).size).toBe(openingChoiceLabels.length);
  });

  it("anchors major emotional turns with real event artwork", () => {
    const illustratedFighters = fighterDefinitions.filter((fighter) =>
      Object.values(fighter.scenes).some((scene) =>
        scene.lines.some((line) => line.direction?.still),
      ),
    );

    expect(illustratedFighters.length).toBe(fighterDefinitions.length);
    illustratedFighters.forEach((fighter) => {
      Object.values(fighter.scenes)
        .flatMap((scene) => scene.lines)
        .flatMap((line) => line.direction?.still ?? [])
        .forEach((path) => {
          expect(path).toMatch(/^\/assets\//);
          expect(
            existsSync(join(process.cwd(), "public", path.slice(1))),
          ).toBe(true);
        });
    });
  });

  it("bookends every non-opening route with encounter and climax artwork", () => {
    fighterDefinitions
      .filter((fighter) => fighter.id !== "gidonozeaas")
      .forEach((fighter) => {
        const meetStills = fighter.scenes.meet.lines.filter(
          (line) => line.direction?.still,
        );
        const lateStills = [
          fighter.scenes.power,
          fighter.scenes.crisis,
          fighter.scenes.liberation,
          fighter.scenes.epilogue,
        ].flatMap((scene) =>
          scene.lines.filter((line) => line.direction?.still),
        );
        expect(meetStills.length).toBeGreaterThanOrEqual(1);
        expect(lateStills.length).toBeGreaterThanOrEqual(1);
      });
  });

  it("gives every first encounter a dedicated visual reveal", () => {
    fighterDefinitions.forEach((fighter) => {
      const stills = fighter.scenes.meet.lines
        .map((line) => line.direction?.still)
        .filter(Boolean);
      expect(stills.length).toBeGreaterThanOrEqual(1);
      stills.forEach((path) => {
        expect(
          existsSync(join(process.cwd(), "public", path!.slice(1))),
        ).toBe(true);
      });
    });
  });

  it("stages every story step with a changing background or full-screen art", () => {
    fighterDefinitions.forEach((fighter) => {
      Object.values(fighter.scenes).forEach((scene) => {
        const hasVisualDirection =
          Boolean(scene.background) ||
          scene.lines.some(
            (line) =>
              Boolean(line.direction?.background) ||
              Boolean(line.direction?.still),
          );
        expect(hasVisualDirection).toBe(true);
      });
    });
  });

  it("keeps exposition moving through Mimi's first-person observations", () => {
    fighterDefinitions
      .filter((fighter) => fighter.id !== "gidonozeaas")
      .forEach((fighter) => {
        Object.values(fighter.scenes).forEach((scene) => {
          expect(
            scene.lines.filter((line) => line.kind === "thought").length,
          ).toBeGreaterThanOrEqual(10);
          expect(
            scene.lines.filter((line) => line.speaker === "ミミ").length,
          ).toBeGreaterThanOrEqual(1);
          expect(
            scene.lines
              .slice(0, 8)
              .some((line) => line.speaker !== undefined),
          ).toBe(true);
        });
      });
  });

  it("keeps narration and speaker ownership explicit", () => {
    const sazanami = fighterDefinitions.find(
      (fighter) => fighter.id === "sazanami",
    )!;
    const ushiro = fighterDefinitions.find(
      (fighter) => fighter.id === "ushiro",
    )!;
    const minato = fighterDefinitions.find(
      (fighter) => fighter.id === "minato",
    )!;

    expect(
      sazanami.scenes.meet.lines.find(
        (entry) => entry.text === "その水槽、さっきから奥行きがおかしい。",
      )?.speaker,
    ).toBe("ミミ");
    expect(
      ushiro.scenes.meet.lines.find(
        (entry) => entry.text === "数えないで。",
      )?.speaker,
    ).toBe("うしろ");
    expect(
      minato.scenes.epilogue.lines.find(
        (entry) =>
          entry.text ===
          "ミナトは新しい地図を広げ、最初に闘技場へ丸を付けた。",
      )?.kind,
    ).toBe("thought");
  });

  it("keeps the opening character as a staged first-person visual novel", () => {
    const gidono = fighterDefinitions.find(
      (fighter) => fighter.id === "gidonozeaas",
    )!;
    const scenes = Object.values(gidono.scenes);
    scenes.forEach((scene) => {
      expect(scene.lines.length).toBeGreaterThanOrEqual(10);
      expect(scene.background).toMatch(/^\/assets\/story\//);
      expect(scene.lines.filter((entry) => entry.kind === "thought").length)
        .toBeGreaterThanOrEqual(2);
      scene.lines
        .filter((entry) => entry.kind === "thought")
        .forEach((entry) => {
          expect(entry.speaker).toBeUndefined();
        });
      scene.lines.forEach((entry) => {
        expect(entry.text.length).toBeLessThanOrEqual(130);
      });
    });
    expect(
      scenes.some((scene) =>
        scene.lines.some((entry) => entry.direction?.still),
      ),
    ).toBe(true);
    expect(
      scenes.some((scene) =>
        scene.lines.some((entry) => entry.direction?.sprite),
      ),
    ).toBe(true);
    Object.values(gidono.scenes)
      .filter((scene) => scene.choices)
      .forEach((scene) => {
        scene.choices!.forEach((choice) => {
          expect(choice.result.length).toBeGreaterThanOrEqual(45);
        });
      });

    const inWorldText = scenes
      .flatMap((scene) => [
        ...scene.lines.map((entry) => entry.text),
        ...(scene.choices ?? []).flatMap((entry) => [
          entry.label,
          entry.result,
        ]),
      ])
      .join("\n");
    [
      "地の文",
      "ミミは",
      "裏ボス",
      "攻略対象",
      "ときメモ",
      "プレイヤー",
    ].forEach((term) => {
      expect(inWorldText).not.toContain(term);
    });
  });

  it("introduces the premise before the first weekly choice", () => {
    const fullText = fullProloguePages.map((entry) => entry.text).join("\n");
    const condensedText = condensedProloguePages
      .map((entry) => entry.text)
      .join("\n");

    [
      "転生",
      "カジノ",
      "契約",
      "アルデバラン社",
      "戦う必要はありません",
      "過ごし方を一つ",
      "契約記録室",
      "閲覧権限",
    ].forEach((term) => expect(fullText).toContain(term));
    [
      "転生",
      "カジノ",
      "契約",
      "第三闘技場",
      "戦わず",
      "一つだけ選んで",
      "閲覧権限",
    ].forEach((term) => expect(condensedText).toContain(term));
    expect(fullProloguePages.length).toBeLessThanOrEqual(52);
    expect(fullProloguePages.length).toBeGreaterThanOrEqual(45);
    expect(condensedProloguePages.length).toBeLessThanOrEqual(6);
    expect(new Set(fullProloguePages.map((entry) => entry.sceneLabel)).size)
      .toBeGreaterThanOrEqual(3);
    fullProloguePages.forEach((entry) => {
      expect(entry.text.length).toBeLessThanOrEqual(130);
    });
    const prologueStills = fullProloguePages.flatMap(
      (entry) => entry.direction?.still ?? [],
    );
    expect(prologueStills.length).toBeGreaterThanOrEqual(1);
    prologueStills.forEach((path) => {
        expect(
          existsSync(join(process.cwd(), "public", path.slice(1))),
        ).toBe(true);
    });
  });

  it("carries every week into events with an authored emotional turn", () => {
    expect(weeklyNarratives).toHaveLength(26);
    for (let week = 1; week <= 26; week += 1) {
      (["work", "play", "rest", "search"] as const).forEach((action) => {
        const lines = weeklyNarrativeLines(week, action);
        expect(lines).toHaveLength(4);
        expect(lines.every((line) => line.kind === "thought")).toBe(true);
        expect(lines.slice(0, 3).every((line) => line.text.length >= 15))
          .toBe(true);
        expect(lines.at(-1)!.text.length).toBeGreaterThanOrEqual(25);
      });
    }
  });

  it("keeps the official schedule ordered and inside 26 weeks", () => {
    const weeks = officialMatches.map((match) => match.week);
    expect(weeks).toEqual([...weeks].sort((a, b) => a - b));
    expect(Math.min(...weeks)).toBeGreaterThan(0);
    expect(Math.max(...weeks)).toBe(26);
    expect(officialMatches.at(-1)?.final).toBe(true);
  });

  it("keeps chaos match rules stable while domination adds assessments", () => {
    expect(matchesForRoute("chaos")).toEqual(matchesForRoute("normal"));
    expect(matchesForRoute("domination").length).toBe(
      officialMatches.length + 5,
    );
  });
});
