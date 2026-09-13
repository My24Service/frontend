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
const LIGHT = {l: 92, c: 10}
const MID = {l: 75, c: 12}
const DARK = {l: 50, c: 13}

/**
 * The text colour is the background's own colour, moved in lightness — the
 * CSS `oklch(from var(--bg-color) calc(l - 0.55) c h / 90%)` that was found
 * by hand, baked to a flat hex for the wire. A background from
 * TEXT_LEANS_LIGHT up gets darker text, below it lighter; the 10% of
 * background showing through is what lets its hue colour the text.
 */
const TEXT_SHIFT = 55
const TEXT_LEANS_LIGHT = 62
const TEXT_OPACITY = 0.9

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
 * earlier one; sorted. The gap is judged on the light swatch as sRGB will
 * show it — clipping moves a hue — but the hue kept is the one walked to,
 * so rendering from it does not clip a second time.
 */
function hues(): number[] {
  const taken: {walked: number; shown: number}[] = []
  for (let index = 0; ; index++) {
    const walked = (index * GOLDEN_ANGLE) % 360
    const shown = hueOf(hex(LIGHT.l, LIGHT.c, walked))
    if (taken.some((other) => hueDistance(shown, other.shown) < MIN_HUE_GAP)) break
    taken.push({walked, shown})
  }
  return taken.sort((a, b) => a.shown - b.shown).map((entry) => entry.walked)
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

/** `text` laid over `background` at TEXT_OPACITY, as the browser would composite it. */
function overBackground(text: ColorInstance, background: ColorInstance): ColorInstance {
  const t = text.rgb().array()
  const b = background.rgb().array()
  return Color.rgb(...t.map((v, i) => v * TEXT_OPACITY + b[i] * (1 - TEXT_OPACITY)))
}

/**
 * The text colour for a label on `background`: the background itself,
 * shifted TEXT_SHIFT in lightness toward whichever end it does not lean
 * to, at 90% over the background. If that pairing falls short of
 * MIN_CONTRAST — the dark row's cyans, a saturated legacy colour — the
 * shift grows until it reads, so every label is readable whatever its
 * background.
 */
export function labelTextColor(background: string | null | undefined): string | null {
  if (!background) return null
  const bg = Color(background)
  const {okl, okc, okh} = bg.oklch().object()
  // A grey has no hue worth keeping; `color` reports NaN, which oklch() rejects.
  const grey = Number.isNaN(okh)

  /** The text shifted `direction`-ward until it reads, or as far as it goes. */
  function shifted(direction: 1 | -1): {text: string; contrast: number} {
    for (let shift = TEXT_SHIFT; ; shift++) {
      const l = Math.max(0, Math.min(100, okl + direction * shift))
      // At the end of the scale only plain black or white is left.
      const atEnd = l === 0 || l === 100
      const c = grey || atEnd ? 0 : okc
      const text = overBackground(fromOklch(l, c, grey ? 0 : okh), bg).hex().toLowerCase()
      const contrast = bg.contrast(Color(text))
      if (contrast >= MIN_CONTRAST || atEnd) return {text, contrast}
    }
  }

  // The side the background leans to first; a middling colour may run out
  // of scale on that side before it reads (white on a mid blue), and then
  // the other side is the one that does.
  const leaning: 1 | -1 = okl >= TEXT_LEANS_LIGHT ? -1 : 1
  const first = shifted(leaning)
  if (first.contrast >= MIN_CONTRAST) return first.text
  const second = shifted(leaning === 1 ? -1 : 1)
  return second.contrast > first.contrast ? second.text : first.text
}
