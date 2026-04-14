import type { SkillDef } from '@/core/types'

/** Auto-attack: ability type, no GCD, used by auto-attack timer only */
export const AUTO_ATTACK: SkillDef = {
  id: 'auto_attack',
  name: '自动攻击',
  type: 'ability',
  castTime: 0,
  cooldown: 0,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 3.5,
  mpCost: 0,
  effects: [{ type: 'damage', potency: 1 }],
}

export const DEMO_SKILLS: SkillDef[] = [
  // 1: 近战单体战技
  {
    id: 'slash',
    name: '劈砍',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 4,
    mpCost: 0,
    effects: [{ type: 'damage', potency: 2 }],
  },
  // 2: 远程单体战技
  {
    id: 'line_shot',
    name: '射击',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 15,
    mpCost: 0,
    effects: [{ type: 'damage', potency: 1 }],
  },
  // 3: 扇形战技
  {
    id: 'overpower',
    name: '超压斧',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'aoe',
    requiresTarget: true,
    range: 8,
    mpCost: 0,
    zones: [{
      anchor: { type: 'caster' },
      direction: { type: 'toward_target' },
      shape: { type: 'fan', radius: 8, angle: 90 },
      resolveDelay: 0,
      hitEffectDuration: 300,
      effects: [{ type: 'damage', potency: 1.5 }],
    }],
  },
  // 4: 强化（增伤20%，8s）
  {
    id: 'embolden',
    name: '强化',
    type: 'ability',
    castTime: 0,
    cooldown: 30000,
    gcd: false,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 0,
    effects: [{ type: 'apply_buff', buffId: 'embolden' }],
  },
  // 5: 铁壁（减伤40%，8s）
  {
    id: 'rampart',
    name: '铁壁',
    type: 'ability',
    castTime: 0,
    cooldown: 25000,
    gcd: false,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 0,
    effects: [{ type: 'apply_buff', buffId: 'rampart' }],
  },
  // 6: 治疗魔法（1.8s咏唱，自身回血，消耗MP）
  {
    id: 'cure',
    name: '治疗',
    type: 'spell',
    castTime: 1800,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 2400,
    effects: [{ type: 'heal', potency: 12.5 }],
  },
]

/** Q key: dash to target */
export const SKILL_DASH: SkillDef = {
  id: 'dash',
  name: '突进',
  type: 'ability',
  castTime: 0,
  cooldown: 10000,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 15,
  mpCost: 0,
  effects: [{ type: 'dash' }],
}

/** E key: backstep away from target */
export const SKILL_BACKSTEP: SkillDef = {
  id: 'backstep',
  name: '后跳',
  type: 'ability',
  castTime: 0,
  cooldown: 10000,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 5,  mpCost: 0,  effects: [{ type: 'backstep', distance: 10 }],
}
