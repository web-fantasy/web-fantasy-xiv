import { it, expect } from 'vitest'
import { DARK_KNIGHT_JOB } from './index'
import { simulate, printResult, skill } from '../sim-test-utils'

it('Dark Knight DPS — spam Shadow Bolt + Dark Mind on CD', () => {
  const job = DARK_KNIGHT_JOB
  const result = simulate(job, {
    gcdCycle: [skill(job, 'drk_shadow_bolt')],
    ogcds: [
      { skill: skill(job, 'drk_dark_mind') },
    ],
  })
  printResult('Dark Knight', job, result)
  expect(result.totalDamage).toBeGreaterThan(0)
})
