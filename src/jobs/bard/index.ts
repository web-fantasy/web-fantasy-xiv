import type { PlayerJob } from '../shared'
import { JobCategory, mergeBuffs, mergeBuffMap, buildSkillBar } from '../shared'
import { PHYS_RANGED_AUTO, ROLE_DASH_FORWARD, ROLE_BACKSTEP, ROLE_SECOND_WIND } from '../commons/role-skills'
import { BARD_SKILLS } from './skills'
import { BARD_BUFFS } from './status'

export const BARD_JOB: PlayerJob = {
  id: 'bard',
  name: '吟游诗人',
  description: '以弓作为武器的战斗精英，擅长远距离输出和施加增益状态。需要轮换三首有着不同增益效果的战歌来提升自己的战斗力。',
  category: JobCategory.PhysRanged,
  stats: {
    hp: 9500,
    mp: 10000,
    attack: 1100,
    speed: 5,
    autoAttackRange: 10,
    gcdDuration: 2300,
  },
  skills: [...BARD_SKILLS, ROLE_SECOND_WIND],
  extraSkills: new Map([[100, ROLE_DASH_FORWARD], [101, ROLE_BACKSTEP]]),
  autoAttackSkill: PHYS_RANGED_AUTO,
  autoAttackInterval: 3000,
  skillBar: buildSkillBar([...BARD_SKILLS, ROLE_SECOND_WIND], ROLE_DASH_FORWARD, ROLE_BACKSTEP),
  buffs: mergeBuffs(BARD_BUFFS),
  buffMap: mergeBuffMap(BARD_BUFFS),
  passiveBuffs: [
    { buffId: 'brd_pitch', interval: 1000, stacks: 1, requiresBuff: 'brd_minuet' },
  ],
}
