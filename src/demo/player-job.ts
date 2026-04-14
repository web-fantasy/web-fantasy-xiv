import type { SkillDef, BuffDef } from '@/core/types'
import type { SkillBarEntry } from '@/ui/state'
import { DEMO_SKILLS, AUTO_ATTACK, SKILL_DASH, SKILL_BACKSTEP } from './demo-skills'
import { DEMO_BUFFS, DEMO_BUFF_MAP } from './demo-buffs'

/** Player job definition — bundles stats, skills, and buffs */
export interface PlayerJob {
  id: string
  name: string
  stats: {
    hp: number
    mp: number
    attack: number
    speed: number
    autoAttackRange: number
  }
  skills: SkillDef[]
  extraSkills: Map<number, SkillDef>
  autoAttackSkill: SkillDef
  autoAttackInterval: number
  skillBar: SkillBarEntry[]
  buffs: Record<string, BuffDef>
  buffMap: Map<string, BuffDef>
}

export const DEFAULT_JOB: PlayerJob = {
  id: 'default',
  name: '冒险者',
  stats: {
    hp: 10000,
    mp: 10000,
    attack: 1000,
    speed: 5,
    autoAttackRange: 3.5,
  },
  skills: DEMO_SKILLS,
  extraSkills: new Map([[100, SKILL_DASH], [101, SKILL_BACKSTEP]]),
  autoAttackSkill: AUTO_ATTACK,
  autoAttackInterval: 3000,
  skillBar: [
    ...DEMO_SKILLS.map((s, i) => ({ key: `${i + 1}`, skill: s })),
    { key: 'Q', skill: SKILL_DASH },
    { key: 'E', skill: SKILL_BACKSTEP },
  ],
  buffs: DEMO_BUFFS,
  buffMap: DEMO_BUFF_MAP,
}

/** All available jobs */
export const JOBS: PlayerJob[] = [DEFAULT_JOB]

export function getJob(id: string): PlayerJob {
  return JOBS.find(j => j.id === id) ?? DEFAULT_JOB
}
