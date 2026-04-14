import type { SkillDef, BuffDef } from '@/core/types'

export const DRK_SKILLS: SkillDef[] = [
  // 1: Shadow Bolt — ranged spell, costs 1500 HP, high potency
  //    With 行尸走肉: HP cost becomes HP heal
  //    With 暗黑意志: HP cost becomes MP cost
  {
    id: 'drk_shadow_bolt',
    name: '暗影弹',
    type: 'spell',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 15,
    mpCost: 0,
    hpCost: 1000,
    hpCostSwapBuff: 'drk_dark_mind',
    hpCostReverseBuff: 'drk_living_dead',
    effects: [{ type: 'damage', potency: 2.5 }],
  },
  // 2: Drain Slash — melee, low damage, heals self
  {
    id: 'drk_drain_slash',
    name: '吸血斩',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 4,
    mpCost: 0,
    effects: [
      { type: 'damage', potency: 1.0 },
      { type: 'heal', potency: 2.5 },
    ],
  },
  // 3: Dark Mind — swap HP cost to MP cost for 10s
  {
    id: 'drk_dark_mind',
    name: '暗黑意志',
    type: 'ability',
    castTime: 0,
    cooldown: 30000,
    gcd: false,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 0,
    effects: [
      { type: 'heal', potency: 2.0 },
      { type: 'apply_buff', buffId: 'drk_dark_mind' },
    ],
  },
  // 4: Shadow Wall — shield + lifesteal + MP on hit for 8s
  {
    id: 'drk_shadow_wall',
    name: '暗影壁',
    type: 'ability',
    castTime: 0,
    cooldown: 30000,
    gcd: false,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 0,
    effects: [{ type: 'apply_buff', buffId: 'drk_shadow_wall' }],
  },
  // 6: Living Dead — undying + HP cost reversal for 10s
  {
    id: 'drk_living_dead',
    name: '行尸走肉',
    type: 'ability',
    castTime: 0,
    cooldown: 300000,
    gcd: false,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 0,
    effects: [{ type: 'apply_buff', buffId: 'drk_living_dead' }],
  },
]

// --- Dark Knight buffs ---

export const DRK_BUFFS: Record<string, BuffDef> = {
  drk_dark_mind: {
    id: 'drk_dark_mind',
    name: '暗黑意志',
    description: '暗影弹消耗MP代替HP。',
    type: 'buff',
    duration: 10000,
    stackable: false,
    maxStacks: 1,
    effects: [],
  },
  drk_shadow_wall: {
    id: 'drk_shadow_wall',
    name: '暗影壁',
    description: '护盾吸收3000伤害。攻击附带20%吸血效果。受到攻击时回复500MP。',
    type: 'buff',
    duration: 8000,
    stackable: false,
    maxStacks: 1,
    effects: [
      { type: 'shield', value: 3000 },
      { type: 'lifesteal', value: 0.2 },
      { type: 'mp_on_hit', value: 500 },
    ],
  },
  drk_living_dead: {
    id: 'drk_living_dead',
    name: '行尸走肉',
    description: 'HP不会低于1。暗影弹的HP消耗转为HP回复。',
    type: 'buff',
    duration: 10000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'undying' }],
  },
}

export const DRK_BUFF_MAP = new Map(Object.entries(DRK_BUFFS))
