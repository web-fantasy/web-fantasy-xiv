// src/arena/geometry.ts
import type { Vec2 } from '@/core/types'

const DEG2RAD = Math.PI / 180

function distanceSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export function pointInCircle(point: Vec2, center: Vec2, radius: number): boolean {
  return distanceSq(point, center) <= radius * radius
}

export function pointInRing(
  point: Vec2,
  center: Vec2,
  innerRadius: number,
  outerRadius: number,
): boolean {
  const dSq = distanceSq(point, center)
  return dSq >= innerRadius * innerRadius && dSq <= outerRadius * outerRadius
}

export function pointInFan(
  point: Vec2,
  center: Vec2,
  radius: number,
  angleDeg: number,
  facingDeg: number,
): boolean {
  const dSq = distanceSq(point, center)
  if (dSq > radius * radius) return false

  const dx = point.x - center.x
  const dy = point.y - center.y
  // atan2: angle from center to point, 0° = up (+y), clockwise
  const angleToPoint = ((Math.atan2(dx, dy) / DEG2RAD) + 360) % 360
  const facingNorm = ((facingDeg % 360) + 360) % 360

  let diff = Math.abs(angleToPoint - facingNorm)
  if (diff > 180) diff = 360 - diff

  return diff <= angleDeg / 2
}

export function pointInRect(
  point: Vec2,
  center: Vec2,
  length: number,
  width: number,
  facingDeg: number,
): boolean {
  const rad = facingDeg * DEG2RAD
  const sin = Math.sin(rad)
  const cos = Math.cos(rad)

  // Transform point to local coordinates (facing = +y axis)
  const dx = point.x - center.x
  const dy = point.y - center.y
  const localX = dx * cos - dy * sin
  const localY = dx * sin + dy * cos

  // rect extends from 0 to length along facing, ±width/2 perpendicular
  return localY >= 0 && localY <= length && Math.abs(localX) <= width / 2
}
