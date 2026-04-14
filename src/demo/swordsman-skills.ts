import type { SkillDef, BuffDef } from '@/core/types'

/** Samurai auto-attack: melee range */
export const SAMURAI_AUTO_ATTACK: SkillDef = {
  id: 'sam_auto',
  name: '自动攻击',
  type: 'ability',
  castTime: 0,
  cooldown: 0,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 3.5,
  mpCost: 0,
  effects: [{ type: 'damage', potency: 1.0 }],
}

export const SAMURAI_SKILLS: SkillDef[] = [
  // 1: Setsu (Snow) — melee GCD, grants Snow buff
  {
    id: 'sam_setsu',
    name: '雪',
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
      { type: 'apply_buff', buffId: 'sam_setsu' },
    ],
  },
  // 2: Getsu (Moon) — melee GCD, grants Moon buff
  {
    id: 'sam_getsu',
    name: '月',
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
      { type: 'apply_buff', buffId: 'sam_getsu' },
    ],
  },
  // 3: Ka (Flower) — melee GCD, grants Flower buff
  {
    id: 'sam_ka',
    name: '花',
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
      { type: 'apply_buff', buffId: 'sam_ka' },
    ],
  },
  // 4: Midare Setsugekka — powerful fan AOE, requires all 3 buffs, 0.8s cast
  {
    id: 'sam_midare',
    name: '纷乱雪月花',
    type: 'spell',
    castTime: 800,
    cooldown: 0,
    gcd: true,
    targetType: 'aoe',
    requiresTarget: true,
    range: 8,
    mpCost: 0,
    requiresBuffs: ['sam_setsu', 'sam_getsu', 'sam_ka'],
    zones: [{
      anchor: { type: 'caster' },
      direction: { type: 'toward_target' },
      shape: { type: 'fan', radius: 8, angle: 120 },
      resolveDelay: 800, // match castTime: telegraph during cast, resolve on completion
      hitEffectDuration: 500,
      effects: [{ type: 'damage', potency: 6.0 }],
    }],
    effects: [
      { type: 'consume_buffs', buffIds: ['sam_setsu', 'sam_getsu', 'sam_ka'] },
    ],
  },
  // 5: Enpi — ranged single-target, low potency (stop-loss when away from boss)
  {
    id: 'sam_enpi',
    name: '燕飞',
    type: 'weaponskill',
    castTime: 0,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: true,
    range: 15,
    mpCost: 0,
    effects: [{ type: 'damage', potency: 0.5 }],
  },
  // 6: Cure — higher MP cost heal
  {
    id: 'sam_cure',
    name: '治疗',
    type: 'spell',
    castTime: 1800,
    cooldown: 0,
    gcd: true,
    targetType: 'single',
    requiresTarget: false,
    range: 0,
    mpCost: 3200,
    effects: [{ type: 'heal', potency: 12.5 }],
  },
]

/** Q key: dash to target (6s cooldown) */
export const SAMURAI_DASH: SkillDef = {
  id: 'sam_dash',
  name: '突进',
  type: 'ability',
  castTime: 0,
  cooldown: 6000,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 15,
  mpCost: 0,
  effects: [{ type: 'dash' }],
}

/** E key: backstep (6s cooldown) */
export const SAMURAI_BACKSTEP: SkillDef = {
  id: 'sam_backstep',
  name: '后跳',
  type: 'ability',
  castTime: 0,
  cooldown: 6000,
  gcd: false,
  targetType: 'single',
  requiresTarget: true,
  range: 5,
  mpCost: 0,
  effects: [{ type: 'backstep', distance: 10 }],
}

// --- Samurai buffs ---

export const SAMURAI_BUFFS: Record<string, BuffDef> = {
  sam_setsu: {
    id: 'sam_setsu',
    name: '雪',
    description: '集齐雪、月、花后可释放纷乱雪月花。',
    type: 'buff',
    duration: 0,
    stackable: false,
    maxStacks: 1,
    effects: [],
  },
  sam_getsu: {
    id: 'sam_getsu',
    name: '月',
    description: '集齐雪、月、花后可释放纷乱雪月花。',
    type: 'buff',
    duration: 0,
    stackable: false,
    maxStacks: 1,
    effects: [],
  },
  sam_ka: {
    id: 'sam_ka',
    name: '花',
    description: '集齐雪、月、花后可释放纷乱雪月花。',
    type: 'buff',
    duration: 0,
    stackable: false,
    maxStacks: 1,
    effects: [],
  },
}

export const SAMURAI_BUFF_MAP = new Map(Object.entries(SAMURAI_BUFFS))
