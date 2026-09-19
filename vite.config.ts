import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { validateContentPlugin } from './scripts/validate-content'

export default defineConfig({
  plugins: [react(), tailwindcss(), validateContentPlugin(), absoluteSocialUrls()],
  base: process.env.VITE_BASE_PATH ?? '/',
})

/**
 * Rewrites the social preview tags to absolute URLs at build time.
 *
 * Link unfurlers do not resolve a relative `og:image` — a shared link simply
 * shows no picture. Left relative in the source so the dev server works
 * without configuration.
 */
function absoluteSocialUrls(): Plugin {
  return {
    name: 'absolute-social-urls',
    apply: 'build',
    transformIndexHtml(html) {
      const origin = process.env.VITE_SITE_URL?.replace(/\/$/, '')
      if (origin === undefined || origin === '') {
        this.warn(
          'VITE_SITE_URL is not set: social preview tags stay relative and link ' +
            'previews will show no image. See .env.example.',
        )
        return html
      }
      return html
        .replace(/content="\/og-image\.png"/g, `content="${origin}/og-image.png"`)
        .replace(/property="og:url" content="\/"/, `property="og:url" content="${origin}/"`)
    },
  }
}
