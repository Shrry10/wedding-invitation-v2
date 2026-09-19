import { createRoot } from 'react-dom/client'
import '../index.css'

/** Development-only sheet for choosing the script face against the reference. */
function Type() {
  return (
    <div style={{ background: 'var(--color-paper)', padding: 40, color: 'var(--color-ink)' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: '0.12em' }}>
        GREAT VIBES
      </p>
      <p style={{ fontFamily: 'var(--font-script)', fontSize: 68, margin: '0 0 6px' }}>
        Sreetam &amp;
      </p>
      <p style={{ fontFamily: 'var(--font-script)', fontSize: 68, margin: '0 0 30px' }}>
        Bhavna
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: '0.12em' }}>
        PINYON SCRIPT
      </p>
      <p style={{ fontFamily: 'var(--font-script-alt)', fontSize: 68, margin: '0 0 6px' }}>
        Sreetam &amp;
      </p>
      <p style={{ fontFamily: 'var(--font-script-alt)', fontSize: 68, margin: '0 0 30px' }}>
        Bhavna
      </p>
      <p style={{ fontFamily: 'var(--font-script)', fontSize: 40, margin: '0 0 8px' }}>
        Date and Location · Countdown · Our story
      </p>
      <p style={{ fontFamily: 'var(--font-script-alt)', fontSize: 40, margin: '0 0 30px' }}>
        Date and Location · Countdown · Our story
      </p>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 46, letterSpacing: '0.1em', margin: '0 0 8px' }}>
        OUR STORY
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 46, letterSpacing: '0.1em', margin: 0 }}>
        THE DETAILS
      </p>
    </div>
  )
}

createRoot(document.getElementById('probe') as HTMLElement).render(<Type />)
