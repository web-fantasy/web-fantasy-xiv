import { describe, expect, it } from 'vitest'
import { parseEventYaml } from './event-loader'

const VALID_YAML = `
id: healing-oasis
title: 治愈绿洲
description: 你发现一汪清澈的泉水
options:
  - id: drink
    label: 饮用泉水
    outcomes:
      - { kind: determination, delta: 1 }
  - id: leave
    label: 离开
    outcomes: []
`

const WITH_REQUIRES = `
id: pilgrim-trade
title: 朝圣者交易
description: A pilgrim offers a trade
options:
  - id: give-det
    label: 献出 1 决心
    requires:
      determination: { $gte: 2 }
    outcomes:
      - { kind: determination, delta: -1 }
      - { kind: crystals, delta: 8 }
`

describe('parseEventYaml', () => {
  it('parses valid event definition', () => {
    const e = parseEventYaml(VALID_YAML)
    expect(e.id).toBe('healing-oasis')
    expect(e.title).toBe('治愈绿洲')
    expect(e.options).toHaveLength(2)
    expect(e.options[0].outcomes).toEqual([{ kind: 'determination', delta: 1 }])
  })

  it('parses requires with MongoDB-like operator', () => {
    const e = parseEventYaml(WITH_REQUIRES)
    expect(e.options[0].requires).toEqual({ determination: { $gte: 2 } })
  })

  it('throws on missing id / title / options', () => {
    expect(() => parseEventYaml(`title: x\noptions: []`)).toThrow(/id/)
    expect(() => parseEventYaml(`id: x\noptions: []`)).toThrow(/title/)
  })

  it('throws on invalid outcome kind', () => {
    expect(() => parseEventYaml(`
id: bad
title: Bad
description: d
options:
  - id: o
    label: L
    outcomes:
      - { kind: invalid_kind, delta: 1 }
`)).toThrow(/outcome.*kind/)
  })
})
