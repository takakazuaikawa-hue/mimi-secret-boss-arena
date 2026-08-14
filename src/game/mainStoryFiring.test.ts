import { beforeEach, describe, expect, it } from "vitest";
import { useGameStore } from "./store";

// 実際のストア(プレイヤーが触るのと同じ経路)でメインストーリーが再生されるか
const playUntilIdle = (): string[] => {
  const played: string[] = [];
  const store = useGameStore.getState();
  let guard = 0;
  while (useGameStore.getState().run?.currentEvent && guard < 12) {
    played.push(useGameStore.getState().run!.currentEvent!.scene.id);
    store.resolveEvent(0);
    const { followup } = useGameStore.getState().continueEvent();
    if (!followup) break;
    guard += 1;
  }
  // 最後のイベントも記録に含める
  const trailing = useGameStore.getState().run?.currentEvent?.scene.id;
  if (trailing && played.at(-1) !== trailing) played.push(trailing);
  return played;
};

describe("メインストーリーの発火(ストア経由)", () => {
  beforeEach(() => {
    useGameStore.setState({ run: undefined });
  });

  it("新規開始の週1で、メイン第1話→ギドノの出会いが順に再生される", () => {
    useGameStore.getState().startRun("normal");
    expect(useGameStore.getState().run?.campaignStage).toBe(1);

    useGameStore.getState().chooseAction("work");
    const played = playUntilIdle();

    expect(played[0]).toBe("main.s1.w01");
    expect(played).toContain("gidonozeaas.meet");
    expect(played.filter((id) => id === "gidonozeaas.meet")).toHaveLength(1);
  });

  it("区分情報のない古い保存データでも、メイン話が再生される", () => {
    useGameStore.getState().startRun("normal");
    const run = useGameStore.getState().run!;
    // この機能より前に始めた周回を再現
    useGameStore.setState({
      run: { ...run, campaignStage: undefined },
    });

    useGameStore.getState().chooseAction("work");
    const played = playUntilIdle();
    expect(played[0]).toBe("main.s1.w01");
  });
});
