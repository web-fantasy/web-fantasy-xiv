import type { PlayerJob } from '../shared'
import { JobCategory, mergeBuffs, mergeBuffMap, buildSkillBar } from '../shared'
import { CASTER_AUTO, ROLE_DASH } from '../commons/role-skills'
import { BLACK_MAGE_SKILLS, BLACK_MAGE_LEYLINE_STEP } from './skills'
import { BLACK_MAGE_BUFFS } from './status'

export const BLACK_MAGE_JOB: PlayerJob = {
  id: 'black_mage',
  name: '黑魔法师',
  description: '使用双手咒杖的魔法导师，擅长单体进攻的远程魔法职业。灵极火提升攻击力，灵极冰恢复魔力，冰火交替是输出的核心。',
  category: JobCategory.Caster,
  stats: {
    hp: 8000,
    mp: 10000,
    attack: 1200,
    speed: 5,
    autoAttackRange: 3.5,
    noMpRegen: true,
  },
  skills: BLACK_MAGE_SKILLS,
  extraSkills: new Map([[100, ROLE_DASH], [101, BLACK_MAGE_LEYLINE_STEP]]),
  autoAttackSkill: CASTER_AUTO,
  autoAttackInterval: 3000,
  skillBar: buildSkillBar(BLACK_MAGE_SKILLS, ROLE_DASH, BLACK_MAGE_LEYLINE_STEP),
  buffs: mergeBuffs(BLACK_MAGE_BUFFS),
  buffMap: mergeBuffMap(BLACK_MAGE_BUFFS),
  passiveBuffs: [
    { buffId: 'blm_enochian', interval: 500, stacks: 1 },
  ],
}
