// Stand-in for vite-plugin-theme-preprocessor/dist/browser-utils.
//
// The real module imports `../toBrowserEnvs`, a file the theme preprocessor
// plugin *writes into node_modules* the first time `vite dev`/`vite build`
// runs. Vitest never loads that plugin (see vitest.config.js), so on a fresh
// `npm ci` — i.e. in CI — the file does not exist and every spec that reaches
// src/theme.ts fails at import-analysis. Locally it only works because the dev
// server has run at least once. Aliased in vitest.config.js.
import { vi } from 'vitest'

export const toggleTheme = vi.fn()
