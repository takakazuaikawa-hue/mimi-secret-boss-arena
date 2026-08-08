import { describe, expect, it } from "vitest";
import { fighterDefinitions } from "../data/characters";
import { chooseWeeklyAction, createRun } from "../game/engine";
import { legacyNarrativeBlockById } from "./legacyBlocks";
import { migrateNarrativeRunState } from "./saveMigration";
import { asEventId } from "./schema";

describe("narrative save migration", () => {
  it("adds canonical flags and stable choice IDs without deleting legacy data", () => {
    const meetScene = fighterDefinitions[0].scenes.meet;
    const block = legacyNarrativeBlockById.get(asEventId(meetScene.id));
    const stableChoiceId = block?.nodes
      .find((node) => node.type === "choice")
      ?.choices.at(1)?.id;
    const run = createRun("normal", "legacy-narrative-flags");
    run.flags = [
      "opening:owner-transfer-complete",
      `choice:${meetScene.id}:1`,
    ];

    const migrated = migrateNarrativeRunState(run);

    expect(migrated.flags).toContain("opening:owner-transfer-complete");
    expect(migrated.flags).toContain("opening.owner-transfer.completed");
    expect(migrated.flags).toContain(`choice:${meetScene.id}:1`);
    expect(migrated.flags).toContain(`choice:${stableChoiceId}`);
  });

  it("attaches a block ID to an in-progress event from an old save", () => {
    const current = chooseWeeklyAction(
      createRun("normal", "legacy-current-event"),
      "work",
    );
    if (!current.currentEvent) throw new Error("Expected opening event.");
    const legacyRun = {
      ...current,
      currentEvent: {
        ...current.currentEvent,
        narrativeBlockId: undefined,
      },
    };

    const migrated = migrateNarrativeRunState(legacyRun);

    expect(migrated.currentEvent?.narrativeBlockId).toBe(
      migrated.currentEvent?.scene.id,
    );
  });

  it("is idempotent when migration runs more than once", () => {
    const run = createRun("normal", "migration-idempotence");
    run.flags = ["opening:owner-transfer-complete"];

    const once = migrateNarrativeRunState(run);
    const twice = migrateNarrativeRunState(once);

    expect(twice).toEqual(once);
  });
});
