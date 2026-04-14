import type { BuffDef } from '@/core/types'

export const DEMO_BUFFS: Record<string, BuffDef> = {
  vulnerability: {
    id: 'vulnerability',
    name: '易伤',
    type: 'debuff',
    duration: 8000,
    stackable: true,
    maxStacks: 16,
    effects: [{ type: 'vulnerability', value: 0.1 }], // 10% per stack
  },
  embolden: {
    id: 'embolden',
    name: '攻击力提升',
    type: 'buff',
    duration: 15000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'damage_increase', value: 0.1 }],
  },
  rampart: {
    id: 'rampart',
    name: '铁壁',
    type: 'buff',
    duration: 8000,
    stackable: false,
    maxStacks: 1,
    effects: [{ type: 'mitigation', value: 0.4 }],
  },
  junze: {
    id: 'junze',
    name: '润泽',
    type: 'buff',
    duration: 30000,
    stackable: true,
    maxStacks: 4,
    effects: [{ type: 'damage_increase', value: 0.1 }],
  },
}

// Map version for tooltip lookups
export const DEMO_BUFF_MAP = new Map(Object.entries(DEMO_BUFFS))
