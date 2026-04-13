// src/renderer/arena-renderer.ts
import {
  MeshBuilder, StandardMaterial, Color3,
  type Scene, type Mesh,
} from '@babylonjs/core'
import type { ArenaDef, AoeShapeDef } from '@/core/types'
import type { EventBus } from '@/core/event-bus'

const DEATH_ZONE_COLOR = new Color3(0.3, 0.05, 0.35)  // dark purple
const DEATH_ZONE_EMISSIVE = new Color3(0.15, 0.02, 0.18)

export class ArenaRenderer {
  private deathZoneMeshes = new Map<string, Mesh>()
  private dzMat: StandardMaterial

  constructor(private scene: Scene, arenaDef: ArenaDef, private bus?: EventBus) {
    if (arenaDef.shape.type === 'circle') {
      this.createCircleArena(scene, arenaDef)
    } else {
      this.createRectArena(scene, arenaDef.shape.width, arenaDef.shape.height)
    }

    this.dzMat = new StandardMaterial('deathzone-mat', scene)
    this.dzMat.diffuseColor = DEATH_ZONE_COLOR
    this.dzMat.emissiveColor = DEATH_ZONE_EMISSIVE
    this.dzMat.specularColor = Color3.Black()
    this.dzMat.alpha = 0.8

    // Listen for dynamic death zone events
    if (bus) {
      bus.on('deathzone:added', (payload: { zone: { id: string; center: { x: number; y: number }; facing: number; shape: AoeShapeDef } }) => {
        this.addDeathZoneMesh(payload.zone.id, payload.zone.center, payload.zone.shape, payload.zone.facing)
      })
      bus.on('deathzone:removed', (payload: { id: string }) => {
        this.removeDeathZoneMesh(payload.id)
      })
    }
  }

  private addDeathZoneMesh(id: string, center: { x: number; y: number }, shape: AoeShapeDef, facing: number): void {
    // Remove existing mesh with same id
    this.removeDeathZoneMesh(id)

    let mesh: Mesh
    const facingRad = (facing * Math.PI) / 180

    switch (shape.type) {
      case 'circle':
        mesh = MeshBuilder.CreateDisc(`deathzone-${id}`, { radius: shape.radius, tessellation: 48 }, this.scene)
        break
      case 'fan': {
        const arcRad = (shape.angle * Math.PI) / 180
        const segments = 32
        const positions: number[] = [0, 0, 0]
        const indices: number[] = []
        for (let i = 0; i <= segments; i++) {
          const a = -arcRad / 2 + (arcRad * i) / segments
          positions.push(Math.sin(a) * shape.radius, 0, Math.cos(a) * shape.radius)
          if (i > 0) {
            indices.push(0, i, i + 1)
          }
        }
        const normals: number[] = new Array(positions.length).fill(0)
        for (let i = 0; i < normals.length; i += 3) normals[i + 1] = 1
        mesh = new MeshBuilder.CreateGround(`deathzone-${id}`, { width: 1, height: 1 }, this.scene)
        mesh.dispose()
        mesh = MeshBuilder.CreateDisc(`deathzone-${id}`, { radius: shape.radius, arc: shape.angle / 360, tessellation: 48 }, this.scene)
        break
      }
      case 'ring':
        mesh = MeshBuilder.CreateDisc(`deathzone-${id}`, { radius: shape.outerRadius, tessellation: 48 }, this.scene)
        // TODO: proper ring with inner hole — for now use outer disc
        break
      case 'rect':
        mesh = MeshBuilder.CreateGround(`deathzone-${id}`, { width: shape.width, height: shape.length }, this.scene)
        break
      default:
        return
    }

    mesh.rotation.x = Math.PI / 2
    if (shape.type === 'rect') mesh.rotation.x = 0 // ground already flat
    if (shape.type === 'fan') {
      mesh.rotation.y = -facingRad
    } else if (shape.type === 'rect') {
      mesh.rotation.y = -facingRad
    }
    mesh.position.set(center.x, 0.02, center.y)
    mesh.material = this.dzMat
    this.deathZoneMeshes.set(id, mesh)
  }

