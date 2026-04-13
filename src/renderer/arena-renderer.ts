// src/renderer/arena-renderer.ts
import {
  MeshBuilder, StandardMaterial, Color3,
  type Scene,
} from '@babylonjs/core'
import type { ArenaDef } from '@/core/types'

export class ArenaRenderer {
  constructor(scene: Scene, arenaDef: ArenaDef) {
    if (arenaDef.shape.type === 'circle') {
      this.createCircleArena(scene, arenaDef.shape.radius)
    } else {
      this.createRectArena(scene, arenaDef.shape.width, arenaDef.shape.height)
    }
  }

  private createCircleArena(scene: Scene, radius: number): void {
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

    // Boundary ring (thin white torus)
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
