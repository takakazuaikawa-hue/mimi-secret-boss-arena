import { fighterById, fighterDefinitions } from "../data/characters";
import { itemById } from "../data/items";
import { parseBonusMatchId } from "../data/matches";
import {
  openingRookieOpponents,
  type BattleFighterDefinition,
} from "../data/opponents";
import { createRandom, type RandomSource } from "./rng";
import type {
  BattleIntervention,
  BattleLogEntry,
  BattlePlan,
  BattlePresentationEvent,
  BattleState,
  BattleTactic,
  BattleUnit,
  FighterDefinition,
  FormationSlot,
  MatchDefinition,
  RunState,
  SkillDefinition,
  Stats,
} from "./types";

const conditionScale = {
  good: 1.08,
  normal: 1,
  bad: 0.92,
} as const;

const formationSlots: FormationSlot[] = ["front", "middle", "rear"];

const selectedBattleFighters = (run: RunState): FighterDefinition[] => {
  const selectedIds =
    run.activeTeam.length > 0
      ? run.activeTeam.slice(0, 3)
      : run.roster.slice(0, 3);
  return selectedIds
    .map((id) => fighterById.get(id))
    .filter((fighter): fighter is FighterDefinition => Boolean(fighter));
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const scaledStats = (
  fighter: BattleFighterDefinition,
  run: RunState,
  scale = 1,
): Stats => {
  const state = run.fighters[fighter.id];
  const boost = state?.statBoosts ?? {};
  const equipment = state?.equippedItemId
    ? itemById.get(state.equippedItemId)?.statBoosts
    : undefined;
  const factor = conditionScale[state?.condition ?? "normal"] * scale;
  const value = (stat: keyof Stats) =>
    Math.round(
      (fighter.stats[stat] + (boost[stat] ?? 0) + (equipment?.[stat] ?? 0)) *
        factor,
    );
  return {
    hp: value("hp"),
    mp: value("mp"),
    attack: value("attack"),
    defense: value("defense"),
    magic: value("magic"),
    speed: value("speed"),
  };
};

const tacticFor = (
  fighter: BattleFighterDefinition,
  run: RunState,
  side: BattleUnit["side"],
): BattleTactic => {
  if (side === "player" && run.battleTactics?.[fighter.id]) {
    return run.battleTactics[fighter.id];
  }
  if (fighter.ai === "aggressive") return "burst";
  if (fighter.ai === "careful") return "conserve";
  if (fighter.ai === "tricky") return "support";
  return "signature";
};

const makeUnit = (
  fighter: BattleFighterDefinition,
  side: BattleUnit["side"],
  stats: Stats,
  run: RunState,
  index: number,
  name = fighter.name,
): BattleUnit => {
  const state = run.fighters[fighter.id];
  return {
    instanceId: `${side}:${fighter.id}:${index}`,
    fighterId: fighter.id,
    name,
    side,
    stats,
    maxHp: stats.hp,
    hp: stats.hp,
    maxMp: stats.mp,
    mp: stats.mp,
    trust: state?.trust ?? 45,
    ownership: state?.ownership ?? 55,
    condition: state?.condition ?? "normal",
    role: fighter.role,
    position: formationSlots[index] ?? "rear",
    tactic: tacticFor(fighter, run, side),
    strong: fighter.strong,
    weak: fighter.weak,
    traitName: fighter.traitName,
    traitText: fighter.traitText,
    skills: fighter.skills,
    ai: fighter.ai,
    guarding: false,
    attackBuff: 0,
    magicBuff: 0,
    defenseBuff: 0,
    speedBuff: 0,
    evasion: 0,
    barrier: 0,
    breakGauge: 0,
    breakMax: 100,
    brokenTurns: 0,
    comboCount: 0,
    criticalPity: 0,
    receivedHits: 0,
    traitTriggered: false,
    defeatTraitTriggered: false,
    defeated: false,
  };
};

export const opponentsForMatch = (
  run: RunState,
  match: MatchDefinition,
): BattleFighterDefinition[] => {
  const selectedFighters = selectedBattleFighters(run);
  const bonusMatch = parseBonusMatchId(match.id);
  const baseMatchId = bonusMatch?.baseId ?? match.id;
  if (baseMatchId === "opening-cup") {
    const offset = bonusMatch?.round ?? 0;
    return Array.from(
      { length: selectedFighters.length },
      (_, index) =>
        openingRookieOpponents[
          (offset + index) % openingRookieOpponents.length
        ],
    );
  }
  const selectedIds = selectedFighters.map((fighter) => fighter.id);
  const pool = fighterDefinitions.filter(
    (fighter) => !selectedIds.includes(fighter.id),
  );
  return createRandom(`${run.seed}:opponents:${match.id}`)
    .shuffle(pool)
    .slice(0, selectedFighters.length);
};

const pushLog = (
  battle: BattleState,
  actor: string,
  text: string,
  tone: BattleLogEntry["tone"] = "normal",
) => {
  battle.logs.push({ turn: battle.turn, actor, text, tone });
  battle.logs = battle.logs.slice(-100);
};

const pushPresentation = (
  battle: BattleState,
  event: Omit<BattlePresentationEvent, "id" | "turn">,
) => {
  const events = battle.presentationEvents ?? [];
  const spotlight =
    battle.spotlightSide === event.side &&
    (event.kind === "damage" || event.kind === "debuff")
      ? battle.spotlightSide === "player"
        ? "chance"
        : "crisis"
      : event.spotlight;
  events.push({
    ...event,
    spotlight,
    id: `${battle.turn}:${events.length}:${event.actorId ?? "system"}`,
    turn: battle.turn,
  });
  if (spotlight) battle.spotlightSide = undefined;
  battle.presentationEvents = events;
};

const triggerTrait = (
  battle: BattleState,
  unit: BattleUnit,
  text: string,
  repeat = false,
) => {
  if (unit.traitTriggered && !repeat) return;
  unit.traitTriggered = true;
  battle.metrics.traitTriggers += 1;
  pushLog(battle, unit.name, `固有特性「${unit.traitName}」発動。${text}`, "system");
  pushPresentation(battle, {
    actorId: unit.instanceId,
    actorName: unit.name,
    side: unit.side,
    skillName: unit.traitName,
    kind: "trait",
    element: "star",
    targetIds: [unit.instanceId],
    targets: [],
    headline: `固有特性「${unit.traitName}」`,
    detail: text,
  });
};

const startTraits = (battle: BattleState) => {
  [...battle.player, ...battle.enemy].forEach((unit) => {
    if (unit.fighterId === "cassim-bell") {
      const allies = unit.side === "player" ? battle.player : battle.enemy;
      allies.forEach((ally) => {
        ally.maxMp += 8;
        ally.mp += 8;
      });
      triggerTrait(battle, unit, "全員の初期MPが8増えた。");
    }
    if (unit.fighterId === "mumyo") {
      if (unit.ownership < 50) unit.speedBuff += 0.12;
      if (unit.trust >= 55) unit.attackBuff += 0.14;
      triggerTrait(
        battle,
        unit,
        unit.ownership < 50
          ? "所有が薄く、速度が上がった。"
          : "契約の重さを攻撃へ変えた。",
      );
    }
    if (unit.fighterId === "ushiro") unit.evasion += 0.48;
    if (unit.fighterId === "rookie-piyo-slime") {
      unit.barrier += 6;
      triggerTrait(battle, unit, "震えながらも盾を構え、障壁を6得た。");
    }
    if (unit.fighterId === "rookie-kobold") {
      unit.defenseBuff += 0.08;
      unit.speedBuff -= 0.05;
      triggerTrait(
        battle,
        unit,
        "借り物の兜で防御が上がり、重さで速度が下がった。",
      );
    }
    if (unit.fighterId === "rookie-bat-mage") {
      unit.magicBuff += 0.06;
      triggerTrait(battle, unit, "教本を開き、魔力を少し高めた。");
    }
  });
};

export const createBattle = (
  run: RunState,
  match: MatchDefinition,
  _random: RandomSource,
): BattleState => {
  const player = selectedBattleFighters(run).map((fighter, index) =>
      makeUnit(fighter, "player", scaledStats(fighter, run), run, index),
    );

  const enemyScale =
    match.difficulty <= 1
      ? match.difficulty
      : 1 + (match.difficulty - 1) * 0.42;
  const enemyFighters = opponentsForMatch(run, match);
  const enemyTitles =
    enemyFighters.length === 1
      ? ["代表"]
      : enemyFighters.length === 2
        ? ["先鋒", "大将"]
        : ["先鋒", "中堅", "大将"];
  const enemy = enemyFighters.map((fighter, index) =>
    makeUnit(
      fighter,
      "enemy",
      scaledStats(fighter, run, enemyScale),
      run,
      index,
      `${enemyTitles[index]}・${fighter.name}`,
    ),
  );
  const average = (field: "trust" | "ownership") =>
    player.length > 0
      ? Math.round(
          player.reduce((sum, unit) => sum + unit[field], 0) / player.length,
        )
      : 0;
  const teamTrust = average("trust");
  const teamOwnership = average("ownership");
  const battle: BattleState = {
    matchId: match.id,
    turn: 0,
    player,
    enemy,
    logs: [
      {
        turn: 0,
        actor: "実況",
        text:
          match.id === "opening-cup"
            ? "新人モンスターと、説明書に載っていない何かが向かい合いました。"
            : `${match.name}、開幕。前衛が攻撃を引き受け、後衛が機をうかがいます。`,
        tone: "system",
      },
    ],
    presentationEvents: [],
    status: "ready",
    turningPointUsed: false,
    cheerUses: teamTrust >= 68 ? 3 : teamTrust < 38 ? 1 : 2,
    readUses: 2,
    forceUses: teamOwnership >= 68 ? 2 : 1,
    shiftUses: 1,
    momentum: clamp(Math.round((teamTrust - 30) * 0.35), 0, 20),
    momentumMax: 100,
    plan: run.battlePlan,
    teamTrust,
    teamOwnership,
    forcedFighterId:
      match.id === "opening-cup" &&
      player.some((unit) => unit.fighterId === "gidonozeaas")
        ? "gidonozeaas"
        : undefined,
    forcedSkillId:
      match.id === "opening-cup" &&
      player.some((unit) => unit.fighterId === "gidonozeaas")
        ? "gido.blackstar"
        : undefined,
    metrics: {
      weaknessHits: 0,
      criticalHits: 0,
      turningPoints: 0,
      traitTriggers: 0,
      interventions: 0,
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      skillUses: {},
    },
  };
  startTraits(battle);
  return battle;
};

const living = (units: BattleUnit[]) => units.filter((unit) => !unit.defeated);

const copyBattle = (battle: BattleState): BattleState => ({
  ...battle,
  player: battle.player.map((unit) => ({ ...unit })),
  enemy: battle.enemy.map((unit) => ({ ...unit })),
  logs: [...battle.logs],
  presentationEvents: battle.presentationEvents?.map((event) => ({
    ...event,
    targetIds: [...event.targetIds],
    targets: event.targets.map((target) => ({
      ...target,
      tags: [...target.tags],
    })),
  })),
  metrics: {
    ...battle.metrics,
    skillUses: { ...(battle.metrics.skillUses ?? {}) },
  },
});

const planFactor = (
  unit: BattleUnit,
  battle: BattleState,
  stat: "attack" | "magic" | "defense" | "speed",
) => {
  if (unit.side !== "player") return 1;
  if (battle.plan === "assault") {
    if (stat === "attack" || stat === "magic") return 1.09;
    if (stat === "defense") return 0.92;
    return 1.04;
  }
  if (battle.plan === "guarded") {
    if (stat === "defense") return 1.13;
    if (stat === "attack" || stat === "magic") return 0.94;
    return 0.96;
  }
  return 1;
};

const formationFactor = (
  unit: BattleUnit,
  stat: "attack" | "magic" | "defense" | "speed",
) => {
  if (unit.position === "front") {
    if (stat === "defense") return 1.1;
    if (stat === "attack") return 1.04;
  }
  if (unit.position === "rear") {
    if (stat === "magic") return 1.12;
    if (stat === "attack") return 0.9;
  }
  return 1;
};

export const effectiveStat = (
  unit: BattleUnit,
  battle: BattleState,
  stat: "attack" | "magic" | "defense" | "speed",
) => {
  const buff =
    stat === "attack"
      ? unit.attackBuff
      : stat === "magic"
        ? unit.magicBuff
        : stat === "defense"
          ? unit.defenseBuff
          : unit.speedBuff;
  return (
    unit.stats[stat] *
    (1 + buff) *
    planFactor(unit, battle, stat) *
    formationFactor(unit, stat)
  );
};

const skillCategory = (skill: SkillDefinition) => {
  if (skill.kind === "guard") return "guard" as const;
  if (skill.mpCost > 0 || skill.kind !== "damage") return "skill" as const;
  return "attack" as const;
};

const skillScore = (
  skill: SkillDefinition,
  unit: BattleUnit,
  allies: BattleUnit[],
  _enemies: BattleUnit[],
) => {
  const wounded = living(allies).filter((ally) => ally.hp / ally.maxHp < 0.55);
  let score = skill.power - skill.mpCost * 0.75;
  if (skill.kind === "heal") score += wounded.length * 55;
  if (skill.kind === "guard" && unit.hp / unit.maxHp < 0.42) score += 70;
  if (skill.kind === "buff" && battleBuffRoom(allies)) score += 35;
  if (skill.kind === "debuff") score += 22;
  if (skill.target === "allEnemies" || skill.target === "allAllies") score += 18;
  return score;
};

const battleBuffRoom = (allies: BattleUnit[]) =>
  living(allies).some(
    (ally) => ally.attackBuff < 0.16 || ally.defenseBuff < 0.16,
  );

const chooseSkill = (
  unit: BattleUnit,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  random: RandomSource,
  forcedSkillId?: string,
) => {
  if (forcedSkillId) {
    const forced = unit.skills.find(
      (skill) => skill.id === forcedSkillId && skill.mpCost <= unit.mp,
    );
    if (forced) return forced;
  }
  const usable = unit.skills.filter((skill) => skill.mpCost <= unit.mp);
  const basic =
    usable.find((skill) => skill.kind === "damage" && skill.mpCost === 0) ??
    usable[0] ??
    unit.skills[0];
  const wounded = living(allies).some((ally) => ally.hp / ally.maxHp < 0.48);
  const healing = usable
    .filter((skill) => skill.kind === "heal")
    .sort((a, b) => b.power - a.power)[0];
  if (
    wounded &&
    healing &&
    (unit.tactic === "support" || unit.tactic === "signature" || random.next() < 0.55)
  ) {
    return healing;
  }
  const guard = usable.find((skill) => skill.kind === "guard");
  if (unit.hp / unit.maxHp < 0.3 && guard && random.next() < 0.76) return guard;

  if (unit.tactic === "conserve") {
    const crisis = living(allies).length <= 1 || unit.hp / unit.maxHp < 0.35;
    if (!crisis && unit.mp / unit.maxMp < 0.72) return basic;
  }
  const scored = usable
    .map((skill) => ({
      skill,
      score:
        skillScore(skill, unit, allies, enemies) +
        (unit.tactic === "burst" && skill.kind === "damage" ? skill.mpCost * 2.5 : 0) +
        (unit.tactic === "support" && skill.kind !== "damage" ? 65 : 0) +
        (unit.tactic === "conserve" ? -skill.mpCost * 2 : 0) +
        random.next() * 12,
    }))
    .sort((a, b) => b.score - a.score);
  if (unit.tactic === "signature" && random.next() < 0.22) return basic;
  return scored[0]?.skill ?? basic;
};

const targetScore = (
  actor: BattleUnit,
  skill: SkillDefinition,
  target: BattleUnit,
  random: RandomSource,
) => {
  const position = target.position === "front" ? 48 : target.position === "middle" ? 25 : 8;
  const vulnerable = (1 - target.hp / target.maxHp) * 38;
  const burst = actor.tactic === "burst" ? vulnerable : 0;
  return position + vulnerable + burst + random.next() * 18;
};

const pickTargets = (
  actor: BattleUnit,
  skill: SkillDefinition,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  random: RandomSource,
) => {
  const livingAllies = living(allies);
  const livingEnemies = living(enemies);
  switch (skill.target) {
    case "self":
      return [actor];
    case "ally":
      return [
        [...livingAllies].sort(
          (a, b) => a.hp / a.maxHp - b.hp / b.maxHp,
        )[0] ?? actor,
      ];
    case "allAllies":
      return livingAllies;
    case "allEnemies":
      return livingEnemies;
    default:
      return [
        ...livingEnemies
          .map((target) => ({ target, score: targetScore(actor, skill, target, random) }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 1)
          .map(({ target }) => target),
      ];
  }
};

const preActionTraits = (battle: BattleState, actor: BattleUnit) => {
  if (
    actor.fighterId === "gidonozeaas" &&
    actor.hp / actor.maxHp < 0.5 &&
    !actor.traitTriggered
  ) {
    actor.magicBuff += 0.24;
    actor.speedBuff += 0.16;
    triggerTrait(battle, actor, "黒星の核が露出し、魔力と速度が上がった。");
  }
  if (
    actor.fighterId === "night-eater" &&
    battle.turn >= 3 &&
    !actor.traitTriggered
  ) {
    const enemies = actor.side === "player" ? battle.enemy : battle.player;
    living(enemies).forEach((enemy) => {
      enemy.speedBuff = Math.max(-0.45, enemy.speedBuff - 0.16);
    });
    triggerTrait(battle, actor, "薄暮が広がり、敵全体の速度を下げた。");
  }
  if (actor.fighterId === "sazanami") {
    if (battle.turn % 2 === 0) actor.defenseBuff = Math.max(actor.defenseBuff, 0.18);
    else actor.magicBuff = Math.max(actor.magicBuff, 0.18);
    if (!actor.traitTriggered) {
      triggerTrait(battle, actor, "奇数ラウンドは魔力、偶数ラウンドは防御が上がる。");
    }
  }
};

const onAllyDefeated = (
  battle: BattleState,
  defeated: BattleUnit,
  allies: BattleUnit[],
) => {
  const marian = living(allies).find(
    (unit) => unit.fighterId === "marian" && !unit.defeatTraitTriggered,
  );
  if (!marian) return;
  marian.defeatTraitTriggered = true;
  const survivors = living(allies);
  const before = new Map(
    survivors.map((ally) => [
      ally.instanceId,
      { hp: ally.hp, breakGauge: ally.breakGauge },
    ]),
  );
  survivors.forEach((ally) => {
    ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.24));
  });
  triggerTrait(
    battle,
    marian,
    `${defeated.name}の離脱を逆さの祈りに変え、残った味方を回復した。`,
  );
  pushPresentation(battle, {
    actorId: marian.instanceId,
    actorName: marian.name,
    side: marian.side,
    skillName: marian.traitName,
    kind: "heal",
    element: "star",
    targetIds: survivors.map((ally) => ally.instanceId),
    targets: survivors.map((ally) => ({
      instanceId: ally.instanceId,
      name: ally.name,
      hpBefore: before.get(ally.instanceId)?.hp ?? ally.hp,
      hpAfter: ally.hp,
      breakBefore: before.get(ally.instanceId)?.breakGauge ?? ally.breakGauge,
      breakAfter: ally.breakGauge,
      value: ally.hp - (before.get(ally.instanceId)?.hp ?? ally.hp),
      tags: ["RECOVER"],
    })),
    headline: `${marian.name}の「${marian.traitName}」`,
    detail: `残った味方${survivors.length}体を回復`,
  });
};

