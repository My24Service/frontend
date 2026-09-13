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
 * slices, taken until a new hue would land within `MIN_HUE_GAP` of an
 * existing one, sorted for display, and drawn three times — light, mid and
 * dark OKLCH lightness — at one chroma each so the set reads as one family. (The dark row once continued the walk to land between the
 * light hues; the lightness gap alone keeps the rows apart, so it was
 * dropped.)
 */

const GOLDEN_ANGLE = 137.508
const MIN_HUE_GAP = 18

/** OKLCH lightness (0–100) and chroma (0–100) per series, as `color` scales them. */
const LIGHT = {l: 85, c: 10}
const MID = {l: 70, c: 12}
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

/**
 * The golden-angle walk, until a hue would land within MIN_HUE_GAP of an
 * earlier one; sorted. Measured on the light swatch as sRGB will show it,
 * since that is the hue the eye — and the spec — gets.
 */
function hues(): number[] {
  const taken: number[] = []
  for (let index = 0; ; index++) {
    const hue = hueOf(hex(LIGHT.l, LIGHT.c, (index * GOLDEN_ANGLE) % 360))
    if (taken.some((other) => hueDistance(hue, other) < MIN_HUE_GAP)) break
    taken.push(hue)
  }
  return taken.sort((a, b) => a - b)
}

const HUES = hues()

export const LABEL_PALETTE: {
  readonly light: readonly string[]
  readonly mid: readonly string[]
  readonly dark: readonly string[]
} = {
  light: HUES.map((h) => hex(LIGHT.l, LIGHT.c, h)),
  mid: HUES.map((h) => hex(MID.l, MID.c, h)),
  dark: HUES.map((h) => hex(DARK.l, DARK.c, h)),
}

const PALETTE_SET = new Set<string>([...LABEL_PALETTE.light, ...LABEL_PALETTE.mid, ...LABEL_PALETTE.dark])

export function isPaletteColor(value: string | null | undefined): boolean {
  return typeof value === 'string' && PALETTE_SET.has(value.toLowerCase())
}

/** WCAG AA for normal text; what every palette pairing is pinned to. */
const MIN_CONTRAST = 4.5

function contrast(background: string, text: string): number {
  return Color(background).contrast(Color(text))
}

/**
 * The text colour for a label on `background`: its own hue, pushed far
 * enough in lightness to read. Whichever of the two candidates reads better;
 * on a palette colour that is always at least MIN_CONTRAST. A colour from
 * before the palette may be too middling for either — `readableBackground`
 * is what the form runs such a colour through first.
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

/**
 * `background`, moved in lightness — keeping its hue and chroma — toward the
 * side it already leans, just until its derived text reads on it. A palette
 * colour, or any colour whose text already reads, comes back unchanged. This
 * is how a record coloured before the palette is brought into line: the form
 * opens on the nudged colour and saves it, so the record is corrected once.
 */
export function readableBackground(background: string | null | undefined): string | null {
  if (!background) return null
  const start = background.toLowerCase()
  const text = labelTextColor(start)
  if (text === null || contrast(start, text) >= MIN_CONTRAST) return start

  const {okl, okc, okh} = Color(start).oklch().object()
  const h = Number.isNaN(okh) ? 0 : okh
  const step = okl >= 50 ? 1 : -1
  let l = okl
  let candidate = start
  while (l > 0 && l < 100) {
    l += step
    candidate = hex(l, okc, h)
    const candidateText = labelTextColor(candidate)
    if (candidateText !== null && contrast(candidate, candidateText) >= MIN_CONTRAST) return candidate
  }
  return candidate
}
