import { createRoot } from 'react-dom/client'
import '../index.css'
import {
  OPEN_ENVELOPE_SEAL,
  OpenEnvelope,
  OrnateFrame,
  Polaroid,
  SEALED_ENVELOPE_SEAL,
  SealedEnvelope,
} from '../components/art/Maroon'

/** Stand-in for the wax seal another module owns, so the slot can be judged. */
function SealSlot({ spec }: { spec: { left: number; top: number; diameter: number } }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${spec.left * 100}%`,
        top: `${spec.top * 100}%`,
        width: `${spec.diameter * 100}%`,
        aspectRatio: '1',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'var(--color-gold)',
        border: '2px solid var(--color-gold-deep)',
      }}
    />
  )
}

function Cell({ x, y, w, children }: { x: number; y: number; w: number; children: React.ReactNode }) {
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w }}>{children}</div>
  )
}

function Probe() {
  return (
    <div style={{ position: 'relative', background: 'var(--color-paper)', height: 900 }}>
      <Cell x={20} y={20} w={430}>
        <div style={{ position: 'relative' }}>
          <SealedEnvelope />
          <SealSlot spec={SEALED_ENVELOPE_SEAL} />
        </div>
      </Cell>

      <Cell x={470} y={20} w={300}>
        <div style={{ position: 'relative' }}>
          <OpenEnvelope>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'var(--color-cream)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              }}
            />
          </OpenEnvelope>
          <SealSlot spec={OPEN_ENVELOPE_SEAL} />
        </div>
      </Cell>

      <Cell x={800} y={20} w={150}>
        <Polaroid caption="Once" tilt={-4} />
      </Cell>
      <Cell x={960} y={20} w={120}>
        <Polaroid caption="0.8 2021" tilt={3}>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(var(--color-silver-light), var(--color-leaf-light))',
            }}
          />
        </Polaroid>
      </Cell>

      <Cell x={20} y={380} w={440}>
        <OrnateFrame>
          <div style={{ width: '100%', height: '100%', background: 'var(--color-maroon)' }} />
        </OrnateFrame>
      </Cell>
      <Cell x={490} y={380} w={300}>
        <OrnateFrame ratio="4 / 3">
          <div style={{ width: '100%', height: '100%', background: 'var(--color-cream-deep)' }} />
        </OrnateFrame>
      </Cell>
      <Cell x={810} y={380} w={200}>
        <OrnateFrame ratio={0.8}>
          <div style={{ width: '100%', height: '100%', background: 'var(--color-cream-deep)' }} />
        </OrnateFrame>
      </Cell>
    </div>
  )
}

createRoot(document.getElementById('probe') as HTMLElement).render(<Probe />)
