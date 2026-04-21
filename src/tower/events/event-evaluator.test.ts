import { describe, expect, it } from 'vitest'
import { evaluateRequirement } from './event-evaluator'

describe('evaluateRequirement', () => {
  const ctx = { determination: 3, crystals: 10 }

  it('undefined requires → always true', () => {
    expect(evaluateRequirement(undefined, ctx)).toBe(true)
  })

  it('$gte passes / fails', () => {
    expect(evaluateRequirement({ determination: { $gte: 3 } }, ctx)).toBe(true)
    expect(evaluateRequirement({ determination: { $gte: 4 } }, ctx)).toBe(false)
  })

  it('$lte passes / fails', () => {
    expect(evaluateRequirement({ crystals: { $lte: 10 } }, ctx)).toBe(true)
    expect(evaluateRequirement({ crystals: { $lte: 9 } }, ctx)).toBe(false)
  })

  it('$gt / $lt strict', () => {
    expect(evaluateRequirement({ determination: { $gt: 3 } }, ctx)).toBe(false)
    expect(evaluateRequirement({ determination: { $gt: 2 } }, ctx)).toBe(true)
    expect(evaluateRequirement({ crystals: { $lt: 10 } }, ctx)).toBe(false)
    expect(evaluateRequirement({ crystals: { $lt: 11 } }, ctx)).toBe(true)
  })

  it('$eq / $ne', () => {
    expect(evaluateRequirement({ determination: { $eq: 3 } }, ctx)).toBe(true)
    expect(evaluateRequirement({ determination: { $eq: 4 } }, ctx)).toBe(false)
    expect(evaluateRequirement({ crystals: { $ne: 10 } }, ctx)).toBe(false)
    expect(evaluateRequirement({ crystals: { $ne: 5 } }, ctx)).toBe(true)
  })

  it('multiple operators on same field AND', () => {
    expect(evaluateRequirement({ determination: { $gte: 2, $lt: 5 } }, ctx)).toBe(true)
    expect(evaluateRequirement({ determination: { $gte: 4, $lt: 5 } }, ctx)).toBe(false)
  })

  it('multiple fields AND', () => {
    expect(evaluateRequirement(
      { determination: { $gte: 3 }, crystals: { $gte: 5 } },
      ctx,
    )).toBe(true)
    expect(evaluateRequirement(
      { determination: { $gte: 3 }, crystals: { $gte: 20 } },
      ctx,
    )).toBe(false)
  })
})
