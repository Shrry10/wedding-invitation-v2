interface SkipLinkProps {
  targetId: string
}

/**
 * The first focusable element on the page. Invisible until focused.
 */
export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Skip to content
    </a>
  )
}
