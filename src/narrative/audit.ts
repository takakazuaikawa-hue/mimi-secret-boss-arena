import {
  narrativeEventBlockSchema,
  type ConditionAtom,
  type NarrativeEffect,
  type NarrativeEventBlock,
  type NarrativeNode,
} from "./schema";
import { flagDefinitionById } from "./registry/flags";

export interface NarrativeAuditIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  blockId?: string;
  nodeId?: string;
}

export interface NarrativeAuditOptions {
  assetExists?: (path: string) => boolean;
}

const issue = (
  severity: NarrativeAuditIssue["severity"],
  code: string,
  message: string,
  blockId?: string,
  nodeId?: string,
): NarrativeAuditIssue => ({
  severity,
  code,
  message,
  ...(blockId ? { blockId } : {}),
  ...(nodeId ? { nodeId } : {}),
});

const conditionAtoms = (block: NarrativeEventBlock) => [
  ...block.trigger.when.all,
  ...block.trigger.when.any,
  ...block.trigger.when.none,
  ...block.nodes.flatMap((node) =>
    node.type === "choice"
      ? node.choices.flatMap((choice) =>
          choice.when
            ? [...choice.when.all, ...choice.when.any, ...choice.when.none]
            : [],
        )
      : [],
  ),
];

const effectsInNode = (node: NarrativeNode): NarrativeEffect[] => {
  if (node.type === "effect") return node.effects;
  if (node.type === "choice") {
    return node.choices.flatMap((choice) => choice.effects);
  }
  return [];
};

const referencedFlagIds = (
  atoms: ConditionAtom[],
  effects: NarrativeEffect[],
) => [
  ...atoms
    .filter((atom) => atom.type === "flag")
    .map((atom) => atom.flagId),
  ...effects
    .filter(
      (
        effect,
      ): effect is Extract<
        NarrativeEffect,
        { type: "setFlag" | "incrementFlag" }
      > => effect.type === "setFlag" || effect.type === "incrementFlag",
    )
    .map((effect) => effect.flagId),
];

const localEdges = (
  nodes: NarrativeNode[],
  nodeIndex: number,
  localNodeIds: Set<string>,
) => {
  const node = nodes[nodeIndex];
  if (node.type === "end") return [];
  if (node.type === "jump") {
    return localNodeIds.has(node.target) ? [node.target] : [];
  }
  if (node.type === "choice") {
    return node.choices
      .map((choice) => choice.goto)
      .filter((target) => localNodeIds.has(target));
  }
  const next = nodes[nodeIndex + 1];
  return next ? [next.id] : [];
};

