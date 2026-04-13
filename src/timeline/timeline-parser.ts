// src/timeline/timeline-parser.ts

export interface TimelineAction {
  at: number
  action: string
  use?: string
  loop?: number
  arena?: string
  entity?: string
  position?: { x: number; y: number }
  facing?: number
  locked?: boolean
}

export function flattenTimeline(rawEntries: any[]): TimelineAction[] {
  const result: TimelineAction[] = []

  for (const entry of rawEntries) {
    flattenEntry(entry, 0, result)
  }

  result.sort((a, b) => a.at - b.at)
  return result
}

function flattenEntry(entry: any, baseTime: number, out: TimelineAction[]): void {
  const at = (entry.at ?? 0) + baseTime

  if (entry.use != null) {
    out.push({ at, action: 'use', use: entry.use })
  } else if (entry.loop != null) {
    out.push({ at, action: 'loop', loop: entry.loop })
  } else if (entry.action === 'switch_arena') {
    out.push({ at, action: 'switch_arena', arena: entry.arena })
  } else if (entry.action === 'spawn_entity') {
    out.push({ at, action: 'spawn_entity', entity: entry.entity, position: entry.position })
  } else if (entry.action === 'lock_facing') {
    out.push({ at, action: 'lock_facing', facing: entry.facing, locked: entry.locked })
  }

  if (entry.then) {
    for (const child of entry.then) {
      const childAt = at + (child.after ?? 0)
      flattenEntry({ ...child, at: 0, after: undefined }, childAt, out)
    }
  }
}
