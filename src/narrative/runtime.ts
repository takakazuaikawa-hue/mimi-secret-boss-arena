import type {
  CharacterScene,
  DialogueLine,
  RunState,
  SceneChoice,
  SceneDirection,
  SceneSpriteCue,
  WeeklyAction,
  WeeklyEvent,
} from "../game/types";
import { legacyFlagAliasToId, flagDefinitionById } from "./registry/flags";
import { asFlagId, asNodeId } from "./schema";
import type {
  NarrativeEffect,
  NarrativeEventBlock,
  NarrativeNode,
} from "./schema";

type ChoiceNode = Extract<NarrativeNode, { type: "choice" }>;
export type NarrativeChoice = ChoiceNode["choices"][number];

const clampRelationship = (value: number) =>
  Math.max(0, Math.min(100, value));

const addUnique = (values: string[], value: string) =>
  values.includes(value) ? values : [...values, value];

const removeFlagValue = (flags: string[], flagId: string) =>
  flags.filter(
    (entry) =>
      entry !== flagId &&
      !entry.startsWith(`${flagId}:`) &&
      legacyFlagAliasToId.get(entry) !== flagId,
  );

const setFlagValue = (
  flags: string[],
  flagId: string,
  value: boolean | number | string,
) => {
  let next = removeFlagValue(flags, flagId);
  if (value === false) return next;

  const encoded = value === true ? flagId : `${flagId}:${String(value)}`;
  next = addUnique(next, encoded);
  const aliases = flagDefinitionById.get(asFlagId(flagId))?.legacyAliases ?? [];
  aliases.forEach((alias) => {
    if (value === true) next = addUnique(next, alias);
  });
  return next;
};

const readNumericFlag = (flags: string[], flagId: string) => {
  const entry = flags.find((candidate) =>
    candidate.startsWith(`${flagId}:`),
  );
  if (!entry) return 0;
  const value = Number(entry.slice(flagId.length + 1));
  return Number.isFinite(value) ? value : 0;
};

const targetFighterIds = (
  run: RunState,
  target: Extract<
    NarrativeEffect,
    { type: "relationship" | "fighterPoints" | "setCondition" }
  >["target"],
) =>
  target.type === "fighter"
    ? run.fighters[target.fighterId]
      ? [target.fighterId]
      : []
    : run.roster.filter((fighterId) => Boolean(run.fighters[fighterId]));

const applyEffect = (source: RunState, effect: NarrativeEffect): RunState => {
  const run: RunState = {
    ...source,
    fighters: { ...source.fighters },
    roster: [...source.roster],
    activeTeam: [...source.activeTeam],
    flags: [...source.flags],
  };

  switch (effect.type) {
    case "setFlag":
      run.flags = setFlagValue(run.flags, effect.flagId, effect.value);
      return run;
    case "incrementFlag": {
      const current = readNumericFlag(run.flags, effect.flagId);
      run.flags = setFlagValue(
        run.flags,
        effect.flagId,
        current + effect.amount,
      );
      return run;
    }
    case "money":
      run.money = Math.max(0, run.money + effect.amount);
      return run;
    case "sharedPoints":
      run.sharedPoints = Math.max(0, run.sharedPoints + effect.amount);
      return run;
    case "setOwnershipStage":
      run.ownershipStage = effect.stage;
      return run;
    case "setArenaRank":
      run.arenaRank = effect.rank;
      return run;
    case "relationship":
      targetFighterIds(run, effect.target).forEach((fighterId) => {
        const fighter = { ...run.fighters[fighterId] };
        if (effect.trust !== undefined) {
          fighter.trust =
            effect.mode === "set"
              ? clampRelationship(effect.trust)
              : clampRelationship(fighter.trust + effect.trust);
        }
        if (effect.ownership !== undefined) {
          fighter.ownership =
            effect.mode === "set"
              ? clampRelationship(effect.ownership)
              : clampRelationship(fighter.ownership + effect.ownership);
        }
        run.fighters[fighterId] = fighter;
      });
      return run;
    case "fighterPoints":
      targetFighterIds(run, effect.target).forEach((fighterId) => {
        const fighter = { ...run.fighters[fighterId] };
        fighter.fighterPoints = Math.max(
          0,
          fighter.fighterPoints + effect.amount,
        );
        run.fighters[fighterId] = fighter;
      });
      return run;
    case "setCondition":
      targetFighterIds(run, effect.target).forEach((fighterId) => {
        run.fighters[fighterId] = {
          ...run.fighters[fighterId],
          condition: effect.condition,
        };
      });
      return run;
    case "markEncountered":
      if (run.fighters[effect.fighterId]) {
        run.fighters[effect.fighterId] = {
          ...run.fighters[effect.fighterId],
          encountered: effect.encountered,
        };
      }
      return run;
    case "setStoryStage":
      if (run.fighters[effect.fighterId]) {
        run.fighters[effect.fighterId] = {
          ...run.fighters[effect.fighterId],
          storyStage: effect.stage,
        };
      }
      return run;
    case "setLiberationEligible":
      if (run.fighters[effect.fighterId]) {
        run.fighters[effect.fighterId] = {
          ...run.fighters[effect.fighterId],
          liberationEligible: effect.eligible,
        };
      }
      return run;
    case "setLiberated":
      if (run.fighters[effect.fighterId]) {
        run.fighters[effect.fighterId] = {
          ...run.fighters[effect.fighterId],
          liberated: effect.liberated,
          ...(effect.liberated
            ? { liberationMisses: 0, contractDecision: "released" as const }
            : {}),
        };
      }
      return run;
    case "liberationDecision":
      if (run.fighters[effect.fighterId]) {
        run.fighters[effect.fighterId] = {
          ...run.fighters[effect.fighterId],
          contractDecision:
            effect.decision === "release" ? "released" : "retained",
        };
      }
      return run;
    case "recruitmentDecision": {
      const fighter = run.fighters[effect.fighterId];
      if (!fighter) return run;
      if (effect.decision === "decline") {
        run.flags = addUnique(
          run.flags,
          `recruitment-declined:${effect.fighterId}`,
        );
        run.fighters[effect.fighterId] = {
          ...fighter,
          recruited: false,
          storyStage: 1,
        };
        return run;
      }
      run.fighters[effect.fighterId] = {
        ...fighter,
        recruited: true,
        storyStage: Math.max(2, fighter.storyStage + 1),
      };
      run.roster = addUnique(run.roster, effect.fighterId);
      if (run.activeTeam.length < 3) {
        run.activeTeam = addUnique(run.activeTeam, effect.fighterId);
      }
      return run;
    }
    case "schedule":
      run.flags = addUnique(
        run.flags,
        `scheduled-event:${effect.eventId}:${effect.weekOffset ?? 0}`,
      );
      return run;
    case "unlockGallery":
      run.flags = addUnique(run.flags, `gallery-unlock:${effect.galleryId}`);
      return run;
  }
};