  private removeDeathZoneMesh(id: string): void {
    const mesh = this.deathZoneMeshes.get(id)
    if (mesh) {
      mesh.dispose()
      this.deathZoneMeshes.delete(id)
    }
  }

  private createCircleArena(scene: Scene, arenaDef: ArenaDef): void {
    const radius = (arenaDef.shape as { type: 'circle'; radius: number }).radius

    // Ground disc
    const ground = MeshBuilder.CreateDisc('arena-ground', {
      radius,
      tessellation: 64,
    }, scene)
    ground.rotation.x = Math.PI / 2 // flat on ground

    const mat = new StandardMaterial('arena-mat', scene)
    mat.diffuseColor = new Color3(0.35, 0.35, 0.38)  // gray
    mat.specularColor = Color3.Black()
    ground.material = mat

    if (arenaDef.boundary === 'lethal') {
      // Lethal boundary: purple outer ring instead of white
      const outerRadius = radius + 5
      const outerDisc = MeshBuilder.CreateDisc('arena-deathzone-outer', {
        radius: outerRadius,
        tessellation: 64,
      }, scene)
      outerDisc.rotation.x = Math.PI / 2
      outerDisc.position.y = -0.01 // slightly below arena
      const dzMat = new StandardMaterial('deathzone-outer-mat', scene)
      dzMat.diffuseColor = DEATH_ZONE_COLOR
      dzMat.emissiveColor = DEATH_ZONE_EMISSIVE
      dzMat.specularColor = Color3.Black()
      outerDisc.material = dzMat

      // Boundary ring in purple
      const boundary = MeshBuilder.CreateTorus('arena-boundary', {
        diameter: radius * 2,
        thickness: 0.15,
        tessellation: 64,
      }, scene)
      boundary.position.y = 0.05
      const boundaryMat = new StandardMaterial('boundary-mat', scene)
      boundaryMat.diffuseColor = new Color3(0.5, 0.1, 0.55)
      boundaryMat.emissiveColor = new Color3(0.25, 0.05, 0.3)
      boundary.material = boundaryMat
    } else {
      // Wall boundary: white torus
      const boundary = MeshBuilder.CreateTorus('arena-boundary', {
        diameter: radius * 2,
        thickness: 0.1,
        tessellation: 64,
      }, scene)
      boundary.position.y = 0.05

      const boundaryMat = new StandardMaterial('boundary-mat', scene)
      boundaryMat.diffuseColor = new Color3(0.9, 0.9, 0.9)
      boundaryMat.emissiveColor = new Color3(0.3, 0.3, 0.3)
      boundary.material = boundaryMat
    }
  }

  private createRectArena(scene: Scene, width: number, height: number): void {
    const ground = MeshBuilder.CreateGround('arena-ground', {
      width,
      height,
    }, scene)

    const mat = new StandardMaterial('arena-mat', scene)
    mat.diffuseColor = new Color3(0.35, 0.35, 0.38)  // gray
    mat.specularColor = Color3.Black()
    ground.material = mat

    // Boundary lines (thin white boxes)
    const thickness = 0.1
    const lineHeight = 0.2
    const sides = [
      { name: 'top', w: width, h: thickness, x: 0, z: height / 2 },
      { name: 'bottom', w: width, h: thickness, x: 0, z: -height / 2 },
      { name: 'left', w: thickness, h: height, x: -width / 2, z: 0 },
      { name: 'right', w: thickness, h: height, x: width / 2, z: 0 },
    ]

    const boundaryMat = new StandardMaterial('boundary-mat', scene)
    boundaryMat.diffuseColor = new Color3(0.9, 0.9, 0.9)
    boundaryMat.emissiveColor = new Color3(0.3, 0.3, 0.3)

    for (const side of sides) {
      const box = MeshBuilder.CreateBox(`boundary-${side.name}`, {
        width: side.w, height: lineHeight, depth: side.h,
      }, scene)
      box.position.set(side.x, lineHeight / 2, side.z)
      box.material = boundaryMat
    }
  }
}
