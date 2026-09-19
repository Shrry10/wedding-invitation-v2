import { useEffect, useState } from 'react'

/**
 * Which of the given sections currently occupies most of the viewport.
 *
 * Always returns exactly one id, never null and never several. At the very top
 * and very bottom of the document a section may barely intersect at all; rather
 * than clearing the marker, the last winner is held, so the navigation always
 * shows the guest where they are.
 */
export function useActiveSection(sectionIds: string[]): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(sectionIds[0])

  useEffect(() => {
    if (sectionIds.length === 0) return
    if (typeof IntersectionObserver !== 'function') return

    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null)

    if (elements.length === 0) return

    // Visible height per section, updated as each one crosses the viewport.
    const visibleHeight = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleHeight.set(entry.target.id, entry.intersectionRect.height)
        }

        let winner: string | undefined
        let largest = 0
        for (const [id, height] of visibleHeight) {
          if (height > largest) {
            largest = height
            winner = id
          }
        }

        // Nothing visible — hold the previous winner rather than clearing it.
        if (winner !== undefined && largest > 0) setActiveId(winner)
      },
      {
        // A spread of thresholds so the ratio updates smoothly as a tall
        // section scrolls through, not only when it enters or leaves.
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}
