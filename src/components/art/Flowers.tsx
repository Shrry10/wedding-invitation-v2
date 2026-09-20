import type { CSSProperties, ReactElement } from 'react'
import envelopeBouquetUrl from '../../assets/images/flowers/envelope-bouquet.webp'
import linerRosesUrl from '../../assets/images/flowers/liner-roses.webp'
import standingPosyUrl from '../../assets/images/flowers/standing-posy.webp'
import tiedPosyUrl from '../../assets/images/flowers/tied-posy.webp'
import trayBouquetUrl from '../../assets/images/flowers/tray-bouquet.webp'
import wildRoseSprayUrl from '../../assets/images/flowers/wild-rose-spray.webp'
import wildRosesOnFrameUrl from '../../assets/images/flowers/wild-roses-on-frame.webp'

/**
 * The white flowers that are photographs.
 *
 * The drawn sprays (`Florals.tsx`) all showed the same rose with drawn leaves;
 * every spray on the site is now a real arrangement, cut out of a photograph
 * with its own stems and foliage. A file may be used in more than one place —
 * the two story prints carry the same pair, mirrored, and the supplied posy
 * stands both behind the playlist and in the details envelope — but a place
 * that repeats another always mirrors it, so no two read as the same picture.
 *
 * Where the reference tucks flowers behind an object (the silver tray, the
 * story prints, the names envelope), the photograph is laid before that object
 * so it covers the stems and only the blooms show; two small sprigs are laid
 * after the prints instead, so they rest on the frames.
 *
 * Five of them are supplied by the couple, from the Canva template this site
 * is modelled on; the other two are Pixabay photographs (free to use and
 * modify, no attribution required).
 * `src/assets/images/flowers/SOURCES.md` lists where each file came from and
 * how it was cut out. The width and height below are each file's own, so the
 * browser reserves the right box before the image arrives.
 */
const FLOWERS = {
  /** One ranunculus, jasmine, astilbe and eucalyptus, bound in twine — the supplied posy that stands on the sealed envelope. */
  'standing-posy': { src: standingPosyUrl, w: 360, h: 438 },
  /** One ranunculus, jasmine and astilbe, bound in twine — the supplied posy. */
  'tied-posy': { src: tiedPosyUrl, w: 817, h: 1000 },
  /** A round bouquet of cream garden roses and eucalyptus, tied with a lace bow. */
  'tray-bouquet': { src: trayBouquetUrl, w: 1100, h: 1038 },
  /** The same bouquet with its bow and stems cut away: heads only, for lining the envelope. */
  'liner-roses': { src: linerRosesUrl, w: 1100, h: 699 },
  /** A spray of open white roses and buds on a leafy stem. */
  'wild-rose-spray': { src: wildRoseSprayUrl, w: 1000, h: 500 },
  /** One ranunculus, jasmine and astilbe, bound in twine — the posy standing in the envelope. */
  'envelope-bouquet': { src: envelopeBouquetUrl, w: 827, h: 1000 },
  /** Three open wild roses and their leaves, to lie on the corner of a print. */
  'wild-roses-on-frame': { src: wildRosesOnFrameUrl, w: 620, h: 400 },
} as const

export type FlowerPhotoId = keyof typeof FLOWERS

export interface FlowerPhotoProps {
  photo: FlowerPhotoId
  className?: string | undefined
  style?: CSSProperties | undefined
  /** Only the flowers visible on arrival should skip lazy loading. */
  eager?: boolean | undefined
}

/**
 * One cut-out photograph of flowers. Decorative, so it is hidden from
 * assistive technology and carries no alternative text.
 */
export function FlowerPhoto({ photo, className, style, eager }: FlowerPhotoProps): ReactElement {
  const { src, w, h } = FLOWERS[photo]
  return (
    <img
      className={className === undefined ? 'flower-photo' : `flower-photo ${className}`}
      src={src}
      width={w}
      height={h}
      alt=""
      aria-hidden="true"
      draggable={false}
      loading={eager === true ? 'eager' : 'lazy'}
      decoding="async"
      style={style}
    />
  )
}
