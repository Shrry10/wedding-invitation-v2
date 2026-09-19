import { useCallback, useMemo } from 'react'
import { SkipLink } from './components/a11y/SkipLink'
import { Backdrop } from './components/Backdrop'
import { EnvelopePage } from './pages/EnvelopePage'
import { HomePage } from './pages/HomePage'
import { DetailsPage } from './pages/DetailsPage'
import { StoryPage } from './pages/StoryPage'
import { content } from './data/content'
import { useHashRoute } from './hooks/useHashRoute'
import { coupleInitials, coupleNames } from './lib/coupleNames'

/**
 * Page composition.
 *
 * Four pages, as the reference has: the envelope, the invitation behind it, and
 * the two pages that invitation opens onto. Which one shows is decided here and
 * nowhere else; no page knows about any other.
 */
export function App() {
  const [page, navigate] = useHashRoute()

  const names = useMemo(() => {
    const [first, second] = coupleNames(content.couple)
    return `${first} & ${second}`
  }, [])
  // The seal strikes the two initials as one cipher, so no ampersand.
  const monogram = useMemo(() => coupleInitials(content.couple), [])

  const goHome = useCallback(() => navigate('home'), [navigate])

  return (
    <>
      <Backdrop />
      <SkipLink targetId="main" />

      {page === 'envelope' && (
        <EnvelopePage names={names} monogram={monogram} onOpened={goHome} />
      )}

      {page === 'home' && (
        <HomePage content={content} names={names} monogram={monogram} navigate={navigate} />
      )}

      {page === 'details' && (
        <DetailsPage content={content} monogram={monogram} navigate={navigate} />
      )}

      {page === 'story' && (
        <StoryPage
          beats={content.story.beats}
          images={content.gallery}
          heading={content.story.heading}
          closingMessage={content.story.closingMessage}
          names={names}
          monogram={monogram}
          navigate={navigate}
        />
      )}
    </>
  )
}
