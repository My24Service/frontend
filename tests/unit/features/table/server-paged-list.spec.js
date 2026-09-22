import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/**
 * The whole-collection bound is the API's own ceiling. The contract states
 * it as `maximum` on every list's `page_size` parameter; this pins the
 * constant to that number so a backend change to `max_page_size` shows up
 * here rather than as silently short collections.
 */
describe('WHOLE_COLLECTION_PAGE_SIZE', () => {
  const schema = readFileSync(resolve(__dirname, '../../../../openapi/schema.yaml'), 'utf8')

  test('equals the page_size maximum the contract states, on every list', () => {
    const blocks = schema.split('- name: page_size').slice(1)
    expect(blocks.length).toBeGreaterThan(50)

    const maximums = new Set(blocks.map((block) => {
      const match = block.slice(0, 400).match(/maximum: (\d+)/)
      return match ? Number(match[1]) : null
    }))
    expect(maximums).toEqual(new Set([WHOLE_COLLECTION_PAGE_SIZE]))
  })
})
