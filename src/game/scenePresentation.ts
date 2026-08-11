import type {
  DialogueLine,
  SceneEffect,
  SceneSpriteCue,
} from "./types";

export interface ScenePresentationState {
  background?: string;
  sprite?: SceneSpriteCue | null;
  still?: string;
  effect?: SceneEffect;
}

const hasSpriteDirection = (line: DialogueLine) =>
  Boolean(
    line.direction &&
      Object.prototype.hasOwnProperty.call(line.direction, "sprite"),
  );

/**
 * Resolves the visible composition at a dialogue line.
 *
 * Backgrounds, sprites, and event CGs are scene state: they remain visible
 * until a later direction explicitly changes the composition. Effects remain
 * line-local so a pulse or shake does not leak into following dialogue.
 */
export const resolveScenePresentation = (
  lines: DialogueLine[],
  visibleLineIndex: number,
  initial: Pick<ScenePresentationState, "background" | "sprite"> = {},
): ScenePresentationState => {
  let background = initial.background;
  let sprite = initial.sprite;
  let still: string | undefined;
  const lastIndex = Math.min(
    Math.max(visibleLineIndex, 0),
    Math.max(lines.length - 1, 0),
  );

  for (let index = 0; index <= lastIndex; index += 1) {
    const line = lines[index];
    const direction = line?.direction;
    if (!direction) continue;

    const changesComposition = Boolean(direction.background) || hasSpriteDirection(line);
    if (changesComposition) still = undefined;
    if (direction.background) background = direction.background;
    if (hasSpriteDirection(line)) sprite = direction.sprite;
    if (direction.still) still = direction.still;
  }

  return {
    background,
    sprite,
    still,
    effect: lines[lastIndex]?.direction?.effect,
  };
};
