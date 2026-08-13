import { z } from "zod";
import { ambientEvents } from "../data/ambientEvents";
import { fighterDefinitions } from "../data/characters";
import { officialMatches } from "../data/matches";

const statSchema = z.object({
  hp: z.number().int().min(1).max(999),
  mp: z.number().int().min(0).max(999),
  attack: z.number().int().min(1).max(999),
  defense: z.number().int().min(1).max(999),
  magic: z.number().int().min(1).max(999),
  speed: z.number().int().min(1).max(999),
});

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["damage", "heal", "guard", "buff", "debuff"]),
  target: z.enum(["enemy", "ally", "allEnemies", "allAllies", "self"]),
  element: z.enum(["neutral", "flame", "tide", "gale", "star"]),
  power: z.number().min(0).max(200),
  mpCost: z.number().int().min(0).max(99),
  note: z.string().min(1),
  mechanics: z
    .object({
      defensePierce: z.number().min(0).max(0.8).optional(),
      attackBuff: z.number().min(0).max(0.5).optional(),
      magicBuff: z.number().min(0).max(0.5).optional(),
      defenseBuff: z.number().min(0).max(0.5).optional(),
      speedBuff: z.number().min(0).max(0.5).optional(),
      evasionBuff: z.number().min(0).max(0.5).optional(),
      attackDebuff: z.number().min(0).max(0.5).optional(),
      magicDebuff: z.number().min(0).max(0.5).optional(),
      defenseDebuff: z.number().min(0).max(0.5).optional(),
      speedDebuff: z.number().min(0).max(0.5).optional(),
      barrier: z.number().min(0).max(200).optional(),
      criticalBonus: z.number().min(0).max(0.5).optional(),
    })
    .optional(),
});

const choiceSchema = z.object({
  label: z.string().min(1),
  result: z.string().min(1),
  outcomeHeadline: z.string().min(1).optional(),
  trust: z.number().min(-100).max(100),
  ownership: z.number().min(-100).max(100),
  money: z.number().optional(),
  sharedPoints: z.number().optional(),
  fighterPoints: z.number().optional(),
  condition: z.enum(["good", "normal", "bad"]).optional(),
  liberationDecision: z.enum(["release", "retain"]).optional(),
  recruitmentDecision: z.enum(["join", "defer", "decline"]).optional(),
  tone: z
    .enum(["comic", "heroic", "tender", "defiant", "wild", "pragmatic"])
    .optional(),
  intent: z.string().min(1).optional(),
  promise: z.string().min(1).optional(),
  memory: z.string().min(1).optional(),
  outcomeVisual: z
    .object({
      src: z.string().regex(/^\/assets\//),
      alt: z.string().min(1),
      focusX: z.number().min(0).max(100).optional(),
      focusY: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

const spriteSchema = z.object({
  asset: z.string().min(1),
  alt: z.string(),
  position: z.enum(["left", "center", "right"]).optional(),
  scale: z.enum(["compact", "standard", "tall"]).optional(),
});

const directionSchema = z.object({
  background: z.string().min(1).optional(),
  sprite: spriteSchema.nullable().optional(),
  still: z.string().min(1).optional(),
  effect: z.enum(["pulse", "shake", "flash"]).optional(),
});

const sceneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  location: z.string().min(1),
  actions: z
    .array(z.enum(["work", "play", "rest", "search"]))
    .min(1),
  lines: z
    .array(
      z.object({
        speaker: z.string().min(1).optional(),
        text: z.string().min(1),
        kind: z.enum(["dialogue", "thought"]).optional(),
        beat: z
          .enum(["comic", "tension", "tender", "revelation", "resolve"])
          .optional(),
        cue: z.string().min(1).optional(),
        direction: directionSchema.optional(),
      }),
    )
    .min(1),
  background: z.string().min(1).optional(),
  sprite: spriteSchema.nullable().optional(),
  choices: z.array(choiceSchema).min(2).max(3).optional(),
});

const fighterSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  kind: z.string().min(1),
  role: z.enum(["万能", "攻撃", "守備", "支援", "妨害", "速攻"]),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
  summary: z.string().min(10),
  currentLimit: z.string().min(5),
  traitName: z.string().min(1),
  traitText: z.string().min(5),
  ai: z.enum(["aggressive", "steady", "careful", "tricky"]),
  strong: z.enum(["neutral", "flame", "tide", "gale", "star"]),
  weak: z.enum(["neutral", "flame", "tide", "gale", "star"]),
  stats: statSchema,
  skills: z.tuple([skillSchema, skillSchema, skillSchema, skillSchema]),
  scenes: z.object({
    meet: sceneSchema,
    join: sceneSchema,
    bond: sceneSchema,
    power: sceneSchema,
    crisis: sceneSchema,
    liberation: sceneSchema,
    epilogue: sceneSchema,
  }),
});

export const validateContent = () => {
  const fighters = z.array(fighterSchema).length(15).parse(fighterDefinitions);
  const ids = new Set(fighters.map((fighter) => fighter.id));
  if (ids.size !== fighters.length) {
    throw new Error("Fighter IDs must be unique.");
  }
  const skillIds = fighters.flatMap((fighter) =>
    fighter.skills.map((skill) => skill.id),
  );
  if (new Set(skillIds).size !== skillIds.length) {
    throw new Error("Skill IDs must be unique.");
  }
  fighters.forEach((fighter) => {
    if (fighter.strong === fighter.weak) {
      throw new Error(`Strong and weak elements conflict: ${fighter.id}`);
    }
  });

  officialMatches.forEach((match) => {
    if (match.week < 1 || match.week > 26) {
      throw new Error(`Match week is outside the campaign: ${match.id}`);
    }
  });

  Object.values(ambientEvents)
    .flat()
    .forEach((event) => sceneSchema.parse(event));

  return true;
};
