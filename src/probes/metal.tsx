import { createRoot } from 'react-dom/client'
import '../index.css'
import { AntiqueKey, PearlEarrings, SilverTray, WaxSeal } from '../components/art/Metal'

/**
 * A drawing bench for the metal module: every object at a size worth judging,
 * plus the two small sizes the pages actually use, since a seal that survives
 * 300 pixels can still go muddy at 46.
 */
function Bench() {
  return (
    <div
      style={{
        background: 'var(--color-paper)',
        padding: '18px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <WaxSeal monogram="MA" size={300} />
        <div style={{ display: 'flex', gap: '18px', alignItems: 'flex-end' }}>
          <WaxSeal monogram="MA" size={96} />
          <WaxSeal monogram="MA" size={46} />
        </div>
        <div style={{ width: '220px' }}>
          <PearlEarrings />
        </div>
      </div>

      <div style={{ width: '380px' }}>
        <SilverTray>
          <div style={{ textAlign: 'center', color: 'var(--color-ink)' }}>
            <div style={{ fontFamily: 'var(--font-script)', fontSize: '28px' }}>The Details</div>
            <div style={{ fontSize: '10px', letterSpacing: '0.14em' }}>CLICK HERE</div>
          </div>
        </SilverTray>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        <div style={{ width: '260px' }}>
          <AntiqueKey />
        </div>
        <div style={{ width: '96px' }}>
          <AntiqueKey />
        </div>
      </div>
    </div>
  )
}

const host = document.getElementById('probe')
if (host !== null) createRoot(host).render(<Bench />)
