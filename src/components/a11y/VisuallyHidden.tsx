import type { ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  /** Render as a live-region-safe element when the text updates over time. */
  as?: 'span' | 'p' | 'div'
  /** For content that legitimately differs between build time and load time. */
  suppressHydrationWarning?: boolean | undefined
}

/**
 * Removes content from the visual render while keeping it in the
 * accessibility tree.
 */
export function VisuallyHidden({
  children,
  as: Tag = 'span',
  suppressHydrationWarning,
}: VisuallyHiddenProps) {
  return (
    <Tag className="visually-hidden" suppressHydrationWarning={suppressHydrationWarning}>
      {children}
    </Tag>
  )
}
