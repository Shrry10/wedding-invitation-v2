import type { CSSProperties, ReactElement } from 'react'
import openBackUrl from '../../assets/images/objects/envelope-open-back.webp'
import openFrontUrl from '../../assets/images/objects/envelope-open-front.webp'
import sealedEnvelopeUrl from '../../assets/images/objects/envelope-sealed.webp'
import photoMountUrl from '../../assets/images/objects/photo-mount.webp'
import recordUrl from '../../assets/images/objects/record.webp'
import silverPlateUrl from '../../assets/images/objects/silver-plate.webp'
import waxSealUrl from '../../assets/images/objects/wax-seal.webp'

/**
 * The objects that are photographs.
 *
 * Every one of these was drawn once, in SVG, and every one lost the thing that
 * identified it: the envelope's cloth came out as card, the mount's board as a
 * flat wash, the seal as a printed token, the record as a hole in the page.
 * They are all supplied by the couple, cut out of the Canva template this site
 * is modelled on, which photographs the real stationery.
 *
 * `src/assets/images/objects/SOURCES.md` lists where each file came from and
 * how it was cut. The width and height below are each file's own, so the
 * browser reserves the right box before the image arrives.
 *
 * Two of them are one object: the open envelope is published as a back half
 * and a front half on one canvas, already in register, so they are cut to one
 * shared box and written at one size. Laid one over the other with the flowers
 * between, they are an envelope with something in it.
 */
const OBJECTS = {
  /** The envelope as it arrives, flap down. */
  'envelope-sealed': { src: sealedEnvelopeUrl, w: 950, h: 681 },
  /** The same envelope opened: back panel and thrown-back flap, the printed liner painted out. */
  'envelope-open-back': { src: openBackUrl, w: 900, h: 1001 },
  /** Its front pocket, in register with the back, to lay over whatever is inside. */
  'envelope-open-front': { src: openFrontUrl, w: 900, h: 1001 },
  /** The maroon instant-photo mount: square aperture, deep band below it for a caption. */
  'photo-mount': { src: photoMountUrl, w: 592, h: 696 },
  /** The gold wax seal, struck blank — the page presses its own monogram into it. */
  'wax-seal': { src: waxSealUrl, w: 212, h: 207 },
  /** A twelve-inch pressing, cut to its own disc so it can be spun about its centre. */
  record: { src: recordUrl, w: 680, h: 680 },
  /** The chased silver salver the details badge lies on. */
  'silver-plate': { src: silverPlateUrl, w: 900, h: 899 },
} as const

export type ObjectPhotoId = keyof typeof OBJECTS

export interface ObjectPhotoProps {
  photo: ObjectPhotoId
  className?: string | undefined
  style?: CSSProperties | undefined
  /** Only the objects visible on arrival should skip lazy loading. */
  eager?: boolean | undefined
}

/**
 * One cut-out photograph of an object. Decorative, so it is hidden from
 * assistive technology and carries no alternative text.
 */
export function ObjectPhoto({ photo, className, style, eager }: ObjectPhotoProps): ReactElement {
  const { src, w, h } = OBJECTS[photo]
  return (
    <img
      className={className === undefined ? 'object-photo' : `object-photo ${className}`}
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
