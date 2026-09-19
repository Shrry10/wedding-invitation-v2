import { PhotoStandIn } from './art/PhotoStandIn'
import { photoUrl } from '../lib/photoUrl'
import type { GalleryImage } from '../data/types'

/**
 * What goes in one polaroid's well: the photograph, or until there is one the
 * drawn stand-in the rest of the site uses, which is a picture rather than an
 * empty frame. Both fill the well the same way, so a photograph drops into
 * the identical box at the identical size.
 *
 * The photographs are cropped to the well's own proportion (492 : 501) before
 * they are added, so `object-fit` has almost nothing left to cut and the crop
 * a person chose is the crop that shows.
 */
export function PrintFill({
  image,
  seed,
  eager = false,
}: {
  image: GalleryImage | undefined
  /** Varies the stand-in, so a row of empty frames does not look cloned. */
  seed: number
  /** Load at once, for a print that is on screen when the page opens. */
  eager?: boolean
}) {
  const src = image === undefined ? undefined : photoUrl(image)
  if (image === undefined || src === undefined) {
    return <PhotoStandIn seed={seed} className="print-fill" />
  }
  return (
    <img
      className="print-fill"
      src={src}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
    />
  )
}
