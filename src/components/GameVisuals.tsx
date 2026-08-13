import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { fighterById, fighterDefinitions } from "../data/characters";
import {
  battleOpponentById,
  battleOpponentVisualIndex,
} from "../data/opponents";
import { opponentVisuals } from "../data/opponentVisuals";

const atlasPosition = (index: number) => ({
  "--chibi-x": `${((index % 4) * 100) / 3}%`,
  "--chibi-y": `${(Math.floor(index / 4) * 100) / 3}%`,
}) as CSSProperties;

const opponentAtlasPosition = (index: number) => ({
  "--opponent-x": `${index * 50}%`,
}) as CSSProperties;

export function FighterChibi({
  id,
  showName = false,
  mood = "idle",
}: {
  id: string | "mimi";
  showName?: boolean;
  mood?: "idle" | "cheer" | "rest";
}) {
  const opponent = battleOpponentById.get(id);
  const opponentVisual = opponentVisuals[id];
  const index =
    id === "mimi"
      ? 15
      : Math.max(
          0,
          fighterDefinitions.findIndex((fighter) => fighter.id === id),
        );
  const fighter = id === "mimi" ? undefined : fighterById.get(id);
  const name =
    id === "mimi" ? "ミミ" : (fighter?.name ?? opponent?.name ?? "所属選手");

  return (
    <figure
      className={`fighter-chibi fighter-chibi--${mood}`}
      aria-label={showName ? name : undefined}
    >
      {opponentVisual ? (
        <img
          src={opponentVisual.battle}
          alt=""
          className="fighter-chibi__art fighter-chibi__art--opponent"
        />
      ) : (
        <span
          className={`fighter-chibi__sprite ${
            opponent ? "fighter-chibi__sprite--opponent" : ""
          }`}
          style={
            opponent
              ? opponentAtlasPosition(battleOpponentVisualIndex[id] ?? 0)
              : atlasPosition(index)
          }
        />
      )}
      {showName && <figcaption>{name}</figcaption>}
    </figure>
  );
}

export function LoadingScreen({
  progress,
  title = "闘技場を準備しています",
  detail = "控室の鍵と、限定メニューの在庫を確認中",
}: {
  progress: number;
  title?: string;
  detail?: string;
}) {
  const displayProgress = Math.max(4, Math.min(100, Math.round(progress)));
  return (
    <main className="game-loading-screen" aria-live="polite">
      <img
        src="/assets/ui/week-transition-cg.png"
        alt=""
        className="game-loading-screen__image"
      />
      <div className="game-loading-screen__scrim" />
      <motion.section
        className="game-loading-screen__content"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="loading-brand">
          <span>ミミの</span>
          <strong>ときめき裏ボス闘技場</strong>
        </div>
        <div className="loading-copy">
          <span>NOW PREPARING</span>
          <h1>{title}</h1>
          <p>{detail}</p>
        </div>
        <div
          className="loading-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={displayProgress}
        >
          <div>
            <i style={{ width: `${displayProgress}%` }} />
          </div>
          <strong>{displayProgress}%</strong>
        </div>
        <p className="loading-tip">
          裏ボスでも、出勤簿は一人一枚です。
        </p>
      </motion.section>
    </main>
  );
}

export interface TransitionNotice {
  title: string;
  detail: string;
  tip: string;
}

export function SceneTransition({
  notice,
}: {
  notice: TransitionNotice;
}) {
  return (
    <motion.div
      className="scene-transition"
      role="status"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <img src="/assets/ui/week-transition-cg.png" alt="" />
      <div className="scene-transition__scrim" />
      <motion.section
        initial={{ opacity: 0, x: -14 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span>PLEASE WAIT</span>
        <h2>{notice.title}</h2>
        <p>{notice.detail}</p>
        <div className="scene-transition__line">
          <i />
        </div>
        <small>{notice.tip}</small>
      </motion.section>
    </motion.div>
  );
}
