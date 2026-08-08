# Battle System Redesign

Updated: 2026-07-24

## Baseline Score: 24 / 100

The original battle was a short stat race. Roles changed base numbers, but all
fifteen character traits were display-only. Several skill notes did not match
their effects. Targets were mostly random, the four AI personalities only
changed skill-use probability, and the three pre-match plans were scalar stat
modifiers. A manager decision offered one generic buff, one three-way guess,
one forced skill, or no action.

## Design Targets

1. Team order, AI policy, traits, elements, and equipment must produce different
   outcomes without requiring manual control every turn.
2. The player must be able to explain why a battle is moving toward victory or
   defeat by looking at the screen.
3. Important intervention choices must solve different tactical problems.
4. Battles should normally last four to eight rounds and stop for no more than
   three manager decisions.
5. Randomness may create uncertainty, but it must not hide the governing rules.

## Adopted References

- Final Fantasy XII: situational AI sets and direct overrides.
- Unicorn Overlord: ordered conditional tactics and target priorities.
- Octopath Traveler: Break as a visible setup-and-payoff cycle.
- Dragon Quest: allocate a shared tension-like resource to decisive actions.
- Teamfight Tactics: reduce invisible power and make key combat events readable.
- Into the Breach: show threats early enough for a decision to matter.

## Tactical Layers

### Formation

The active-team order is the formation: front, middle, rear. Front fighters draw
more single-target attacks and resist damage. Rear fighters are targeted less
often and gain magic output, but physical attacks are weaker.

### AI Policy

Each fighter receives one policy before battle:

- Signature: role-aware use of the character's full kit.
- Burst: spend MP and exploit weaknesses or vulnerable targets.
- Support: heal, guard, buff, and debuff before attacking.
- Conserve: protect MP and use costly skills only in a crisis.

### Break

Damage and debuffs add Break. Weakness hits and critical hits add more. At 100,
the target loses an action and takes increased damage. Break is shown beside HP
and MP.

### Momentum

The team gains Momentum from weakness hits, critical hits, Breaks, and trusting
fighters to act. At 60, the manager can trigger a coordinated follow-up. Forced
orders consume Momentum.

### Character Traits

Every trait in the roster data has a mechanical trigger. Trait activation is
logged and counted in the battle result.

## Manager Decisions

- Rally: choose attack, defense, or synchronization.
- Read: predict the enemy category and apply a category-specific counter.
- Shift: change the team plan once during battle.
- Force: spend ownership authority to force one affordable skill with recoil.
- Link: spend Momentum for a coordinated Break and tempo swing.
- Entrust: make no direct order and gain Momentum from team trust.

## Technical Decisions

- Keep the battle state JSON-serializable and transition it through pure
  functions.
- Keep XState for application phases and seedrandom for deterministic battles.
- Use Zod to validate battle-facing roster content.
- Use fast-check to fuzz seeds, tactics, plans, and difficulties.
- Do not adopt boardgame.io: its multiplayer, turn ownership, and networking
  layers duplicate the current store and statechart.
- Do not adopt a stateful behavior-tree runtime: transient tree instances would
  fight persisted deterministic battle state. Ordered policy rules provide the
  useful part of the pattern without hidden runtime state.

## Implementation Audit

### Iteration Scores

| Iteration | Score | Main finding |
| --- | ---: | --- |
| Baseline | 24 / 100 | A short stat race; traits and several skill notes were cosmetic. |
| Core rewrite | 63 / 100 | Good pacing, but manager choices changed win rate by only 6.7 points. |
| First rendered build | 78 / 100 | Formation and six calls were readable; debuffs double-counted Break and the tell classification was vague. |
| Interaction audit | 86 / 100 | The next manager window retained the previous submenu, and the displayed tell was secretly a guaranteed answer. |
| System audit | 92 / 100 | Tactical layers were measurable, but this score incorrectly treated a static HUD and combat log as readable play. |
| Player-experience reset | **0 / 100** | A round resolved at once, future actions leaked through the log, and the viewer could not follow cause and effect. |
| Action replay | 58 / 100 | Source, target, skill, and damage appeared in sequence, but future KO states still leaked. |
| Causal replay | 79 / 100 | HP, MP, Break, KO, and the visible feed followed the active action. |
| Impact timing | 88 / 100 | Wind-up and impact were separated; outcomes and Momentum appeared only on impact. |
| Final player audit | **93 / 100** | Reactive traits follow their trigger, multi-target actions group cleanly, and desktop/mobile information hierarchy is legible. |

### Final Rubric

- Source, target, and action recognition: 20 / 20
- Cause-and-effect timing: 19 / 20
- State-change readability: 18 / 20
- Manager agency and feedback: 18 / 20
- Pacing and replay controls: 9 / 10
- Responsive hierarchy and accessibility: 9 / 10

### Verified Results

- Five test files and 22 tests pass.
- Property tests fuzz 300 generated seeds and difficulties.
- Presentation tests reconstruct HP, Break, and Momentum in event order and
  reject discontinuous future-state snapshots.
- The rendered battle shows only the current and previous action; unresolved
  events never enter the visible feed.
- Wind-up shows the actor, skill, and target. Damage, healing, KO, Break, MP,
  and Momentum update together at impact.
- Reactive traits and trait healing are emitted after the attack that triggered
  them.
- Normal-route battles average roughly six to seven rounds with about two to
  three manager windows.
- A managed normal team gains more than ten win-rate points over a passive team
  in the balance audit.
- All fifteen roster traits activate in reachable simulations.
- Burst AI spends materially more MP than Conserve AI over repeated matches.
- Enemy tells are useful but fallible: their measured accuracy is constrained to
  68-84 percent.
- Battle state, tactical resources, and content mechanics are validated for
  deterministic replay and bounded values.

### Research Sources

- Unicorn Overlord official tactical tips:
  https://unicornoverlord.atlus.com/media/pdf/unicorn_overlord_tips_v2.pdf
- Final Fantasy XII Gambits:
  https://eu.finalfantasy.com/news/147
- Octopath Traveler Break and Boost:
  https://na.store.square-enix-games.com/octopath-traveler-0
- Teamfight Tactics combat-clarity retrospective:
  https://teamfighttactics.leagueoflegends.com/en-us/news/dev/dev-teamfight-tactics-galaxies-learnings/
- Riot Games visual-effects curriculum:
  https://www.riotgames.com/en/artedu/visual-effects
- Riot Games UI curriculum:
  https://www.riotgames.com/en/artedu/user-interface-design
- Riot Games gameplay-clarity shader case study:
  https://www.riotgames.com/en/news/valorant-shaders-and-gameplay-clarity
- Into the Breach GDC design postmortem:
  https://www.gdcvault.com/play/1025772/-Into-the-Breach-Design
- fast-check property testing:
  https://fast-check.dev/
- Zod schema validation:
  https://zod.dev/

## Remaining Work

The remaining seven points require observed player sessions rather than more
HUD features: first-time comprehension timing, color-vision checks on physical
devices, battle-audio direction, and matchup retuning after the roster grows.
The event contract now exposes the action order needed for those tests without
changing combat simulation.
