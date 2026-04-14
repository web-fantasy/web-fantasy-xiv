# Job Balance Design

## DPM Baseline

All jobs must maintain theoretical 60s total damage within **0.85x ~ 1.20x** of the DPM baseline.

### Baseline Calculation

Reference job: **Adventurer (冒险者)**

| Parameter       | Value           |
|-----------------|-----------------|
| Attack          | 1,000           |
| Auto-attack     | potency 1.0, interval 3.0s |
| Skill 1 (Slash) | potency 2.0, GCD 2.5s |

60s theoretical output (non-stop Skill 1 + auto-attack):

| Source       | Count       | Damage per hit | Total   |
|--------------|-------------|----------------|---------|
| Auto-attack  | 60 / 3.0 = 20 | 1,000         | 20,000  |
| Slash        | 60 / 2.5 = 24 | 2,000         | 48,000  |
| **Total**    |             |                | **68,000** |

DPM baseline (theoretical) = 68,000 × 0.80 = 54,400

**Measured baseline**: Adventurer with Embolden buff (+20% dmg, 8s/30s) in actual play: **~1186 DPS = 71,160 total**

The measured value is the true reference because it includes buff uptime that theoretical omits.

### Acceptable Range (measured)

| Bound | Multiplier | DPS     |
|-------|------------|---------|
| Lower | × 0.95    | **1127** |
| Upper | × 1.15    | **1364** |

## Damage Formula

```
damage = attack × potency × (1 + sum_of_increases) × product_of_(1 - mitigation)
```

No increases/mitigations: `damage = attack × potency`

## Per-Job Verification Template

When designing a new job, calculate:

1. Auto-attack contribution: `floor(60s / AA_interval) × attack × AA_potency`
2. Skill rotation contribution: identify the optimal repeating GCD cycle, compute `floor(60s / cycle_time) × cycle_damage`
3. Sum = total 60s theoretical damage
4. Verify: **46,240 <= total <= 65,280**

## Notes

- Potency is a multiplier on attack, not a flat number (potency 2.0 = 200% of attack).
- GCD skills share a cooldown timer; oGCD abilities can weave between GCDs.
- For jobs with buff windows or burst phases, calculate the full 60s rotation including buff uptime.
- Stop-loss skills (ranged fallback) are excluded from theoretical max since they are only used when forced off melee range.
- Low-potency filler skills encourage players to complete combo rotations for burst finishers.

## Job Verification Records

### Samurai (武士) — Melee DPS

| Parameter        | Value                              |
|------------------|------------------------------------|
| Attack           | 1,000                              |
| Auto-attack      | potency 1.0, interval 2.8s         |
| GCD              | 2.35s                              |
| Setsu/Getsu/Ka   | potency 0.7 each (700 dmg)         |
| Midare Setsugekka| potency 4.5 (4,500 dmg), fan AOE, requires all 3 buffs |
| Enpi (stop-loss) | potency 0.5, ranged, excluded      |

Rotation: Setsu → Getsu → Ka → Midare = 4 GCDs = 9.4s

| Source          | Count / Cycles | Damage      | Total      |
|-----------------|----------------|-------------|------------|
| Auto-attack     | 21 hits        | 1,000       | 21,000     |
| 6 full combos   | 6 × (2,100 + 4,500) | 6,600 each | 39,600  |
| 1 extra GCD     | 1              | 700         | 700        |
| **Total**       |                |             | **61,300** |

61,300 / 54,400 = **1.13x** ✓

Spam skill 1 only (no combo): 25 × 700 + 21,000 = 38,500 → 0.71x (strong penalty for not completing combos)

### Black Mage (黑魔法师) — Caster DPS

| Parameter        | Value                              |
|------------------|------------------------------------|
| Attack           | 1,000                              |
| Auto-attack      | potency 0.2, interval 3.0s, range 20m |
| GCD              | 2.5s (standard)                    |
| Fire (火炎)      | potency 2.0, cast 2.5s, MP 2500   |
| Blizzard (冰结)  | potency 0.5, cast 1.8s (0 with Astral Fire), restores 35% MP |
| Flare (核爆)     | potency 4.5, oGCD ability, circle 5m at target, requires 50 Enochian |

Buffs: Astral Fire (灵极火) +10% ATK/stack (max 3), Umbral Ice (灵极冰) absorbs fire MP cost, Enochian (天语) +2/sec in combat (max 100)

Rotation: 3 Ice (1 instant + 2 cast) → 7 Fire (3 free + 4 paid) = 10 GCDs = 25s cycle

| Source          | Count / Cycles | Damage      | Total      |
|-----------------|----------------|-------------|------------|
| Auto-attack     | 20 hits        | 200         | 4,000      |
| Ice (per cycle) | 3 × 500        |             | 1,500/cyc  |
| Fire 1 (+10%)   | 1 × 2,200      |             | 2,200/cyc  |
| Fire 2 (+20%)   | 1 × 2,400      |             | 2,400/cyc  |
| Fire 3-7 (+30%) | 5 × 2,600      |             | 13,000/cyc |
| 2.4 cycles      |                | 19,100/cyc  | 45,840     |
| Flare (oGCD)    | 2 × 4,500      |             | 9,000      |
| **Total**       |                |             | **58,840** |

58,840 / 54,400 = **1.08x** ✓

No MP regen — must cycle through ice to sustain. Spam fire only = OOM in ~10s.
