import { createActor } from "xstate";
import { describe, expect, it } from "vitest";
import { gameMachine } from "./machine";

describe("archive navigation", () => {
  it("opens from match preparation and returns to the interrupted phase", () => {
    const actor = createActor(gameMachine).start();
    actor.send({ type: "NEW_GAME" });
    actor.send({ type: "SKIP_PROLOGUE" });
    actor.send({ type: "ACTION_CHOSEN" });
    actor.send({ type: "CHOICE_RESOLVED" });
    actor.send({ type: "OUTCOME_DONE" });
    actor.send({ type: "MATCH_QUEUED" });
    expect(actor.getSnapshot().value).toBe("matchPrep");

    actor.send({ type: "OPEN_ARCHIVE" });
    expect(actor.getSnapshot().value).toBe("archive");

    actor.send({ type: "RECOVER_MATCH" });
    expect(actor.getSnapshot().value).toBe("matchPrep");
  });

  it("accepts the archive command from every campaign phase", () => {
    const recoveries = [
      "RECOVER_WEEK",
      "RECOVER_EVENT",
      "RECOVER_OUTCOME",
      "RECOVER_MANAGEMENT",
      "RECOVER_MATCH",
      "RECOVER_BATTLE",
      "RECOVER_ENDING",
    ] as const;

    recoveries.forEach((type) => {
      const actor = createActor(gameMachine).start();
      actor.send({ type });
      actor.send({ type: "OPEN_ARCHIVE" });
      expect(actor.getSnapshot().value).toBe("archive");
      actor.stop();
    });
  });
});
