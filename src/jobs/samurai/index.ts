import type { PlayerJob } from '../shared'
import { JobCategory, mergeBuffs, mergeBuffMap, buildSkillBar } from '../shared'
import { MELEE_AUTO, ROLE_DASH, ROLE_BACKSTEP, ROLE_SECOND_WIND } from '../commons/role-skills'
import { SAMURAI_SKILLS } from './skills'
import { SAMURAI_BUFFS } from './status'

export const SAMURAI_JOB: PlayerJob = {
  id: 'samurai',
  name: '武士',
  description: '以武士刀作为武器的战斗精英，擅长使用居合术打出超高伤害的近战职业。需要通过雪、月、花三连斩集齐闪光，释放纷乱雪月花造成毁灭性伤害。',
  category: JobCategory.Melee,
  stats: {
    hp: 11000,
    mp: 8000,
    attack: 1250,
    speed: 5,
    autoAttackRange: 3.5,
    gcdDuration: 2350,
  },
  skills: [...SAMURAI_SKILLS, ROLE_SECOND_WIND],
  extraSkills: new Map([[100, ROLE_DASH], [101, ROLE_BACKSTEP]]),
  autoAttackSkill: MELEE_AUTO,
  autoAttackInterval: 2800,
  skillBar: buildSkillBar([...SAMURAI_SKILLS, ROLE_SECOND_WIND], ROLE_DASH, ROLE_BACKSTEP),
  buffs: mergeBuffs(SAMURAI_BUFFS),
  buffMap: mergeBuffMap(SAMURAI_BUFFS),
}
