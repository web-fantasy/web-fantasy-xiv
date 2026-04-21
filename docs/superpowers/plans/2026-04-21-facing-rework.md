# Facing Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mouse-driven player facing with movement-direction facing, add smooth rotation interpolation for all entities.

**Architecture:** Renderer-level `displayFacing` chases logical `entity.facing` at 720°/s. Player input driver sets facing from WASD direction instead of mouse position. Skill resolver's existing auto-face logic works as-is, protected by a "skip during cast" guard in the input driver.

**Tech Stack:** TypeScript (strict), Babylon.js (TransformNode), Vitest

---

### Task 1: Add `computeDirectionAngle` utility

**Files:**
- Modify: `src/input/input-manager.ts` (add function)
- Modify: `src/input/input-manager.test.ts` (add tests)
- Modify: `src/index.ts` (add export)

- [ ] **Step 1: Write tests for `computeDirectionAngle`**

Add to `src/input/input-manager.test.ts`:

```typescript
import { computeDirectionAngle } from '@/input/input-manager'

describe('computeDirectionAngle', () => {
  it('should return 0° for north (+Y)', () => {
    expect(computeDirectionAngle({ x: 0, y: 1 })).toBeCloseTo(0, 0)
  })

  it('should return 90° for east (+X)', () => {
    expect(computeDirectionAngle({ x: 1, y: 0 })).toBeCloseTo(90, 0)
  })

  it('should return 180° for south (-Y)', () => {
    expect(computeDirectionAngle({ x: 0, y: -1 })).toBeCloseTo(180, 0)
  })

  it('should return 270° for west (-X)', () => {
    expect(computeDirectionAngle({ x: -1, y: 0 })).toBeCloseTo(270, 0)
  })

  it('should return correct angle for diagonal (NE)', () => {
    const angle = computeDirectionAngle({ x: 1, y: 1 })
    expect(angle).toBeCloseTo(45, 0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test src/input/input-manager.test.ts`
Expected: FAIL — `computeDirectionAngle is not exported`

- [ ] **Step 3: Implement `computeDirectionAngle`**

Add to `src/input/input-manager.ts` after the `computeFacingAngle` function (line 37):

```typescript
/** Convert a normalized direction vector to a facing angle in degrees. 0 = +Y, clockwise. */
export function computeDirectionAngle(dir: Vec2): number {
  return ((Math.atan2(dir.x, dir.y) * 180) / Math.PI + 360) % 360
}
```

- [ ] **Step 4: Add export to `src/index.ts`**

Change the input-manager export line (line 67) from:
```typescript
export { InputManager, computeMoveDirection, computeFacingAngle } from './input/input-manager'
```
to:
```typescript
export { InputManager, computeMoveDirection, computeFacingAngle, computeDirectionAngle } from './input/input-manager'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test src/input/input-manager.test.ts`
Expected: PASS (all 9 tests)

- [ ] **Step 6: Commit**

```bash
git add src/input/input-manager.ts src/input/input-manager.test.ts src/index.ts
git commit -m "feat(input): add computeDirectionAngle utility"
```

---

### Task 2: Smooth rotation interpolation in EntityRenderer

**Files:**
- Modify: `src/renderer/entity-renderer.ts`

- [ ] **Step 1: Add `displayFacing` map and rotation constant**

Add a new private field after `private meshes` (line 21):

```typescript
private static readonly ROTATION_SPEED = 720 // degrees per second
private displayFacing = new Map<string, number>()
```

- [ ] **Step 2: Initialize `displayFacing` on mesh creation**

In `createMesh()`, after `this.meshes.set(...)` (line 163), add:

```typescript
this.displayFacing.set(entity.id, entity.facing)
```

- [ ] **Step 3: Apply smooth rotation in `updateAll`**

Replace line 179:
```typescript
group.root.rotation.y = (entity.facing * Math.PI) / 180
```
with:
```typescript
// Smooth rotation toward logical facing
const current = this.displayFacing.get(entity.id) ?? entity.facing
const delta = angleDelta(current, entity.facing)
const maxStep = EntityRenderer.ROTATION_SPEED * (dt / 1000)
const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep)
const newDisplay = ((current + step) % 360 + 360) % 360
this.displayFacing.set(entity.id, newDisplay)
group.root.rotation.y = (newDisplay * Math.PI) / 180
```

- [ ] **Step 4: Add `angleDelta` helper function**

Add at the top of the file (after imports, before the interface):

```typescript
/** Shortest signed angular distance from `from` to `to` in degrees. Positive = clockwise. */
function angleDelta(from: number, to: number): number {
  let d = ((to - from) % 360 + 360) % 360
  if (d > 180) d -= 360
  return d
}
```

