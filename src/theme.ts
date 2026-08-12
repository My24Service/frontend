import BASE_URL from './services/base-url'

export const THEME_DEFAULT = 'theme-default'
export const THEME_SHLTR = 'theme-shltr'

const companycode = BASE_URL.split('//')[1].split('.')[0]

// Tenants running the shltr design. Everything else falls back to the default.
const themes: Record<string, string> = {
  'shltr': THEME_SHLTR,
  'shltr-installation': THEME_SHLTR,
  'wsmes': THEME_SHLTR,
  'wsmes-corporate': THEME_SHLTR,
  'riedel': THEME_SHLTR,
  'amex': THEME_SHLTR,
  'rivieramaison': THEME_SHLTR,
  'poelgeest': THEME_SHLTR,
  'graafbakeries': THEME_SHLTR,
  'dpwn': THEME_SHLTR,
  'dpworld': THEME_SHLTR,
  'trioworld': THEME_SHLTR,
  'smurfit': THEME_SHLTR,
  'demo-branches': THEME_SHLTR,
  // 'ast': THEME_SHLTR,
  // 'gls': THEME_SHLTR,
}

export const activeTheme = companycode in themes ? themes[companycode] : THEME_DEFAULT

export const isShltrTheme = activeTheme === THEME_SHLTR
