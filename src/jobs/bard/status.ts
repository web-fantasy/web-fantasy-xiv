import type { BuffDef } from '@/core/types'
import { icon } from '../commons/icon-paths'

export const BARD_BUFFS: Record<string, BuffDef> = {
  brd_ballad: {
    id: 'brd_ballad',
    name: '贤者的叙事谣',
    description: '攻击力提高10%。',
    icon: icon('player_skill_effects',12612),
    type: 'buff',
    duration: 18000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'damage_increase', value: 0.15 }],
  },
  brd_paeon: {
    id: 'brd_paeon',
    name: '军神的赞美歌',
    description: '自动攻击间隔、战技与魔法的咏唱及复唱时间缩短16%。',
    icon: icon('player_skill_effects',12614),
    type: 'buff',
    duration: 18000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'haste', value: 0.20 }],
  },
  brd_minuet: {
    id: 'brd_minuet',
    name: '放浪神的小步舞曲',
    description: '每秒获得1层诗心，最多6层。拥有诗心时可释放完美音调。',
    icon: icon('player_skill_effects',12615),
    type: 'buff',
    duration: 18000,
    stackable: false,
    maxStacks: 1,
    effects: [],
  },
  brd_pitch: {
    id: 'brd_pitch',
    name: '诗心',
    description: '放浪神的小步舞曲期间每秒获得。消耗所有层数释放完美音调，伤害随层数增加。',
    icon: icon('player_skill_effects',12610),
    type: 'buff',
    duration: 3000,
    stackable: true,
    maxStacks: 6,
    effects: [],
  },
}
