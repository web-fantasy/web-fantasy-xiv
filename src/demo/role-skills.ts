import type { SkillDef } from '@/core/types'

// ─── Auto Attacks ────────────────────────────────────────

/** Melee auto-attack: potency 1.0, range 3.5m */
export const MELEE_AUTO: SkillDef = {
  id: 'melee_auto',
  name: '攻击（自动）',
  type: 'ability',
  castTime: 0, cooldown: 0, gcd: false,
  targetType: 'single', requiresTarget: true,
  range: 3.5, mpCost: 0,
  effects: [{ type: 'damage', potency: 1.0 }],
}

/** Physical ranged auto-attack: potency 0.5, range 10m */
export const PHYS_RANGED_AUTO: SkillDef = {
  id: 'phys_ranged_auto',
  name: '射击（自动）',
  type: 'ability',
  castTime: 0, cooldown: 0, gcd: false,
  targetType: 'single', requiresTarget: true,
  range: 10, mpCost: 0,
  effects: [{ type: 'damage', potency: 0.5 }],
}

/** Caster / healer auto-attack: potency 0.05, range 3.5m */
export const CASTER_AUTO: SkillDef = {
  id: 'caster_auto',
  name: '敲打（自动）',
  type: 'ability',
  castTime: 0, cooldown: 0, gcd: false,
  targetType: 'single', requiresTarget: true,
  range: 3.5, mpCost: 0,
  effects: [{ type: 'damage', potency: 0.05 }],
}

// ─── Movement Skills ─────────────────────────────────────

/** Dash toward locked target, stops at autoAttackRange */
export const ROLE_DASH: SkillDef = {
  id: 'role_dash',
  name: '突进',
  type: 'ability',
  castTime: 0, cooldown: 10000, gcd: false,
  targetType: 'single', requiresTarget: true,
  range: 15, mpCost: 0,
  effects: [{ type: 'dash' }],
}

/** Dash forward 10m toward facing direction (mouse cursor) */
export const ROLE_DASH_FORWARD: SkillDef = {
  id: 'role_dash_forward',
  name: '前冲',
  type: 'ability',
  castTime: 0, cooldown: 10000, gcd: false,
  targetType: 'single', requiresTarget: false,
  range: 0, mpCost: 0,
  effects: [{ type: 'dash_forward', distance: 10 }],
}

/** Backstep 10m away from target */
export const ROLE_BACKSTEP: SkillDef = {
  id: 'role_backstep',
  name: '后跳',
  type: 'ability',
  castTime: 0, cooldown: 10000, gcd: false,
  targetType: 'single', requiresTarget: true,
  range: 5, mpCost: 0,
  effects: [{ type: 'backstep', distance: 10 }],
}

// ─── Recovery Skills ─────────────────────────────────────

/** Physical role self-heal (melee + phys ranged) */
export const ROLE_SECOND_WIND: SkillDef = {
  id: 'role_second_wind',
  name: '内丹',
  type: 'ability',
  castTime: 0, cooldown: 20000, gcd: false,
  targetType: 'single', requiresTarget: false,
  range: 0, mpCost: 0,
  effects: [{ type: 'heal', potency: 3.5 }],
}
