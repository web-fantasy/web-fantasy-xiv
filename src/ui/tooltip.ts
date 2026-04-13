// src/ui/tooltip.ts

export class Tooltip {
  private el: HTMLDivElement

  constructor(parent: HTMLDivElement) {
    this.el = document.createElement('div')
    this.el.style.cssText = `
      position: fixed; z-index: 200; display: none;
      background: rgba(10, 10, 15, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 4px; padding: 8px 12px;
      font-size: 12px; color: #ccc; line-height: 1.6;
      pointer-events: none; max-width: 260px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
    `
    parent.appendChild(this.el)
  }

  show(html: string, x: number, y: number): void {
    this.el.innerHTML = html
    this.el.style.display = 'block'

    // Position above the cursor, clamp to viewport
    const rect = this.el.getBoundingClientRect()
    let left = x - rect.width / 2
    let top = y - rect.height - 8

    if (left < 4) left = 4
    if (left + rect.width > window.innerWidth - 4) left = window.innerWidth - rect.width - 4
    if (top < 4) top = y + 20 // flip below if too high

    this.el.style.left = `${left}px`
    this.el.style.top = `${top}px`
  }

  hide(): void {
    this.el.style.display = 'none'
  }
}

// --- Tooltip content builders ---

const TYPE_NAMES: Record<string, string> = {
  weaponskill: '战技',
  spell: '魔法',
  ability: '能力技',
}

const TARGET_NAMES: Record<string, string> = {
  single: '单体',
  aoe: '范围',
}

export function buildSkillTooltip(skill: {
  name: string
  type: string
  castTime?: number
  cooldown?: number
  range?: number
  targetType?: string
  gcd?: boolean
  requiresTarget?: boolean
  effects?: { type: string; potency?: number; buffId?: string; distance?: number }[]
  zones?: { shape?: { type: string; radius?: number; angle?: number; length?: number; width?: number } }[]
}): string {
  const lines: string[] = []

  // Name + type
  lines.push(`<div style="color:#fff;font-size:13px;font-weight:bold;margin-bottom:4px">${skill.name}</div>`)

  const tags: string[] = []
  tags.push(`<span style="color:#aaa">${TYPE_NAMES[skill.type] ?? skill.type}</span>`)
  if (skill.targetType) tags.push(`<span style="color:#888">${TARGET_NAMES[skill.targetType] ?? skill.targetType}</span>`)
  if (skill.gcd) tags.push(`<span style="color:#666">GCD</span>`)
  lines.push(tags.join(' · '))

  // Cast / CD / Range
  const stats: string[] = []
  if (skill.castTime && skill.castTime > 0) stats.push(`咏唱 ${(skill.castTime / 1000).toFixed(1)}s`)
  if (skill.cooldown && skill.cooldown > 0) stats.push(`CD ${(skill.cooldown / 1000).toFixed(0)}s`)
  if (skill.range && skill.range > 0) stats.push(`距离 ${skill.range}m`)
  if (skill.requiresTarget) stats.push('需要目标')
  if (stats.length) lines.push(`<div style="color:#999;font-size:11px;margin-top:2px">${stats.join(' | ')}</div>`)

  // Effects
  if (skill.effects?.length) {
    for (const e of skill.effects) {
      lines.push(`<div style="margin-top:3px">${formatEffect(e)}</div>`)
    }
  }

  // Zone shapes
  if (skill.zones?.length) {
    for (const z of skill.zones) {
      if (z.shape) lines.push(`<div style="color:#888;font-size:11px">${formatShape(z.shape)}</div>`)
    }
  }

  return lines.join('')
}

export function buildBuffTooltip(buff: {
  name: string
  type: string
  stacks: number
  remaining: number
  effects: { type: string; value?: number }[]
}): string {
  const lines: string[] = []

  const color = buff.type === 'debuff' ? '#ff8888' : '#88ff88'
  lines.push(`<div style="color:${color};font-size:13px;font-weight:bold;margin-bottom:4px">${buff.name}</div>`)
  lines.push(`<span style="color:#aaa">${buff.type === 'debuff' ? '减益' : '增益'}</span>`)

  if (buff.stacks > 1) lines.push(` · <span style="color:#ddd">${buff.stacks} 层</span>`)

  if (buff.remaining > 0) {
    lines.push(`<div style="color:#999;font-size:11px;margin-top:2px">剩余 ${(buff.remaining / 1000).toFixed(1)}s</div>`)
  }

  for (const e of buff.effects) {
    lines.push(`<div style="margin-top:3px">${formatBuffEffect(e, buff.stacks)}</div>`)
  }

  return lines.join('')
}

function formatEffect(e: { type: string; potency?: number; buffId?: string; distance?: number; stacks?: number }): string {
  switch (e.type) {
    case 'damage': return `<span style="color:#ff8888">伤害 ×${e.potency}</span>`
    case 'heal': return `<span style="color:#88ff88">治疗 ×${e.potency}</span>`
    case 'apply_buff': return `<span style="color:#ffcc66">施加 ${e.buffId}${e.stacks && e.stacks > 1 ? ` ×${e.stacks}` : ''}</span>`
    case 'dash': return `<span style="color:#88ccff">突进至目标</span>`
    case 'backstep': return `<span style="color:#88ccff">后跳 ${e.distance}m</span>`
    case 'knockback': return `<span style="color:#ffaa66">击退 ${e.distance}m</span>`
    case 'pull': return `<span style="color:#ffaa66">吸引 ${e.distance}m</span>`
    default: return `<span style="color:#888">${e.type}</span>`
  }
}

function formatBuffEffect(e: { type: string; value?: number }, stacks: number): string {
  const v = e.value ?? 0
  const total = v * stacks
  const pct = (total * 100).toFixed(0)
  switch (e.type) {
    case 'damage_increase': return `<span style="color:#ff8888">增伤 +${pct}%</span>`
    case 'mitigation': return `<span style="color:#88ccff">减伤 ${(v * 100).toFixed(0)}%</span>`
    case 'vulnerability': return `<span style="color:#ff6666">易伤 +${pct}%${stacks > 1 ? ` (${(v * 100).toFixed(0)}% × ${stacks})` : ''}</span>`
    case 'speed_modify': return `<span style="color:#88ff88">速度 ${v > 0 ? '+' : ''}${(v * 100).toFixed(0)}%</span>`
    case 'dot': return `<span style="color:#ff8888">持续伤害</span>`
    case 'hot': return `<span style="color:#88ff88">持续治疗</span>`
    case 'silence': return `<span style="color:#ff6666">沉默</span>`
    case 'stun': return `<span style="color:#ff6666">眩晕</span>`
    default: return `<span style="color:#888">${e.type}</span>`
  }
}

function formatShape(s: { type: string; radius?: number; angle?: number; length?: number; width?: number }): string {
  switch (s.type) {
    case 'circle': return `圆形 r=${s.radius}m`
    case 'fan': return `扇形 r=${s.radius}m ${s.angle}°`
    case 'ring': return `环形`
    case 'rect': return `矩形 ${s.length}×${s.width}m`
    default: return s.type
  }
}
