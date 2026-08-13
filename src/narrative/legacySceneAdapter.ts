import type {
  CharacterScene,
  SceneChoice,
  SceneDirection,
  SceneSpriteCue,
} from "../game/types";
import {
  assetIdSchema,
  narrativeEventBlockSchema,
  type NarrativeEffect,
  type NarrativeEventBlock,
} from "./schema";

export interface LegacySceneAdapterOptions {
  kind: NarrativeEventBlock["kind"];
  arcId: string;
  characterId?: string;
  stage?: string;
  routes?: Array<"normal" | "domination" | "chaos">;
  repeat?: NarrativeEventBlock["trigger"]["repeat"];
  priority?: number;
  weight?: number;
  status?: NarrativeEventBlock["debug"]["status"];
  completionEffects?: NarrativeEffect[];
}

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

const assetIdForPath = (path: string) => {
  const slug = path
    .replace(/^\/assets\//, "")
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/gi, ".")
    .replace(/^\.+|\.+$/g, "")
    .toLowerCase();
  return assetIdSchema.parse(`legacy.asset.${slug || "unnamed"}.${stableHash(path)}`);
};

const speakerIdForName = (speaker?: string) => {
  if (!speaker) return "narrator";
  if (speaker === "ミミ") return "mimi";
  return `legacy.speaker.${stableHash(speaker)}`;
};

const actorIdForSprite = (
  sprite: SceneSpriteCue,
  characterId?: string,
) => characterId ?? `legacy.actor.${stableHash(sprite.asset)}`;

const effectTarget = (characterId?: string) =>
  characterId
    ? ({ type: "fighter", fighterId: characterId } as const)
    : ({ type: "available-roster" } as const);

const effectsForChoice = (
  choice: SceneChoice,
  characterId?: string,
  stage?: string,
): NarrativeEffect[] => {
  const effects: NarrativeEffect[] = [];
  if (choice.trust !== 0 || choice.ownership !== 0) {
    effects.push({
      type: "relationship",
      target: effectTarget(characterId),
      mode: "add",
      trust: choice.trust,
      ownership: choice.ownership,
    });
  }
  if (choice.money) effects.push({ type: "money", amount: choice.money });
  if (choice.sharedPoints) {
    effects.push({ type: "sharedPoints", amount: choice.sharedPoints });
  }
  if (choice.fighterPoints) {
    effects.push({
      type: "fighterPoints",
      target: effectTarget(characterId),
      amount: choice.fighterPoints,
    });
  }
  if (choice.condition) {
    effects.push({
      type: "setCondition",
      target: effectTarget(characterId),
      condition: choice.condition,
    });
  }
  if (choice.recruitmentDecision && stage === "join") {
    if (!characterId) {
      throw new Error("Recruitment choices require a characterId.");
    }
    effects.push({
      type: "recruitmentDecision",
      fighterId: characterId,
      decision: choice.recruitmentDecision,
    });
  }
  if (choice.liberationDecision && stage === "liberation") {
    if (!characterId) {
      throw new Error("Liberation choices require a characterId.");
    }
    effects.push({
      type: "liberationDecision",
      fighterId: characterId,
      decision: choice.liberationDecision,
    });
  }
  return effects;
};

