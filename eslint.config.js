import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // The palette lives in index.css. No colour hex literal may appear in
      // TypeScript or TSX source: artwork and components reference custom
      // properties instead, so a palette change is a one-line edit.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
          message:
            'Colour hex literals are not allowed in source. Reference a palette custom property instead.',
        },
        {
          selector: 'TemplateElement[value.raw=/#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b/]',
          message:
            'Colour hex literals are not allowed in source. Reference a palette custom property instead.',
        },
      ],
    },
  },
  {
    files: ['scripts/**/*.ts', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Tests ship nothing, and a contrast test needs real colour values to
    // measure. The ban exists so a palette change is one edit in the
    // stylesheet; a fixture cannot undermine that.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
)
