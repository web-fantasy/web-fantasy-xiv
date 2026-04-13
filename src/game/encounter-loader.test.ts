import { describe, it, expect } from 'vitest'
import { parseEncounterYaml } from '@/game/encounter-loader'

const MINIMAL_YAML = `
arena:
  name: Test
  shape: circle
  radius: 10
  boundary: wall

boss:
  hp: 100000
  attack: 1
  speed: 3
  size: 2
  facing: 180

player:
  hp: 30000
  attack: 1000

boss_ai:
  chaseRange: 5
  autoAttackRange: 15
  autoAttackInterval: 3000

skills:
  slash:
    name: Slash
    type: spell
    castTime: 2000
    targetType: aoe
    zones:
      - anchor: { type: caster }
        direction: { type: fixed, angle: 180 }
        shape: { type: fan, radius: 8, angle: 90 }
        resolveDelay: 2000
        hitEffectDuration: 500
        effects: [{ type: damage, potency: 5000 }]

timeline:
  - at: 1000
    use: slash
  - at: 5000
    use: slash
  - at: 10000
    action: enable_ai
`

describe('parseEncounterYaml', () => {
  it('should parse arena', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.arena.name).toBe('Test')
    expect(data.arena.shape).toEqual({ type: 'circle', radius: 10 })
  })

  it('should parse boss entity', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.boss.hp).toBe(100000)
    expect(data.boss.facing).toBe(180)
    expect(data.boss.type).toBe('boss')
  })

  it('should parse player overrides', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.player.hp).toBe(30000)
    expect(data.player.attack).toBe(1000)
  })

  it('should parse skills', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.skills.size).toBe(1)
    const slash = data.skills.get('slash')!
    expect(slash.name).toBe('Slash')
    expect(slash.type).toBe('spell')
    expect(slash.zones).toHaveLength(1)
  })

  it('should parse and flatten timeline', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.timeline).toHaveLength(3)
    expect(data.timeline[0]).toEqual({ at: 1000, action: 'use', use: 'slash' })
    expect(data.timeline[2]).toEqual({ at: 10000, action: 'enable_ai' })
  })

  it('should parse boss_ai config', () => {
    const data = parseEncounterYaml(MINIMAL_YAML)
    expect(data.bossAI.chaseRange).toBe(5)
    expect(data.bossAI.autoAttackRange).toBe(15)
  })
})
