import { describe, expect, it } from "vitest";
import type { DialogueLine } from "./types";
import { resolveScenePresentation } from "./scenePresentation";

const line = (
  text: string,
  direction?: DialogueLine["direction"],
): DialogueLine => ({ text, direction });

describe("resolveScenePresentation", () => {
  it("keeps an event CG visible across ordinary dialogue and effects", () => {
    const lines = [
      line("決定的瞬間", { still: "/cg/memory.png", effect: "pulse" }),
      line("余韻の台詞"),
      line("さらに続く会話", { effect: "shake" }),
    ];

    expect(resolveScenePresentation(lines, 1).still).toBe("/cg/memory.png");
    expect(resolveScenePresentation(lines, 1).effect).toBeUndefined();
    expect(resolveScenePresentation(lines, 2)).toMatchObject({
      still: "/cg/memory.png",
      effect: "shake",
    });
  });

  it("clears the event CG when the composition returns to a background or sprite", () => {
    const sprite = { asset: "/sprite/person.png", alt: "人物" };
    const lines = [
      line("一枚絵", { still: "/cg/memory.png" }),
      line("場所が変わる", { background: "/bg/next.png" }),
      line("人物へ戻る", { sprite }),
    ];

    expect(resolveScenePresentation(lines, 0).still).toBe("/cg/memory.png");
    expect(resolveScenePresentation(lines, 1).still).toBeUndefined();
    expect(resolveScenePresentation(lines, 2)).toMatchObject({ sprite });
  });

  it("replaces an earlier event CG with the next event CG", () => {
    const lines = [
      line("一枚目", { still: "/cg/first.png" }),
      line("二枚目", { still: "/cg/second.png" }),
      line("余韻"),
    ];

    expect(resolveScenePresentation(lines, 2).still).toBe("/cg/second.png");
  });
});
