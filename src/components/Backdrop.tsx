import hands from '../assets/images/background-hands.jpg'

/**
 * The photograph behind every page: the two of them reaching for each other,
 * in black and white, faded almost to the paper.
 *
 * It is placed by the point where the hands meet, not by its own middle. That
 * point is at 53.9% across and 47.3% down the image — measured from the
 * pixels, as the centroid gap of the skin tones — and `object-fit` cannot put
 * an off-centre point at the centre of a viewport: its percentages align a
 * fraction of the image with the same fraction of the box, so the hands would
 * sit at 54% of a desktop and somewhere else again on a phone. Here the image
 * is pinned at the viewport's centre and pulled back by exactly that fraction
 * of its own size, which lands the hands dead centre at every size and shape
 * of screen. The minimum dimensions are what keep both edges covered when the
 * focal point is that far off the middle.
 *
 * Fixed rather than a fixed background-image: a fixed element composites and
 * costs nothing while the page scrolls; `background-attachment: fixed` is
 * repainted, and is ignored by mobile Safari anyway.
 */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <img src={hands} alt="" decoding="async" fetchPriority="low" draggable={false} />
    </div>
  )
}