const applySkillMechanics = (
  battle: BattleState,
  skill: SkillDefinition,
  target: BattleUnit,
) => {
  const mechanics = skill.mechanics;
  if (!mechanics) return;
  target.attackBuff = clamp(
    target.attackBuff + (mechanics.attackBuff ?? 0) - (mechanics.attackDebuff ?? 0),
    -0.5,
    0.65,
  );
  target.magicBuff = clamp(
    target.magicBuff + (mechanics.magicBuff ?? 0) - (mechanics.magicDebuff ?? 0),
    -0.5,
    0.65,
  );
  target.defenseBuff = clamp(
    target.defenseBuff + (mechanics.defenseBuff ?? 0) - (mechanics.defenseDebuff ?? 0),
    -0.45,
    0.65,
  );
  target.speedBuff = clamp(
    target.speedBuff + (mechanics.speedBuff ?? 0) - (mechanics.speedDebuff ?? 0),
    -0.45,
    0.55,
  );
  target.evasion = clamp(target.evasion + (mechanics.evasionBuff ?? 0), 0, 0.65);
  target.barrier = Math.min(target.maxHp * 0.5, target.barrier + (mechanics.barrier ?? 0));
};

const performDamage = (
  battle: BattleState,
  actor: BattleUnit,
  target: BattleUnit,
  skill: SkillDefinition,
  allies: BattleUnit[],
  random: RandomSource,
) => {
  const hpBefore = target.hp;
  const breakBefore = target.breakGauge;
  const momentumBefore = battle.momentum;
  if (target.evasion > 0 && random.next() < target.evasion) {
    pushLog(battle, target.name, `${skill.name}を回避。`, target.side === "player" ? "good" : "bad");
    pushPresentation(battle, {
      actorId: actor.instanceId,
      actorName: actor.name,
      side: actor.side,
      skillName: skill.name,
      kind: "miss",
      element: skill.element,
      targetIds: [target.instanceId],
      targets: [
        {
          instanceId: target.instanceId,
          name: target.name,
          hpBefore,
          hpAfter: target.hp,
          breakBefore,
          breakAfter: target.breakGauge,
          tags: ["MISS"],
        },
      ],
      momentumBefore,
      momentumAfter: battle.momentum,
      headline: `${actor.name}の「${skill.name}」`,
      detail: `${target.name}は攻撃を見切った`,
    });
    if (target.fighterId === "ushiro" && !target.traitTriggered) {
      target.evasion = Math.max(0, target.evasion - 0.48);
      triggerTrait(battle, target, "最初の攻撃を視界の外へ逃がした。");
    }
    return;
  }
  if (target.fighterId === "ushiro" && !target.traitTriggered) {
    target.evasion = Math.max(0, target.evasion - 0.48);
  }

  const isMagic = skill.mpCost > 0;
  const offense = effectiveStat(actor, battle, isMagic ? "magic" : "attack");
  let pierce = skill.mechanics?.defensePierce ?? 0;
  if (
    actor.fighterId === "teirei" &&
    actor.lastTargetId === target.instanceId
  ) {
    pierce = Math.max(pierce, 0.42);
    if (!actor.traitTriggered) {
      triggerTrait(battle, actor, "同じ標的を再定義し、防御を42%無視する。");
    }
  }
  const defense =
    effectiveStat(target, battle, "defense") *
    (1 - pierce) *
    (target.guarding ? 1.5 : 1);
  let criticalChance = 0.07 + (skill.mechanics?.criticalBonus ?? 0);
  if (actor.fighterId === "rinne") criticalChance += actor.criticalPity;
  const critical = random.next() < criticalChance;
  if (actor.fighterId === "rinne") {
    if (critical) {
      actor.criticalPity = 0;
      if (!actor.traitTriggered) triggerTrait(battle, actor, "外れ続けた確率を会心へ繰り越した。");
    } else {
      actor.criticalPity = Math.min(0.38, actor.criticalPity + 0.08);
    }
  }
  const formationDamage =
    target.position === "front" ? 0.92 : target.position === "rear" ? 1.06 : 1;
  const spread = 0.94 + random.next() * 0.12;
  let damageBeforeBarrier = Math.max(
    3,
    Math.round(
      (offense * (skill.power / 57) - defense * 0.34) *
        (critical ? 1.45 : 1) *
        formationDamage *
        spread,
    ),
  );
  if (
    target.fighterId === "shahar" &&
    skill.target === "allEnemies" &&
    !target.traitTriggered
  ) {
    damageBeforeBarrier = Math.max(1, Math.round(damageBeforeBarrier * 0.5));
    triggerTrait(battle, target, "最初に受ける全体攻撃を天蓋で半減した。");
  }
  const absorbed = Math.min(target.barrier, damageBeforeBarrier);
  target.barrier -= absorbed;
  const damage = Math.max(0, damageBeforeBarrier - absorbed);
  target.hp = Math.max(0, target.hp - damage);
  if (actor.side === "player") {
    battle.metrics.damageDealt += damage;
  } else {
    battle.metrics.damageTaken += damage;
  }
  target.receivedHits += 1;
  const tagList = [
    critical ? "CRITICAL" : "",
    absorbed > 0 ? `障壁-${Math.round(absorbed)}` : "",
  ].filter(Boolean);
  const tags = tagList
    .filter(Boolean)
    .join(" / ");
  pushLog(
    battle,
    actor.name,
    `${skill.name}。${target.name}に${damage}ダメージ${tags ? `［${tags}］` : "。"} `,
    target.side === "enemy" ? "good" : "bad",
  );

  if (critical) {
    battle.metrics.criticalHits += 1;
    if (actor.side === "player") battle.momentum = clamp(battle.momentum + 8, 0, 100);
  }

  if (target.hp === 0) target.defeated = true;
  const presentationTags = [
    ...tagList,
    target.defeated ? "KO" : "",
  ].filter(Boolean);
  pushPresentation(battle, {
    actorId: actor.instanceId,
    actorName: actor.name,
    side: actor.side,
    skillName: skill.name,
    kind: "damage",
    element: skill.element,
    targetIds: [target.instanceId],
    targets: [
      {
        instanceId: target.instanceId,
        name: target.name,
        hpBefore,
        hpAfter: target.hp,
        breakBefore,
        breakAfter: target.breakGauge,
        value: damage,
        tags: presentationTags,
      },
    ],
    momentumBefore,
    momentumAfter: battle.momentum,
    headline: `${actor.name}の「${skill.name}」`,
    detail: `${target.name}に${damage}ダメージ`,
  });

  if (target.fighterId === "wolf-nine" && !target.defeated) {
    target.attackBuff = clamp(target.attackBuff + 0.07, -0.5, 0.65);
    if (!target.traitTriggered) triggerTrait(battle, target, "受けた一撃を次の攻撃力へ変えた。");
  }
  if (
    actor.fighterId === "peony" &&
    target.hp / target.maxHp < 0.28
  ) {
    const peonyAllies = living(allies);
    const before = new Map(
      peonyAllies.map((ally) => [
        ally.instanceId,
        { hp: ally.hp, breakGauge: ally.breakGauge },
      ]),
    );
    peonyAllies.forEach((ally) => {
      ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.06));
    });
    if (!actor.traitTriggered) triggerTrait(battle, actor, "瀕死の相手へ手加減し、味方を回復した。");
    pushPresentation(battle, {
      actorId: actor.instanceId,
      actorName: actor.name,
      side: actor.side,
      skillName: actor.traitName,
      kind: "heal",
      element: "star",
      targetIds: peonyAllies.map((ally) => ally.instanceId),
      targets: peonyAllies.map((ally) => ({
        instanceId: ally.instanceId,
        name: ally.name,
        hpBefore: before.get(ally.instanceId)?.hp ?? ally.hp,
        hpAfter: ally.hp,
        breakBefore: before.get(ally.instanceId)?.breakGauge ?? ally.breakGauge,
        breakAfter: ally.breakGauge,
        value: ally.hp - (before.get(ally.instanceId)?.hp ?? ally.hp),
        tags: ["RECOVER"],
      })),
      headline: `${actor.name}の「${actor.traitName}」`,
      detail: `味方${peonyAllies.length}体を回復`,
    });
  }
  actor.lastTargetId = target.instanceId;
  if (target.hp === 0) {
    pushLog(battle, "実況", `${target.name}、戦闘不能。`, "system");
    onAllyDefeated(battle, target, target.side === "player" ? battle.player : battle.enemy);
  }
};

