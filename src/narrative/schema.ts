import { z } from "zod";

const identifier = z
  .string()
  .min(1)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);

export const eventIdSchema = identifier.brand<"EventId">();
export const nodeIdSchema = identifier.brand<"NodeId">();
export const choiceIdSchema = identifier.brand<"ChoiceId">();
export const lineIdSchema = identifier.brand<"LineId">();
export const flagIdSchema = identifier.brand<"FlagId">();
export const assetIdSchema = identifier.brand<"AssetId">();

export const weeklyActionSchema = z.enum(["work", "play", "rest", "search"]);
export const routeIdSchema = z.enum(["normal", "domination", "chaos"]);
export const comparisonSchema = z.enum([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "includes",
]);

export const conditionAtomSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("flag"),
    flagId: flagIdSchema,
    comparison: comparisonSchema.default("eq"),
    value: z.union([z.boolean(), z.number(), z.string()]),
  }),
  z.object({
    type: z.literal("visited"),
    eventId: eventIdSchema,
    comparison: comparisonSchema.default("gte"),
    count: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("fact"),
    path: z
      .string()
      .regex(
        /^(run\.(week|route|wins|losses|money|ownershipStage)|fighter\.[a-z0-9-]+\.(encountered|recruited|liberated|trust|ownership|storyStage))$/,
      ),
    comparison: comparisonSchema,
    value: z.union([z.boolean(), z.number(), z.string()]),
  }),
]);

export const conditionSetSchema = z.object({
  all: z.array(conditionAtomSchema).default([]),
  any: z.array(conditionAtomSchema).default([]),
  none: z.array(conditionAtomSchema).default([]),
});

export const repeatRuleSchema = z
  .object({
    mode: z.enum([
      "once-per-run",
      "once-per-profile",
      "repeatable",
      "cooldown",
    ]),
    maxCount: z.number().int().positive().optional(),
    cooldownWeeks: z.number().int().positive().optional(),
  })
  .superRefine((rule, context) => {
    if (rule.mode === "cooldown" && !rule.cooldownWeeks) {
      context.addIssue({
        code: "custom",
        path: ["cooldownWeeks"],
        message: "cooldown events require cooldownWeeks",
      });
    }
  });

export const eventTriggerSchema = z.object({
  actions: z.array(weeklyActionSchema).min(1).optional(),
  routes: z.array(routeIdSchema).min(1).optional(),
  week: z
    .object({
      exact: z.array(z.number().int().min(1).max(99)).min(1).optional(),
      min: z.number().int().min(1).max(99).optional(),
      max: z.number().int().min(1).max(99).optional(),
    })
    .optional(),
  when: conditionSetSchema.default({ all: [], any: [], none: [] }),
  repeat: repeatRuleSchema,
  priority: z.number().int().min(0).max(1000),
  weight: z.number().positive(),
});

export const assetReferenceSchema = z.object({
  id: assetIdSchema,
  kind: z.enum(["background", "sprite", "still", "music", "sound"]),
  path: z.string().regex(/^\/assets\//),
  alt: z.string(),
  focusX: z.number().min(0).max(100).optional(),
  focusY: z.number().min(0).max(100).optional(),
  gallery: z
    .object({
      title: z.string().min(1),
      chapter: z.string().min(1),
      caption: z.string().min(1),
      unlock: z.enum(["on-view", "on-event-complete", "on-choice"]),
      /** Required for branch-specific memories so an unchosen CG stays locked. */
      choiceId: choiceIdSchema.optional(),
    })
    .optional(),
});

export const directionCommandSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("background"),
    assetId: assetIdSchema,
    transition: z.enum(["none", "dissolve", "flash"]).default("dissolve"),
  }),
  z.object({
    type: z.literal("show"),
    assetId: assetIdSchema,
    actorId: identifier.optional(),
    slot: z.enum(["left", "center", "right"]).default("center"),
    scale: z.enum(["compact", "standard", "tall"]).default("standard"),
  }),
  z.object({
    type: z.literal("hide"),
    actorId: identifier,
  }),
  z.object({
    type: z.literal("clearSprites"),
  }),
  z.object({
    type: z.literal("still"),
    assetId: assetIdSchema,
    unlockId: identifier.optional(),
  }),
  z.object({
    type: z.literal("effect"),
    effectId: z.enum(["pulse", "shake", "flash"]),
  }),
  z.object({
    type: z.literal("music"),
    assetId: assetIdSchema,
  }),
  z.object({
    type: z.literal("sound"),
    assetId: assetIdSchema,
  }),
]);

