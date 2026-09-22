import { describe, expect, test } from 'vitest'
import Color from 'color'

import {
  LABEL_PALETTE,
  labelTextColor,
  isPaletteColor,
} from '@/features/statuscode'

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
    // Circular: a swatch walked to at 359.9° can measure as 0.1° after
    // rounding, so the row may start just past the wrap. One descent is
    // allowed — the wrap itself.
    for (const series of [LABEL_PALETTE.light, LABEL_PALETTE.mid, LABEL_PALETTE.dark]) {
      const hues = series.map((hex) => Color(hex).oklch().object().okh)
      const descents = hues.filter((hue, i) => i > 0 && hue < hues[i - 1]).length
      expect(descents).toBeLessThanOrEqual(1)
    }
  })

  test('each series keeps its hues apart', () => {
    // The walk asks for 18°, measured on the light swatch. At the light
    // row's lightness sRGB cannot hold its chroma for pinks and blues, so
    // those swatches clip and their measured hues sit closer than asked;
    // the bounds are what survives that, not the walk's own gap.
    for (const [series, minGap] of [[LABEL_PALETTE.light, 12], [LABEL_PALETTE.mid, 10], [LABEL_PALETTE.dark, 10]]) {
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
    // The text carries the background's chroma at a much lower lightness,
    // which sRGB clips for some hues, so the measured hue can sit a few
    // tens of degrees off; the bound is the same side of the wheel. Measured
    // on the rows with dark text — the near-white text on the dark row is a
    // tint whose hue rounding scatters.
    for (const hex of [...LABEL_PALETTE.light, ...LABEL_PALETTE.mid]) {
      const text = labelTextColor(hex)
      expect(hueDistance(Color(hex).oklch().object().okh, Color(text).oklch().object().okh)).toBeLessThan(45)
    }
  })

  test('darkens the text on a light or mid background and lightens it on a dark one', () => {
    expect(Color(labelTextColor(LABEL_PALETTE.light[0])).isDark()).toBe(true)
    expect(Color(labelTextColor(LABEL_PALETTE.mid[0])).isDark()).toBe(true)
    expect(Color(labelTextColor(LABEL_PALETTE.dark[0])).isLight()).toBe(true)
  })

  test('reads on any colour at all — a record from before the palette included', () => {
    for (const hex of ['#ffffff', '#000000', '#ff3300', '#1e88e5', '#808080', '#fb8c00', '#00d3cb']) {
      expect(Color(hex).contrast(Color(labelTextColor(hex)))).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('is null for no colour', () => {
    expect(labelTextColor(null)).toBeNull()
    expect(labelTextColor('')).toBeNull()
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
