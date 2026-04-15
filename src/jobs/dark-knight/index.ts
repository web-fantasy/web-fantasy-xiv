import type { PlayerJob } from '../shared'
import { JobCategory, mergeBuffs, mergeBuffMap, buildSkillBar } from '../shared'
import { MELEE_AUTO, ROLE_DASH, ROLE_BACKSTEP, ROLE_SECOND_WIND } from '../commons/role-skills'
import { DARK_KNIGHT_SKILLS } from './skills'
import { DARK_KNIGHT_BUFFS } from './status'

export const DARK_KNIGHT_JOB: PlayerJob = {
  id: 'dark_knight',
  name: '暗黑骑士',
  description: '以双手大剑作为武器，以生命为代价换取强大攻击力的战斗精英。噬魂斩消耗HP造成高额伤害，吸收波远程回复生命，嗜血和暗影墙提供攻防转换窗口，行尸走肉是最后的保命手段。',
  category: JobCategory.Tank,
  stats: {
    hp: 12000,
    mp: 8000,
    attack: 1000,
    speed: 5,
    autoAttackRange: 3.5,
  },
  skills: [...DARK_KNIGHT_SKILLS, ROLE_SECOND_WIND],
  extraSkills: new Map([[100, ROLE_DASH], [101, ROLE_BACKSTEP]]),
  autoAttackSkill: MELEE_AUTO,
  autoAttackInterval: 3000,
  skillBar: buildSkillBar([...DARK_KNIGHT_SKILLS, ROLE_SECOND_WIND], ROLE_DASH, ROLE_BACKSTEP),
  buffs: mergeBuffs(DARK_KNIGHT_BUFFS),
  buffMap: mergeBuffMap(DARK_KNIGHT_BUFFS),
}
