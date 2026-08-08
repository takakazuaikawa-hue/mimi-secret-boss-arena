# Completion Audit - 2026-07-28

## Purpose

This document is the source of truth for the large-scale incomplete-work audit of
`Mimi no Tokimeki Ura-Boss Arena`.

An item is not complete merely because:

- a screen exists,
- a test passes,
- a design document says it is complete,
- an asset file exists, or
- the happy path works once.

Completion requires agreement between the original requirement, implementation,
content/assets, rendered behavior, and player-facing quality.

## Audit Rules

1. Record every investigation, command category, artifact, change, and failure.
2. Separate `confirmed incomplete` from `not yet verified`.
3. Attach concrete evidence to every confirmed finding.
4. Do not lower severity because a workaround exists.
5. Re-audit this audit before closing it.
6. Detection comes before broad fixes so later work cannot hide the original gap.

## Confirmed Decision-Criteria Failures

These are not isolated bugs. They are invalid standards that previously produced
many downstream mistakes.

1. **Reference mechanics were allowed to outrank the requested experience.**
   The Pyre comparison introduced roster loss even though keeping and perfecting a
   favorite team is central to this game.
2. **Theme variables were mistaken for recurring player intent.**
   Trust and ownership belong in the long arc and battle model; they are not an
   interesting answer to “what do I want to do in this scene?” every week.
3. **System differentiation was mistaken for meaningful choice.**
   Different hidden meter deltas do not make two options meaningful when their
   practical action, story path, and later response remain the same.
4. **Automated pass rates and self-scores were allowed to substitute for rendered
   player comprehension.**
   The first revised choice tests passed, but the rendered screen still showed the
   same generic intent and promise for both options. The defect was visible only
   when the choice was read as a player would read it.
5. **Presence was mistaken for completion.**
   Authored epilogue text, gallery assets, Hall-of-Fame data, and a final-match ID
   were counted as features despite missing playable delivery or payoff.
6. **Quantity was mistaken for authored variety.**
   A large choice/text count concealed repeated templates and generic inference.

New work must be rejected when it satisfies data volume or system tests but fails
to communicate a distinct player goal, expected tradeoff, and later consequence
in the rendered game.

## Status Legend

- `CONFIRMED`: Evidence proves the work is incomplete or contradictory.
- `VERIFY`: The requirement exists, but implementation and rendered behavior have
  not both been checked.
- `PASS`: Requirement, implementation, assets, and behavior were checked.
- `BLOCKED`: Verification could not be completed; the reason must be recorded.

## Work Log

