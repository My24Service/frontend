import { describe, expect, test } from 'vitest'

import ListPagination from '@/features/member/ListPagination.vue'

import { settle } from '../../support/api-seam/index.js'
import { mountListView } from '../../support/form-harness.js'

/**
 * The count-and-pagination block, directly.
 *
 * The four list specs assert requests and routes, which bypass this component
 * entirely — the mutation review scored it 0/19 and asked for exactly this.
 * It takes plain props and reads its page from the route, so mounting it at a
 * query is the whole harness; what the specs pin is the arithmetic of the
 * "start - end / count" line, including the collapsed range a stale or
 * hand-edited `?page=` beyond the last page now produces instead of numbers
 * that have drifted past the data.
 */

async function mountPagination({count, query = {}, label = 'Module'}) {
  const wrapper = await mountListView(ListPagination, {
    query,
    deep: true,
    props: {count, label, controlsId: 'probe-table'},
  })
  await settle()
  return wrapper
}

/** The count line with whitespace collapsed, e.g. "Module 21 - 40 / 45". */
function countText(wrapper) {
  return wrapper.get('.count-section').text().replace(/\s+/g, ' ').trim()
}

describe('ListPagination, the count line', () => {
  test('a single short page reads as one range', async () => {
    const wrapper = await mountPagination({count: 5})

    expect(countText(wrapper)).toContain('1 - 5 / 5')
  })

  test('an empty list reads as zero through zero', async () => {
    const wrapper = await mountPagination({count: 0})

    expect(countText(wrapper)).toContain('0 - 0 / 0')
  })

  test('the second of several pages names its own twenty', async () => {
    const wrapper = await mountPagination({count: 45, query: {page: '2'}})

    expect(countText(wrapper)).toContain('21 - 40 / 45')
  })

  test('the last partial page stops at the count', async () => {
    const wrapper = await mountPagination({count: 45, query: {page: '3'}})

    expect(countText(wrapper)).toContain('41 - 45 / 45')
  })

  test('a page beyond the data collapses instead of drifting past it', async () => {
    const wrapper = await mountPagination({count: 45, query: {page: '99'}})

    expect(countText(wrapper)).toContain('45 - 45 / 45')
  })
})

describe('ListPagination, the pager itself', () => {
  test('renders no buttons while everything fits on one page', async () => {
    const wrapper = await mountPagination({count: 5})

    expect(wrapper.find('.pagination-section button').exists()).toBe(false)
  })

  test('offers pages once the rows outrun the page size', async () => {
    const wrapper = await mountPagination({count: 45})

    expect(wrapper.findAll('.pagination-section button').length).toBeGreaterThan(0)
  })
})
