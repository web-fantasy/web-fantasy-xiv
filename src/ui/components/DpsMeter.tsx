import { dpsMeter } from '../state'

export function DpsMeter() {
  const { skills, totalDamage, dps } = dpsMeter.value
  if (totalDamage === 0) return null

  return (
    <div
      style={{
        marginTop: 6,
        background: 'rgba(0,0,0,0.7)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '4px 10px',
          color: '#aaa',
          fontSize: 10,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        DPS Meter
      </div>

      {skills.map((s) => (
        <div
          key={s.name}
          class="relative overflow-hidden"
          style={{
            padding: '2px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            class="absolute left-0 top-0 h-full"
            style={{
              width: `${(s.percent * 100).toFixed(1)}%`,
              background: 'rgba(255, 100, 60, 0.15)',
            }}
          />
          <div class="relative flex justify-between items-center z-1" style={{ fontSize: 10 }}>
            <span style={{ color: '#ccc' }}>{s.name}</span>
            <span class="tabular-nums" style={{ color: '#888' }}>
              {formatDamage(s.total)}
              <span style={{ color: '#666', marginLeft: 4 }}>
                {(s.percent * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        </div>
      ))}

      <div
        style={{
          padding: '4px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          color: '#999',
        }}
      >
        <span>Total {formatDamage(totalDamage)}</span>
        <span class="tabular-nums">{formatDamage(Math.floor(dps))} DPS</span>
      </div>
    </div>
  )
}

function formatDamage(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
