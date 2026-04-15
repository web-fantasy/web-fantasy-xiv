import { it, expect } from 'vitest'
import { WARRIOR_JOB } from './index'
import { simulate, printResult, skill } from '../sim-test-utils'

it('Warrior DPS — Embolden on CD + spam Slash', () => {
  const job = WARRIOR_JOB
  const result = simulate(job, {
    gcdCycle: [skill(job, 'slash')],
    ogcds: [{ skill: skill(job, 'embolden') }],
  })
  printResult('Warrior', job, result)
  expect(result.totalDamage).toBeGreaterThan(0)
})