| No. | Work performed | Result / evidence |
| ---: | --- | --- |
| 001 | Identified the active project and local app | Project: `C:\Users\takakazu\projects\mimi_secret_boss_arena`; app: `http://127.0.0.1:5175/`. |
| 002 | Listed the project root | Found source, public assets, docs, scripts, build output, and unmanaged temporary image files in both the root and `tmp/`. |
| 003 | Searched source and content for TODO/FIXME/HACK/placeholder/stub markers | No reliable marker list was found. This does not prove completion because most known gaps are semantic and visual. |
| 004 | Read the existing design and audit documents | Reviewed `GAME_DESIGN`, `ARCHITECTURE`, `ONBOARDING_DESIGN`, `BATTLE_SYSTEM_REDESIGN`, `QUALITY_AUDIT`, and `PLAYER_UX_AUDIT`. |
| 005 | Compared the current prologue length with onboarding rules | Current prologue is 48 advances; onboarding documents and their scoring model specify a 27-advance upper bound. The documents and current implementation contradict each other. |
| 006 | Inspected human-shaped standing-picture source assets | The inspected character sprites are primarily waist/thigh-up crops. Feet are absent in the source files, so layout changes cannot restore them. |
| 007 | Inspected existing audit claims against the standing-picture defect | Existing 92/100 audits did not detect the repeated missing-feet problem. Their scores cannot be treated as current completion evidence. |
| 008 | Reviewed explicit omissions already recorded by the old quality audit | It admits that a human 90-minute read-through, full proofreading of all 15 character event sets, and Hall-of-Fame free-battle verification were not performed. |
| 009 | Reviewed repository hygiene and generated intermediates | Found root `tmp-title-desktop.png`, `tmp-title-mobile.png`, plus contact sheets, crops, QA screenshots, and generation references under `tmp/`. |
| 010 | Reviewed attribution coverage | `ATTRIBUTIONS.md` lists only a small early subset of generated assets and does not cover the current title, character, background, and event-CG set. |
| 011 | Loaded the frontend testing/debugging procedure | The rendered audit must check page identity, nonblank content, framework overlay, console health, screenshots, and interaction evidence on desktop and mobile where practical. |
| 012 | Created this durable audit ledger | Further static, asset, text, battle, save-data, and rendered checks will be appended here. |
| 013 | Inventoried source size and screen components | `App.tsx` is 5,967 lines and contains 19 screen/component functions; `styles.css` is 14,777 lines. An unused `LegacyTitleScreen` remains in production source. |
| 014 | Checked UTF-8 integrity after PowerShell displayed mojibake | Node read the underlying files as valid UTF-8 with no replacement characters. The mojibake was a terminal display artifact and was not recorded as a product defect. |
| 015 | Inspected state-machine phases and archive behavior | The only phases are title, prologue, week, event, outcome, management, match prep, battle, ending, and archive. Archive supports viewing Hall-of-Fame entries, collections, and gallery images only. |
| 016 | Searched for post-game battle implementations | No free-battle or past-team tournament state, command, screen, or battle creation path exists. `SYS-001` is confirmed incomplete. |
| 017 | Inspected save-store and Hall-of-Fame snapshots | Campaign state, profile, archived fighter snapshots, formation, plan, and tactics are persisted. Corruption/error handling remains pending verification. |
| 018 | Measured CSS cascade repetition | 36 media queries, 8 `!important` declarations, and many selectors redefined 4-9 times; comments explicitly rely on “final cascade guard” ordering. |
| 019 | Inspected audio implementation and calls | Only three short casino effects (`ui`, `reward`, `bet`) are wired. There is no BGM, ambience, voice, battle-skill sound set, or scene-based audio control. |
| 020 | Added `scripts/completion-audit.mjs` | Repeatable static checks now cover missing references, unused media, oversized source, repeated CSS selectors, explicit markers, legacy title code, and temporary artifacts. |
| 021 | Corrected self-referential marker noise in the audit script | Explicit-marker scanning now targets runtime source only; current source has no TODO/FIXME/HACK/placeholder markers. |
| 022 | Ran the static completion audit | 74 runtime asset references, zero missing references, 134 media files, 60+ unreferenced media files, and extensive CSS selector repetition were reported. |
| 023 | Attempted image analysis with the default `python` command | Failed because `python` is not on PATH. This was an environment failure, not an asset result. |
| 024 | Loaded the bundled workspace runtime | Located the bundled Python executable and packages for repeatable image analysis. |
| 025 | Added and ran `scripts/image-asset-audit.py` | Read all 79 images successfully; total image size is 142,043,762 bytes. Forty-five images are approximately 1672x941 and many exceed 2 MB. |
| 026 | Compared standing-picture dimensions | Regular cropped sprites are mostly about 353-599x605, while three true-form assets are 1024x1536 or taller. The visual specification is inconsistent. |
| 027 | Attempted tests through PowerShell `npm` | Failed because the machine blocks `npm.ps1`. Retried with `npm.cmd`. |
| 028 | Attempted Vitest inside the filesystem sandbox | Failed because esbuild could not read the parent directory ACL. Retried with approved normal execution. |
| 029 | Ran the complete automated test suite | 6 files and 46 tests passed in 23.37 seconds. Passing tests do not cover the confirmed visual and narrative-quality defects. |
| 030 | Ran the production build | TypeScript and Vite build passed. Output: 144 files, 137.39 MiB; CSS 203.73 KB, application JS chunks approximately 862 KB before gzip. |
| 031 | Ran the existing text-volume audit | Reported 2,897 Japanese strings and 61,791 characters across data sources. It measures authored volume, not per-run exposure or prose quality. |
| 032 | Ran the balance audit with verbose metrics | No-search averages 4.04 recruits; search-heavy averages 6.88. Normal managed win rate is 68.1% versus 57.74% passive; domination managed win rate is 50.07%. |
| 033 | Reviewed simulation-test methodology | Weekly simulations skip the actual official-match flow. Battle balance resets a fixed three-person roster for every match instead of using one campaign’s developed team. |
| 034 | Inspected story construction and ending rendering | Four stages use shared choices across 14 characters. Epilogues are not scheduled as scenes and are flattened into one paragraph on the ending/archive screens. |
| 035 | Added and ran `scripts/content-runtime-audit.ts` through Vite SSR | 180 fighter choices contain only 76 unique labels; 8 labels are each reused 14 times (112 repeated uses). Across 600 simulated runs, zero epilogue scenes were reached. |
| 036 | Measured character illustration coverage | Non-opening characters usually have one encounter CG and one character-specific later CG. Five of seven story stages generally use shared backgrounds plus standing art only. |
| 037 | Inspected battle playback code | AI rounds resolve automatically, but each presentation result requires player clicks. Combatants move forward, targets react, and results include weakness/BREAK/damage summaries. |
| 038 | Compared displayed AI reasoning with actual AI scoring | The UI labels a four-item generic tactic description as “AI’s aim”; it does not expose the actual HP, weakness, score, target, or skill-selection reason used by battle logic. |
| 039 | Attempted `npm audit` in the sandbox | Failed because registry network access was blocked. |
| 040 | Requested normal-environment `npm audit` | Rejected because it would send the dependency inventory to the public npm service without specific approval. No workaround was attempted; dependency vulnerability status is `BLOCKED`. |
| 041 | Inspected save controls and replacement behavior | Starting a new run immediately replaces the active run. There is no confirmation, backup slot, profile reset, or corruption-recovery UI; the existing `clearRun` action is unreachable. |
| 042 | Inspected accessibility hooks in source | Dialogue has keyboard advance, major overlays have Escape handlers, and a global reduced-motion rule exists. Focus trapping/restoration and full keyboard flows still require rendered testing. |
| 043 | Traced player preference fields | `dialogueMode` is persisted and has a setter but is never read by the UI or narrative renderer; migration always forces it to `step`. |
| 044 | Started rendered QA with workspace Playwright | Desktop 1280x800 and mobile 390x844 title screens rendered without horizontal overflow, console errors, blank output, or framework overlay. |
| 045 | Inspected the rendered route-selection sheet | Normal route content, locked routes, 26-week/90-minute expectation, and primary action were visible. No runtime error was observed. |
| 046 | Attempted a 48-page prologue traversal in Node REPL | Timed out and reset the browser kernel at 60 seconds. |
| 047 | Retried prologue traversal with fewer screenshots and a 120-second budget | Timed out again because repeated Playwright interactions did not complete. |
| 048 | Retried in ten-page chunks | Browser setup/first interaction timed out before a stable reusable session was returned. |
| 049 | Attempted the direct in-app browser client | Connection did not complete before the Node REPL timeout. |
| 050 | Supplied bundled Playwright to the existing onboarding script | Sandboxed execution timed out after 164 seconds; approved normal execution also timed out after 124 seconds. |
| 051 | Attempted to identify residual headless browser processes | PowerShell/WMI process queries also timed out; no process was terminated to avoid affecting the user's browser. |
| 052 | Audited final-opponent construction | Every match, including the final demon king, selects three ordinary recruitable fighter definitions not already on the active team and applies a difficulty scale. |
| 053 | Audited battle-format coverage | No dedicated individual/1v1 competition flow exists; the campaign and battle state are built around up to three active fighters versus three enemies. |
| 054 | Added zero-roster reachability metrics to the campaign audit | Across 200 runs per policy: zero available fighters occurred in 4.5% of no-search runs, 0% of search-heavy runs, and 39% of focus-first runs. |
| 055 | Traced the zero-roster final-week behavior | The match is queued with an empty team, the match-prep start button is disabled, and normal/chaos routes have no retire action. The campaign cannot finish. |
| 056 | Expanded choice duplication auditing to all fighter, ambient, and route scenes | Script updated; execution remains pending because the local browser/process slowdown affected command responsiveness. |
| 057 | Ran the expanded all-content choice audit | 352 choices have 247 unique labels. Outside the fighter template problem, only one ambient label is duplicated twice. |
| 058 | Reviewed research traceability | Reference documents cite primary/official material and some secondary writing guidance. Their high self-scores still rely on system checks rather than observed player sessions. |
| 059 | Searched all runtime text for prohibited meta-language | Found repeated in-world uses of “secret boss,” “run,” and a fictional copy of the game’s own complete strategy guide. |
| 060 | Compared meta-language tests with actual coverage | The current content test rejects meta terms only inside Gidono’s scenes, leaving ambient, route, weekly, ending, and UI narrative copy unchecked. |
| 061 | Audited memory-gallery coverage against authored CGs | Gallery contains eight generic/Gidono memories and omits all 14 non-opening encounter CGs and 14 later character CGs. |
| 062 | Traced retained-contract ending copy | Character status says a retained fighter has unlocked an epilogue, but ending/archive epilogue content is gated to actually liberated fighters. |
| 063 | Compared first-week action effects with its fixed event | All actions lead to Gidono recruitment. Work gains money; play spends money with no trust target; search spends money and worsens condition; onboarding hides numeric effects. |
| 064 | Checked the first-three-fighter guarantee | Until three fighters are available in weeks 1-3, every action has guaranteed recruitment, so search pays its cost/risk without improving recruitment probability. |
| 065 | Asked the user to confirm the meaning of liberation before continuing | User confirmed that contract liberation must not take away a character the player deliberately raised. |
| 066 | Traced the origin of the liberation-departure rule | The assistant introduced it through a Pyre analogy, then incorrectly promoted it into design docs, tests, UI copy, and prior self-scoring. It was not a user requirement. |
| 067 | Removed liberation-based roster exclusion from runtime systems | Updated availability, focus, growth, equipment, formation, match setup, battle creation, condition drift, save migration, Hall-of-Fame capture, and UI controls. |
| 068 | Rewrote liberation choices and messaging | Contract release now sets ownership to zero while preserving the fighter, equipment, active slot, growth access, and focus. Both relationship choices count as liberation. |
| 069 | Corrected design and reference documents | User intent now outranks borrowed reference mechanics; Pyre-style roster loss is explicitly rejected. |
| 070 | Audited the choice framework after user escalation | Confirmed that generic intent/promise text was inferred from trust/ownership deltas, making theme variables the repeated surface decision instead of a scene-specific goal. |
| 071 | Researched intentional and meaningful choice design | Choice of Games requires the player's intention, likely result, and relative risk to be legible before choosing; GDC references emphasize micro and macro follow-through. |
| 072 | Changed the choice UI information hierarchy | Removed trust/ownership arrows from choice previews and result receipts. Choices now lead with concrete action, expected benefit/cost, and remembered consequence. |
| 073 | Added choice follow-through | Liberation scenes now remember the earlier crisis choice; shared join/bond/power/liberation templates gained authored intent, cost, and memory text. |
| 074 | Ran TypeScript verification | `tsc --noEmit` passed. |
| 075 | Ran targeted liberation/campaign/store regression tests | 15 of 17 passed initially. Two old expectations encoded the rejected departure rule or brittle memory wording; both tests were corrected. |
| 076 | Ran the complete automated suite after corrections | All 6 test files and 47 tests passed. |
| 077 | Rendered the first choice at 1280x800 and 390x844 | The first pass was correctly rejected despite green tests: both options still showed the same inferred intent and promise because the saved event contained old resolved content. |
| 078 | Cleared isolated QA storage and replayed the prologue from a fresh state | Verified the new event data, avoiding a false failure from persisted old choice payloads. |
| 079 | Re-rendered the first choice after authored intent/cost text | Option 1 clearly offers a three-minute conversation with no extra pay; option 2 secures registration and 400G before hearing the full story. No horizontal overflow at 390px. |
| 080 | Rendered the choice-result screen | The result leads with the selected action, authored scene outcome, remembered consequence, and unlocks; trust/ownership deltas no longer dominate the receipt. |
| 081 | Checked browser console during the rendered flow | No application errors. Repeated unused-preload warnings for `weekly-hub/work.webp` remain and are covered by loading/performance findings. |
| 082 | Replaced shared character-choice templates | Added dedicated join, bond, power, crisis, and liberation actions and outcome prose for every non-opening fighter; Gidono retains his separately authored scenes. |
| 083 | Added a uniqueness gate for major character choices | Across meet, join, bond, power, crisis, and liberation, all 30 labels and all 30 immediate outcomes per stage must be unique. The targeted content test passes. |
| 084 | Added cross-scene choice callbacks | The next character stage inserts the remembered consequence of the prior choice into the visual-novel text; the crisis decision returns during liberation. |
| 085 | Re-ran full regression before the final callback change | All 6 files and 48 tests passed after full character-choice authoring. |
| 086 | Verified the final callback change after broad runs became unstable | TypeScript passed; targeted liberation callback and all-character choice-uniqueness tests passed. Three later broad Vitest attempts timed out during environment stalls and are not reported as passes. |
| 087 | Reconciled product intent before beginning the next rebuild pass | Created `PRODUCT_DIRECTION.md` as the top-level product standard and `REBUILD_ROADMAP.md` as the dependency-ordered implementation ledger. |
| 088 | Compared current quality criteria with the corrected liberation requirement | Confirmed that `QUALITY_AUDIT.md` still contains an obsolete scoring condition requiring liberation to reduce available battle strength, despite its own invalidation notice. Phase 0 must remove this and other contradictory criteria before implementation scoring resumes. |
| 089 | Recorded the user's correction of the product hierarchy and audience | The product's main value is a bright, funny, unprecedented novel-game experience people want to recommend. Otome-style character presentation and readable battles follow; team building is a method, and liberation is a provisional narrative device. The primary audience is ordinary Japanese visual-novel players aged middle-school and above, with strategy and growth designed for light users. |
| 090 | Reordered the rebuild around the corrected product | Updated `PRODUCT_DIRECTION.md` and `REBUILD_ROADMAP.md`; narrative master design and a completion-quality opening vertical slice now precede full-loop balance, battle depth, bulk text, and asset production. |
| 091 | Audited current content as a novel-reading experience | Prologue, weekly narration, route events, match premises, and character profiles contain several strong recommendable incidents, but the 26-week narration and most character psychology repeatedly converge on contracts, ownership, permission, and liberation. |
| 092 | Defined the revised narrative skeleton and opening vertical slice | Added `NARRATIVE_EXPERIENCE_AUDIT.md` and `NARRATIVE_MASTER_PLAN.md`, including comedy rules, seven-act emotional progression, light-user system principles, and an Act 0-1 completion-quality validation target. |
| 093 | Compared all 15 recruitable characters for narrative repetition | Added `CHARACTER_DISTINCTION_MATRIX.md`; assigned distinct dominant emotions, comedy modes, and ways Mimi changes, while limiting contract-liberation climaxes. |
| 094 | Reframed all 26 weeks as a reading-experience progression | Added `WEEKLY_EXPERIENCE_MATRIX.md`; each week now has a proposed emotional function, system role, and primary change from the current contract-heavy narration. |
| 095 | Classified screens and features by their contribution to the novel experience | Added `SCREEN_ROLE_MATRIX.md`; the opening narrative, choice delivery, weekly story selection, first battle, and result callback form the initial completion-quality path. |
| 096 | Specified the first four weeks as a completion-quality vertical slice | Added `OPENING_VERTICAL_SLICE_SPEC.md`, covering scene order, opening-action variants, carry-forward consequences, random-roster constraints, first-match narrative requirements, assets, timing targets, and validation questions. |
| 097 | Authored the first concrete rewrite instead of stopping at planning | Added `OPENING_SCRIPT_V1.md`, covering the shortened prologue, four distinct first-week routes into Gidono's encounter, two concrete first choices, and recruitment. |
| 098 | Defined persistent callbacks for opening decisions | Added `OPENING_CHOICE_CALLBACKS.md`; every opening action and Gidono decision has authored callbacks in week 2 and the first official match, with optional week-3 effects. |
| 099 | Received a player-led review from title through the first official match | The player abandoned battle judging because the opening hook, Mimi's voice, world explanation, tutorial, ownership chronology, work specificity, common story, reveal staging, inline narration, recruitment choice, management layout, tournament rationale, and battle presentation were below a reviewable state. |
| 100 | Verified viewport ownership and inconsistent layout contracts | Players are not expected to resize the game manually. Story text uses a 1080px cap, general pages 1240px, management a separate full-width/1280 rule, status a three-column 1130px+ structure, and match prep another set of duplicate rules. |
| 101 | Verified that current flow contradicts Mimi's ownership chronology | The title and route UI call Mimi an owner before the prologue, route selection happens before the story, and week 4 is a new-owner cup. Corrected requirement: a dispatched bunny who later inherits owner rights accidentally from the previous owner. |
| 102 | Verified the separate alternate prose source | `DialogueLine.cue` is rendered as a separate styled block below normal prose. This was an intentional but incorrect presentation feature, not a font-wrapping bug. |
| 103 | Verified the premature-standing-art bug | Event rendering uses nullish fallback, so `sprite: null` falls back to the fighter's default standing art instead of suppressing it before the reveal CG. |
| 104 | Verified forced recruitment and invalid Gidono choices | Every resolved `meet` scene automatically sets `recruited = true`; the fighter-registration option has no established player or Mimi motivation and there is no decline or defer path. |
| 105 | Invalidated the opening V1 draft and created a correction gate | Added `PLAYER_REVIEW_CORRECTIONS.md`; the opening V1 and current vertical-slice spec are non-authoritative until all correction areas are resolved. |
| 106 | Corrected two isolated presentation defects | `sprite: null` now explicitly suppresses fallback standing art, and authored `cue` prose is rendered inside the normal paragraph instead of as a separate styled voice. TypeScript verification passed; the full production build timed out and is not reported as passing. |
| 107 | Rebuilt Mimi's voice standard before rewriting the opening | Added `MIMI_VOICE_BIBLE_V1.md` with personality, prose rhythm, emotional modes, prohibited habits, examples, and ten first-line candidates. |
| 108 | Rebuilt the common-story ownership and tournament causality | Added `MIMI_COMMON_STORY_ARC.md`. The campaign now starts with dispatched work, separates encounter from recruitment, transfers owner rights accidentally, reveals each right through a story problem, and gives every tournament a distinct narrative cause, player-facing stake, and win/loss consequence. Updated the product, narrative, weekly, correction, and roadmap documents to match. |
| 109 | Finalized the transfer incident without humiliating the previous owner | The madam voluntarily attempts to return her lottery prize; an ambiguous on-site representative field misregisters Mimi as provisional owner. The madam immediately helps correct it and apologizes with tea and the colosseum confection “Yatsuzaki Daifuku,” a refined strawberry daifuku that appears to drip blood-red strawberry sauce. |
| 110 | Wrote the replacement opening through the ownership accident | Added `OPENING_COMMON_SCRIPT_V2.md` with authored first-person prose, screen direction, player-paced tutorial beats, three concrete work paths, a CG-first Gidono encounter with no recruitment, the madam's good-faith return procedure, the three-way misunderstanding, and a final hook into the first entry notice. |
| 111 | Continued the opening without waiting for another user prompt | Extended `OPENING_COMMON_SCRIPT_V2.md` through the first-match entrance. Added the Yatsuzaki Daifuku apology scene, a real withdrawal inquiry, the candidate-room consequence, consent-based Gidono recruitment/defer/decline paths, progressive status/growth/formation tutorials, explicit tournament purpose and stakes, and the pre-match emotional beat. |
| 112 | Removed the invented room-protection motivation after user correction | The first tournament is now an optional beginner tutorial entered because Mimi wants its hot-spring-trip prize. Ordinary training monsters are hopelessly outmatched by the accidentally assembled secret-boss-class team; the team wins too easily and is automatically raised to the highest rank. Added a fixed week-5 hot-spring trip with character-specific scenes before the second official tournament. |
| 113 | Started implementation instead of ending on another future-tense promise | Added `prologueV2.ts`, switched the app to the new dispatched-worker opening, made NEW GAME start the normal prologue directly instead of opening the pre-story route picker, and changed the title action and transition copy accordingly. TypeScript and the production build pass. Rendered interaction QA remains open because neither the Browser plugin nor a local Playwright installation is available in this task. |
| 114 | Separated encounter, recruitment, and decline in runtime state | `meet` now records acquaintance without adding the fighter to the roster. A later `join` scene performs recruitment only after a join choice; every fighter has a distinct decline choice, and declined fighters are not automatically prompted again. Updated the content schema and regression tests. All 48 tests and TypeScript pass. |
| 115 | Added explicit employee-to-owner progression | `RunState` now distinguishes employee, provisional owner, and owner. The first weekly screen is presented as paid dispatch work rather than team management; the ownership-transfer incident is a required follow-up after Gidono's first encounter. |
| 116 | Implemented the good-faith accidental transfer scene | The madam tries to return her lottery-won rights, immediately requests correction when Mimi is misregistered, and apologizes with tea and blood-red strawberry “Yatsuzaki Daifuku.” The player learns only the rights needed at that point. |
| 117 | Prevented the empty-management-screen failure | A provisional owner with no recruited fighter now receives an authored handover screen instead of a blank team-management view. It explicitly confirms that no fighter was registered automatically and that recruitment remains a later player decision. |
| 118 | Rebuilt first-week actions as concrete dispatch jobs | The four choices are now serving guests, reception support, rest, and inventory checking, with explicit wages or recovery. Normal owner costs and trust effects do not apply before ownership. |
| 119 | Implemented the corrected first tournament | The old new-owner welcome cup is replaced by a hot-spring-prize beginner tournament. `roundsOnWin` now produces real chained bouts; the opening tournament has three named ordinary-monster opponents and deliberately low tutorial difficulty. Completing all three promotes the team directly to the highest rank and finalizes Mimi's owner status. |
| 120 | Implemented the earned week-5 hot-spring trip | A new click-paced common event triggers only after winning the opening tournament. It includes three characterful choices and a newly generated, text-free fantasy ryokan background saved as `public/assets/story/bg-hot-spring-ryokan.png`. |
| 121 | Added regression coverage for the corrected opening chain | Tests cover paid dispatch actions, encounter without recruitment, one-time transfer, provisional state, three tournament bouts, highest-rank promotion, formal ownership, and the earned hot-spring event. All 51 tests, TypeScript, and the production build pass. |
| 122 | Performed partial rendered verification | The in-app browser confirmed the title identity, nonblank title art, direct “派遣初日から始める” entry, no relevant console warnings/errors, the new first line, player-paced 1/35 dialogue, and the opening background. Browser automation became unstable during repeated dialogue advancement, so the complete title-to-provisional-owner rendered path remains open and is not claimed as passed. |
| 123 | Removed a remaining title-level chronology spoiler | The rotating title copy no longer states that Mimi becomes an owner, and the Continue button now reflects employee/provisional-owner/owner state rather than always saying a numbered week. Rendered title inspection confirmed the employee-state wording. |
| 124 | Made the opening tournament legible before battle | The match-preparation screen now gives the hot-spring prize, the current bout out of three, the ordinary-monster premise, and the rank-up consequence before team formation. TypeScript, all 51 tests, and the production build pass. A new browser-side security policy later blocked further localhost interaction, so this exact screen remains pending rendered verification. |

