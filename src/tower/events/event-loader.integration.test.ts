import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEventYaml } from './event-loader'

const EVENT_IDS = [
  'healing-oasis',
  'pilgrim-trade',
  'battle-trap',
  'training-dummy',
  'mystic-stele',
  'event-fallback',
]

describe.each(EVENT_IDS)('event yaml: %s', (id) => {
  it(`${id} parses into a valid EventDef`, () => {
    const path = join(process.cwd(), 'public/tower/events', `${id}.yaml`)
    const source = readFileSync(path, 'utf-8')
    const def = parseEventYaml(source)
    expect(def.id).toBe(id)
    expect(def.options.length).toBeGreaterThan(0)
  })
})
