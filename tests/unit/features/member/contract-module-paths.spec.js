import { describe, expect, test } from 'vitest'

import {
  pathsFromSelection,
  selectionFromPaths,
} from '@/features/member/contract/module-paths'

/**
 * The `module_paths_pks` encoding, directly.
 *
 * A Contract is a name plus a set of Module Parts, and the parts travel to the
 * backend folded into one string: `"1:246|7:258,255"` — module id, colon,
 * comma-separated part ids, pipe between modules. The checkbox tree is what a
 * user reads that string as, so the round trip has to be lossless or an edit
 * silently drops entitlements. These specs pin both directions against the
 * recorded contract 28's actual stored value.
 */

describe('pathsFromSelection', () => {
  test('folds selected parts into the wire encoding', () => {
    expect(
      pathsFromSelection({
        1: ['246'],
        7: ['258', '255', '279', '259', '275', '256'],
        11: ['294'],
      }),
    ).toBe('1:246|7:258,255,279,259,275,256|11:294')
  })

  test('skips modules with nothing selected', () => {
    expect(pathsFromSelection({1: [], 7: ['258']})).toBe('7:258')
  })

  test('an entirely empty selection encodes to an empty string', () => {
    expect(pathsFromSelection({})).toBe('')
    expect(pathsFromSelection({1: []})).toBe('')
  })
})

describe('selectionFromPaths', () => {
  test('parses the stored encoding into per-module selections of string ids', () => {
    expect(selectionFromPaths('1:246|11:294,295')).toEqual({
      1: ['246'],
      11: ['294', '295'],
    })
  })

  test('treats a nullish or empty encoding as no selection', () => {
    expect(selectionFromPaths(null)).toEqual({})
    expect(selectionFromPaths(undefined)).toEqual({})
    expect(selectionFromPaths('')).toEqual({})
  })
})

describe('the round trip is lossless', () => {
  // Contract 28's stored value, as the demo tenant holds it — six modules,
  // 53 named parts, in this exact order.
  const RECORDED =
    '1:250,269,245,246,248,247,249,251,262,261,268|2:229,223,224,225,267,227,226,228,289' +
    '|4:233,244,242,264,263,260,271,240,266,239|6:230,282,232' +
    '|7:258,255,279,259,275,256,273,283,254,272,274,257,276,277,293,281|11:294,295,296,297'

  test('decode then encode gives back exactly what came in', () => {
    expect(pathsFromSelection(selectionFromPaths(RECORDED))).toBe(RECORDED)
  })
})
