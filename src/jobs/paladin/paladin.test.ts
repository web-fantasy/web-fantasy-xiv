import { it, expect } from 'vitest'
import { PALADIN_JOB } from './index'
import { simulate, printResult, skill } from '../sim-test-utils'

it('Paladin DPS — Vanguard×4 → Holy Spirit×4 cycle', () => {
  const job = PALADIN_JOB
  const result = simulate(job, {
    gcdCycle: [
      skill(job, 'pld_vanguard'),
      skill(job, 'pld_vanguard'),
      skill(job, 'pld_vanguard'),
      skill(job, 'pld_vanguard'),
      skill(job, 'pld_holy_spirit'),
      skill(job, 'pld_holy_spirit'),
      skill(job, 'pld_holy_spirit'),
      skill(job, 'pld_holy_spirit'),
    ],
  })
  printResult('Paladin', job, result)
  expect(result.totalDamage).toBeGreaterThan(0)
})
