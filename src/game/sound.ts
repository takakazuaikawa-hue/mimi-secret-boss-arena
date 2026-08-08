import { Howl } from "howler";

type SoundName =
  | "ui"
  | "reward"
  | "bet"
  | "battleMove"
  | "battleHit"
  | "battleSkill"
  | "battleBreak";

const sources: Record<SoundName, string> = {
  ui: "/assets/audio/casino/Audio/chip-lay-1.ogg",
  reward: "/assets/audio/casino/Audio/chips-collide-1.ogg",
  bet: "/assets/audio/casino/Audio/dice-throw-1.ogg",
  battleMove: "/assets/audio/casino/Audio/card-slide-4.ogg",
  battleHit: "/assets/audio/casino/Audio/chips-collide-3.ogg",
  battleSkill: "/assets/audio/casino/Audio/card-fan-2.ogg",
  battleBreak: "/assets/audio/casino/Audio/dice-throw-3.ogg",
};

const sounds = new Map<SoundName, Howl>();

export const playSound = (name: SoundName, enabled = true) => {
  if (!enabled || typeof window === "undefined") return;
  let sound = sounds.get(name);
  if (!sound) {
    sound = new Howl({
      src: [sources[name]],
      volume: name === "ui" ? 0.2 : name.startsWith("battle") ? 0.24 : 0.3,
    });
    sounds.set(name, sound);
  }
  sound.play();
};
