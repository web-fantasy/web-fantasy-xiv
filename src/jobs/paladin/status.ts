import type { BuffDef } from '@/core/types'
import { icon } from '../commons/icon-paths'

export const PALADIN_BUFFS: Record<string, BuffDef> = {
  pld_requiescat: {
    id: 'pld_requiescat',
    name: '安魂祈祷',
    description: '释放圣灵时消耗1层使其即时咏唱。',
    icon: icon('player_skill_effects', 12514),
    type: 'buff',
    duration: 21000,
    stackable: true,
    maxStacks: 4,
    effects: [],
  },
  pld_fof: {
    id: 'pld_fof',
    name: '战逃反应',
    description: '释放先锋剑时消耗1层使其威力提高25%，并回复2000MP。',
    icon: icon('player_skill_effects', 10155),
    type: 'buff',
    duration: 21000,
    stackable: true,
    maxStacks: 4,
    effects: [],
  },
  pld_hallowed: {
    id: 'pld_hallowed',
    name: '神圣领域',
    description: '特殊攻击之外其他所有攻击均无效。',
    icon: icon('player_skill_effects', 12504),
    type: 'buff',
    duration: 10000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'invulnerable' }],
  },
}
