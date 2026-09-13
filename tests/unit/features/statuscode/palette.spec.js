import { describe, expect, test } from 'vitest'
import Color from 'color'

import {
  LABEL_PALETTE,
  labelTextColor,
  isPaletteColor,
  readableBackground,
} from '@/features/statuscode/statuscode/palette'

const HEX = /^#[0-9a-f]{6}$/
const ALL = [...LABEL_PALETTE.light, ...LABEL_PALETTE.mid, ...LABEL_PALETTE.dark]

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

describe('LABEL_PALETTE', () => {
  test('is a light, a mid and a dark series of hex colours', () => {
    expect(LABEL_PALETTE.light.length).toBeGreaterThanOrEqual(10)
    expect(LABEL_PALETTE.mid.length).toBe(LABEL_PALETTE.light.length)
    expect(LABEL_PALETTE.dark.length).toBe(LABEL_PALETTE.light.length)
    for (const hex of ALL) expect(hex).toMatch(HEX)
  })

  test('has no duplicates', () => {
    expect(new Set(ALL).size).toBe(ALL.length)
  })

  test('each series is ordered by hue, so the swatches read as a wheel', () => {
    for (const series of [LABEL_PALETTE.light, LABEL_PALETTE.mid, LABEL_PALETTE.dark]) {
      const hues = series.map((hex) => Color(hex).oklch().object().okh)
      expect([...hues].sort((a, b) => a - b)).toEqual(hues)
    }
  })

  test('each series keeps its hues apart', () => {
    // The walk enforces its gap on the light swatches; the dark row shares
    // the hues but rounds to 8-bit sRGB a little differently, so it gets
    // the looser bound.
    for (const [series, minGap] of [[LABEL_PALETTE.light, 15], [LABEL_PALETTE.mid, 10], [LABEL_PALETTE.dark, 10]]) {
      const hues = series.map((hex) => Color(hex).oklch().object().okh)
      for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
          expect(hueDistance(hues[i], hues[j])).toBeGreaterThanOrEqual(minGap)
        }
      }
    }
  })

  test('the rows step down in lightness, with a clear gap, and each row is even', () => {
    const lightness = (series) => series.map((hex) => Color(hex).oklch().object().okl)
    const lightL = lightness(LABEL_PALETTE.light)
    const midL = lightness(LABEL_PALETTE.mid)
    const darkL = lightness(LABEL_PALETTE.dark)

    expect(Math.min(...lightL) - Math.max(...midL)).toBeGreaterThan(8)
    expect(Math.min(...midL) - Math.max(...darkL)).toBeGreaterThan(8)
    for (const row of [lightL, midL, darkL]) expect(Math.max(...row) - Math.min(...row)).toBeLessThan(8)
  })
})

describe('labelTextColor', () => {
  test('gives every palette colour a text colour that reads on it', () => {
    for (const hex of ALL) {
      const text = labelTextColor(hex)
      expect(text).toMatch(HEX)
      expect(Color(hex).contrast(Color(text))).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('keeps the background’s hue in the text', () => {
    // Measured on the light series only: its text is dark enough to carry a
    // hue. The near-white text on the dark series is a tint whose hue 8-bit
    // rounding moves by tens of degrees without a visible difference.
    for (const hex of [...LABEL_PALETTE.light, ...LABEL_PALETTE.mid]) {
      const text = labelTextColor(hex)
      expect(hueDistance(Color(hex).oklch().object().okh, Color(text).oklch().object().okh)).toBeLessThan(12)
    }
  })

  test('darkens the text on a light or mid background and lightens it on a dark one', () => {
    expect(Color(labelTextColor(LABEL_PALETTE.light[0])).isDark()).toBe(true)
    expect(Color(labelTextColor(LABEL_PALETTE.mid[0])).isDark()).toBe(true)
    expect(Color(labelTextColor(LABEL_PALETTE.dark[0])).isLight()).toBe(true)
  })

  test('reads on any colour the palette would have produced, light or dark', () => {
    expect(Color('#ffffff').contrast(Color(labelTextColor('#ffffff')))).toBeGreaterThanOrEqual(4.5)
    expect(Color('#000000').contrast(Color(labelTextColor('#000000')))).toBeGreaterThanOrEqual(4.5)
  })

  test('is null for no colour', () => {
    expect(labelTextColor(null)).toBeNull()
    expect(labelTextColor('')).toBeNull()
  })
})

describe('readableBackground', () => {
  test('leaves a palette colour alone', () => {
    for (const hex of ALL) {
      expect(readableBackground(hex)).toBe(hex)
    }
  })

  test('leaves a legacy colour alone when its text already reads', () => {
    expect(readableBackground('#ffffff')).toBe('#ffffff')
    expect(readableBackground('#7a1f00')).toBe('#7a1f00')
  })

  test('moves a mid-lightness legacy colour toward the side it leans, just until its text reads', () => {
    // #ff3300 (L≈65) and #1e88e5 (L≈62) are too light for light text and too
    // dark for dark text; each leans light, so each is lightened.
    for (const hex of ['#ff3300', '#1e88e5']) {
      const fixed = readableBackground(hex)
      expect(fixed).toMatch(HEX)
      expect(Color(fixed).oklch().object().okl).toBeGreaterThan(Color(hex).oklch().object().okl)
      expect(Color(fixed).oklch().object().okl - Color(hex).oklch().object().okl).toBeLessThan(20)
      expect(hueDistance(Color(fixed).oklch().object().okh, Color(hex).oklch().object().okh)).toBeLessThan(8)
      expect(Color(fixed).contrast(Color(labelTextColor(fixed)))).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('is null for no colour', () => {
    expect(readableBackground(null)).toBeNull()
  })
})

describe('isPaletteColor', () => {
  test('knows its own colours, case-insensitively, and nothing else', () => {
    expect(isPaletteColor(LABEL_PALETTE.light[2])).toBe(true)
    expect(isPaletteColor(LABEL_PALETTE.dark[2].toUpperCase())).toBe(true)
    expect(isPaletteColor('#ff3300')).toBe(false)
    expect(isPaletteColor(null)).toBe(false)
  })
})
