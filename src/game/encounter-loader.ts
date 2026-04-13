// src/game/encounter-loader.ts
import { parse as parseYaml } from 'yaml'
import { parseArenaConfig, parseSkillConfig } from '@/config/schema'
import { flattenTimeline } from '@/timeline/timeline-parser'
import type { ArenaDef, SkillDef } from '@/core/types'
import type { TimelineAction } from '@/config/schema'
import type { BossBehaviorConfig } from '@/ai/boss-behavior'
import type { CreateEntityOptions } from '@/entity/entity'

export interface EncounterData {
  arena: ArenaDef
  boss: CreateEntityOptions
  player: Partial<CreateEntityOptions>
  bossAI: Partial<BossBehaviorConfig>
  skills: Map<string, SkillDef>
  timeline: TimelineAction[]
}

/**
 * Load an encounter from a YAML file (fetched via URL).
 * The YAML is self-contained: arena, entities, skills, and timeline all inline.
 */
export async function loadEncounter(url: string): Promise<EncounterData> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to load encounter: ${url} (${response.status})`)
  const text = await response.text()
  return parseEncounterYaml(text)
}

/**
 * Parse encounter YAML string into runtime data.
 * Exported for testing without network.
 */
export function parseEncounterYaml(yamlText: string): EncounterData {
  const raw = parseYaml(yamlText)

  // Arena
  const arena = parseArenaConfig(raw.arena)

  // Boss entity
  const boss: CreateEntityOptions = {
    id: 'boss',
    type: 'boss',
    hp: raw.boss.hp,
    maxHp: raw.boss.hp,
    attack: raw.boss.attack ?? 1,
    speed: raw.boss.speed ?? 0,
    size: raw.boss.size ?? 1.5,
    autoAttackRange: raw.boss.autoAttackRange ?? 5,
    aggroRange: raw.boss.aggroRange ?? raw.boss_ai?.aggroRange ?? 0,
    facing: raw.boss.facing ?? 180,
  }

  // Player overrides
  const player: Partial<CreateEntityOptions> = {
    hp: raw.player?.hp ?? 30000,
    maxHp: raw.player?.hp ?? 30000,
    attack: raw.player?.attack ?? 1000,
    speed: raw.player?.speed ?? 6,
    size: raw.player?.size ?? 0.5,
    autoAttackRange: raw.player?.autoAttackRange ?? 5,
  }

  // Boss AI config
  const bossAI: Partial<BossBehaviorConfig> = raw.boss_ai ?? {}

  // Skills
  const skills = new Map<string, SkillDef>()
  if (raw.skills) {
    for (const [id, def] of Object.entries(raw.skills)) {
      const parsed = parseSkillConfig({ id, ...(def as any) })
      skills.set(id, parsed)
    }
  }

  // Timeline
  const timeline = flattenTimeline(raw.timeline ?? [])

  return { arena, boss, player, bossAI, skills, timeline }
}