const act = (
  battle: BattleState,
  actor: BattleUnit,
  allies: BattleUnit[],
  enemies: BattleUnit[],
  random: RandomSource,
) => {
  preActionTraits(battle, actor);
  const forced =
    battle.forcedFighterId === actor.fighterId ? battle.forcedSkillId : undefined;
  const skill = chooseSkill(actor, allies, enemies, random, forced);
  if (actor.side === "player") {
    battle.metrics.skillUses[skill.id] =
      (battle.metrics.skillUses[skill.id] ?? 0) + 1;
  }
  actor.mp = Math.max(0, actor.mp - skill.mpCost);
  let targets = pickTargets(actor, skill, allies, enemies, random);
  const labyrinth = targets.find(
    (target) => target.fighterId === "room-seventeen" && !target.defeated,
  );
  if (labyrinth && targets.length === 1 && living(enemies).length > 1 && random.next() < 0.28) {
    const alternatives = living(enemies).filter((target) => target.instanceId !== labyrinth.instanceId);
    targets = [random.pick(alternatives)];
    if (!labyrinth.traitTriggered) triggerTrait(battle, labyrinth, "攻撃の行き先を別の部屋へずらした。");
  }

  if (skill.kind === "damage") {
    targets.forEach((target) => performDamage(battle, actor, target, skill, allies, random));
  } else if (skill.kind === "heal") {
    targets.forEach((target) => {
      const hpBefore = target.hp;
      const breakBefore = target.breakGauge;
      const amount = Math.max(
        6,
        Math.round(effectiveStat(actor, battle, "magic") * (skill.power / 54)),
      );
      target.hp = Math.min(target.maxHp, target.hp + amount);
      if (actor.side === "player") {
        battle.metrics.healingDone += target.hp - hpBefore;
      }
      applySkillMechanics(battle, skill, target);
      pushLog(battle, actor.name, `${skill.name}。${target.name}が${amount}回復。`, actor.side === "player" ? "good" : "bad");
      pushPresentation(battle, {
        actorId: actor.instanceId,
        actorName: actor.name,
        side: actor.side,
        skillName: skill.name,
        kind: "heal",
        element: skill.element,
        targetIds: [target.instanceId],
        targets: [
          {
            instanceId: target.instanceId,
            name: target.name,
            hpBefore,
            hpAfter: target.hp,
            breakBefore,
            breakAfter: target.breakGauge,
            value: target.hp - hpBefore,
            tags: [],
          },
        ],
        headline: `${actor.name}の「${skill.name}」`,
        detail: `${target.name}のHPが${target.hp - hpBefore}回復`,
      });
    });
  } else if (skill.kind === "guard") {
    const before = new Map(
      targets.map((target) => [
        target.instanceId,
        { hp: target.hp, breakGauge: target.breakGauge },
      ]),
    );
    targets.forEach((target) => {
      target.guarding = true;
      target.defenseBuff = clamp(target.defenseBuff + skill.power / 300, -0.45, 0.65);
      applySkillMechanics(battle, skill, target);
    });
    pushLog(battle, actor.name, `${skill.name}で守りを固めた。`);
    pushPresentation(battle, {
      actorId: actor.instanceId,
      actorName: actor.name,
      side: actor.side,
      skillName: skill.name,
      kind: "guard",
      element: skill.element,
      targetIds: targets.map((target) => target.instanceId),
      targets: targets.map((target) => ({
        instanceId: target.instanceId,
        name: target.name,
        hpBefore: before.get(target.instanceId)?.hp ?? target.hp,
        hpAfter: target.hp,
        breakBefore:
          before.get(target.instanceId)?.breakGauge ?? target.breakGauge,
        breakAfter: target.breakGauge,
        tags: ["GUARD"],
      })),
      headline: `${actor.name}の「${skill.name}」`,
      detail: `${targets.map((target) => target.name).join("・")}を守る`,
    });
  } else if (skill.kind === "buff") {
    const before = new Map(
      targets.map((target) => [
        target.instanceId,
        { hp: target.hp, breakGauge: target.breakGauge },
      ]),
    );
    targets.forEach((target) => {
      target.attackBuff = clamp(target.attackBuff + skill.power / 330, -0.5, 0.65);
      target.magicBuff = clamp(target.magicBuff + skill.power / 360, -0.5, 0.65);
      applySkillMechanics(battle, skill, target);
    });
    pushLog(battle, actor.name, `${skill.name}。味方の戦型が整う。`);
    pushPresentation(battle, {
      actorId: actor.instanceId,
      actorName: actor.name,
      side: actor.side,
      skillName: skill.name,
      kind: "buff",
      element: skill.element,
      targetIds: targets.map((target) => target.instanceId),
      targets: targets.map((target) => ({
        instanceId: target.instanceId,
        name: target.name,
        hpBefore: before.get(target.instanceId)?.hp ?? target.hp,
        hpAfter: target.hp,
        breakBefore:
          before.get(target.instanceId)?.breakGauge ?? target.breakGauge,
        breakAfter: target.breakGauge,
        tags: ["POWER UP"],
      })),
      headline: `${actor.name}の「${skill.name}」`,
      detail: `${targets.length > 1 ? "味方全体" : targets[0]?.name}を強化`,
    });
  } else {
    const momentumBefore = battle.momentum;
    const before = new Map(
      targets.map((target) => [
        target.instanceId,
        { hp: target.hp, breakGauge: target.breakGauge },
      ]),
    );
    targets.forEach((target) => {
      target.attackBuff = clamp(target.attackBuff - skill.power / 360, -0.5, 0.65);
      target.defenseBuff = clamp(target.defenseBuff - skill.power / 390, -0.45, 0.65);
      applySkillMechanics(battle, skill, target);
    });
    pushLog(battle, actor.name, `${skill.name}。相手の構えと判断を乱した。`);
    pushPresentation(battle, {
      actorId: actor.instanceId,
      actorName: actor.name,
      side: actor.side,
      skillName: skill.name,
      kind: "debuff",
      element: skill.element,
      targetIds: targets.map((target) => target.instanceId),
      targets: targets.map((target) => ({
        instanceId: target.instanceId,
        name: target.name,
        hpBefore: before.get(target.instanceId)?.hp ?? target.hp,
        hpAfter: target.hp,
        breakBefore:
          before.get(target.instanceId)?.breakGauge ?? target.breakGauge,
        breakAfter: target.breakGauge,
        tags: [
          "DOWN",
        ].filter(Boolean),
      })),
      momentumBefore,
      momentumAfter: battle.momentum,
      headline: `${actor.name}の「${skill.name}」`,
      detail: `${targets.length > 1 ? "敵全体" : targets[0]?.name}を弱体化`,
    });
  }

  if (actor.fighterId === "minato") {
    actor.comboCount =
      actor.lastSkillId && actor.lastSkillId !== skill.id ? actor.comboCount + 1 : 0;
    if (actor.comboCount >= 2) {
      actor.attackBuff = clamp(actor.attackBuff + 0.12, -0.5, 0.65);
      actor.comboCount = 0;
      if (!actor.traitTriggered) triggerTrait(battle, actor, "異なる技の連続使用で攻撃が上がった。");
    }
  }
  actor.lastSkillId = skill.id;

  const debuffedAlly = living(allies).some(
    (ally) => ally.attackBuff < -0.05 || ally.defenseBuff < -0.05 || ally.speedBuff < -0.05,
  );
  if (debuffedAlly) {
    const amara = living(allies).find(
      (unit) => unit.fighterId === "amara" && !unit.traitTriggered,
    );
    if (amara) {
      living(allies).forEach((ally) => {
        ally.hp = Math.min(ally.maxHp, ally.hp + Math.round(ally.maxHp * 0.08));
      });
      triggerTrait(battle, amara, "味方への不利益を反証し、全員を少し回復した。");
    }
  }

  if (battle.forcedFighterId === actor.fighterId) {
    battle.forcedFighterId = undefined;
    battle.forcedSkillId = undefined;
  }
};

