import type { SkillDef, BuffDef } from '@/core/types'
import type { SkillBarEntry } from '@/ui/state'
import { DEMO_SKILLS, AUTO_ATTACK, SKILL_DASH, SKILL_BACKSTEP } from './demo-skills'
import {
  SAMURAI_SKILLS, SAMURAI_AUTO_ATTACK, SAMURAI_DASH, SAMURAI_BACKSTEP,
  SAMURAI_BUFFS, SAMURAI_BUFF_MAP,
} from './swordsman-skills'
import {
  BLM_SKILLS, BLM_AUTO_ATTACK, BLM_DASH, BLM_LEYLINE_STEP,
  BLM_BUFFS, BLM_BUFF_MAP,
} from './blm-skills'
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
    /** GCD duration in ms (default 2500) */
    gcdDuration?: number
    /** Disable automatic MP regeneration */
    noMpRegen?: boolean
  }
  skills: SkillDef[]
  extraSkills: Map<number, SkillDef>
  autoAttackSkill: SkillDef
  autoAttackInterval: number
  skillBar: SkillBarEntry[]
  buffs: Record<string, BuffDef>
  buffMap: Map<string, BuffDef>
  /** Buffs that passively accumulate during combat */
  passiveBuffs?: { buffId: string; interval: number; stacks: number }[]
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

export const SAMURAI_JOB: PlayerJob = {
  id: 'samurai',
  name: '武士',
  description: '暴力型近战职业。以雪、月、花三连斩集齐闪光后，释放纷乱雪月花造成毁灭性伤害。',
  category: JobCategory.Melee,
  stats: {
    hp: 11000,
    mp: 8000,
    attack: 1000,
    speed: 5,
    autoAttackRange: 3.5,
    gcdDuration: 2350,
  },
  skills: SAMURAI_SKILLS,
  extraSkills: new Map([[100, SAMURAI_DASH], [101, SAMURAI_BACKSTEP]]),
  autoAttackSkill: SAMURAI_AUTO_ATTACK,
  autoAttackInterval: 2800,
  skillBar: [
    ...SAMURAI_SKILLS.map((s, i) => ({ key: `${i + 1}`, skill: s })),
    { key: 'Q', skill: SAMURAI_DASH },
    { key: 'E', skill: SAMURAI_BACKSTEP },
  ],
  buffs: SAMURAI_BUFFS,
  buffMap: SAMURAI_BUFF_MAP,
}

export const BLM_JOB: PlayerJob = {
  id: 'blm',
  name: '黑魔法师',
  description: '以超长咏唱换取毁灭性伤害的远程魔法职业。灵极火提升攻击力，灵极冰恢复魔力，冰火交替是输出的核心。',
  category: JobCategory.Caster,
  stats: {
    hp: 8000,
    mp: 10000,
    attack: 1000,
    speed: 5,
    autoAttackRange: 3.5,
    noMpRegen: true,
  },
  skills: BLM_SKILLS,
  extraSkills: new Map([[100, BLM_DASH], [101, BLM_LEYLINE_STEP]]),
  autoAttackSkill: BLM_AUTO_ATTACK,
  autoAttackInterval: 3000,
  skillBar: [
    ...BLM_SKILLS.map((s, i) => ({ key: `${i + 1}`, skill: s })),
    { key: 'Q', skill: BLM_DASH },
    { key: 'E', skill: BLM_LEYLINE_STEP },
  ],
  buffs: BLM_BUFFS,
  buffMap: BLM_BUFF_MAP,
  passiveBuffs: [
    { buffId: 'blm_enochian', interval: 500, stacks: 1 },
  ],
}

/** All available jobs */
export const JOBS: PlayerJob[] = [DEFAULT_JOB, SAMURAI_JOB, BLM_JOB]

export function getJob(id: string): PlayerJob {
  return JOBS.find(j => j.id === id) ?? DEFAULT_JOB
}
