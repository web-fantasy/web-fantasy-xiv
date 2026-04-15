import type { PlayerJob } from '../shared'
import { JobCategory, mergeBuffs, mergeBuffMap, buildSkillBar } from '../shared'
import { MELEE_AUTO, ROLE_DASH, ROLE_BACKSTEP, ROLE_SECOND_WIND } from '../commons/role-skills'
import { WARRIOR_SKILLS } from './skills'

export const WARRIOR_JOB: PlayerJob = {
  id: 'warrior',
  name: '战士',
  description: '以巨斧作为武器，穿着金属甲胄的战斗精英。拥有相对平衡的输出、防御能力，适合新手游玩。',
  category: JobCategory.Tank,
  stats: {
    hp: 10000,
    mp: 10000,
    attack: 1000,
    speed: 5,
    autoAttackRange: 3.5,
  },
  skills: [...WARRIOR_SKILLS, ROLE_SECOND_WIND],
  extraSkills: new Map([[100, ROLE_DASH], [101, ROLE_BACKSTEP]]),
  autoAttackSkill: MELEE_AUTO,
  autoAttackInterval: 3000,
  skillBar: buildSkillBar([...WARRIOR_SKILLS, ROLE_SECOND_WIND], ROLE_DASH, ROLE_BACKSTEP),
  buffs: mergeBuffs({}),
  buffMap: mergeBuffMap({}),
}