const totalHealthRatio = (units: BattleUnit[]) =>
  units.reduce((sum, unit) => sum + unit.hp / unit.maxHp, 0);

const likelySkill = (unit: BattleUnit, allies: BattleUnit[], enemies: BattleUnit[]) => {
  const usable = unit.skills.filter((skill) => skill.mpCost <= unit.mp);
  const wounded = living(allies).some((ally) => ally.hp / ally.maxHp < 0.48);
  return (
    (wounded ? usable.find((skill) => skill.kind === "heal") : undefined) ??
    (unit.hp / unit.maxHp < 0.3
      ? usable.find((skill) => skill.kind === "guard")
      : undefined) ??
    [...usable].sort(
      (a, b) => skillScore(b, unit, allies, enemies) - skillScore(a, unit, allies, enemies),
    )[0] ??
    unit.skills[0]
  );
};

export const predictedEnemyAction = (battle: BattleState) => {
  const counts = { attack: 0, guard: 0, skill: 0 };
  living(battle.enemy).forEach((enemy) => {
    counts[skillCategory(likelySkill(enemy, battle.enemy, battle.player))] += 1;
  });
  return (Object.entries(counts) as Array<[keyof typeof counts, number]>).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? "attack";
};

const setEnemyIntent = (battle: BattleState, random: RandomSource) => {
  const enemies = living(battle.enemy);
  const likelyIntent = predictedEnemyAction(battle);
  const confidence = clamp(66 + battle.teamTrust * 0.16, 72, 82);
  const alternatives = (["attack", "guard", "skill"] as const).filter(
    (category) => category !== likelyIntent,
  );
  const intent =
    random.next() * 100 < confidence
      ? likelyIntent
      : random.pick(alternatives);
  const lead = enemies
    .map((unit) => ({
      unit,
      skill: likelySkill(unit, battle.enemy, battle.player),
    }))
    .find(({ skill }) => skillCategory(skill) === likelyIntent);
  battle.enemyTell = likelyIntent;
  battle.enemyIntent = intent;
  battle.enemyTellConfidence = Math.round(confidence);
  battle.enemyThreat = lead ? `${lead.unit.name}の「${lead.skill.name}」` : undefined;
};

