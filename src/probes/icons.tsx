import { createRoot } from 'react-dom/client'
import '../index.css'
import { LineIcon } from '../components/art/LineIcons'
import type { LineIconName } from '../components/art/LineIcons'

const NAMES: LineIconName[] = [
  'calendar',
  'ceremony',
  'reception',
  'travel',
  'stay',
  'hearts',
  'champagne-tower',
  'chandelier',
  'dinner',
  'cake',
  'shoes',
  'cupid',
  'first-date',
  'suitcase',
  'ring-hand',
  'car',
  'honeymoon',
]

function Sheet() {
  return (
    <div
      style={{
        background: 'var(--color-paper)',
        padding: '12px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '4px',
        fontFamily: 'ui-serif, Georgia, serif',
      }}
    >
      {NAMES.map((name) => (
        <div key={name} style={{ textAlign: 'center' }}>
          <LineIcon name={name} size={186} />
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.08em',
              color: 'var(--color-ink-soft)',
            }}
          >
            {name}
            <LineIcon name={name} size={44} />
          </div>
        </div>
      ))}
    </div>
  )
}

const mount = document.getElementById('probe')
if (mount) createRoot(mount).render(<Sheet />)
