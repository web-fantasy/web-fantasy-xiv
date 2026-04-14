import { useEffect, useRef } from 'preact/hooks'
import { useRoute } from 'preact-iso'
import { useEngine } from '../engine-context'
import { startTimelineDemo, disposeActiveScene } from '@/demo/demo-timeline'

export function GameView() {
  const { params } = useRoute()
  const { canvas } = useEngine()
  const uiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const uiRoot = uiRef.current!
    const id = params.id
    const base = import.meta.env.BASE_URL
    const encounterUrl = `${base}encounters/${id}.yaml`

    startTimelineDemo(canvas!, uiRoot, encounterUrl)

    return () => {
      disposeActiveScene()
    }
  }, [params.id, canvas])

  return (
    <div
      ref={uiRef}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}
