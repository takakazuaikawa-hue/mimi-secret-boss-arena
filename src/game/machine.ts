import { setup } from "xstate";

export type GamePhase =
  | "title"
  | "prologue"
  | "week"
  | "event"
  | "outcome"
  | "management"
  | "matchPrep"
  | "battle"
  | "ending"
  | "archive";

type GameEvent =
  | { type: "NEW_GAME" }
  | { type: "SKIP_PROLOGUE" }
  | { type: "ACTION_CHOSEN" }
  | { type: "CHOICE_RESOLVED" }
  | { type: "OUTCOME_FOLLOWUP" }
  | { type: "OUTCOME_DONE" }
  | { type: "MATCH_QUEUED" }
  | { type: "WEEK_ADVANCED" }
  | { type: "BATTLE_STARTED" }
  | { type: "BONUS_MATCH" }
  | { type: "BATTLE_DONE" }
  | { type: "RUN_ENDED" }
  | { type: "OPEN_ARCHIVE" }
  | { type: "CLOSE_ARCHIVE" }
  | { type: "TO_TITLE" }
  | { type: "RESUME_WEEK" }
  | { type: "RESUME_EVENT" }
  | { type: "RESUME_OUTCOME" }
  | { type: "RESUME_MANAGEMENT" }
  | { type: "RESUME_MATCH" }
  | { type: "RESUME_BATTLE" }
  | { type: "RESUME_ENDING" }
  | { type: "RECOVER_TITLE" }
  | { type: "RECOVER_PROLOGUE" }
  | { type: "RECOVER_WEEK" }
  | { type: "RECOVER_EVENT" }
  | { type: "RECOVER_OUTCOME" }
  | { type: "RECOVER_MANAGEMENT" }
  | { type: "RECOVER_MATCH" }
  | { type: "RECOVER_BATTLE" }
  | { type: "RECOVER_ENDING" };

export const gameMachine = setup({
  types: {
    events: {} as GameEvent,
  },
}).createMachine({
  id: "mimi-secret-boss-arena",
  initial: "title",
  on: {
    OPEN_ARCHIVE: ".archive",
    RECOVER_TITLE: ".title",
    RECOVER_PROLOGUE: ".prologue",
    RECOVER_WEEK: ".week",
    RECOVER_EVENT: ".event",
    RECOVER_OUTCOME: ".outcome",
    RECOVER_MANAGEMENT: ".management",
    RECOVER_MATCH: ".matchPrep",
    RECOVER_BATTLE: ".battle",
    RECOVER_ENDING: ".ending",
  },
  states: {
    title: {
      on: {
        NEW_GAME: "prologue",
        RESUME_WEEK: "week",
        RESUME_EVENT: "event",
        RESUME_OUTCOME: "outcome",
        RESUME_MANAGEMENT: "management",
        RESUME_MATCH: "matchPrep",
        RESUME_BATTLE: "battle",
        RESUME_ENDING: "ending",
      },
    },
    prologue: {
      on: { SKIP_PROLOGUE: "week", TO_TITLE: "title" },
    },
    week: {
      on: {
        ACTION_CHOSEN: "event",
        TO_TITLE: "title",
      },
    },
    event: {
      on: {
        CHOICE_RESOLVED: "outcome",
        TO_TITLE: "title",
      },
    },
    outcome: {
      on: {
        OUTCOME_FOLLOWUP: "event",
        OUTCOME_DONE: "management",
        TO_TITLE: "title",
      },
    },
    management: {
      on: {
        MATCH_QUEUED: "matchPrep",
        WEEK_ADVANCED: "week",
        RUN_ENDED: "ending",
        TO_TITLE: "title",
      },
    },
    matchPrep: {
      on: { BATTLE_STARTED: "battle", TO_TITLE: "title" },
    },
    battle: {
      on: {
        BONUS_MATCH: "matchPrep",
        BATTLE_DONE: "week",
        RUN_ENDED: "ending",
        TO_TITLE: "title",
      },
    },
    ending: {
      on: {
        TO_TITLE: "title",
      },
    },
    archive: {
      on: {
        CLOSE_ARCHIVE: "title",
        TO_TITLE: "title",
      },
    },
  },
});
