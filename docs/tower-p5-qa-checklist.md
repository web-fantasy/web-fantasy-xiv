# Phase 5 Manual QA Checklist

Run-through before merging `feat/tower-p5-elite-boss-events` to master. Each item is a browser-driven end-to-end test — no automated coverage (automation covers units, not tower-page integration).

Environment: `pnpm dev` → http://localhost:5173/tower. Use DevTools console for state inspection if helpful (`$pinia` / `useTowerStore()`).

## Event Nodes

- [ ] Start new run → walk to an event node (kind=event) → modal opens with title + description + options
- [ ] **治愈绿洲** → click "饮用泉水" → determination +1; modal closes; node marked completed
- [ ] **朝圣者交易** → three options render; `献出 1 决心 → 8 水晶` requires determination ≥ 2 (disabled if = 1); `献出 5 水晶 → 1 决心` requires crystals ≥ 5 (disabled if < 5); leave always available
- [ ] **战斗陷阱** → `硬扛（-1 决心）` always works; `付 6 水晶绕路` disabled if crystals < 6
- [ ] **训练假人** → `练剑（-8 水晶 → +1 决心）` disabled if crystals < 8; leave always available
- [ ] **神秘石碑** → `触摸` (-5 💎 → +1 ❤️) and `破坏` (-1 ❤️ → +12 💎) both gated
- [ ] **Keyboard access**: Tab moves focus between option buttons (no focus escape); first enabled option gets focus on modal open

## Battle Nodes

- [ ] Walk to mob node → NodeConfirmPanel shows `[侦察（1 💎）] [进入战斗] [取消]`; elite/boss also enabled (no more "phase 5 实装" disabled label)
- [ ] Mob encounter → win → crystals rewarded; node marked completed; back to in-path
- [ ] Mob encounter → wipe → overlay shows `[重试] [放弃（+N 💎 低保）]`; determination -1 on wipe
- [ ] Mob wipe → retry → HP回满, re-engage; another wipe → determination -2 total from 2 wipes
- [ ] Mob wipe → abandon → crystals +floor(reward/2); node marked completed
- [ ] Elite encounter → fortune-trial loads; back-attack mechanic fires at t=8s (180° front semicircle danger; dodge by running behind); meteor at 18s; doom at 28s
- [ ] Elite encounter → aoe-marathon loads; 3-chain small AOEs at 2/3.5/5s; cross at 10s; multi-marker 18-22.5s
- [ ] Elite wipe → overlay same as mob (kind=elite → 50% salvage abandon label)
- [ ] **决心 == 0 path**: simulate by repeatedly wiping until determination = 0 → next wipe overlay shows ONLY `[进入结算]` (no retry, no salvage)

## Boss (Tower Warden)

- [ ] Walk to boss node → NodeConfirmPanel shows `[进入战斗]` + new **场地机制 section** listing "决心 ≤ 2 时获得超越之力（攻防血 +25%）"
- [ ] When determination ≤ 2, orange hint "（当前将立即触发）" appears next to the condition
- [ ] Enter boss fight with determination > 2 → NO echo buff on player (verify via HUD buff bar)
- [ ] Enter boss fight with determination ≤ 2 → echo buff applied at combat start (spec §3.2 three-effect stack: attack_modifier 0.25 / mitigation 0.25 / max_hp_modifier 0.25)
  - HP bar should visually drop to ~80% as maxHp grows 25% without hp compensation (FF14 strict)
  - Idle regen at 20%/3s should fill to 100% within 3s (player-input-driver.ts idle regen)
- [ ] Boss phase 1 → phase 2 transition at t=80s: boss invul (cannot be damaged) for 5s
- [ ] Phase 2 → 3 at t=160s: same invul
- [ ] Hard enrage at t=240s: unavoidable radial AOE potency 9999 → instant wipe
- [ ] Boss wipe: determination -2 (not -1); overlay shows `[重试] [放弃（整局结束）]`
- [ ] Boss retry → HP full, re-engage
- [ ] Boss abandon → IMMEDIATELY transitions to `ended` phase (no salvage, no return to path); pendingCombatNodeId cleared; run persisted

## Death Window (DoT Comeback)

- [ ] Apply a lethal DoT on boss (use a job skill that DoTs), then let player die → DEATH WINDOW triggers
- [ ] Red pulsing vignette overlay appears at screen edges (pointer-events none, doesn't block)
- [ ] Boss DoT ticks continue for up to 10s after player hp=0
- [ ] If DoT kills boss within window → VICTORY (determination NOT deducted)
- [ ] If all player DoTs expire before boss dies → early finalize as wipe
- [ ] If 10s timeout → wipe finalize

## End Run

- [ ] Determination reaches 0 → next wipe → `[进入结算]` → ended phase
- [ ] Boss abandon → ended phase
- [ ] ended phase shows whatever T4 stub existed (phase 6 settlement UI — stub OK here)

## Regression

- [ ] Existing phase-4 mob encounters (frost-sprite, fire-elemental, chain-marker, arena-shrinker) still behave correctly (mechanics intact)
- [ ] Phase-4 侦察 (scout) flow works: pays 1 crystal, populates scoutedNodes, second visit free
- [ ] Phase-4 放弃低保 flow for mob/elite works as before (50% salvage + completed)
- [ ] Pause / resume / debug terminal (~ key) all phase-4 features intact

## Console / Errors

- [ ] No unexpected errors in browser console during any of the above
- [ ] No TypeScript warnings in `pnpm dev` stderr

---

Sign-off format: "QA by <name> on <date>; issues: [none | list]"
