// src/tower/random.ts
//
// Seeded PRNG (mulberry32). ~10 行的 high-quality 伪随机.
// spec §7.4：所有 tower-mode 随机生成都使用此模块，**禁止 Math.random**.

/**
 * 将任意字符串 seed 哈希到 uint32.
 * 使用 FNV-1a 变体，足够稳定且无依赖.
 */
export function seedToUint32(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type Rng = () => number

/**
 * 基于字符串 seed 创建 PRNG. 返回函数每次调用产生 [0, 1) 区间浮点数.
 * 算法：mulberry32，周期 2^32，质量足够游戏级别的随机需求.
 */
export function createRng(seed: string): Rng {
  let state = seedToUint32(seed)
  return function mulberry32(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