const shouldOpenTurningPoint = (battle: BattleState) => {
  if (battle.turningPointUsed || battle.turn < 2) return false;
  const playerRatio = totalHealthRatio(battle.player) / battle.player.length;
  const enemyRatio = totalHealthRatio(battle.enemy) / battle.enemy.length;
  const someoneIsPressed = Math.min(playerRatio, enemyRatio) <= 0.82;
  const balanceIsUnclear = Math.abs(playerRatio - enemyRatio) <= 0.22;
  const notableExchange =
    battle.metrics.criticalHits >= 2 ||
    battle.momentum >= 42;
  return (
    (battle.turn === 2 &&
      (someoneIsPressed || balanceIsUnclear || notableExchange)) ||
    battle.turn >= 3
  );
};

export const resolveBattleRound = (
  source: BattleState,
  random: RandomSource,
): BattleState => {
  const battle = copyBattle(source);
  if (battle.status === "ready") battle.status = "running";
  if (battle.status !== "running") return battle;
  battle.presentationEvents = [];
  battle.turn += 1;
  [...battle.player, ...battle.enemy].forEach((unit) => {
    unit.guarding = false;
    unit.evasion = Math.max(
      unit.fighterId === "ushiro" && !unit.traitTriggered ? 0.48 : 0,
      unit.evasion * 0.65,
    );
  });
  const order = [...living(battle.player), ...living(battle.enemy)].sort(
    (a, b) =>
      effectiveStat(b, battle, "speed") -
      effectiveStat(a, battle, "speed") +
      (random.next() - 0.5) * 3,
  );
  for (const actor of order) {
    if (actor.defeated) continue;
    const allies = actor.side === "player" ? battle.player : battle.enemy;
    const enemies = actor.side === "player" ? battle.enemy : battle.player;
    if (living(enemies).length === 0) break;
    act(battle, actor, allies, enemies, random);
  }

  if (living(battle.enemy).length === 0) {
    battle.status = "won";
    pushLog(battle, "実況", "ミミのチーム、勝利です。", "system");
  } else if (living(battle.player).length === 0) {
    battle.status = "lost";
    pushLog(battle, "実況", "試合終了。今回は相手が上でした。", "system");
  } else if (battle.turn >= 10) {
    battle.status =
      totalHealthRatio(battle.player) >= totalHealthRatio(battle.enemy) ? "won" : "lost";
    pushLog(battle, "実況", "規定時間終了。残存戦力で判定します。", "system");
  } else if (shouldOpenTurningPoint(battle)) {
    battle.status = "decision";
    battle.turningPointUsed = true;
    battle.decisionKind = "turningPoint";
    setEnemyIntent(battle, random);
    const playerRatio = totalHealthRatio(battle.player) / battle.player.length;
    const enemyRatio = totalHealthRatio(battle.enemy) / battle.enemy.length;
    battle.decisionReason =
      playerRatio + 0.12 < enemyRatio
        ? "ここをしのげば、まだ流れを戻せる"
        : enemyRatio + 0.12 < playerRatio
          ? "相手が立て直す前に、決め切れる"
          : "次の一手で、試合の空気が変わる";
    pushLog(battle, "実況", "歓声が止まりました。ここが勝負どころです。", "system");
  } else if (battle.turn === 1 || battle.turn === 6) {
    battle.status = "decision";
    battle.decisionKind = battle.turn === 1 ? "opening" : "final";
    setEnemyIntent(battle, random);
    battle.decisionReason =
      battle.turn === 1
        ? "最初の手応えから戦型を決める"
        : "残り時間は少ない。最後の監督指示";
    pushLog(
      battle,
      "ミミ",
      battle.turn === 1
        ? "一巡した。みんなの癖が少し見えた。"
        : "今なら、最後にひとつだけ届く。",
      "system",
    );
  }
  return battle;
};