export const applyNarrativeEffects = (
  source: RunState,
  effects: readonly NarrativeEffect[],
) => effects.reduce(applyEffect, source);

const assetPath = (
  block: NarrativeEventBlock,
  assetId: string,
  expectedKind?: "background" | "sprite" | "still",
) => {
  const asset = block.presentation.assets.find((entry) => entry.id === assetId);
  if (!asset || (expectedKind && asset.kind !== expectedKind)) {
    throw new Error(
      `Narrative asset ${assetId} is missing or has the wrong kind in ${block.id}.`,
    );
  }
  return asset.path;
};

const legacyChoiceFromNarrative = (choice: NarrativeChoice): SceneChoice => {
  const relationshipEffects = choice.effects.filter(
    (
      effect,
    ): effect is Extract<NarrativeEffect, { type: "relationship" }> =>
      effect.type === "relationship" && effect.mode === "add",
  );
  const amountFor = (type: NarrativeEffect["type"]) =>
    choice.effects
      .filter((effect) => effect.type === type)
      .reduce(
        (sum, effect) =>
          sum +
          ("amount" in effect && typeof effect.amount === "number"
            ? effect.amount
            : 0),
        0,
      );

  return {
    label: choice.label,
    result: choice.result,
    trust: relationshipEffects.reduce(
      (sum, effect) => sum + (effect.trust ?? 0),
      0,
    ),
    ownership: relationshipEffects.reduce(
      (sum, effect) => sum + (effect.ownership ?? 0),
      0,
    ),
    money: amountFor("money"),
    sharedPoints: amountFor("sharedPoints"),
    fighterPoints: amountFor("fighterPoints"),
    condition: choice.effects.find(
      (
        effect,
      ): effect is Extract<NarrativeEffect, { type: "setCondition" }> =>
        effect.type === "setCondition",
    )?.condition,
    recruitmentDecision: choice.effects.find(
      (
        effect,
      ): effect is Extract<
        NarrativeEffect,
        { type: "recruitmentDecision" }
      > => effect.type === "recruitmentDecision",
    )?.decision,
    liberationDecision: choice.effects.find(
      (
        effect,
      ): effect is Extract<NarrativeEffect, { type: "liberationDecision" }> =>
        effect.type === "liberationDecision",
    )?.decision,
    tone: choice.tone,
    intent: choice.intent,
    promise: choice.promise,
    memory: choice.memory,
  };
};

