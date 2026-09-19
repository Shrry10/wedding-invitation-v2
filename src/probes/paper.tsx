import { createRoot } from 'react-dom/client'
import '../index.css'
import {
  DeckleStamp,
  EmbossedCard,
  HeartFlourish,
  InvitationCard,
  ScallopedBox,
  ScallopedOval,
} from '../components/art/Paper'

/** Probe page: every cream-paper object at a size where the engraving is legible. */
function Probe() {
  const script = { fontFamily: 'var(--font-script)', fontSize: 26, lineHeight: 1.1 }
  const caps = {
    fontFamily: 'var(--font-display)',
    letterSpacing: '0.12em',
    fontSize: 12,
    textTransform: 'uppercase',
  } as const
  return (
    <div style={{ background: 'var(--color-paper)', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ width: 250 }}>
          <DeckleStamp>
            <div style={{ ...caps, fontSize: 17, textAlign: 'center' }}>Tap to open</div>
          </DeckleStamp>
          <div style={{ height: 18 }} />
          <DeckleStamp>
            <div style={{ ...caps, fontSize: 12, textAlign: 'center' }}>Get directions</div>
          </DeckleStamp>
        </div>
        <div style={{ width: 240 }}>
          <ScallopedOval>
            <div style={{ textAlign: 'center' }}>
              <div style={script}>Save the Date</div>
              <div style={{ ...caps, fontSize: 13, marginTop: 4 }}>July 18, 2028</div>
            </div>
          </ScallopedOval>
          <div style={{ height: 14 }} />
          <ScallopedOval>
            <div style={{ textAlign: 'center' }}>
              <div style={script}>Our story</div>
              <div style={{ ...caps, marginTop: 2 }}>Click here</div>
            </div>
          </ScallopedOval>
        </div>
        <div style={{ width: 210 }}>
          <InvitationCard>
            <div style={{ textAlign: 'center', color: 'var(--color-ink)' }}>
              <div style={{ ...caps, fontSize: 18 }}>Invitation</div>
              <div style={{ ...caps, fontSize: 11, marginTop: 4 }}>to celebrate the wedding of</div>
              <div style={{ ...caps, fontSize: 16, marginTop: 18 }}>Morgane</div>
              <div style={script}>Wilson</div>
              <div style={{ ...caps, fontSize: 16, marginTop: 14 }}>Alexander</div>
              <div style={script}>Richards</div>
              <div style={{ ...caps, fontSize: 12, marginTop: 20 }}>July 18, 2028</div>
            </div>
          </InvitationCard>
        </div>
        <div style={{ width: 250 }}>
          <EmbossedCard>
            <div style={{ textAlign: 'center', color: 'var(--color-ink)' }}>
              <div style={script}>Countdown</div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>670 : 21 : 30 : 49</div>
              <div style={{ ...caps, fontSize: 9, marginTop: 2 }}>days hours minutes seconds</div>
              <div style={{ fontSize: 13, marginTop: 12 }}>Until the big day</div>
              <div style={{ ...script, fontSize: 20, marginTop: 8 }}>With love and gratitude</div>
            </div>
          </EmbossedCard>
        </div>
      </div>
      <div style={{ height: 26 }} />
      <div style={{ width: 660 }}>
        <ScallopedBox>
          <div style={{ textAlign: 'center', color: 'var(--color-ink)' }}>
            <div style={{ ...script, fontSize: 30 }}>Message for you</div>
            <div style={{ ...caps, fontSize: 11, lineHeight: 1.5, marginTop: 8 }}>
              Our journey together has been shaped by your love and unwavering support. We are so
              honored to have you here.
            </div>
          </div>
        </ScallopedBox>
      </div>
      <div style={{ height: 26 }} />
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
        <div style={{ width: 300 }}>
          <HeartFlourish />
        </div>
        {/* Narrow, with more words than the drawing's proportion allows: the
            frame should grow taller rather than clip. */}
        <div style={{ width: 300 }}>
          <ScallopedBox>
            <div style={{ ...caps, fontSize: 10, lineHeight: 1.5, textAlign: 'center' }}>
              Our journey together has been shaped by your love and unwavering support. We are so
              honored to have you here, not just to celebrate our wedding.
            </div>
          </ScallopedBox>
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('probe') as HTMLElement).render(<Probe />)
