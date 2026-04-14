import { useEffect, useState } from 'preact/hooks'

interface EncounterEntry {
  label: string
  description: string
  file: string
}

export function MainMenu() {
  const [levels, setLevels] = useState<EncounterEntry[]>([])
  const base = import.meta.env.BASE_URL

  useEffect(() => {
    fetch(`${base}encounters/index.json`)
      .then((r) => r.json())
      .then(setLevels)
  }, [])

  return (
    <div
      class="absolute inset-0 flex flex-col items-center justify-center z-100"
      style={{ background: 'rgba(0, 0, 0, 0.85)', pointerEvents: 'auto' }}
    >
      <h1 class="text-4xl text-gray-200 mb-2 font-light tracking-widest">Web Fantasy XIV</h1>
      <p class="text-sm text-gray-500 mb-10 tracking-wide">Boss Battle Simulator</p>
      {levels.map((lv) => {
        const id = lv.file.replace(/\.yaml$/, '')
        return (
          <a
            key={id}
            href={`/encounter/${id}`}
            class="block min-w-60 px-8 py-3 my-1 text-sm text-gray-400 tracking-wide text-left rounded border border-white/20 transition-all duration-150 hover:bg-white/20 hover:text-white"
            style={{ background: 'rgba(255, 255, 255, 0.1)', pointerEvents: 'auto' }}
          >
            <div>{'\u25B6  '}{lv.label}</div>
            {lv.description && (
              <div class="text-xs text-gray-500 mt-0.5">{lv.description}</div>
            )}
          </a>
        )
      })}
    </div>
  )
}
