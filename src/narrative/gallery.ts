import type { NarrativeEventBlock } from "./schema";

export interface NarrativeGalleryEntry {
  id: string;
  eventId: string;
  assetId: string;
  choiceId?: string;
  characterId?: string;
  stage?: string;
  title: string;
  chapter: string;
  caption: string;
  image: string;
  unlock: "on-view" | "on-event-complete" | "on-choice";
}

export interface NarrativeGalleryUnlockState {
  seenEvents: readonly string[];
  eventHistory?: readonly string[];
  flags?: readonly string[];
  liberatedCharacterIds: readonly string[];
}

/**
 * Gallery memories are profile-owned.  Current-run history can reveal them
 * immediately, while `seenEvents` keeps them available after starting a new
 * loop or clearing the current save slot.
 */
export const isNarrativeGalleryEntryUnlocked = (
  entry: NarrativeGalleryEntry,
  state: NarrativeGalleryUnlockState,
) => {
  if (entry.unlock === "on-choice") {
    return Boolean(
      state.flags?.some(
        (flag) =>
          flag === `gallery-unlock:${entry.id}` ||
          flag === `gallery-unlock:${entry.assetId}` ||
          (entry.choiceId
            ? flag === `choice:${entry.choiceId}`
            : flag.startsWith(`choice:${entry.eventId}`)),
      ),
    );
  }
  if (state.seenEvents.includes(entry.eventId)) return true;
  if (state.eventHistory?.includes(entry.eventId)) return true;
  return Boolean(
    entry.characterId &&
      state.liberatedCharacterIds.includes(entry.characterId),
  );
};

/**
 * Narrative JSON is the source of truth for the memory gallery.
 * Every still participates by default; authored `asset.gallery` metadata can
 * replace the safe defaults without requiring a second hand-maintained list.
 */
export const galleryEntriesFromNarrativeBlocks = (
  blocks: readonly NarrativeEventBlock[],
): NarrativeGalleryEntry[] =>
  blocks.flatMap((block) =>
    block.presentation.assets
      .filter((asset) => asset.kind === "still")
      .map((asset) => ({
        id: `${block.id}:${asset.id}`,
        eventId: block.id,
        assetId: asset.id,
        choiceId: asset.gallery?.choiceId,
        characterId: block.ownership.characterId,
        stage: block.ownership.stage,
        title: asset.gallery?.title ?? block.title,
        chapter:
          asset.gallery?.chapter ??
          (block.ownership.stage
            ? `${block.ownership.stage.toUpperCase()} / ${block.presentation.location}`
            : block.presentation.location),
        caption: asset.gallery?.caption ?? block.summary,
        image: asset.path,
        unlock: asset.gallery?.unlock ?? "on-event-complete",
      })),
  );
