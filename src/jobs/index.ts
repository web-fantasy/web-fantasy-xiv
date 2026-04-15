export { JobCategory, JOB_CATEGORY_LABELS, mergeBuffs, mergeBuffMap, buildSkillBar } from './shared'
export type { PlayerJob } from './shared'
export { classJobIcon } from './commons/icon-paths'
export { COMMON_BUFFS } from './commons/buffs'
export { WARRIOR_JOB } from './warrior/index'
export { SAMURAI_JOB } from './samurai/index'
export { BLACK_MAGE_JOB } from './black-mage/index'
export { BARD_JOB } from './bard/index'
export { DARK_KNIGHT_JOB } from './dark-knight/index'
export { PALADIN_JOB } from './paladin/index'

import type { PlayerJob } from './shared'
import { WARRIOR_JOB } from './warrior/index'
import { SAMURAI_JOB } from './samurai/index'
import { BLACK_MAGE_JOB } from './black-mage/index'
import { BARD_JOB } from './bard/index'
import { DARK_KNIGHT_JOB } from './dark-knight/index'
import { PALADIN_JOB } from './paladin/index'

/** All available jobs */
export const JOBS: PlayerJob[] = [WARRIOR_JOB, SAMURAI_JOB, BLACK_MAGE_JOB, BARD_JOB, DARK_KNIGHT_JOB, PALADIN_JOB]

export function getJob(id: string): PlayerJob {
  return JOBS.find(j => j.id === id) ?? WARRIOR_JOB
}
