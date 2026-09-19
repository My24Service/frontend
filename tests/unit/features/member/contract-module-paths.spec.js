import { describe, expect, test } from 'vitest'

import {
  pathsFromSelection,
  selectionFromPaths,
} from '@/features/member/contract/module-paths'

describe('pathsFromSelection', () => {
  test('turns the ticked parts into wire rows of numbers', () => {
    expect(
      pathsFromSelection({
        1: ['246'],
        7: ['258', '255', '279'],
        11: ['294'],
      }),
    ).toEqual([
      {module: 1, parts: [246]},
      {module: 7, parts: [258, 255, 279]},
      {module: 11, parts: [294]},
    ])
  })

  test('skips modules with nothing selected', () => {
    expect(pathsFromSelection({1: [], 7: ['258']})).toEqual([{module: 7, parts: [258]}])
  })

  test('an entirely empty selection is no rows', () => {
    expect(pathsFromSelection({})).toEqual([])
    expect(pathsFromSelection({1: []})).toEqual([])
  })
})

describe('selectionFromPaths', () => {
  test('reads the stored rows into per-module selections of string ids', () => {
    expect(selectionFromPaths([{module: 1, parts: [246]}, {module: 11, parts: [294, 295]}])).toEqual({
      1: ['246'],
      11: ['294', '295'],
    })
  })

  test('treats nullish or empty rows as no selection', () => {
    expect(selectionFromPaths(null)).toEqual({})
    expect(selectionFromPaths(undefined)).toEqual({})
    expect(selectionFromPaths([])).toEqual({})
    expect(selectionFromPaths([{module: 3, parts: []}])).toEqual({})
  })
})

describe('the round trip is lossless', () => {
  const RECORDED = [
    {module: 1, parts: [250, 269, 245, 246, 248]},
    {module: 7, parts: [258, 255, 279, 259]},
    {module: 11, parts: [294, 295, 296, 297]},
  ]

  test('decode then encode gives back exactly what came in', () => {
    expect(pathsFromSelection(selectionFromPaths(RECORDED))).toEqual(RECORDED)
  })
})
