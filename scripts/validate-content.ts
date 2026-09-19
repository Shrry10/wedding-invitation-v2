import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

/**
 * Fails the build when the content file is invalid.
 *
 * Runs at build start rather than in a test so that invalid content can never
 * be deployed, regardless of whether anyone ran the test suite.
 */
export function validateContentPlugin(): Plugin {
  return {
    name: 'validate-invitation-content',
    async buildStart() {
      const { content } = await import('../src/data/content')
      const { validateContent, formatFailures } = await import('../src/data/validate')

      // Read the real palette out of the stylesheet, so the contrast check
      // measures what ships rather than what a fixture says.
      const stylesheet = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
      const declared = new Map<string, string>()
      for (const match of stylesheet.matchAll(/(--color-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})\s*;/g)) {
        declared.set(match[1] as string, match[2] as string)
      }

      const failures = validateContent(content, {
        assetExists: (relativePath) => existsSync(resolve(process.cwd(), relativePath)),
        resolveToken: (token) => {
          const name = /var\((--[\w-]+)\)/.exec(token)?.[1]
          return name === undefined ? undefined : declared.get(name)
        },
      })

      if (failures.length > 0) {
        this.error(
          `Invitation content failed validation with ${failures.length} problem(s):\n${formatFailures(failures)}\n`,
        )
      }
    },
  }
}
