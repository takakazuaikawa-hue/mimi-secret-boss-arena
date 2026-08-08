import seedrandom from "seedrandom";

export interface RandomSource {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
}

export const createRandom = (seed: string): RandomSource => {
  const random = seedrandom(seed);
  const next = () => random();

  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
    shuffle: <T>(items: readonly T[]) => {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(next() * (index + 1));
        [result[index], result[swapIndex]] = [
          result[swapIndex],
          result[index],
        ];
      }
      return result;
    },
  };
};

export const randomForCursor = (seed: string, cursor: number) =>
  createRandom(`${seed}:${cursor}`);