export const auditNarrativeBlocks = (
  inputBlocks: readonly NarrativeEventBlock[],
  options: NarrativeAuditOptions = {},
): NarrativeAuditIssue[] => {
  const issues: NarrativeAuditIssue[] = [];
  const blocks: NarrativeEventBlock[] = [];
  const eventIds = new Set<string>();
  const lineIds = new Set<string>();
  const choiceIds = new Set<string>();
  const assetDefinitions = new Map<string, { kind: string; path: string }>();

  inputBlocks.forEach((input, index) => {
    const parsed = narrativeEventBlockSchema.safeParse(input);
    if (!parsed.success) {
      issues.push(
        issue(
          "error",
          "schema.invalid",
          `Block ${index} is invalid: ${parsed.error.issues
            .map((entry) => `${entry.path.join(".")}: ${entry.message}`)
            .join("; ")}`,
          typeof input?.id === "string" ? input.id : undefined,
        ),
      );
      return;
    }
    if (eventIds.has(parsed.data.id)) {
      issues.push(
        issue(
          "error",
          "event.duplicate-id",
          `Duplicate event ID: ${parsed.data.id}`,
          parsed.data.id,
        ),
      );
    }
    eventIds.add(parsed.data.id);
    blocks.push(parsed.data);
  });

  blocks.forEach((block) => {
    const nodeIds = new Set<string>();
    const assetIds = new Set(block.presentation.assets.map((asset) => asset.id));

    block.presentation.assets.forEach((asset) => {
      const previous = assetDefinitions.get(asset.id);
      if (
        previous &&
        (previous.kind !== asset.kind || previous.path !== asset.path)
      ) {
        issues.push(
          issue(
            "error",
            "asset.conflicting-definition",
            `Asset ${asset.id} maps to both ${previous.path} and ${asset.path}.`,
            block.id,
          ),
        );
      } else {
        assetDefinitions.set(asset.id, {
          kind: asset.kind,
          path: asset.path,
        });
      }
      if (options.assetExists && !options.assetExists(asset.path)) {
        issues.push(
          issue(
            "error",
            "asset.missing-file",
            `Asset file does not exist: ${asset.path}`,
            block.id,
          ),
        );
      }
    });

    block.nodes.forEach((node) => {
      if (nodeIds.has(node.id)) {
        issues.push(
          issue(
            "error",
            "node.duplicate-id",
            `Duplicate node ID: ${node.id}`,
            block.id,
            node.id,
          ),
        );
      }
      nodeIds.add(node.id);

      if (node.type === "line") {
        if (lineIds.has(node.lineId)) {
          issues.push(
            issue(
              "error",
              "line.duplicate-id",
              `Duplicate line ID: ${node.lineId}`,
              block.id,
              node.id,
            ),
          );
        }
        lineIds.add(node.lineId);
      }

      if (node.type === "choice") {
        node.choices.forEach((choice) => {
          if (choiceIds.has(choice.id)) {
            issues.push(
              issue(
                "error",
                "choice.duplicate-id",
                `Duplicate choice ID: ${choice.id}`,
                block.id,
                node.id,
              ),
            );
          }
          choiceIds.add(choice.id);
        });
      }

      if (
        node.type === "direction" &&
        "assetId" in node.command &&
        !assetIds.has(node.command.assetId)
      ) {
        issues.push(
          issue(
            "error",
            "asset.unregistered-reference",
            `Direction references unregistered asset ${node.command.assetId}.`,
            block.id,
            node.id,
          ),
        );
      }
    });

    block.nodes.forEach((node) => {
      const targets =
        node.type === "jump"
          ? [node.target]
          : node.type === "choice"
            ? node.choices.map((choice) => choice.goto)
            : [];
      targets.forEach((target) => {
        if (!nodeIds.has(target) && !eventIds.has(target)) {
          issues.push(
            issue(
              "error",
              "transition.missing-target",
              `Transition target does not exist: ${target}`,
              block.id,
              node.id,
            ),
          );
        }
      });

      effectsInNode(node)
        .filter(
          (
            effect,
          ): effect is Extract<NarrativeEffect, { type: "schedule" }> =>
            effect.type === "schedule",
        )
        .forEach((effect) => {
          if (!eventIds.has(effect.eventId)) {
            issues.push(
              issue(
                "error",
                "schedule.missing-event",
                `Scheduled event does not exist: ${effect.eventId}`,
                block.id,
                node.id,
              ),
            );
          }
        });
    });

    const allEffects = block.nodes.flatMap(effectsInNode);
    referencedFlagIds(conditionAtoms(block), allEffects).forEach((flagId) => {
      if (!flagDefinitionById.has(flagId)) {
        issues.push(
          issue(
            "error",
            "flag.unregistered",
            `Flag is not registered: ${flagId}`,
            block.id,
          ),
        );
      }
    });

    if (!block.nodes.some((node) => node.type === "line")) {
      issues.push(
        issue(
          "error",
          "content.no-lines",
          "Narrative block has no readable lines.",
          block.id,
        ),
      );
    }

    const firstNode = block.nodes[0];
    const reachable = new Set<string>();
    const queue: string[] = firstNode ? [firstNode.id] : [];
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId || reachable.has(currentId)) continue;
      reachable.add(currentId);
      const currentIndex = block.nodes.findIndex(
        (node) => node.id === currentId,
      );
      if (currentIndex < 0) continue;
      localEdges(block.nodes, currentIndex, nodeIds).forEach((target) => {
        if (!reachable.has(target)) queue.push(target);
      });
    }

    block.nodes.forEach((node) => {
      if (!reachable.has(node.id)) {
        issues.push(
          issue(
            "error",
            "node.unreachable",
            `Node cannot be reached from the block entry: ${node.id}`,
            block.id,
            node.id,
          ),
        );
      }
    });

    const reachableEnd = block.nodes.some(
      (node) => node.type === "end" && reachable.has(node.id),
    );
    if (!reachableEnd) {
      issues.push(
        issue(
          "error",
          "flow.no-reachable-end",
          "Narrative block has no reachable end node.",
          block.id,
        ),
      );
    }

    if (block.debug.legacyGeneratedIds) {
      issues.push(
        issue(
          "warning",
          "migration.generated-ids",
          "Line and choice IDs are compatibility IDs and should be replaced when this block is rewritten.",
          block.id,
        ),
      );
    }
  });

  return issues;
};

export const assertNarrativeBlocks = (
  blocks: readonly NarrativeEventBlock[],
  options: NarrativeAuditOptions = {},
) => {
  const issues = auditNarrativeBlocks(blocks, options);
  const errors = issues.filter((entry) => entry.severity === "error");
  if (errors.length > 0) {
    throw new Error(
      errors
        .map(
          (entry) =>
            `[${entry.code}] ${entry.blockId ?? "unknown"}: ${entry.message}`,
        )
        .join("\n"),
    );
  }
  return issues;
};
