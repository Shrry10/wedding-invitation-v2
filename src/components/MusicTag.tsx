import { ObjectPhoto } from './art/Objects'
import type { BackgroundMusic } from '../hooks/useBackgroundMusic'

/**
 * The control that is always within reach.
 *
 * Music that a guest cannot stop is rude, and the sleeve on the invitation is
 * only on one of the four pages — so the switch is also a small thing in the
 * corner, on every page. It is a paper tag with a record threaded through it,
 * because a media bar in browser chrome would be the one object on this site
 * that is not stationery on a table.
 *
 * It keeps to itself: pale until it is hovered, focused, or playing, and it
 * prints the title of whatever is on so a guest can see what they are hearing
 * without going back to the sleeve.
 */
export function MusicTag({ music }: { music: BackgroundMusic }) {
  const { playing, current, toggle, next } = music

  return (
    <div className="music-tag" data-playing={playing ? '' : undefined}>
      <button
        type="button"
        className="music-tag__switch"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? `Pause ${current.title}` : 'Play the music'}
      >
        <span className="music-tag__disc" aria-hidden="true">
          <ObjectPhoto photo="record" className="music-tag__record" />
        </span>
        <span className="music-tag__words">
          <span className="t-label music-tag__state">{playing ? 'Now playing' : 'Music'}</span>
          <span className="music-tag__title">{playing ? current.title : 'Play'}</span>
        </span>
      </button>

      {/* Only offered while something is sounding: "next" on a silent page has
          nothing to be next to. */}
      {playing && (
        <button
          type="button"
          className="music-tag__next"
          onClick={next}
          aria-label={`Skip ${current.title}`}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M3 3 L11 8 L3 13 Z" fill="currentColor" />
            <rect x="11.6" y="3" width="1.8" height="10" fill="currentColor" />
          </svg>
        </button>
      )}
    </div>
  )
}
