// src/ui/timeline-display.ts
import type { SkillDef } from '@/core/types'
import type { TimelineAction } from '@/config/schema'
import type { PhaseScheduler } from '@/timeline/phase-scheduler'

const STORAGE_KEY = 'xiv-timeline-collapsed'
const WINDOW_MS = 30000 // show skills within 30s
const MAX_ENTRIES = 5
const FLASH_DURATION = 1000

interface DisplayEntry {
  /** unique key: phaseId_at_use */
  key: string
  action: TimelineAction
  skill: SkillDef
  el: HTMLDivElement
  bar: HTMLDivElement
  countdown: HTMLSpanElement
  state: 'upcoming' | 'casting' | 'flash'
  flashElapsed: number
}

export class TimelineDisplay {
  private container: HTMLDivElement
  private header: HTMLDivElement
  private list: HTMLDivElement
  private collapsed: boolean
  private entries: DisplayEntry[] = []

  constructor(
    parent: HTMLDivElement,
    private scheduler: PhaseScheduler,
    private skillMap: Map<string, SkillDef>,
  ) {
    this.collapsed = localStorage.getItem(STORAGE_KEY) === 'true'

    this.container = document.createElement('div')
    this.container.style.cssText = `
      position: absolute; top: 60px; left: 12px;
      width: 220px; z-index: 50;
      font-size: 12px; font-family: 'Segoe UI', sans-serif;
    `

    this.header = document.createElement('div')
    this.header.style.cssText = `
      background: rgba(0,0,0,0.7); padding: 4px 10px;
      cursor: pointer; border-radius: 4px 4px 0 0;
      color: #aaa; display: flex; justify-content: space-between;
      border: 1px solid rgba(255,255,255,0.1);
      border-bottom: none; user-select: none;
    `
    const label = document.createElement('span')
    label.textContent = 'Timeline'
    this.header.appendChild(label)
    const arrow = document.createElement('span')
    arrow.textContent = this.collapsed ? '▸' : '▾'
    arrow.id = 'tl-arrow'
    this.header.appendChild(arrow)
    this.header.addEventListener('click', () => this.toggle())
    this.container.appendChild(this.header)

    this.list = document.createElement('div')
    this.list.style.cssText = `
      background: rgba(0,0,0,0.6);
      border: 1px solid rgba(255,255,255,0.1);
      border-top: none; border-radius: 0 0 4px 4px;
      overflow: hidden;
      display: ${this.collapsed ? 'none' : 'block'};
    `
    this.container.appendChild(this.list)

    parent.appendChild(this.container)
  }

  private toggle(): void {
    this.collapsed = !this.collapsed
    localStorage.setItem(STORAGE_KEY, String(this.collapsed))
    this.list.style.display = this.collapsed ? 'none' : 'block'
    const arrow = this.header.querySelector('#tl-arrow')
    if (arrow) arrow.textContent = this.collapsed ? '▸' : '▾'
  }

  /** Call each logic frame */
  update(dt: number): void {
    if (this.collapsed) return

    const elapsed = this.scheduler.combatElapsed
    const allActions = this.scheduler.getAllActions()

    // Collect upcoming skill actions within window
    const upcoming: { key: string; action: TimelineAction; skill: SkillDef; absoluteAt: number; timeUntil: number }[] = []

    for (const { action, phaseId, absoluteAt } of allActions) {
      if (action.action !== 'use' || !action.use) continue
      const skill = this.skillMap.get(action.use)
      if (!skill) continue

      const timeUntil = absoluteAt - elapsed
      if (timeUntil > WINDOW_MS) continue
      if (timeUntil < -FLASH_DURATION - (skill.castTime || 0)) continue

      const key = `${phaseId}_${action.at}_${action.use}_${action.entity ?? ''}`
      upcoming.push({ key, action, skill, absoluteAt, timeUntil })
    }

    // Sort by absolute time, take first MAX_ENTRIES
    upcoming.sort((a, b) => a.absoluteAt - b.absoluteAt)
    const visible = upcoming.slice(0, MAX_ENTRIES)

    // Reconcile DOM entries
    this.reconcileEntries(visible)

    // Update each entry
    for (const entry of this.entries) {
      const match = visible.find((v) => v.key === entry.key)
      const timeUntil = match ? match.timeUntil : -99999
      this.updateEntry(entry, timeUntil, dt)
    }
  }

