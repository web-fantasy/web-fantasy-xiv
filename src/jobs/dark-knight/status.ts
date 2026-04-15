import type { BuffDef } from '@/core/types'
import { icon } from '../commons/icon-paths'

export const DARK_KNIGHT_BUFFS: Record<string, BuffDef> = {
  drk_dark_mind: {
    id: 'drk_dark_mind',
    name: '嗜血',
    description: '噬魂斩消耗MP代替HP。攻击附带25%吸血效果。',
    icon: icon('player_skill_effects',13109),
    type: 'buff',
    duration: 10000,
    stackable: false,
    maxStacks: 1,
    effects: [
      { type: 'lifesteal', value: 0.25 },
    ],
  },
  drk_shadow_wall: {
    id: 'drk_shadow_wall',
    name: '暗影墙',
    description: '受到攻击时回复500MP。',
    icon: icon('player_skill_effects',13113),
    type: 'buff',
    duration: 8000,
    stackable: false,
    maxStacks: 1,
    effects: [
      { type: 'mp_on_hit', value: 500 },
    ],
  },
  drk_living_dead: {
    id: 'drk_living_dead',
    name: '行尸走肉',
    description: 'HP不会低于1。噬魂斩的HP消耗转为HP回复。',
    icon: icon('player_skill_effects',13115),
    type: 'buff',
    duration: 10000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'undying' }],
  },
}
