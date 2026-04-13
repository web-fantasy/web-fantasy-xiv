// src/arena/geometry.test.ts
import { describe, it, expect } from 'vitest'
import { pointInCircle, pointInRect, pointInFan, pointInRing } from '@/arena/geometry'

describe('geometry', () => {
  describe('pointInCircle', () => {
    it('should return true for point inside', () => {
      expect(pointInCircle({ x: 1, y: 1 }, { x: 0, y: 0 }, 5)).toBe(true)
    })
    it('should return false for point outside', () => {
      expect(pointInCircle({ x: 10, y: 0 }, { x: 0, y: 0 }, 5)).toBe(false)
    })
    it('should return true for point on edge', () => {
      expect(pointInCircle({ x: 5, y: 0 }, { x: 0, y: 0 }, 5)).toBe(true)
    })
  })

  describe('pointInRect', () => {
    // rect centered at origin, length=10 (along facing), width=4, facing north (0°)
    it('should return true for point inside', () => {
      expect(pointInRect({ x: 0, y: 3 }, { x: 0, y: 0 }, 10, 4, 0)).toBe(true)
    })
    it('should return false for point outside width', () => {
      expect(pointInRect({ x: 5, y: 3 }, { x: 0, y: 0 }, 10, 4, 0)).toBe(false)
    })
    it('should return false for point behind', () => {
      expect(pointInRect({ x: 0, y: -3 }, { x: 0, y: 0 }, 10, 4, 0)).toBe(false)
    })
    it('should work with rotated facing', () => {
      // facing east (90°), length=10, width=4
      expect(pointInRect({ x: 5, y: 0 }, { x: 0, y: 0 }, 10, 4, 90)).toBe(true)
      expect(pointInRect({ x: 0, y: 5 }, { x: 0, y: 0 }, 10, 4, 90)).toBe(false)
    })
  })

  describe('pointInFan', () => {
    it('should return true for point inside fan', () => {
      // fan centered at origin, radius 10, angle 90° (±45°), facing north (0°)
      expect(pointInFan({ x: 0, y: 5 }, { x: 0, y: 0 }, 10, 90, 0)).toBe(true)
    })
    it('should return false for point outside angle', () => {
      expect(pointInFan({ x: 10, y: 0 }, { x: 0, y: 0 }, 10, 90, 0)).toBe(false)
    })
    it('should return false for point outside radius', () => {
      expect(pointInFan({ x: 0, y: 15 }, { x: 0, y: 0 }, 10, 90, 0)).toBe(false)
    })
    it('should handle 180° fan (half circle)', () => {
      // facing north (0°), 180° fan covers left half
      expect(pointInFan({ x: -5, y: 5 }, { x: 0, y: 0 }, 10, 180, 0)).toBe(true)
      expect(pointInFan({ x: 0, y: -5 }, { x: 0, y: 0 }, 10, 180, 0)).toBe(false)
    })
  })

  describe('pointInRing', () => {
    it('should return true for point between radii', () => {
      expect(pointInRing({ x: 7, y: 0 }, { x: 0, y: 0 }, 5, 10)).toBe(true)
    })
    it('should return false for point inside inner radius', () => {
      expect(pointInRing({ x: 3, y: 0 }, { x: 0, y: 0 }, 5, 10)).toBe(false)
    })
    it('should return false for point outside outer radius', () => {
      expect(pointInRing({ x: 12, y: 0 }, { x: 0, y: 0 }, 5, 10)).toBe(false)
    })
  })
})