const resolveLink = (battle: BattleState) => {
  if (battle.momentum < 60) return false;
  const target = [...living(battle.enemy)].sort(
    (a, b) => a.hp / a.maxHp - b.hp / b.maxHp,
  )[0];
  if (!target) return false;
  const hpBefore = target.hp;
  const breakBefore = target.breakGauge;
  const momentumBefore = battle.momentum;
  battle.momentum -= 60;
  const damage = Math.max(
    8,
    Math.round(
      living(battle.player).reduce(
        (sum, unit) => sum + effectiveStat(unit, battle, "attack"),
        0,
      ) / 8,
    ),
  );
  target.hp = Math.max(0, target.hp - damage);
  target.speedBuff = Math.max(-0.45, target.speedBuff - 0.14);
  if (target.hp === 0) target.defeated = true;
  pushLog(battle, "ミミ", `勢いをつないだ連携追撃。${target.name}に${damage}ダメージ。`, "good");
  pushPresentation(battle, {
    actorName: "ミミ",
    skillName: "連携追撃",
    kind: "manager",
    element: "star",
    targetIds: [target.instanceId],
    targets: [
      {
        instanceId: target.instanceId,
        name: target.name,
        hpBefore,
        hpAfter: target.hp,
        breakBefore,
        breakAfter: target.breakGauge,
        value: damage,
        tags: [
          "LINK",
          target.defeated ? "KO" : "",
        ].filter(Boolean),
      },
    ],
    momentumBefore,
    momentumAfter: battle.momentum,
    headline: "ミミの「連携追撃」",
    detail: `${target.name}へ${damage}ダメージ。味方の呼吸がつながった`,
  });
  if (target.defeated) onAllyDefeated(battle, target, battle.enemy);
  return true;
};