## Confirmed Findings

| ID | Severity | Area | Finding | Evidence | Required completion |
| --- | --- | --- | --- | --- | --- |
| VIS-001 | High | Character presentation | Human-shaped assets presented as standing pictures do not include feet and are not full-body standing art. | Direct inspection of the source PNGs; the crop is already present in the asset itself. | Establish the intended standing-art specification, regenerate/replace affected assets consistently, then verify every dialogue composition at desktop and mobile sizes. |
| QA-001 | Critical | Quality process | Existing 92/100 audit scores are invalid as proof of commercial-level completion. | The audits passed the globally repeated defect in `VIS-001` and contain acknowledged untested areas. | Replace self-scoring with requirement-linked evidence, negative-path checks, and rendered/player-flow verification. |
| DOC-001 | High | Onboarding | The current 48-advance prologue conflicts with the documented 27-advance ceiling and the previous UX score. | Current implementation versus `ONBOARDING_DESIGN.md` and `PLAYER_UX_AUDIT.md`. | Decide and document a player-tested onboarding target, measure actual completion time and comprehension, and update implementation/tests/docs together. |
| QA-002 | High | End-to-end validation | A complete human-paced 90-minute playthrough has not been performed. | Explicit omission in the existing quality audit. | Run and record a full campaign with timings, decisions, battle readability, defects, ending, and persistent-state checks. |
| TXT-001 | High | Narrative QA | All 15 characters' complete event sequences have not received a full human proofreading/readability pass. | Explicit omission in the existing quality audit. | Review every scene in context for setup, emotional logic, voice, duplication, transitions, and payoff; verify the corresponding presentation. |
| SYS-001 | High | Post-game | Hall-of-Fame free-battle behavior has not been verified. | Explicit omission in the existing quality audit; original design requires archived teams to be usable outside the campaign. | Confirm implementation and test archived-team creation, persistence, selection, free battle, and past-team tournament behavior. |
| OPS-001 | Medium | Project hygiene | QA and image-generation intermediates remain mixed into the project root and `tmp/`. | Root and recursive temporary-file listing. | Classify each artifact as source, generated deliverable, or disposable QA output; relocate or remove it and document regeneration. |
| DOC-002 | Medium | Attribution / provenance | Asset attribution and generation provenance are stale and incomplete. | Current `ATTRIBUTIONS.md` covers only a small subset of present assets. | Inventory all third-party and generated asset families, licenses/sources, creation dates, and intended usage. |
| SYS-001 | Critical | Post-game | Hall-of-Fame teams cannot be used in free battle or past-team tournaments. | No state-machine phase, store action, UI command, or battle creation path exists; archive entries are view-only. | Implement separate post-game team selection, opponent selection, battle setup, results, and past-team tournament flows without mutating campaign state. |
| TXT-002 | Resolved in major character arcs | Choice design | Major character decisions were repeated templates rather than character-specific actions. | Meet, join, bond, power, crisis, and liberation now have 30 unique labels and 30 unique outcomes per stage; automated uniqueness gate passes. | Continue human in-context proofreading; do not weaken the uniqueness gate when adding characters. |
| CHO-003 | Resolved in major character arcs | Choice design standard | The game repeatedly asked the player to express “trust versus ownership” instead of choosing what to accomplish in the current scene. | Trust/ownership arrows were removed from choice/result UI; major options now state a concrete action, gain/risk, immediate reaction, memory, and next-stage callback. | Extend the same standard to any future route and ambient choices; keep trust/ownership as downstream state. |
| TXT-003 | Critical | Character endings | Authored epilogues are unreachable as visual-novel scenes and are flattened into a single paragraph. | `sceneForStage` stops at crisis; liberation is a special follow-up; no epilogue is scheduled. Ending/archive use `lines.map(...).join(" ")`. | Add a deliberate post-final sequence with click-paced narration, speakers, directions, CGs, unlock gating, and per-character payoff. |
| VIS-002 | High | Story illustration | The requested visual arc for encounter, friction, distrust, excitement, climax, and final ending is not present for each character. | Most characters have only two unique full-screen images across seven stages; shared location backgrounds cover the rest. | Define a shot list per character and stage, prioritize emotional turning points, generate consistent art, and verify every trigger and lightbox path. |
| VIS-003 | High | Character consistency | Character presentation mixes short cropped human sprites and much taller true-form assets without one standing-art specification. | Regular sprites are mostly 353-599x605; selected true forms are 1024x1536 or taller. Previous visual review confirmed missing feet in regular human-shaped art. | Create an asset bible for silhouette, scale, full-body framing, expressions/forms, transparency, and dialogue placement; regenerate and recompose all affected characters. |
| PERF-001 | High | Asset delivery | The web build ships an unoptimized image payload of roughly 142 MB. | 79 images total 142,043,762 bytes; 45 are near 1672x941 and many individual PNGs exceed 2 MB; distribution build is 137.39 MiB. | Convert suitable art to modern formats, right-size responsive variants, lazy-load story assets, preload only the next required scene, and set measurable budgets. |
| AUD-001 | High | Audio experience | The game has only three short UI/casino effects and no musical or scene-based sound experience. | `sound.ts` exposes only `ui`, `reward`, and `bet`; only six calls exist. | Design a title/story/weekly/battle/result set list, ambience layers, skill/impact cues, transitions, volume categories, and robust mute/resume behavior. |
| QA-003 | Critical | QA automation | Existing visual/onboarding QA scripts are stale and not reproducible from project dependencies. | Both import undeclared `playwright`; direct execution fails. They also enforce the old under-30 prologue flow while current content requires 45-52 pages. | Add declared tooling and package scripts, update flow assertions, avoid brittle fixed click indices, and run in CI or a documented local environment. |
| QA-004 | High | Balance validation | Campaign and battle balance are tested separately with synthetic state, not as one full campaign. | Weekly policy tests skip official matches; battle audits recreate the same fixed three fighters for each match. | Simulate and manually play full campaigns where recruitment, growth, money, condition, liberation, betting, matches, and endings affect one continuous state. |
| BAT-001 | High | Battle learning | The displayed “AI reason” is not the actual decision explanation. | UI repeats the selected tactic’s generic description while `chooseSkill` uses HP, MP, skill score, weakness count, buffs, randomness, and target scores. | Record decision factors in battle presentation data and explain the winning factors and target choice in concise player-facing language. |
| ARCH-001 | Medium | Maintainability | Screen and style implementation has accumulated into monoliths and order-dependent cascade patches, contrary to the extensibility goal. | `App.tsx` 5,967 lines; `styles.css` 14,777 lines; selectors repeat up to nine times; unused `LegacyTitleScreen`; several “final cascade guard” comments. | Split by screen/domain, remove dead implementations, introduce stable style ownership/layers, and add focused visual regression coverage before further content expansion. |
| OPS-002 | Medium | Asset integration | Many generated or bundled assets are not integrated or deliberately archived. | 60+ media files are unreferenced, including all four `ui/weekly-hub/*.webp` images, old atlases, alternate sprites, and most casino sounds. | Classify intentional library assets versus obsolete output; integrate accepted assets and remove or relocate obsolete ones. |
| LOAD-001 | Medium | Loading reliability | The loading screen treats image errors as successful completion and preloads only five hard-coded assets. | `image.onerror` calls the same completion handler as `onload`; title art and most next-screen assets are outside the list. | Distinguish success/failure, provide fallback/retry behavior, and use route/scene-aware preload manifests. |
| SAVE-001 | High | Save safety | Starting a new campaign can silently destroy an active 26-week run. | Title `NEW GAME` path calls `startRun` directly; no confirmation or slot/backup behavior exists. | Add an explicit replacement warning with current-week summary, cancel path, and a deliberate delete/restart flow; test persistence after reload. |
| SAVE-002 | High | Save recovery | Persisted data has no schema validation, corruption fallback, or player-accessible reset/recovery flow. | Store migration merges typed assumptions directly; no safe parse/error boundary/reset UI exists. | Validate profile/run schemas, migrate each version, preserve recoverable data, and expose a safe reset/export/import or recovery screen. |
| ARCH-002 | Low | Dead state | `dialogueMode` is a nonfunctional preference. | Stored field and setter exist, but no renderer reads it and no UI changes it; migration forces `step`. | Remove it or implement and test a clearly defined alternate dialogue presentation. |
| FLOW-001 | Critical, corrected | Requirement contamination | The assistant introduced “liberation means roster departure,” then spent implementation and QA effort solving problems caused by that unapproved rule. | Generated design docs cite Pyre as authority; runtime filtered liberated fighters from focus, growth, equipment, formation, and battle; user explicitly rejected the premise. | Removed from runtime and docs. Keep a regression test proving released fighters remain usable, and require user confirmation before importing any reference mechanic that changes a foundational player reward. |
| BAT-002 | Critical | Final boss | The “uncontrollable strongest demon king” is not implemented as a boss. | `opponentsForMatch` chooses three standard recruitable fighters for every match, including `last-demon-king`; only the scalar difficulty and team label change. | Build a dedicated final-boss definition, visuals, skills, AI, phases, tells, music/effects, story transitions, and result logic, then balance it against developed campaign teams. |
| BAT-003 | High | Opponent identity | Official opponents have no authored rosters or match-specific combat identity. | Every card reuses a seeded random subset of recruitable fighter definitions; there are no opponent/boss data models or enemy-only assets. | Author stable opponent teams, roles, signatures, readable counterplay, and visual identities for the seven official cards and five hard-route assessments. |
| SYS-002 | Medium | Match formats | The originally requested individual battle format is absent. | No 1v1 match definition, ruleset, preparation mode, or result path exists. | Decide where individual matches belong without diluting the 3v3 core, then implement and test them as an occasional explicit format. |
| QA-005 | High | Rendered QA coverage | Only title and route-selection screens could be freshly verified; prologue-through-ending rendered automation is currently blocked. | Multiple Node REPL, direct browser-client, sandboxed Playwright, and normal Playwright attempts timed out. No user browser processes were killed. | Restore a deterministic browser test environment, close only verified audit processes, and rerun desktop/mobile narrative, weekly, management, battle, ending, and archive flows. |
| TXT-004 | High | Comedy / narrative voice | In-world text repeatedly calls characters “secret bosses” and directly references the game and its strategy guide, breaking the agreed non-meta comedy structure. | Examples include “secret-boss customer allowance,” “ownership of a secret boss not yet found,” and an in-world `Mimi no Tokimeki Ura-Boss Arena Complete Guide`; ending prose says “next run.” | Keep the title/menus free to name the premise, but rewrite in-world scenes so players infer the archetype from evidence; add a full-content banned/meta-language audit with reviewed exceptions. |
| CNT-001 | Medium | Equipment depth | Equipment content is too small to support long-term build discovery across 15 fighters and repeated 26-week campaigns. | Only four equipment definitions exist; each provides flat stat boosts and there are no set, conditional, character, or battle-behavior effects. | Define a restrained but meaningful equipment framework, then add enough role/strategy choices to create tradeoffs without burying the player in inventory management. |
| QA-006 | Medium | Research validation | Research sources are documented, but claimed 90+ scores are not supported by first-time player observation. | The battle document awards 93/100 while explicitly listing comprehension timing, physical color checks, audio direction, and grown-roster matchup tuning as remaining. | Replace score inflation with evidence gates: observed tasks, comprehension questions, timing, accessibility checks, and continuous-campaign matchup results. |
| VIS-004 | High | Memory gallery | Most authored character CGs cannot be revisited in the gallery. | Gallery has 8 entries while 14 encounter CGs and 14 later character CGs exist outside it; only generic scenes and Gidono memories are registered. | Generate gallery entries from scene/still metadata, unlock on actual viewing, preserve captions and character/stage identity, and verify full-size viewing from archive. |
| TXT-005 | Resolved by redesign | State messaging | The old retained/released split contradicted the intended liberation fantasy. | Both liberation choices now release the contract; UI states that the fighter voluntarily remains available. | Preserve legacy-save migration and regression coverage. |
| CHO-001 | High | First decision | The first weekly choice presents four apparently meaningful actions whose mechanical outcomes are severely unequal despite the same guaranteed story result. | Work: +750-1200G; play: -600G with no roster trust target; search: -800G plus bad condition; all recruit Gidono. Numeric effects are hidden during first-week onboarding. | Give each opening action a fair, legible, persistent benefit and a genuinely different scene path, or defer normal action costs until the player has a team. |
| CHO-002 | Medium | Early search | Search is mechanically dominated as a recruitment choice until the guaranteed three-person roster is complete. | `openingGuarantee` sets recruitment chance to 100% for every action during weeks 1-3 while below three available fighters; search still pays cost and risk. | Make the guarantee fictionally and mechanically explicit, waive/replace search risk during onboarding, or give search a distinct early information/selection advantage. |

