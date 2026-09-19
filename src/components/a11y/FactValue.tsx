import { isPending } from '../../lib/isPending'
import type { MaybePending } from '../../data/types'

interface FactValueProps {
  value: MaybePending<string> | undefined
  /**
   * What to call this fact when it is not yet known, e.g. `Time`. Used to keep
   * the placeholder meaningful to a screen reader rather than a bare "TBD".
   */
  label?: string
  className?: string
}

/**
 * Renders a fact, or a visible marker when that fact is not yet known.
 *
 * This component is the only place the pending state becomes visual. Routing
 * every fact through it is what stops a not-yet-known value being quietly
 * swallowed by a truthiness check in a card, which would leave a guest with a
 * silently missing time rather than an obvious one.
 *
 * It never returns null.
 */
export function FactValue({ value, label, className = '' }: FactValueProps) {
  if (value === undefined || isPending(value)) {
    return (
      <span className={`fact-pending ${className}`.trim()}>
        <span aria-hidden="true">To be confirmed</span>
        <span className="visually-hidden">
          {label === undefined ? 'To be confirmed' : `${label} to be confirmed`}
        </span>
      </span>
    )
  }

  return <span className={className || undefined}>{value}</span>
}
