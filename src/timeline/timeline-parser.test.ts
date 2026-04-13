// src/timeline/timeline-parser.test.ts
import { describe, it, expect } from 'vitest'
import { flattenTimeline } from '@/timeline/timeline-parser'

describe('flattenTimeline', () => {
  it('should pass through flat entries', () => {
    const raw = [
      { at: 0, use: 'slash' },
      { at: 8000, use: 'raidwide' },
    ]
    const result = flattenTimeline(raw)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ at: 0, action: 'use', use: 'slash' })
    expect(result[1]).toEqual({ at: 8000, action: 'use', use: 'raidwide' })
  })

  it('should flatten then/after into absolute times', () => {
    const raw = [
      {
        at: 18000,
        use: 'left_right_cleave',
        then: [
          { after: 3000, use: 'raidwide' },
          { after: 5000, use: 'iron_chariot' },
        ],
      },
    ]
    const result = flattenTimeline(raw)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ at: 18000, action: 'use', use: 'left_right_cleave' })
    expect(result[1]).toEqual({ at: 21000, action: 'use', use: 'raidwide' })
    expect(result[2]).toEqual({ at: 23000, action: 'use', use: 'iron_chariot' })
  })

  it('should handle nested then/after', () => {
    const raw = [
      {
        at: 10000,
        use: 'a',
        then: [
          {
            after: 2000,
            use: 'b',
            then: [
              { after: 1000, use: 'c' },
            ],
          },
        ],
      },
    ]
    const result = flattenTimeline(raw)
    expect(result).toHaveLength(3)
    expect(result[0].at).toBe(10000)
    expect(result[1].at).toBe(12000)
    expect(result[2].at).toBe(13000)
  })

  it('should sort by absolute time', () => {
    const raw = [
      { at: 5000, use: 'b' },
      { at: 1000, use: 'a' },
    ]
    const result = flattenTimeline(raw)
    expect(result[0].at).toBe(1000)
    expect(result[1].at).toBe(5000)
  })

  it('should handle non-use actions', () => {
    const raw = [
      { at: 60000, action: 'switch_arena', arena: 'broken' },
      { at: 62000, action: 'spawn_entity', entity: 'add1', position: { x: 10, y: 0 } },
    ]
    const result = flattenTimeline(raw)
    expect(result[0]).toEqual({ at: 60000, action: 'switch_arena', arena: 'broken' })
    expect(result[1]).toEqual({ at: 62000, action: 'spawn_entity', entity: 'add1', position: { x: 10, y: 0 } })
  })
})
