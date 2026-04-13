import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Plane } from '@babylonjs/core'

export class SceneManager {
  readonly engine: Engine
  readonly scene: Scene
  readonly camera: ArcRotateCamera

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: true })

    this.scene = new Scene(this.engine)
    this.scene.clearColor.set(0.12, 0.12, 0.14, 1) // dark gray

    // Fixed top-down camera (~70° elevation from ground = 20° from zenith)
    this.camera = new ArcRotateCamera(
      'camera',
      -Math.PI / 2, // alpha: rotation around Y
      (28 * Math.PI) / 180, // beta: 28° from zenith (~62° elevation)
      40, // radius: distance from target
      Vector3.Zero(),
      this.scene,
    )
    // Disable user camera control (fixed view)
    this.camera.attachControl(canvas, false)
    this.camera.inputs.clear()

    // Ambient fill light (soft, from above)
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), this.scene)
    ambient.intensity = 0.5

    // Directional light from northwest → shadows fall to southeast (bottom-right on screen)
    // Direction vector points FROM light TO scene: (-1, -2, -1) = light comes from +X, +Y, +Z (NW above)
    const sun = new DirectionalLight('sun', new Vector3(-1, -2, -1).normalize(), this.scene)
    sun.intensity = 0.6
  }

  /** Follow a world position (e.g. player) */
  followTarget(x: number, y: number): void {
    this.camera.target.set(x, 0, y)
  }

  startRenderLoop(onBeforeRender: () => void): void {
    this.engine.runRenderLoop(() => {
      onBeforeRender()
      this.scene.render()
    })
  }

  /** Project screen mouse position to Y=0 ground plane (works even outside arena mesh) */
  pickGroundPosition(): { x: number; y: number } | null {
    const ray = this.scene.createPickingRay(
      this.scene.pointerX,
      this.scene.pointerY,
      null,
      this.camera,
    )
    // Intersect with Y=0 plane
    const groundPlane = Plane.FromPositionAndNormal(Vector3.Zero(), Vector3.Up())
    const distance = ray.intersectsPlane(groundPlane)
    if (distance === null || distance < 0) return null

    const hit = ray.origin.add(ray.direction.scale(distance))
    return { x: hit.x, y: hit.z } // Babylon Z → game Y
  }

  dispose(): void {
    this.engine.dispose()
  }
}
