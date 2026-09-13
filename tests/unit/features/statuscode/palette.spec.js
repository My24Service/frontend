import { describe, expect, test } from 'vitest'
import Color from 'color'

import {
  LABEL_PALETTE,
  labelTextColor,
  isPaletteColor,
} from '@/features/statuscode/statuscode/palette'

const HEX = /^#[0-9a-f]{6}$/

function hueDistance(a, b) {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

describe('LABEL_PALETTE', () => {
  test('is a light series and a dark series of hex colours, the light one first', () => {
    expect(LABEL_PALETTE.light.length).toBeGreaterThanOrEqual(10)
    expect(LABEL_PALETTE.dark.length).toBeGreaterThanOrEqual(10)
    for (const hex of [...LABEL_PALETTE.light, ...LABEL_PALETTE.dark]) expect(hex).toMatch(HEX)
  })

  test('has no duplicates', () => {
    const all = [...LABEL_PALETTE.light, ...LABEL_PALETTE.dark]
    expect(new Set(all).size).toBe(all.length)
  })

  test('each series is ordered by hue, so the swatches read as a wheel', () => {
    for (const series of [LABEL_PALETTE.light, LABEL_PALETTE.dark]) {
      const hues = series.map((hex) => Color(hex).oklch().object().okh)
      expect([...hues].sort((a, b) => a - b)).toEqual(hues)
    }
  })

  test('the light series keeps its hues apart; the dark series sits between them', () => {
    const light = LABEL_PALETTE.light.map((hex) => Color(hex).oklch().object().okh)
    const dark = LABEL_PALETTE.dark.map((hex) => Color(hex).oklch().object().okh)

    for (let i = 0; i < light.length; i++) {
      for (let j = i + 1; j < light.length; j++) {
        expect(hueDistance(light[i], light[j])).toBeGreaterThanOrEqual(15)
      }
    }
    // Not the same hues as the light series: the sequence carried on.
    for (const hue of dark) {
      expect(light.every((other) => hueDistance(hue, other) > 3)).toBe(true)
    }
  })

  test('light colours are lighter than dark ones, and each series is even in lightness', () => {
    const lightL = LABEL_PALETTE.light.map((hex) => Color(hex).oklch().object().okl)
    const darkL = LABEL_PALETTE.dark.map((hex) => Color(hex).oklch().object().okl)

    expect(Math.min(...lightL)).toBeGreaterThan(Math.max(...darkL))
    expect(Math.max(...lightL) - Math.min(...lightL)).toBeLessThan(8)
    expect(Math.max(...darkL) - Math.min(...darkL)).toBeLessThan(8)
  })
})

describe('labelTextColor', () => {
  test('gives every palette colour a text colour that reads on it', () => {
    for (const hex of [...LABEL_PALETTE.light, ...LABEL_PALETTE.dark]) {
      const text = labelTextColor(hex)
      expect(text).toMatch(HEX)
      expect(Color(hex).contrast(Color(text))).toBeGreaterThanOrEqual(4.5)
    }
  })

  test('keeps the background’s hue in the text', () => {
    // Measured on the light series only: its text is dark enough to carry a
    // hue. The near-white text on the dark series is a tint whose hue 8-bit
    // rounding moves by tens of degrees without a visible difference.
    for (const hex of LABEL_PALETTE.light) {
      const text = labelTextColor(hex)
      expect(hueDistance(Color(hex).oklch().object().okh, Color(text).oklch().object().okh)).toBeLessThan(12)
    }
  })

  test('darkens the text on a light background and lightens it on a dark one', () => {
    expect(Color(labelTextColor(LABEL_PALETTE.light[0])).isDark()).toBe(true)
    expect(Color(labelTextColor(LABEL_PALETTE.dark[0])).isLight()).toBe(true)
  })

  test('works for a colour outside the palette — a legacy record keeps a readable label', () => {
    expect(Color('#ff3300').contrast(Color(labelTextColor('#ff3300')))).toBeGreaterThanOrEqual(4.5)
    expect(Color('#ffffff').contrast(Color(labelTextColor('#ffffff')))).toBeGreaterThanOrEqual(4.5)
    expect(Color('#000000').contrast(Color(labelTextColor('#000000')))).toBeGreaterThanOrEqual(4.5)
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
