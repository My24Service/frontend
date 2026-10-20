// Contract declared in src/theme-preprocessor.d.ts.
import { toggleTheme } from "vite-plugin-theme-preprocessor/dist/browser-utils";

export const THEME_DEFAULT = 'theme-default'
export const THEME_SHLTR = 'theme-shltr'

// The server decides which product a tenant is: `profile.family` in
// get-initial-data (backend Member.product_family). The last known family is
// cached per browser so a returning visitor gets the right theme before the
// first request answers; the store re-applies it when initial data arrives.
const CACHE_KEY = 'my24.product_family'

function themeFor(family: string | null | undefined): string {
  return family === 'shltr' ? THEME_SHLTR : THEME_DEFAULT
}

function readCachedFamily(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY)
  } catch {
    return null
  }
}

// Live binding: importers see the current value. Set before any route
// component mounts, because the router guard awaits initial data. Components
// branch on the store's getProductFamily, not on this.
export let activeTheme = themeFor(readCachedFamily())

/** Apply the current theme to the document. Called once at boot. */
export function applyTheme(): void {
  toggleTheme({ scopeName: activeTheme })
}

/** Called by the main store with `profile.family` from initial data. */
export function setProductFamily(family: string | null | undefined): void {
  try {
    if (family) localStorage.setItem(CACHE_KEY, family)
  } catch {
    // storage unavailable: the theme still applies for this page load
  }
  const next = themeFor(family)
  if (next === activeTheme) return
  activeTheme = next
  applyTheme()
}