  private reconcileEntries(
    visible: { key: string; action: TimelineAction; skill: SkillDef; timeUntil: number }[],
  ): void {
    const existingKeys = new Set(this.entries.map((e) => e.key))
    const visibleKeys = new Set(visible.map((v) => v.key))

    // Remove entries no longer visible
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (!visibleKeys.has(this.entries[i].key)) {
        this.entries[i].el.remove()
        this.entries.splice(i, 1)
      }
    }

    // Add new entries
    for (const v of visible) {
      if (!existingKeys.has(v.key)) {
        const entry = this.createElement(v.key, v.action, v.skill)
        this.entries.push(entry)
      }
    }

    // Sort and re-order DOM
    const keyOrder = visible.map((v) => v.key)
    this.entries.sort((a, b) => keyOrder.indexOf(a.key) - keyOrder.indexOf(b.key))
    for (const e of this.entries) {
      this.list.appendChild(e.el)
    }
  }

  private createElement(key: string, action: TimelineAction, skill: SkillDef): DisplayEntry {
    const el = document.createElement('div')
    el.style.cssText = `
      padding: 3px 8px; position: relative;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      overflow: hidden;
    `

    const bar = document.createElement('div')
    bar.style.cssText = `
      position: absolute; left: 0; top: 0; height: 100%;
      background: rgba(100, 160, 255, 0.15);
      width: 0%; transition: none;
    `
    el.appendChild(bar)

    const row = document.createElement('div')
    row.style.cssText = `
      position: relative; display: flex; justify-content: space-between;
      align-items: center; z-index: 1;
    `

    const name = document.createElement('span')
    name.textContent = skill.name
    name.style.cssText = 'color: #ccc;'
    row.appendChild(name)

    const countdown = document.createElement('span')
    countdown.style.cssText = 'color: #888; font-variant-numeric: tabular-nums;'
    row.appendChild(countdown)

    el.appendChild(row)

    return { key, action, skill, el, bar, countdown, state: 'upcoming', flashElapsed: 0 }
  }

  private updateEntry(entry: DisplayEntry, timeUntil: number, dt: number): void {
    const isInstant = entry.skill.type !== 'spell' || entry.skill.castTime === 0

    if (entry.state === 'upcoming') {
      if (timeUntil > 0) {
        // Countdown
        entry.countdown.textContent = (timeUntil / 1000).toFixed(1)
        const pct = Math.max(0, 1 - timeUntil / WINDOW_MS) * 100
        entry.bar.style.width = `${pct}%`
        entry.bar.style.background = 'rgba(100, 160, 255, 0.15)'
      } else {
        // Skill activated
        if (isInstant) {
          entry.state = 'flash'
          entry.flashElapsed = 0
          entry.bar.style.width = '100%'
          entry.bar.style.background = 'rgba(255, 200, 80, 0.3)'
          entry.countdown.textContent = ''
        } else {
          entry.state = 'casting'
          entry.bar.style.width = '100%'
        }
      }
    }

    if (entry.state === 'casting') {
      const castTime = entry.skill.castTime
      const castElapsed = -timeUntil // how far past activation
      if (castElapsed < castTime) {
        // Bar empties during cast
        const remaining = 1 - castElapsed / castTime
        entry.bar.style.width = `${remaining * 100}%`
        entry.bar.style.background = 'rgba(255, 140, 60, 0.25)'
        entry.countdown.textContent = ((castTime - castElapsed) / 1000).toFixed(1)
      } else {
        // Cast complete → flash
        entry.state = 'flash'
        entry.flashElapsed = 0
        entry.bar.style.width = '100%'
        entry.bar.style.background = 'rgba(255, 200, 80, 0.3)'
        entry.countdown.textContent = ''
      }
    }

    if (entry.state === 'flash') {
      entry.flashElapsed += dt
      // Blink effect
      const blink = Math.sin(entry.flashElapsed * 0.01) > 0
      entry.el.style.opacity = blink ? '1' : '0.5'

      if (entry.flashElapsed >= FLASH_DURATION) {
        entry.el.remove()
        const idx = this.entries.indexOf(entry)
        if (idx !== -1) this.entries.splice(idx, 1)
      }
    }
  }
}
