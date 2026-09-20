import { useCallback, useEffect, useState } from 'react'
import { SealedEnvelope } from '../components/art/Maroon'
import { WaxSeal } from '../components/art/Metal'
import { FlowerPhoto } from '../components/art/Flowers'
import { DeckleStamp } from '../components/art/Paper'
import { useReducedMotion } from '../hooks/useReducedMotion'

/** How long the envelope takes to hand over to the invitation. */
const HANDOVER_MS = 760
const HANDOVER_MS_REDUCED = 160

interface EnvelopePageProps {
  /** Both names, already in the order they are shown. */
  names: string
  monogram: string
  onOpened: () => void
}

/**
 * The page every guest lands on.
 *
 * One line, two names, a sealed envelope and a stamp telling you what to do.
 * On the reference this is a plain link to the invitation, so the transition
 * stays modest: the envelope lifts and fades rather than performing.
 */
export function EnvelopePage({ names, monogram, onOpened }: EnvelopePageProps) {
  const reducedMotion = useReducedMotion()
  const [leaving, setLeaving] = useState(false)

  const handleOpen = useCallback(() => setLeaving(true), [])

  useEffect(() => {
    if (!leaving) return
    const timer = window.setTimeout(
      onOpened,
      reducedMotion ? HANDOVER_MS_REDUCED : HANDOVER_MS,
    )
    return () => window.clearTimeout(timer)
  }, [leaving, reducedMotion, onOpened])

  return (
    <main className="page page--envelope" id="main" data-leaving={leaving ? '' : undefined}>
      <div className="envelope-scene">
        <p className="t-label envelope-scene__kicker">The beginning of forever with</p>

        <h1 className="t-script envelope-scene__names">{names}</h1>

        <button
          type="button"
          className="envelope-scene__open"
          onClick={handleOpen}
          aria-label={`Open the invitation from ${names}`}
        >
          <span className="envelope-scene__paper">
            <SealedEnvelope className="envelope-scene__envelope" />
            <WaxSeal monogram={monogram} className="envelope-scene__seal" />
            <FlowerPhoto photo="posy" eager className="envelope-scene__floral" />
          </span>

          {/* The stamp sizes its own padding in percentages, which resolve
              against its containing block — so it gets one its own width. */}
          <span className="envelope-scene__stamp-slot">
            <DeckleStamp className="envelope-scene__stamp">
              <span className="t-label t-label--tight envelope-scene__cue">Tap to open</span>
            </DeckleStamp>
          </span>
        </button>
      </div>
    </main>
  )
}
