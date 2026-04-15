# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XIV Stage Play — a web-based FFXIV-inspired boss fight simulator. Core gameplay: dodge AOE mechanics in a top-down arena. YAML-driven boss timelines, full skill/buff systems, displacement effects.

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server at http://localhost:5173
pnpm build            # Production build
pnpm typecheck        # Type check (tsc --noEmit -p tsconfig.app.json)
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test src/path/to/file.test.ts   # Run a single test file
```

No linter is configured.

## Architecture

Three decoupled layers:

**Game Logic Layer** (pure TypeScript, engine-agnostic):
- `src/core/` — EventBus (central pub/sub), game loop, shared type definitions
- `src/entity/` — EntityManager, player/boss/mob entities
- `src/combat/` — Damage calculation, buff system, displacement
- `src/skill/` — Skill definitions, AOE zone manager, shape collision detection
- `src/timeline/` — YAML-driven boss action scheduler (TimelineScheduler)
- `src/ai/` — Boss AI behavior (aggro, chase, auto-attack)
- `src/arena/` — Boundary geometry, death zones
- `src/config/` — YAML config parsers for arena, entity, skill, timeline

**Rendering Layer** (Babylon.js):
- `src/renderer/` — Scene, entity meshes, AOE telegraph visuals, hit effects

**UI Layer** (Preact + @preact/signals):
- `src/ui/` — HP bars, skill bar, cast bar, damage floaters, buff bar, timeline display
- `src/input/` — Keyboard/mouse input handling
- `src/devtools/` — Developer terminal (~ key), event log, command system

**Game orchestration**:
- `src/game/` — Camera, combat resolver, player driver (ties layers together)
- `src/demo/` — Demo data (skills, buffs, job definitions)

## Key Patterns

- **Event-driven**: All cross-system communication goes through EventBus (`damage:dealt`, `entity:created`, etc.)
- **YAML encounters**: Boss fights defined in `public/encounters/*.yaml` — parsed by config layer, scheduled by TimelineScheduler
- **Discriminated unions**: `src/core/types.ts` uses tagged unions extensively (Vec2/Vec3, AnchorType, AoeShapeDef, etc.)
- **Preact Signals**: UI state management via `@preact/signals`
- **Path alias**: `@/*` resolves to `./src/*`

## Tech Stack

- TypeScript (strict), Preact (JSX via `jsxImportSource: preact`), Babylon.js
- Vite 8, UnoCSS (Wind4/Tailwind v4 preset), Vitest (globals enabled)
- pnpm 10.8.1, ES2022 target, ESNext modules

## Tests

Colocated `*.test.ts` files next to source. Vitest globals enabled — `describe`, `it`, `expect` available without import; use `vi` for mocking.

## Design References

- [Job Balance](docs/job-balance.md) — DPM baseline, damage formula, per-job verification template. Key rules: increases are additive (`1 + sum`), only mitigations are multiplicative; `special` damage bypasses all defenses.
- [Prototype Design](docs/specs/2026-04-13-prototype-design.md) — Original game design spec.
