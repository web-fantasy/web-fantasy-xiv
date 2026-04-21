// src/tower/events/event-loader.ts
// Event YAML parser with schema validation.
//
// Contract (spec §2.3 / phase 5):
//   - Requirement operators: MongoDB-like `$gte / $lte / $gt / $lt / $eq / $ne`.
//     (`$not / $or / $and / $in` deferred to P5-D-10 backlog.)
//   - Outcome kinds: 'crystals' | 'determination' only (P5-D-02).

import { parse as parseYaml } from 'yaml'
import type {
  EventDef,
  EventOptionDef,
  EventOutcome,
  EventRequirement,
  NumberComparator,
} from '@/tower/types'

const VALID_OUTCOME_KINDS = new Set<EventOutcome['kind']>([
  'crystals',
  'determination',
])

const VALID_OPS: readonly (keyof NumberComparator)[] = [
  '$gte',
  '$lte',
  '$gt',
  '$lt',
  '$eq',
  '$ne',
]

const VALID_REQUIRE_FIELDS = new Set<keyof EventRequirement>([
  'determination',
  'crystals',
])

/**
 * Parse a single event YAML document into an `EventDef`.
 * Throws with a descriptive message on any schema violation.
 */
export function parseEventYaml(source: string): EventDef {
  const raw = parseYaml(source)
  if (!raw || typeof raw !== 'object') {
    throw new Error('[event-loader] YAML must be a mapping')
  }
  if (typeof raw.id !== 'string') {
    throw new Error('[event-loader] missing or invalid `id`')
  }
  if (typeof raw.title !== 'string') {
    throw new Error('[event-loader] missing or invalid `title`')
  }
  if (typeof raw.description !== 'string') {
    throw new Error('[event-loader] missing or invalid `description`')
  }
  if (!Array.isArray(raw.options)) {
    throw new Error('[event-loader] `options` must be an array')
  }

  const options: EventOptionDef[] = raw.options.map((o: any, i: number) => {
    if (!o || typeof o !== 'object') {
      throw new Error(`[event-loader] options[${i}] must be an object`)
    }
    if (typeof o.id !== 'string') {
      throw new Error(`[event-loader] options[${i}].id invalid`)
    }
    if (typeof o.label !== 'string') {
      throw new Error(`[event-loader] options[${i}].label invalid`)
    }
    if (!Array.isArray(o.outcomes)) {
      throw new Error(`[event-loader] options[${i}].outcomes must be array`)
    }
    const outcomes: EventOutcome[] = o.outcomes.map((out: any, j: number) => {
      if (!out || typeof out !== 'object') {
        throw new Error(`[event-loader] options[${i}].outcomes[${j}] must be object`)
      }
      if (!VALID_OUTCOME_KINDS.has(out.kind)) {
        throw new Error(
          `[event-loader] options[${i}].outcomes[${j}].kind invalid: ${out.kind}`,
        )
      }
      if (typeof out.delta !== 'number') {
        throw new Error(
          `[event-loader] options[${i}].outcomes[${j}].delta must be number`,
        )
      }
      return { kind: out.kind, delta: out.delta }
    })
    const requires = o.requires ? parseRequires(o.requires, i) : undefined
    return { id: o.id, label: o.label, requires, outcomes }
  })

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    options,
  }
}

function parseRequires(raw: any, optIdx: number): EventRequirement {
  if (!raw || typeof raw !== 'object') {
    throw new Error(`[event-loader] options[${optIdx}].requires must be object`)
  }
  const result: EventRequirement = {}
  for (const [field, comparator] of Object.entries(raw)) {
    if (!VALID_REQUIRE_FIELDS.has(field as keyof EventRequirement)) {
      throw new Error(
        `[event-loader] options[${optIdx}].requires.${field} unknown field`,
      )
    }
    if (!comparator || typeof comparator !== 'object') {
      throw new Error(
        `[event-loader] options[${optIdx}].requires.${field} must be object`,
      )
    }
    const cmp: NumberComparator = {}
    for (const [op, val] of Object.entries(comparator as Record<string, unknown>)) {
      if (!VALID_OPS.includes(op as keyof NumberComparator)) {
        throw new Error(
          `[event-loader] options[${optIdx}].requires.${field}.${op} invalid operator`,
        )
      }
      if (typeof val !== 'number') {
        throw new Error(
          `[event-loader] options[${optIdx}].requires.${field}.${op} must be number`,
        )
      }
      cmp[op as keyof NumberComparator] = val
    }
    result[field as keyof EventRequirement] = cmp
  }
  return result
}

/**
 * Load an event by id: resolve via event-pool manifest, fetch the YAML, parse it.
 * Used at startDescent crystallization time (Task 12).
 */
export async function loadEventById(id: string): Promise<EventDef> {
  const { resolveEventEntry } = await import('@/tower/pools/event-pool')
  const entry = await resolveEventEntry(id)
  const url = `${import.meta.env.BASE_URL}${entry.yamlPath}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`[event-loader] fetch ${url} failed: ${res.status}`)
  }
  const source = await res.text()
  return parseEventYaml(source)
}