const settleTurningPoint = (
  battle: BattleState,
  outcome: NonNullable<BattleState["turningPointOutcome"]>,
) => {
  battle.turningPointOutcome = outcome;
  battle.metrics.turningPoints = (battle.metrics.turningPoints ?? 0) + 1;
  battle.spotlightSide = outcome === "missed" ? "enemy" : "player";

  if (outcome === "seized") {
    living(battle.player).forEach((unit) => {
      unit.attackBuff = clamp(unit.attackBuff + 0.1, -0.5, 0.65);
      unit.magicBuff = clamp(unit.magicBuff + 0.1, -0.5, 0.65);
      unit.speedBuff = clamp(unit.speedBuff + 0.08, -0.45, 0.55);
    });
    pushLog(battle, "実況", "ミミの声に全員が反応した。勝負どころをつかみます。", "good");
  } else if (outcome === "held") {
    living(battle.player).forEach((unit) => {
      unit.defenseBuff = clamp(unit.defenseBuff + 0.1, -0.45, 0.65);
    });
    pushLog(battle, "実況", "流れは渡さない。次の一撃へ踏みとどまりました。", "good");
  } else {
    living(battle.enemy).forEach((unit) => {
      unit.attackBuff = clamp(unit.attackBuff + 0.08, -0.5, 0.65);
      unit.magicBuff = clamp(unit.magicBuff + 0.08, -0.5, 0.65);
    });
    pushLog(battle, "実況", "読みが外れた一瞬を、相手は見逃しません。", "bad");
  }

  const presentation = battle.presentationEvents?.at(-1);
  if (presentation) {
    presentation.headline =
      outcome === "seized"
        ? "勝負どころをつかんだ"
        : outcome === "held"
          ? "流れを渡さなかった"
          : "相手が先に動いた";
    presentation.detail =
      outcome === "seized"
        ? "次の味方行動が、この試合の見せ場になる"
        : outcome === "held"
          ? "守りを整え、次の一手へつないだ"
          : "次の敵行動に警戒が必要";
  }
};