## Requirements Pending Verification

These are not yet declared missing. Each must be traced through design, code, data,
assets, tests, and rendered behavior.

| ID | Area | Requirement to verify | Status |
| --- | --- | --- | --- |
| REQ-001 | Campaign | 26-week, approximately 90-minute campaign with repeat-play explanation skip | VERIFY |
| REQ-002 | Weekly loop | Work/play/rest/search each has a meaningful strategic role and every week produces an event | VERIFY |
| REQ-003 | Recruitment | Search remains worth choosing when characters can also be met through ordinary events | VERIFY |
| REQ-004 | Growth | Character-specific and shared growth points are separate, legible, and usable without consuming a week | VERIFY |
| REQ-005 | Roster | Frequent replacement is not required; condition randomness matters without undermining long-term team building | VERIFY |
| REQ-006 | Character arcs | Every recruitable character has a complete encounter-to-ending arc and visual support at key beats | VERIFY |
| REQ-007 | Liberation | Liberation events occur only when earned, can be missed, remove ownership without removing the fighter, and unlock ending text | VERIFY |
| REQ-008 | Battle | 3v3 manager-style battle is player-paced, readable, strategically learnable, and driven by stats, skills, traits, condition, trust, and instructions | VERIFY |
| REQ-009 | Battle direction | Movement, skill effects, cut-ins, target/action communication, and result explanation make every important event understandable | VERIFY |
| REQ-010 | Routes | Normal, domination/hard, and unlocked chaos routes differ meaningfully without breaking team-building incentives | VERIFY |
| REQ-011 | Economy | Money meaningfully improves teams, gambling supports comeback play, and zero money is not game over | VERIFY |
| REQ-012 | Persistence | Campaign resets correctly while collections and complete Hall-of-Fame team records persist | VERIFY |
| REQ-013 | Post-game | Archived teams work in free battle and past-team tournaments without entering campaign progression | CONFIRMED |
| REQ-014 | UX | Title, weekly action, choices, results, growth, team formation, status, loading/waiting, gallery, and ending screens share the accepted visual quality | VERIFY |
| REQ-015 | Status UX | Weekly screen provides direct access to compelling character art, current status, liberation progress, skills, and tips | VERIFY |
| REQ-016 | Narrative UI | Dialogue is click-paced, uses coherent first-person narration, appropriate standing art, readable typography, and viewable CGs | VERIFY |
| REQ-017 | Save system | Versioning, migration, corruption handling, restart, repeat unlocks, and persistence boundaries are robust | CONFIRMED |
| REQ-018 | Accessibility | Keyboard, focus, contrast, motion, text size, and responsive layout are usable | VERIFY |
| REQ-019 | Audio | Music, ambience, and effects support title, weekly loop, story, and battle without repetition or broken playback | VERIFY |
| REQ-020 | Performance | Asset loading, bundle size, transitions, animation, and long-session memory remain acceptable | CONFIRMED |
| REQ-021 | Dependency security | Installed dependency versions have no known unresolved vulnerabilities | BLOCKED: online npm advisory check requires explicit approval to send the dependency inventory |
| REQ-022 | Match formats | Campaign includes both team battles and occasional individual battles | CONFIRMED |

## Planned Audit Passes

1. Static architecture, state-machine, save-data, and screen inventory.
2. Content schema, character arc, choice, and text-volume inventory.
3. Asset dimensions, alpha bounds, usage, orphan, provenance, and consistency audit.
4. Battle simulation, information flow, pacing, and learning-feedback audit.
5. Automated tests, build, dependency, console, and error-state audit.
6. Rendered desktop/mobile screen-by-screen audit.
7. Full campaign and post-game path audit.
8. Requirement matrix reconciliation and a second independent omission search.

## Closure Gate

This audit cannot be closed until:

- every `VERIFY` row becomes `PASS`, `CONFIRMED`, or `BLOCKED`,
- every confirmed finding has a reproducible evidence trail,
- the complete work log has been checked for omissions,
- no old score is reused without current evidence, and
- remaining work is prioritized by player impact and dependency order.
