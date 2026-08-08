import { ambientEvents } from "../data/ambientEvents";
import { routeEvents } from "../data/routeEvents";
import { adaptLegacyScene } from "./legacySceneAdapter";
import type { NarrativeEventBlock } from "./schema";

export const legacyAmbientNarrativeBlocks: NarrativeEventBlock[] =
  Object.entries(ambientEvents).flatMap(([action, scenes]) =>
    scenes.map((scene) =>
      adaptLegacyScene(scene, {
        kind: "ambient",
        arcId: `ambient.${action}`,
        repeat: { mode: "repeatable" },
        priority: 100,
      }),
    ),
  );

export const legacyRouteNarrativeBlocks: NarrativeEventBlock[] =
  Object.entries(routeEvents).flatMap(([route, scenes]) =>
    (scenes ?? []).map((scene) =>
      adaptLegacyScene(scene, {
        kind: "route",
        arcId: `route.${route}`,
        routes: [route as "normal" | "domination" | "chaos"],
        repeat: { mode: "repeatable" },
        priority: 200,
      }),
    ),
  );

export const legacyWorldNarrativeBlocks: NarrativeEventBlock[] = [
  ...legacyAmbientNarrativeBlocks,
  ...legacyRouteNarrativeBlocks,
];

export const legacyWorldNarrativeBlockById = new Map(
  legacyWorldNarrativeBlocks.map((block) => [block.id, block]),
);