export const adaptLegacyScene = (
  scene: CharacterScene,
  options: LegacySceneAdapterOptions,
): NarrativeEventBlock => {
  const assets = new Map<
    string,
    {
      id: ReturnType<typeof assetIdForPath>;
      kind: "background" | "sprite" | "still";
      path: string;
      alt: string;
    }
  >();
  const nodes: Array<Record<string, unknown>> = [];
  let directionIndex = 0;

  const registerAsset = (
    path: string,
    kind: "background" | "sprite" | "still",
    alt: string,
  ) => {
    const id = assetIdForPath(path);
    const current = assets.get(id);
    if (current && (current.path !== path || current.kind !== kind)) {
      throw new Error(`Legacy asset ID collision: ${id}`);
    }
    assets.set(id, { id, kind, path, alt });
    return id;
  };

  const addDirection = (
    command: Record<string, unknown>,
    hint: string,
  ) => {
    directionIndex += 1;
    nodes.push({
      type: "direction",
      id: `${scene.id}.direction.legacy-${directionIndex}-${hint}`,
      command,
    });
  };

  const addSprite = (sprite: SceneSpriteCue) => {
    const assetId = registerAsset(sprite.asset, "sprite", sprite.alt);
    addDirection(
      {
        type: "show",
        assetId,
        actorId: actorIdForSprite(sprite, options.characterId),
        slot: sprite.position ?? "center",
        scale: sprite.scale ?? "standard",
      },
      "sprite",
    );
  };

  const addDirectionSet = (direction: SceneDirection) => {
    if (direction.background) {
      const assetId = registerAsset(
        direction.background,
        "background",
        `${scene.location}の背景`,
      );
      addDirection(
        { type: "background", assetId, transition: "dissolve" },
        "background",
      );
    }
    if (direction.sprite === null) {
      addDirection({ type: "clearSprites" }, "clear-sprites");
    } else if (direction.sprite) {
      addSprite(direction.sprite);
    }
    if (direction.still) {
      const assetId = registerAsset(
        direction.still,
        "still",
        `${scene.title}のイベント一枚絵`,
      );
      addDirection({ type: "still", assetId }, "still");
    }
    if (direction.effect) {
      addDirection(
        { type: "effect", effectId: direction.effect },
        "effect",
      );
    }
  };

  if (scene.background) {
    addDirectionSet({ background: scene.background });
  }
  if (scene.sprite === null) {
    addDirection({ type: "clearSprites" }, "initial-clear-sprites");
  } else if (scene.sprite) {
    addSprite(scene.sprite);
  }

  scene.lines.forEach((line, index) => {
    if (line.direction) addDirectionSet(line.direction);
    nodes.push({
      type: "line",
      id: `${scene.id}.line.legacy-${index + 1}`,
      lineId: `${scene.id}.text.legacy-${index + 1}`,
      speakerId: speakerIdForName(line.speaker),
      ...(line.speaker ? { speakerName: line.speaker } : {}),
      mode:
        line.kind === "thought"
          ? "thought"
          : line.speaker
            ? "dialogue"
            : "narration",
      text: line.text,
      ...(line.beat ? { emotion: line.beat } : {}),
    });
  });

  const endNodeId = `${scene.id}.end`;
  const completionNodeId = options.completionEffects?.length
    ? `${scene.id}.completion-effects`
    : endNodeId;
  if (scene.choices?.length) {
    nodes.push({
      type: "choice",
      id: `${scene.id}.choices`,
      choices: scene.choices.map((choice, index) => ({
        id: `${scene.id}.choice.legacy-${index + 1}`,
        label: choice.label,
        result: choice.result,
        ...(choice.outcomeHeadline
          ? { outcomeHeadline: choice.outcomeHeadline }
          : {}),
        ...(choice.intent ? { intent: choice.intent } : {}),
        ...(choice.promise ? { promise: choice.promise } : {}),
        ...(choice.memory ? { memory: choice.memory } : {}),
        ...(choice.tone ? { tone: choice.tone } : {}),
        effects: effectsForChoice(
          choice,
          options.characterId,
          options.stage,
        ),
        goto: completionNodeId,
      })),
    });
  }
  if (options.completionEffects?.length) {
    nodes.push({
      type: "effect",
      id: completionNodeId,
      effects: options.completionEffects,
    });
  }
  nodes.push({ type: "end", id: endNodeId, mode: "return-to-week" });

  return narrativeEventBlockSchema.parse({
    schemaVersion: 1,
    id: scene.id,
    kind: options.kind,
    title: scene.title,
    summary: `${scene.location}で起きる「${scene.title}」`,
    ownership: {
      arcId: options.arcId,
      ...(options.characterId ? { characterId: options.characterId } : {}),
      ...(options.stage ? { stage: options.stage } : {}),
    },
    trigger: {
      actions: scene.actions,
      ...(options.routes ? { routes: options.routes } : {}),
      when: { all: [], any: [], none: [] },
      repeat: options.repeat ?? { mode: "once-per-run" },
      priority: options.priority ?? 100,
      weight: options.weight ?? 1,
    },
    presentation: {
      location: scene.location,
      assets: [...assets.values()],
    },
    nodes,
    debug: {
      status: options.status ?? "approved",
      sourceDocument: "legacy CharacterScene",
      authorNote:
        "行IDと選択肢IDは互換変換で生成された仮ID。本文移行時に意味のある永続IDへ置き換える。",
      legacyGeneratedIds: true,
    },
  });
};
