import type { SkillDef } from '@/core/types'

/** Swordsman auto-attack: melee range */
export const SWORDSMAN_AUTO_ATTACK: SkillDef = {
  id: 'swd_auto',
  name: '自动攻击',
  type: 'ability',
  castTime: 0,
  cooldown: 0,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 3.5,
  mpCost: 0,
  effects: [{ type: 'damage', potency: 1.2 }],
}

export const SWORDSMAN_SKILLS: SkillDef[] = [
  // 1: Slash — basic melee GCD
  {
    id: 'swd_slash',
    name: '劈砍',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 4,
    mpCost: 0,
    effects: [{ type: 'damage', potency: 2.5 }],
  },
]