export const narrativeEffectSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("setFlag"),
    flagId: flagIdSchema,
    value: z.union([z.boolean(), z.number(), z.string()]),
  }),
  z.object({
    type: z.literal("incrementFlag"),
    flagId: flagIdSchema,
    amount: z.number(),
  }),
  z.object({
    type: z.literal("relationship"),
    target: z.union([
      z.object({ type: z.literal("fighter"), fighterId: identifier }),
      z.object({ type: z.literal("available-roster") }),
    ]),
    mode: z.enum(["add", "set"]).default("add"),
    trust: z.number().optional(),
    ownership: z.number().optional(),
  }),
  z.object({
    type: z.literal("money"),
    amount: z.number(),
  }),
  z.object({
    type: z.literal("sharedPoints"),
    amount: z.number(),
  }),
  z.object({
    type: z.literal("fighterPoints"),
    target: z.union([
      z.object({ type: z.literal("fighter"), fighterId: identifier }),
      z.object({ type: z.literal("available-roster") }),
    ]),
    amount: z.number(),
  }),
  z.object({
    type: z.literal("setCondition"),
    target: z.union([
      z.object({ type: z.literal("fighter"), fighterId: identifier }),
      z.object({ type: z.literal("available-roster") }),
    ]),
    condition: z.enum(["good", "normal", "bad"]),
  }),
  z.object({
    type: z.literal("recruitmentDecision"),
    fighterId: identifier,
    decision: z.enum(["join", "defer", "decline"]),
  }),
  z.object({
    type: z.literal("markEncountered"),
    fighterId: identifier,
    encountered: z.boolean(),
  }),
  z.object({
    type: z.literal("setStoryStage"),
    fighterId: identifier,
    stage: z.number().int().min(0),
  }),
  z.object({
    type: z.literal("setLiberationEligible"),
    fighterId: identifier,
    eligible: z.boolean(),
  }),
  z.object({
    type: z.literal("setLiberated"),
    fighterId: identifier,
    liberated: z.boolean(),
  }),
  z.object({
    type: z.literal("liberationDecision"),
    fighterId: identifier,
    decision: z.enum(["release", "retain"]),
  }),
  z.object({
    type: z.literal("schedule"),
    eventId: eventIdSchema,
    weekOffset: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal("setOwnershipStage"),
    stage: z.enum(["employee", "provisional", "owner"]),
  }),
  z.object({
    type: z.literal("setArenaRank"),
    rank: z.enum(["unranked", "provisional", "highest"]),
  }),
  z.object({
    type: z.literal("unlockGallery"),
    galleryId: identifier,
  }),
]);

const lineNodeSchema = z.object({
  type: z.literal("line"),
  id: nodeIdSchema,
  lineId: lineIdSchema,
  speakerId: identifier,
  speakerName: z.string().optional(),
  mode: z.enum(["dialogue", "thought", "narration"]),
  text: z.string().min(1),
  emotion: z
    .enum(["comic", "tension", "tender", "revelation", "resolve"])
    .optional(),
});

const directionNodeSchema = z.object({
  type: z.literal("direction"),
  id: nodeIdSchema,
  command: directionCommandSchema,
});

const effectNodeSchema = z.object({
  type: z.literal("effect"),
  id: nodeIdSchema,
  effects: z.array(narrativeEffectSchema).min(1),
});

const jumpNodeSchema = z.object({
  type: z.literal("jump"),
  id: nodeIdSchema,
  target: identifier,
});

const choiceSchema = z.object({
  id: choiceIdSchema,
  label: z.string().min(1),
  result: z.string().min(1),
  outcomeHeadline: z.string().min(1).optional(),
  intent: z.string().min(1).optional(),
  promise: z.string().min(1).optional(),
  memory: z.string().min(1).optional(),
  outcomeAssetId: assetIdSchema.optional(),
  tone: z
    .enum(["comic", "heroic", "tender", "defiant", "wild", "pragmatic"])
    .optional(),
  when: conditionSetSchema.optional(),
  effects: z.array(narrativeEffectSchema),
  goto: identifier,
});

const choiceNodeSchema = z.object({
  type: z.literal("choice"),
  id: nodeIdSchema,
  prompt: z.string().min(1).optional(),
  choices: z.array(choiceSchema).min(2),
});

const endNodeSchema = z.object({
  type: z.literal("end"),
  id: nodeIdSchema,
  mode: z.enum(["return-to-week", "immediate", "ending"]),
});

export const narrativeNodeSchema = z.discriminatedUnion("type", [
  lineNodeSchema,
  directionNodeSchema,
  effectNodeSchema,
  jumpNodeSchema,
  choiceNodeSchema,
  endNodeSchema,
]);

export const narrativeEventBlockSchema = z.object({
  schemaVersion: z.literal(1),
  id: eventIdSchema,
  kind: z.enum([
    "opening",
    "common",
    "character",
    "ambient",
    "route",
    "match",
    "liberation",
    "ending",
  ]),
  title: z.string().min(1),
  summary: z.string().min(1),
  ownership: z.object({
    arcId: identifier,
    characterId: identifier.optional(),
    stage: identifier.optional(),
  }),
  trigger: eventTriggerSchema,
  presentation: z.object({
    location: z.string().min(1),
    assets: z.array(assetReferenceSchema),
  }),
  nodes: z.array(narrativeNodeSchema).min(1),
  debug: z.object({
    status: z.enum(["draft", "review", "approved"]),
    sourceDocument: z.string().optional(),
    authorNote: z.string().optional(),
    legacyGeneratedIds: z.boolean().default(false),
  }),
});

export type NarrativeEventId = z.infer<typeof eventIdSchema>;
export type NarrativeNodeId = z.infer<typeof nodeIdSchema>;
export type NarrativeFlagId = z.infer<typeof flagIdSchema>;

// 旧データ由来の素の文字列IDを branded ID の索引で照合するための境界専用キャスト。
// 実在検証は content 監査とテストが担うため、ここでは型変換のみ行う。
export const asEventId = (value: string): NarrativeEventId =>
  value as NarrativeEventId;
export const asNodeId = (value: string): NarrativeNodeId =>
  value as NarrativeNodeId;
export const asFlagId = (value: string): NarrativeFlagId =>
  value as NarrativeFlagId;

export type ConditionAtom = z.infer<typeof conditionAtomSchema>;
export type ConditionSet = z.infer<typeof conditionSetSchema>;
export type NarrativeEffect = z.infer<typeof narrativeEffectSchema>;
export type NarrativeNode = z.infer<typeof narrativeNodeSchema>;
export type NarrativeEventBlock = z.infer<typeof narrativeEventBlockSchema>;
export type NarrativeAssetReference = z.infer<typeof assetReferenceSchema>;
