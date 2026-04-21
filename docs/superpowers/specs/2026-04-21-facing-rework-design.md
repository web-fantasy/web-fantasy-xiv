# Facing Rework Design

## Summary

Replace mouse-driven player facing with movement-direction facing. Add smooth rotation
interpolation at the renderer level for all entities.

## Motivation

- Current behavior: player always faces the mouse cursor, which feels disconnected from
  movement (can moonwalk sideways while facing away)
- Desired behavior: facing reflects movement direction; targeted skills auto-face the
  caster toward the target; smooth visual transitions for all rotation

## Design

### Separation: logical vs. visual facing

- `entity.facing` (logical) — updated instantly, used for AOE direction, aggro, etc.
- `displayFacing` (renderer) — chases `entity.facing` at a fixed angular velocity,
  purely visual

```
entity.facing  ──(instant)──>  game logic (AOEs, aggro, skill direction)
       │
       ▼
displayFacing  ──(720°/s lerp)──>  TransformNode.rotation.y
```

### 1. Renderer — smooth rotation for all entities

**File**: `src/renderer/entity-renderer.ts`

- Maintain `displayFacing: Map<entityId, number>` alongside existing entity mesh groups
- Each frame, rotate `displayFacing` toward `entity.facing` by up to `ROTATION_SPEED * dt`
  degrees (shortest path)
- Apply `displayFacing` to `TransformNode.rotation.y` instead of `entity.facing`
- `ROTATION_SPEED = 720` (°/s): 180° turn ≈ 0.25s, 90° ≈ 0.125s, small angles near-instant

### 2. Player input — movement direction instead of mouse

**File**: `src/game/player-input-driver.ts`

- Remove `computeFacingAngle(playerPos, mouseWorldPos)` call
- When `moveDirection` is non-zero: set `player.facing` to `atan2(dx, dy)` of movement
  direction
- When `moveDirection` is zero: leave `player.facing` unchanged (keep last facing)
- When player is casting: skip facing update entirely (let skill auto-face persist)

### 3. Skill resolver — no changes

**File**: `src/skill/skill-resolver.ts`

Existing logic already sets `caster.facing = facingToward(caster, target)` on cast start
and instant resolve. Combined with the "skip during cast" rule above, cast-time skills
will hold facing toward the target for the full cast duration.

### 4. Unchanged

- `computeFacingAngle` in `src/input/input-manager.ts` — retained (pure utility)
- Boss/mob `updateFacing` in `src/ai/boss-behavior.ts` — unchanged, renderer smooths it
- AOE direction resolution — uses logical `entity.facing`, unaffected by visual smoothing
- Movement trajectory — completely independent of facing

## Rotation Speed

| Angle | Transition Time |
|-------|----------------|
| 45°   | ~0.06s |
| 90°   | ~0.125s |
| 180°  | ~0.25s |
| 360°  | ~0.5s |

## Edge Cases

- **Instant 180 during combat**: player dodges backward while targeting boss — facing
  flips, renderer smoothly animates the about-face in 0.25s
- **Cast + move**: movement input during cast does NOT override facing; caster stays
  facing target for the full cast
- **Instant skill + move**: facing snaps to target for one frame (skill execution), then
  next frame resumes movement direction
- **Dead player**: already returns early in `PlayerInputDriver.update()`, no change
