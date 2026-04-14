import type { SkillDef, BuffDef } from '@/core/types'
import type { SkillBarEntry } from '@/ui/state'
import { DEMO_SKILLS, AUTO_ATTACK, SKILL_DASH, SKILL_BACKSTEP } from './demo-skills'
import { SWORDSMAN_SKILLS, SWORDSMAN_AUTO_ATTACK } from './swordsman-skills'
import { DEMO_BUFFS, DEMO_BUFF_MAP } from './demo-buffs'

/** Job category — matches icon filenames in public/assets/images/class_jobs/ */
export enum JobCategory {
  Any = 'any',
  Tank = 'tank',
  Healer = 'healer',
  DPS = 'dps',
  Melee = 'melee',
  PhysRanged = 'phys_ranged',
  Caster = 'caster',
  Ranged = 'ranged',
  None = 'none',
}

/** Human-readable label for each category */
export const JOB_CATEGORY_LABELS: Record<JobCategory, string> = {
  [JobCategory.Any]: '全能职业',
  [JobCategory.Tank]: '防护职业',
  [JobCategory.Healer]: '治疗职业',
  [JobCategory.DPS]: '进攻职业',
  [JobCategory.Melee]: '物理近战',
  [JobCategory.PhysRanged]: '物理远程',
  [JobCategory.Caster]: '魔法远程',
  [JobCategory.Ranged]: '远程职业',
  [JobCategory.None]: '未定义',
}

/** Player job definition — bundles stats, skills, and buffs */
export interface PlayerJob {
  id: string
  name: string
  /** Short flavour text shown in the job info panel */
  description?: string
  category: JobCategory
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
  description: '兼具近战、远程、治疗与增减益能力的全能型测试职业。',
  category: JobCategory.None,
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

export const SWORDSMAN_JOB: PlayerJob = {
  id: 'swordsman',
  name: '剑士',
  description: '朴实无华的近战职业，只会劈砍，但劈得很用力。',
  category: JobCategory.Melee,
  stats: {
    hp: 12000,
    mp: 0,
    attack: 1200,
    speed: 5,
    autoAttackRange: 3.5,
  },
  skills: SWORDSMAN_SKILLS,
  extraSkills: new Map([[100, SKILL_DASH], [101, SKILL_BACKSTEP]]),
  autoAttackSkill: SWORDSMAN_AUTO_ATTACK,
  autoAttackInterval: 2800,
  skillBar: [
    ...SWORDSMAN_SKILLS.map((s, i) => ({ key: `${i + 1}`, skill: s })),
    { key: 'Q', skill: SKILL_DASH },
    { key: 'E', skill: SKILL_BACKSTEP },
  ],
  buffs: {},
  buffMap: new Map(),
}

/** All available jobs */
export const JOBS: PlayerJob[] = [DEFAULT_JOB, SWORDSMAN_JOB]

export function getJob(id: string): PlayerJob {
  return JOBS.find(j => j.id === id) ?? DEFAULT_JOB
}