export const applyIntervention = (
  source: BattleState,
  intervention: BattleIntervention,
): BattleState => {
  const battle = copyBattle(source);
  if (battle.status !== "decision") return battle;
  battle.presentationEvents = [];
  const momentumBefore = battle.momentum;
  const wasTurningPoint = battle.decisionKind === "turningPoint";
  let turningPointOutcome: BattleState["turningPointOutcome"];
  let accepted = false;

  if (intervention.type === "pass") {
    const gain = 12 + Math.round(battle.teamTrust / 10);
    battle.momentum = clamp(battle.momentum + gain, 0, 100);
    pushLog(battle, "ミミ", `今は任せる。信頼が勢いを${gain}生んだ。`, "good");
    pushPresentation(battle, {
      actorName: "ミミ",
      skillName: "任せる",
      kind: "manager",
      element: "neutral",
      targetIds: living(battle.player).map((unit) => unit.instanceId),
      targets: [],
      momentumBefore,
      momentumAfter: battle.momentum,
      headline: "監督指示「任せる」",
      detail: `信頼が勢いを${gain}生んだ`,
    });
    turningPointOutcome = battle.teamTrust >= 55 ? "seized" : "held";
    accepted = true;
  } else if (intervention.type === "cheer" && battle.cheerUses > 0) {
    battle.cheerUses -= 1;
    const order = intervention.order ?? "sync";
    living(battle.player).forEach((unit) => {
      if (order === "advance") {
        unit.attackBuff = clamp(unit.attackBuff + 0.3, -0.5, 0.65);
        unit.speedBuff = clamp(unit.speedBuff + 0.15, -0.45, 0.55);
      } else if (order === "endure") {
        unit.defenseBuff = clamp(unit.defenseBuff + 0.22, -0.45, 0.65);
        unit.barrier = Math.min(unit.maxHp * 0.5, unit.barrier + unit.maxHp * 0.08);
      } else {
        unit.magicBuff = clamp(unit.magicBuff + 0.18, -0.5, 0.65);
        unit.attackBuff = clamp(unit.attackBuff + 0.08, -0.5, 0.65);
      }
    });
    if (order === "sync") battle.momentum = clamp(battle.momentum + 14, 0, 100);
    pushLog(
      battle,
      "ミミ",
      order === "advance"
        ? "前へ。先に勝負を動かして！"
        : order === "endure"
          ? "急がなくていい。次の一撃を残して！"
          : "呼吸を合わせて。大技へつなぐ！",
      "good",
    );
    pushPresentation(battle, {
      actorName: "ミミ",
      skillName:
        order === "advance"
          ? "前へ出る"
          : order === "endure"
            ? "耐える"
            : "合わせる",
      kind: "manager",
      element: order === "sync" ? "star" : "neutral",
      targetIds: living(battle.player).map((unit) => unit.instanceId),
      targets: [],
      momentumBefore,
      momentumAfter: battle.momentum,
      headline: `監督指示「${
        order === "advance"
          ? "前へ出る"
          : order === "endure"
            ? "耐える"
            : "合わせる"
      }」`,
      detail:
        order === "advance"
          ? "味方全体の攻撃と速度が上昇"
          : order === "endure"
            ? "味方全体の防御が上がり、障壁を展開"
            : "味方全体の魔力と勢いが上昇",
    });
    turningPointOutcome = "seized";
    accepted = true;
  } else if (intervention.type === "read" && battle.readUses > 0) {
    battle.readUses -= 1;
    const actual = battle.enemyIntent ?? predictedEnemyAction(battle);
    battle.predictedAction = intervention.prediction;
    if (actual === intervention.prediction) {
      if (actual === "attack") {
        living(battle.player).forEach((unit) => {
          unit.defenseBuff = clamp(unit.defenseBuff + 0.24, -0.45, 0.65);
          unit.barrier = Math.min(unit.maxHp * 0.5, unit.barrier + unit.maxHp * 0.1);
        });
      } else if (actual === "guard") {
        living(battle.enemy).forEach((unit) => {
          unit.defenseBuff = clamp(unit.defenseBuff - 0.25, -0.45, 0.65);
        });
      } else {
        living(battle.enemy).forEach((unit) => {
          unit.mp = Math.max(0, unit.mp - 14);
          unit.speedBuff = clamp(unit.speedBuff - 0.22, -0.45, 0.55);
        });
      }
      battle.momentum = clamp(battle.momentum + 18, 0, 100);
      pushLog(battle, "ミミ", "読めた。相手の狙いへ先回りした！", "good");
    } else {
      pushLog(battle, "ミミ", "読みは外れた。情報だけは残った。", "bad");
    }
    pushPresentation(battle, {
      actorName: "ミミ",
      skillName: "読む",
      kind: "manager",
      element: "star",
      targetIds:
        actual === intervention.prediction
          ? living(battle.enemy).map((unit) => unit.instanceId)
          : [],
      targets: [],
      momentumBefore,
      momentumAfter: battle.momentum,
      headline:
        actual === intervention.prediction
          ? "読み成功"
          : "読みは外れた",
      detail:
        actual === intervention.prediction
          ? "敵の次手へ先回りし、対抗策が発動"
          : "効果は得られないが、指示機会は続く",
    });
    turningPointOutcome =
      actual === intervention.prediction ? "seized" : "missed";
    accepted = true;
  } else if (intervention.type === "shift" && battle.shiftUses > 0) {
    battle.shiftUses -= 1;
    battle.plan = intervention.plan;
    pushLog(
      battle,
      "ミミ",
      `戦型を${intervention.plan === "assault" ? "攻勢" : intervention.plan === "guarded" ? "堅守" : "均衡"}へ変更。`,
      "good",
    );
    pushPresentation(battle, {
      actorName: "ミミ",
      skillName: "戦型変更",
      kind: "manager",
      element: "neutral",
      targetIds: living(battle.player).map((unit) => unit.instanceId),
      targets: [],
      momentumBefore,
      momentumAfter: battle.momentum,
      headline: "戦型変更",
      detail: `${
        intervention.plan === "assault"
          ? "攻勢"
          : intervention.plan === "guarded"
            ? "堅守"
            : "均衡"
      }へ切り替えた`,
    });
    turningPointOutcome = "held";
    accepted = true;
  } else if (intervention.type === "force" && battle.forceUses > 0) {
    const unit = battle.player.find(
      (candidate) =>
        candidate.fighterId === intervention.fighterId && !candidate.defeated,
    );
    const skill = unit?.skills.find(
      (candidate) => candidate.id === intervention.skillId,
    );
    if (unit && skill && skill.mpCost <= unit.mp) {
      battle.forceUses -= 1;
      battle.forcedFighterId = unit.fighterId;
      battle.forcedSkillId = skill.id;
      unit.hp = Math.max(1, unit.hp - Math.round(unit.maxHp * 0.08));
      unit.defenseBuff = Math.max(-0.45, unit.defenseBuff - 0.1);
      battle.momentum = Math.max(0, battle.momentum - 15);
      pushLog(battle, "ミミ", `${unit.name}に契約権限で${skill.name}を命じた。反動が残る。`, "bad");
      pushPresentation(battle, {
        actorName: "ミミ",
        skillName: "強制指示",
        kind: "manager",
        element: "neutral",
        targetIds: [unit.instanceId],
        targets: [],
        momentumBefore,
        momentumAfter: battle.momentum,
        headline: `強制指示「${skill.name}」`,
        detail: `${unit.name}は次の行動で命令された技を使う。HPと防御に反動`,
      });
      turningPointOutcome = "seized";
      accepted = true;
    }
  } else if (intervention.type === "link") {
    accepted = resolveLink(battle);
    if (accepted) turningPointOutcome = "seized";
  }

  if (!accepted) return source;
  if (wasTurningPoint) {
    settleTurningPoint(battle, turningPointOutcome ?? "held");
  }
  battle.metrics.interventions += 1;
  battle.status = "running";
  battle.decisionReason = undefined;
  battle.decisionKind = undefined;
  battle.enemyTell = undefined;
  battle.enemyIntent = undefined;
  battle.enemyTellConfidence = undefined;
  battle.enemyThreat = undefined;
  return battle;
};
