// src/arena/arena.ts
import type { ArenaDef, Vec2 } from '@/core/types'

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

  clampPosition(point: Vec2): Vec2 {
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
