import Color, { type ColorInstance } from 'color'

/**
 * The colours a statuscode label may have, and the text colour each gets.
 *
 * A user picks a background from a fixed palette; the text colour is derived
 * from it — the same hue, much darker on a light background and much lighter
 * on a dark one — so no label can be unreadable. The legacy form let users
 * pick both colours freely.
 *
 * The palette is the golden-angle hue walk `OrderTypesPie` uses for its
 * slices, at one OKLCH lightness and chroma so the set reads as one family.
 * The walk fills the wheel evenly: the light series takes hues until a new
 * one would land within `MIN_HUE_GAP` of an existing one, and the dark series
 * simply carries the same walk on — so its hues fall *between* the light ones
 * rather than repeating them. Each series is then sorted by hue for display.
 */

const GOLDEN_ANGLE = 137.508
const MIN_HUE_GAP = 18

/** OKLCH lightness (0–100) and chroma (0–100) per series, as `color` scales them. */
const LIGHT = {l: 85, c: 10}
const DARK = {l: 50, c: 13}

/** The two text candidates: dark text for a light background, light text for a dark one. */
const TEXT_DARK = {l: 31, c: 8}
const TEXT_LIGHT = {l: 99, c: 3}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

// `color` builds `Color.oklch()` at runtime from its conversion models, but
// its constructor type is an alias that stops at LCH — see color-oklch.d.ts.
const fromOklch = (Color as unknown as {oklch: (l: number, c: number, h: number) => ColorInstance}).oklch

function hex(l: number, c: number, h: number): string {
  return fromOklch(l, c, h).hex().toLowerCase()
}

/** The hue a hex colour actually has — rounding to 8-bit sRGB moves it a little. */
function hueOf(hexColor: string): number {
  const h = Color(hexColor).oklch().object().okh
  return Number.isNaN(h) ? 0 : h
}

function walk(): {light: string[]; dark: string[]} {
  const light: string[] = []
  const dark: string[] = []
  let index = 0
  let filling: 'light' | 'dark' = 'light'
  while (filling === 'light' || dark.length < light.length) {
    const hue = (index * GOLDEN_ANGLE) % 360
    index++
    if (filling === 'light' && light.some((other) => hueDistance(hue, hueOf(other)) < MIN_HUE_GAP)) {
      filling = 'dark'
    }
    if (filling === 'light') light.push(hex(LIGHT.l, LIGHT.c, hue))
    else dark.push(hex(DARK.l, DARK.c, hue))
  }
  const byHue = (a: string, b: string) => hueOf(a) - hueOf(b)
  return {light: light.sort(byHue), dark: dark.sort(byHue)}
}

export const LABEL_PALETTE: {readonly light: readonly string[]; readonly dark: readonly string[]} = walk()

const PALETTE_SET = new Set<string>([...LABEL_PALETTE.light, ...LABEL_PALETTE.dark])

export function isPaletteColor(value: string | null | undefined): boolean {
  return typeof value === 'string' && PALETTE_SET.has(value.toLowerCase())
}

/**
 * The text colour for a label on `background`: its own hue, pushed far
 * enough in lightness to read. Works for any hex, so a record with a colour
 * from before the palette still gets a readable label.
 */
export function labelTextColor(background: string | null | undefined): string | null {
  if (!background) return null
  const bg = Color(background)
  // A grey has no hue worth keeping; `color` reports NaN, which oklch() rejects.
  const grey = Number.isNaN(bg.oklch().object().okh)
  const h = grey ? 0 : bg.oklch().object().okh
  const candidates = [TEXT_DARK, TEXT_LIGHT].map((t) => hex(t.l, grey ? 0 : t.c, h))
  // Whichever reads better: lightness alone misjudges a saturated mid colour.
  return candidates.reduce((best, text) => bg.contrast(Color(text)) > bg.contrast(Color(best)) ? text : best)
}