- [ ] **Step 5: Clean up `displayFacing` on mesh removal**

In `removeMesh()` (line 203), after `this.meshes.delete(entityId)`, add:

```typescript
this.displayFacing.delete(entityId)
```

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/renderer/entity-renderer.ts
git commit -m "feat(renderer): add smooth rotation interpolation for all entities"
```

---

### Task 3: Player input driver — movement direction facing

**Files:**
- Modify: `src/game/player-input-driver.ts`

- [ ] **Step 1: Update imports**

Change line 11 from:
```typescript
import { computeMoveDirection, computeFacingAngle } from '@/input/input-manager'
```
to:
```typescript
import { computeMoveDirection, computeDirectionAngle } from '@/input/input-manager'
```

- [ ] **Step 2: Hoist `dir` and replace mouse-facing with movement-direction facing**

The `dir` variable is currently declared inside the `if (!this.buffSystem.isStunned(p))` block (line 106), making it inaccessible to facing logic outside the block. Hoist it and replace the mouse-facing code.

Replace lines 104-137 (the movement block + old mouse-facing code) with:

```typescript
    // Movement direction (used by both movement and facing)
    const dir = computeMoveDirection(this.input.keys)

    // Movement (blocked while stunned)
    if (!this.buffSystem.isStunned(p)) {
      if (dir.x !== 0 || dir.y !== 0) {
        // Slidecast: movement only interrupts casting if remaining > SLIDECAST_WINDOW
        if (p.casting) {
          const remaining = p.casting.castTime - p.casting.elapsed
          if (remaining > SLIDECAST_WINDOW) {
            this.skillResolver.interruptCast(p)
            this.queuedSkill = null
          }
          // else: slidecast window — allow movement without interrupting
        }

        const speedMod = this.buffSystem.getSpeedModifier(p)
        const modifiedSpeed = p.speed * (1 + speedMod)
        const distance = modifiedSpeed * (dt / 1000)
        p.position.x += dir.x * distance
        p.position.y += dir.y * distance

        const clamped = this.arena.clampPosition({ x: p.position.x, y: p.position.y })
        const wallClamped = this.arena.clampToWallZones(clamped)
        p.position.x = wallClamped.x
        p.position.y = wallClamped.y

        this.bus.emit('player:walk', { entity: p, position: { x: p.position.x, y: p.position.y } })
      }
    }

    // Facing follows movement direction; during cast, hold facing toward target
    if (!p.casting) {
      if (dir.x !== 0 || dir.y !== 0) {
        p.facing = computeDirectionAngle(dir)
      }
      // else: keep last facing when stationary
    }
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/game/player-input-driver.ts
git commit -m "feat(player): face movement direction instead of mouse cursor"
```

---

### Task 4: Manual verification

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`

- [ ] **Step 2: Verify movement facing**

1. Press W — character faces north (0°), moves north
2. Press D — character smoothly rotates to east (90°), moves east
3. Press S — character smoothly rotates to south (180°), moves south
4. Press A — character smoothly rotates to west (270°), moves west
5. Press W+D — character faces northeast (45°), moves diagonally
6. Stop pressing keys — character keeps last facing direction

- [ ] **Step 3: Verify skill auto-face**

1. Lock onto a boss (right-click)
2. Face away from boss, then press a targeted skill — character smoothly turns to face boss
3. Cast a spell with cast time while facing away — character holds facing toward boss during entire cast
4. Move during cast (slidecast window) — character still faces boss, but moves in input direction

- [ ] **Step 4: Verify smooth rotation**

1. Rapidly alternate W and S — character smoothly rotates 180° (~0.25s), no instant snap
2. Observe boss turning — boss also smoothly rotates toward target, no instant 180° snaps

- [ ] **Step 5: Run full test suite**

Run: `pnpm test:run`
Expected: all tests pass

---

### Task 5: Cleanup — remove unused import

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Check if `computeFacingAngle` is still used**

Run: `grep -r "computeFacingAngle" src/ --include="*.ts" | grep -v ".test.ts" | grep -v "index.ts"`

If only `input-manager.ts` defines it and no other source file imports it, remove from index.ts export.

- [ ] **Step 2: Remove export if unused**

If unused, change `src/index.ts` line 67 from:
```typescript
export { InputManager, computeMoveDirection, computeFacingAngle, computeDirectionAngle } from './input/input-manager'
```
to:
```typescript
export { InputManager, computeMoveDirection, computeDirectionAngle } from './input/input-manager'
```

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "chore: remove unused computeFacingAngle export"
```
