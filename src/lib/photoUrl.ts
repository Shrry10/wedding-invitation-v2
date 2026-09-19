import type { GalleryImage } from '../data/types'

/**
 * Every photograph in the photo folder, bundled and fingerprinted, keyed by its
 * path from the repository root.
 *
 * The content file names photographs by path rather than importing them, so
 * it stays plain data the build can validate before anything is bundled. This
 * is where a path becomes a URL. The glob pattern must stay in step with
 * `PHOTO_FOLDER` in `data/validate.ts`: the build rejects a photograph outside
 * that folder because this glob would never see it.
 */
const urls = import.meta.glob<string>('/src/assets/images/photos/*', {
  eager: true,
  query: '?url',
  import: 'default',
})

/** The URL a gallery photograph is served at, or undefined if it was not bundled. */
export function photoUrl(image: GalleryImage): string | undefined {
  return urls[`/${image.src}`]
}
