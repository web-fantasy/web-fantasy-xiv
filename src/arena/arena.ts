// src/arena/arena.ts
import type { ArenaDef, DeathZoneDef, Vec2 } from '@/core/types'
import { isPointInAoeShape } from '@/skill/aoe-shape'

export class Arena {
  constructor(readonly def: ArenaDef) {}

  isInBounds(point: Vec2): boolean {
    const { shape } = this.def
    if (shape.type === 'circle') {
      return point.x * point.x + point.y * point.y <= shape.radius * shape.radius
    }
    // rect: centered at origin
    const hw = shape.width / 2
    const hh = shape.height / 2
    return Math.abs(point.x) <= hw && Math.abs(point.y) <= hh
  }

  /** Check if a point is inside any death zone (inner zones OR outside lethal boundary) */
  isInDeathZone(point: Vec2): boolean {
    // Outside lethal boundary
    if (this.def.boundary === 'lethal' && !this.isInBounds(point)) return true

    // Inner death zones
    if (this.def.deathZones) {
      for (const zone of this.def.deathZones) {
        if (isPointInAoeShape(point, zone.center, zone.shape, zone.facing)) return true
      }
    }

    return false
  }

  /**
   * Push a point out of any wall zone it's inside.
   * Uses push-out along vector from zone center to point.
   */
  clampToWallZones(point: Vec2, wallZones: DeathZoneDef[]): Vec2 {
    let result = { ...point }
    for (const zone of wallZones) {
      if (!isPointInAoeShape(result, zone.center, zone.shape, zone.facing)) continue

      const dx = result.x - zone.center.x
      const dy = result.y - zone.center.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 0.001) {
        // Point is exactly at center — push in arbitrary direction
        result = { x: zone.center.x, y: zone.center.y + this.getZoneRadius(zone) + 0.1 }
        continue
      }

      const nx = dx / dist
      const ny = dy / dist
      const pushDist = this.getZoneRadius(zone) + 0.1
      result = { x: zone.center.x + nx * pushDist, y: zone.center.y + ny * pushDist }
    }
    return result
  }

  /** Approximate radius for push-out distance */
  private getZoneRadius(zone: DeathZoneDef): number {
    switch (zone.shape.type) {
      case 'circle': return zone.shape.radius
      case 'fan': return zone.shape.radius
      case 'ring': return zone.shape.outerRadius
      case 'rect': return Math.max(zone.shape.length, zone.shape.width) / 2
    }
  }

  clampPosition(point: Vec2): Vec2 {
    // Lethal boundary: no clamping, player can walk outside
    if (this.def.boundary === 'lethal') return point

    const { shape } = this.def
    if (shape.type === 'circle') {
      const dist = Math.sqrt(point.x * point.x + point.y * point.y)
      if (dist <= shape.radius) return point
      const scale = shape.radius / dist
      return { x: point.x * scale, y: point.y * scale }
    }
    const hw = shape.width / 2
    const hh = shape.height / 2
    return {
      x: Math.max(-hw, Math.min(hw, point.x)),
      y: Math.max(-hh, Math.min(hh, point.y)),
    }
  }
}
