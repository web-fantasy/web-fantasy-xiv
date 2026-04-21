// src/tower/events/event-evaluator.ts
// MongoDB-like operator evaluation for EventRequirement.
// Contract: multiple operators/fields combine with AND (spec §2.3).

import type { EventRequirement } from '@/tower/types'

export interface RequirementContext {
  determination: number
  crystals: number
}

/**
 * Evaluate an `EventRequirement` predicate against current run state.
 * `undefined` requirement is treated as trivially true.
 */
export function evaluateRequirement(
  req: EventRequirement | undefined,
  ctx: RequirementContext,
): boolean {
  if (!req) return true
  for (const [field, cmp] of Object.entries(req)) {
    if (!cmp) continue
    const value = ctx[field as keyof RequirementContext]
    if (cmp.$gte !== undefined && !(value >= cmp.$gte)) return false
    if (cmp.$lte !== undefined && !(value <= cmp.$lte)) return false
    if (cmp.$gt !== undefined && !(value > cmp.$gt)) return false
    if (cmp.$lt !== undefined && !(value < cmp.$lt)) return false
    if (cmp.$eq !== undefined && !(value === cmp.$eq)) return false
    if (cmp.$ne !== undefined && !(value !== cmp.$ne)) return false
  }
  return true
}
