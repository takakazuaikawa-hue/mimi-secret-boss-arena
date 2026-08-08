import type { z } from "zod";
import { flagIdSchema } from "../schema";

type FlagId = z.infer<typeof flagIdSchema>;

export interface FlagDefinition {
  id: FlagId;
  scope: "run" | "profile";
  type: "boolean" | "counter" | "enum" | "string";
  defaultValue: boolean | number | string;
  description: string;
  owner: string;
  allowedValues?: string[];
  legacyAliases?: string[];
}

export const flagDefinitions: FlagDefinition[] = [
  {
    id: flagIdSchema.parse("opening.owner-transfer.completed"),
    scope: "run",
    type: "boolean",
    defaultValue: false,
    description: "誤登録による暫定オーナー移譲イベントを完了した",
    owner: "opening",
    legacyAliases: ["opening:owner-transfer-complete"],
  },
  {
    id: flagIdSchema.parse("opening.cup.champion"),
    scope: "run",
    type: "boolean",
    defaultValue: false,
    description: "新人所有者歓迎杯で優勝した",
    owner: "opening",
    legacyAliases: ["opening-cup:champion"],
  },
  {
    id: flagIdSchema.parse("arena.rank.highest"),
    scope: "run",
    type: "boolean",
    defaultValue: false,
    description: "闘技場ランクが最上級へ到達した",
    owner: "arena",
    legacyAliases: ["rank:highest"],
  },
];

export const flagDefinitionById = new Map(
  flagDefinitions.map((definition) => [definition.id, definition]),
);

export const legacyFlagAliasToId = new Map(
  flagDefinitions.flatMap((definition) =>
    (definition.legacyAliases ?? []).map((alias) => [alias, definition.id] as const),
  ),
);
