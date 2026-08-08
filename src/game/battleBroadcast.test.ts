import { describe, expect, it } from "vitest";
import {
  battleBroadcastForbiddenTerms,
  buildBattleBroadcast,
  type BattleBroadcastInput,
} from "./battleBroadcast";

const base: BattleBroadcastInput = {
  actorName: "ギドノゼアース",
  targetNames: "ピヨゼリー",
  skillName: "黒星",
  kind: "damage",
  impacted: false,
  critical: false,
  detail: "ピヨゼリーに42ダメージ",
  amount: 42,
  defeated: false,
};

describe("battle broadcast", () => {
  it("announces a familiar RPG attack before impact", () => {
    const line = buildBattleBroadcast(base);
    expect(line.headline).toBe("「ギドノゼアースの攻撃！」");
    expect(line.body).toContain("ピヨゼリー");
    expect(line.body).toContain("黒星");
  });

  it("reports damage plainly after impact", () => {
    const line = buildBattleBroadcast({ ...base, impacted: true });
    expect(line.headline).toBe("「ピヨゼリーに42ダメージ！」");
  });

  it("reports the concrete effect of a trait", () => {
    const line = buildBattleBroadcast({
      ...base,
      kind: "trait",
      skillName: "ぷるぷる根性",
      detail: "障壁を6得た",
      impacted: true,
    });
    expect(line.headline).toContain("特性が発動");
    expect(line.body).toContain("障壁を6得た");
  });

  it("never exposes implementation or unexplained teaser labels", () => {
    const samples = [
      buildBattleBroadcast(base),
      buildBattleBroadcast({ ...base, impacted: true }),
      buildBattleBroadcast({ ...base, kind: "buff" }),
      buildBattleBroadcast({
        ...base,
        kind: "miss",
        impacted: true,
      }),
    ];
    const text = samples.flatMap((line) => [line.headline, line.body]).join("\n");
    for (const term of battleBroadcastForbiddenTerms) {
      expect(text).not.toContain(term);
    }
  });
});
