// src/tower/random.test.ts
import { describe, it, expect } from 'vitest'
import { createRng, seedToUint32 } from '@/tower/random'

describe('seedToUint32', () => {
  it('produces the same uint32 for the same seed string', () => {
    expect(seedToUint32('hello')).toBe(seedToUint32('hello'))
  })

  it('produces a different uint32 for different seed strings', () => {
    expect(seedToUint32('hello')).not.toBe(seedToUint32('world'))
  })
})

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng('seed-1')
    const b = createRng('seed-1')
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('produces a different sequence for different seeds', () => {
    const a = createRng('seed-1')
    const b = createRng('seed-2')
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('returns values in [0, 1)', () => {
    const rng = createRng('range-check')
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('advances state independently per rng instance', () => {
    const rng = createRng('independence')
    const v1 = rng()
    const v2 = rng()
    expect(v1).not.toBe(v2)
  })
})
