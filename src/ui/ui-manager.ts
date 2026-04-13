// src/ui/ui-manager.ts
import type { EventBus } from '@/core/event-bus'
import type { Entity } from '@/entity/entity'
import type { SkillDef } from '@/core/types'
import { HpBar } from './hp-bar'
import { SkillBar } from './skill-bar'
import { CastBar } from './cast-bar'
import { DamageFloater } from './damage-floater'
import { GCD_DURATION } from '@/skill/skill-resolver'

export class UIManager {
  private playerHp: HpBar
  private bossHp: HpBar
  private skillBar: SkillBar
  private playerCastBar: CastBar
  private bossCastBar: CastBar
  private damageFloater: DamageFloater

  constructor(
    root: HTMLDivElement,
    bus: EventBus,
    skills: SkillDef[],
  ) {
    DamageFloater.injectStyles()

    this.bossHp = new HpBar(root, '', '#cc3333', 'top')
    this.playerHp = new HpBar(root, '', '#3388cc', 'bottom')
    this.skillBar = new SkillBar(root, skills)
    this.playerCastBar = new CastBar(root, {
      position: 'bottom: 120px',
      color: 'linear-gradient(90deg, #4a9eff, #82c0ff)',
    })
    this.bossCastBar = new CastBar(root, {
      position: 'top: 50px',
      color: 'linear-gradient(90deg, #cc5533, #ff7744)',
    })
    this.damageFloater = new DamageFloater(root)

    bus.on('damage:dealt', (payload: { target: Entity; amount: number }) => {
      const x = window.innerWidth / 2 + (Math.random() - 0.5) * 100
      const y = window.innerHeight / 2 + (Math.random() - 0.5) * 50
      this.damageFloater.spawn(x, y, payload.amount, false)
    })

    bus.on('skill:cast_start', (payload: { caster: Entity; skill: { name: string } }) => {
      const bar = payload.caster.type === 'player' ? this.playerCastBar : this.bossCastBar
      bar.show(payload.skill?.name ?? 'Casting...')
    })

    bus.on('skill:cast_complete', (payload: { caster: Entity }) => {
      if (payload.caster.type === 'player') {
        this.playerCastBar.hide()
      } else {
        this.bossCastBar.hide()
      }
    })

    bus.on('skill:cast_interrupted', (payload: { caster: Entity }) => {
      if (payload.caster?.type === 'player') {
        this.playerCastBar.hide()
      } else {
        this.bossCastBar.hide()
      }
    })
  }

  update(player: Entity, boss: Entity, getCooldown: (skillId: string) => number): void {
    this.playerHp.update(player.hp, player.maxHp)
    this.bossHp.update(boss.hp, boss.maxHp)
    this.skillBar.update(player.gcdTimer, GCD_DURATION, getCooldown)

    if (player.casting) {
      this.playerCastBar.updateProgress(player.casting.elapsed, player.casting.castTime)
    }
    if (boss.casting) {
      this.bossCastBar.updateProgress(boss.casting.elapsed, boss.casting.castTime)
    } else {
      this.bossCastBar.hide()
    }
  }
}
