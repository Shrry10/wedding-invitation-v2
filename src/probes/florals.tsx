import { createRoot } from 'react-dom/client'
import '../index.css'
import { FloralSpray } from '../components/art/Florals'
import { FlowerPhoto, type FlowerPhotoId } from '../components/art/Flowers'

const PHOTOS: readonly FlowerPhotoId[] = [
  'posy',
  'tied-posy',
  'tray-bouquet',
  'wild-rose-spray',
  'envelope-bouquet',
  'wild-roses-on-frame',
]

/**
 * Probe page: every drawn floral variant, then every flower photograph, side by
 * side on white at review size.
 */
function Probe() {
  const cell: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'ui-sans-serif, system-ui',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--color-ink-soft)',
  }
  return (
    <div
      style={{
        background: 'var(--color-paper)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        padding: '12px 8px',
      }}
    >
      <div style={cell}>
        <FloralSpray variant="corner" size={250} />
        <span>corner</span>
      </div>
      <div style={cell}>
        <FloralSpray variant="tied" size={300} />
        <span>tied</span>
      </div>
      <div style={cell}>
        <FloralSpray variant="sprig" size={170} />
        <span>sprig</span>
      </div>
      <div style={cell}>
        <FloralSpray variant="sprig" size={170} flip />
        <span>sprig flipped</span>
      </div>
      <div style={cell}>
        <FloralSpray variant="corner" size={110} />
        <FloralSpray variant="tied" size={130} />
        <span>on-page size</span>
      </div>
      {PHOTOS.map((id) => (
        <div key={id} style={{ ...cell, width: '200px' }}>
          <FlowerPhoto photo={id} eager style={{ width: '100%', height: 'auto' }} />
          <span>{id}</span>
        </div>
      ))}
    </div>
  )
}

const mount = document.getElementById('probe')
if (mount) createRoot(mount).render(<Probe />)
