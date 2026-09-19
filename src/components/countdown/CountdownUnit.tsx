interface CountdownUnitProps {
  /** Already padded and ready to render. */
  value: string
  /** Already pluralised against this unit's own value. */
  label: string
}

/**
 * One unit of the countdown.
 *
 * The numeral sits in a container sized to its own digit count, so a value
 * changing from 09 to 10 cannot nudge the units beside it.
 */
export function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="countdown__unit">
      {/* The prerendered value is from build time and the hydrated one is from
          now; they are supposed to differ. Without this, React reports the
          mismatch as an error on every load. */}
      <span
        className="type-countdown countdown__value"
        style={{ '--digit-count': value.length } as React.CSSProperties}
        suppressHydrationWarning
      >
        {value}
      </span>
      <span className="visually-hidden" suppressHydrationWarning />
      <span className="type-countdown-label countdown__label" suppressHydrationWarning>
        {label}
      </span>
    </div>
  )
}