export const materializeNarrativeBlock = (
  block: NarrativeEventBlock,
): CharacterScene => {
  const lines: DialogueLine[] = [];
  const choices: SceneChoice[] = [];
  let background: string | undefined;
  let sprite: SceneSpriteCue | null | undefined;
  let pendingDirection: SceneDirection = {};

  const hasPendingDirection = () =>
    Object.keys(pendingDirection).length > 0;

  block.nodes.forEach((node) => {
    if (node.type === "direction") {
      const command = node.command;
      if (command.type === "background") {
        const path = assetPath(block, command.assetId, "background");
        if (lines.length === 0 && background === undefined) background = path;
        else pendingDirection.background = path;
      } else if (command.type === "show") {
        const asset = block.presentation.assets.find(
          (entry) => entry.id === command.assetId,
        );
        const nextSprite: SceneSpriteCue = {
          asset: assetPath(block, command.assetId, "sprite"),
          alt: asset?.alt ?? "",
          position: command.slot,
          scale: command.scale,
        };
        if (lines.length === 0 && sprite === undefined) sprite = nextSprite;
        else pendingDirection.sprite = nextSprite;
      } else if (command.type === "hide" || command.type === "clearSprites") {
        if (lines.length === 0 && sprite === undefined) sprite = null;
        else pendingDirection.sprite = null;
      } else if (command.type === "still") {
        pendingDirection.still = assetPath(block, command.assetId, "still");
      } else if (command.type === "effect") {
        pendingDirection.effect = command.effectId;
      }
      return;
    }

    if (node.type === "line") {
      lines.push({
        ...(node.speakerName ? { speaker: node.speakerName } : {}),
        text: node.text,
        ...(node.mode === "thought" ? { kind: "thought" as const } : {}),
        ...(node.emotion ? { beat: node.emotion } : {}),
        ...(hasPendingDirection() ? { direction: pendingDirection } : {}),
      });
      pendingDirection = {};
      return;
    }

    if (node.type === "choice") {
      choices.push(...node.choices.map(legacyChoiceFromNarrative));
    }
  });

  if (hasPendingDirection() && lines.length > 0) {
    lines[lines.length - 1] = {
      ...lines[lines.length - 1],
      direction: {
        ...lines[lines.length - 1].direction,
        ...pendingDirection,
      },
    };
  }

  return {
    id: block.id,
    title: block.title,
    location: block.presentation.location,
    actions: block.trigger.actions ?? ["work", "play", "rest", "search"],
    lines,
    ...(background ? { background } : {}),
    ...(sprite !== undefined ? { sprite } : {}),
    ...(choices.length > 0 ? { choices } : {}),
  };
};

export const weeklyEventFromNarrativeBlock = (
  block: NarrativeEventBlock,
  action: WeeklyAction,
  fighterId?: string,
  isRare = false,
): WeeklyEvent => ({
  id: `${block.id}:week`,
  title: block.title,
  location: block.presentation.location,
  action,
  ...(fighterId ? { fighterId } : {}),
  scene: materializeNarrativeBlock(block),
  isRare,
  narrativeBlockId: block.id,
});

export const resolveNarrativeBlock = (
  source: RunState,
  block: NarrativeEventBlock,
  choiceIndex = 0,
) => {
  const nodeIndexById = new Map(
    block.nodes.map((node, index) => [node.id, index]),
  );
  let run = source;
  let selectedChoice: NarrativeChoice | undefined;
  let index = 0;
  let steps = 0;

  while (index >= 0 && index < block.nodes.length) {
    steps += 1;
    if (steps > block.nodes.length * 4) {
      throw new Error(`Narrative flow appears cyclic: ${block.id}`);
    }
    const node = block.nodes[index];
    if (node.type === "end") break;
    if (node.type === "effect") {
      run = applyNarrativeEffects(run, node.effects);
      index += 1;
      continue;
    }
    if (node.type === "jump") {
      const targetIndex = nodeIndexById.get(asNodeId(node.target));
      if (targetIndex === undefined) {
        throw new Error(
          `Cross-event jump ${node.target} requires the event scheduler.`,
        );
      }
      index = targetIndex;
      continue;
    }
    if (node.type === "choice") {
      selectedChoice = node.choices[choiceIndex];
      if (!selectedChoice) {
        throw new Error(
          `Choice ${choiceIndex} does not exist in narrative block ${block.id}.`,
        );
      }
      run = applyNarrativeEffects(run, selectedChoice.effects);
      const targetIndex = nodeIndexById.get(asNodeId(selectedChoice.goto));
      if (targetIndex === undefined) {
        throw new Error(
          `Cross-event choice target ${selectedChoice.goto} requires the event scheduler.`,
        );
      }
      index = targetIndex;
      continue;
    }
    index += 1;
  }

  return { run, selectedChoice };
};
