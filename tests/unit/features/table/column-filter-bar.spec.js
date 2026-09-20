import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import { enableAutoUnmount, flushPromises } from '@vue/test-utils'

import ServerTable from '@/features/table/ServerTable.vue'
import { createAppColumnHelper } from '@/features/table/table'
import { useServerTable } from '@/features/table/use-server-table'
import { settle } from '../../support/api-seam/index.js'
import {
  addFilter,
  chip,
  chipTexts,
  closeEditor,
  editorInput,
  offeredFilters,
  pickMode,
  settleTransitions,
} from '../../support/column-filters.js'
import { mountListView } from '../../support/form-harness.js'

vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The column-filter bar (src/features/table/filters/), driven through the
 * screen that renders it. The engine is real — `useServerTable` over an
 * inline `queryFn` — so every assertion below is about what reaches the
 * wire: the query the engine hands to `listOptions` after the editor's
 * value went through the table state and the debounce.
 *
 * One host, five filterable columns — one per editor plus the two select
 * shapes (a static list, and an autocomplete over a foreign key that
 * filters under its own `param` and names restored ids through
 * `resolveLabels`) — and one column with no filter at all to prove the menu
 * leaves it out.
 *
 * Mounted with the real `<transition>` (see support/column-filters.js) and
 * on the document, so the focus assertions mean something.
 */

enableAutoUnmount(afterEach)

const OWNERS = [
  { value: '1', label: 'Acme' },
  { value: '2', label: 'Beta' },
  { value: '3', label: 'Gamma' },
]

const TableHost = defineComponent({
  components: { ServerTable },
  props: {
    withFilters: { type: Boolean, default: true },
  },
  setup(props) {
    const queries = ref([])
    const loadOptions = vi.fn(async (term) => OWNERS.filter((owner) => owner.label.toLowerCase().includes(term.toLowerCase())))
    const resolveLabels = vi.fn(async (values) => OWNERS.filter((owner) => values.includes(owner.value)))
    const columnHelper = createAppColumnHelper()
    const columns = columnHelper.columns([
      columnHelper.accessor('name', {
        header: 'Name',
        meta: props.withFilters ? { filter: { variant: 'text' } } : undefined,
      }),
      columnHelper.accessor('num_orders', {
        header: 'Orders',
        meta: props.withFilters ? { filter: { variant: 'number' } } : undefined,
      }),
      columnHelper.accessor('start_date', {
        header: '',
        meta: props.withFilters ? { filter: { variant: 'date', label: 'Start date' } } : undefined,
      }),
      columnHelper.accessor('kind', {
        header: 'Kind',
        meta: props.withFilters
          ? { filter: { variant: 'select', options: [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Bravo' }] } }
          : undefined,
      }),
      columnHelper.accessor('owner', {
        header: 'Owner',
        meta: props.withFilters ? { filter: { variant: 'select', param: 'owner_id', loadOptions, resolveLabels } } : undefined,
      }),
      columnHelper.accessor('plain', { header: 'Plain' }),
    ])
    const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable({
      key: 'filter-bar-table',
      columns,
      // Recorded here, at the seam the engine hands its wire query to, rather
      // than in the queryFn: a key the cache has seen is answered without a
      // fetch, so removing a filter would leave no trace in the queryFn.
      listOptions: (query) => {
        queries.value.push(query)
        return {
          queryKey: ['filter-bar-table', query],
          queryFn: async () => ({ count: 1, results: [{ id: 1, name: 'Row', num_orders: 1, start_date: '2026-09-15', kind: 'a', owner: '1', tags: 'x', plain: '' }] }),
        }
      },
      urlSync: true,
    })
    return { queries, loadOptions, resolveLabels, table, searchDraft, pagination, count, isLoading, isFetching, refresh }
  },
  template: `
    <ServerTable
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      title="Things"
      search-label="Search things"
      :refresh="refresh"
    />
  `,
})

function resetUrl() {
  window.history.replaceState(null, '', '/')
}

function seedUrl(queryString) {
  window.history.replaceState(null, '', `/#/?${queryString}`)
}

async function mountBar(props = {}) {
  resetUrl()
  return mountSeeded(props)
}

/** Mount against whatever the address bar holds right now. */
async function mountSeeded(props = {}) {
  const wrapper = await mountListView(TableHost, {
    deep: true,
    props,
    stubs: { transition: false },
    attachTo: document.body,
  })
  await settle()
  return wrapper
}

/** The last query the engine sent, once the 300 ms filter debounce has run. */
async function lastQuery(wrapper) {
  await new Promise((resolve) => setTimeout(resolve, 350))
  await settle()
  return wrapper.vm.queries.at(-1)
}

describe('ColumnFilterBar', () => {
  test('renders nothing when no column declares a filter', async () => {
    const wrapper = await mountBar({ withFilters: false })

    expect(wrapper.find('.column-filter-bar').exists()).toBe(false)
  })

  test('the menu offers the filterable columns by label, not the plain one', async () => {
    const wrapper = await mountBar()

    expect(await offeredFilters(wrapper)).toEqual(['Name', 'Orders', 'Start date', 'Kind', 'Owner'])
    expect(wrapper.find('tr.filter-row').exists()).toBe(false)
  })

  test('adding a filter shows an empty chip with its editor open and focused', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')

    expect(chipTexts(wrapper)).toEqual(['Name: …'])
    expect(wrapper.find('.column-filter-popover').exists()).toBe(true)
    expect(document.activeElement).toBe(editorInput(wrapper, 'name').element)
  })

  test('a chip left empty vanishes when its editor closes; the column is offered again', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')
    expect(await offeredFilters(wrapper)).not.toContain('Name')

    await closeEditor(wrapper)

    expect(chipTexts(wrapper)).toEqual([])
    expect(await offeredFilters(wrapper)).toContain('Name')
  })

  test('typing in the text editor applies as it goes and reads back on the chip', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('acme')

    expect(chipTexts(wrapper)).toEqual(['Name: acme'])
    expect(await lastQuery(wrapper)).toMatchObject({ page: 1, name: 'acme' })
    expect(window.location.hash).toContain('name=acme')
  })

  test('Enter closes the editor and returns the focus to the chip', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('acme')
    await editorInput(wrapper, 'name').trigger('keydown', { key: 'Enter' })
    await settleTransitions()

    expect(wrapper.find('.column-filter-popover').exists()).toBe(false)
    expect(document.activeElement).toBe(wrapper.get('.filter-chip-main').element)
  })

  test('the chip x removes the filter from the wire and the address bar', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('acme')
    await lastQuery(wrapper)

    await chip(wrapper, 'Name').remove()

    expect(chipTexts(wrapper)).toEqual([])
    expect(await lastQuery(wrapper)).not.toHaveProperty('name')
    expect(window.location.hash).not.toContain('name=')
  })

  test('clear all drops every chip at once', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Name')
    await editorInput(wrapper, 'name').setValue('acme')
    await closeEditor(wrapper)
    await addFilter(wrapper, 'Kind')
    await wrapper.get('.column-filter-popover [role="option"]').trigger('click')
    await closeEditor(wrapper)
    expect(chipTexts(wrapper)).toEqual(['Name: acme', 'Kind: Alpha'])

    await wrapper.get('.column-filter-bar .clear-all').trigger('click')

    expect(chipTexts(wrapper)).toEqual([])
    const query = await lastQuery(wrapper)
    expect(query).not.toHaveProperty('name')
    expect(query).not.toHaveProperty('kind')
  })

  test('a shared URL restores the chips, described in the chip words', async () => {
    seedUrl('name=acme&num_orders=18...80&start_date=2026-09&kind=b')
    const wrapper = await mountSeeded()

    expect(chipTexts(wrapper)).toEqual(['Name: acme', 'Orders: 18 – 80', 'Start date: 09/2026', 'Kind: Bravo'])
    expect(wrapper.vm.queries[0]).toMatchObject({ name: 'acme', num_orders: '18...80', start_date: '2026-09', kind: 'b' })
    resetUrl()
  })
})

describe('the number editor', () => {
  test('an exact number rides the wire as itself', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Orders')
    await editorInput(wrapper, 'num_orders').setValue('25')

    expect(chipTexts(wrapper)).toEqual(['Orders: 25'])
    expect(await lastQuery(wrapper)).toMatchObject({ num_orders: '25' })
  })

  test('at least / at most spell the open-ended ranges', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Orders')
    await pickMode(wrapper, 'At least')
    await editorInput(wrapper, 'num_orders').setValue('18')
    expect(chipTexts(wrapper)).toEqual(['Orders: ≥ 18'])
    expect(await lastQuery(wrapper)).toMatchObject({ num_orders: '18...' })

    await pickMode(wrapper, 'At most')
    expect(chipTexts(wrapper)).toEqual(['Orders: ≤ 18'])
    expect(await lastQuery(wrapper)).toMatchObject({ num_orders: '...18' })
  })

  test('between spells the inclusive range, and the switch the exclusive one', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Orders')
    await pickMode(wrapper, 'Between')
    await editorInput(wrapper, 'num_orders', 'from').setValue('18')
    await editorInput(wrapper, 'num_orders', 'to').setValue('80')
    expect(chipTexts(wrapper)).toEqual(['Orders: 18 – 80'])
    expect(await lastQuery(wrapper)).toMatchObject({ num_orders: '18...80' })

    await wrapper.get('.column-filter-popover .filter-number-exclusive input').setValue(true)
    expect(chipTexts(wrapper)).toEqual(['Orders: 18 – 80 (excl.)'])
    expect(await lastQuery(wrapper)).toMatchObject({ num_orders: '18..80' })
  })

  test('a restored range opens in between mode with both ends filled', async () => {
    seedUrl('num_orders=18...80')
    const wrapper = await mountSeeded()

    await chip(wrapper, 'Orders').open()

    expect(editorInput(wrapper, 'num_orders', 'from').element.value).toBe('18')
    expect(editorInput(wrapper, 'num_orders', 'to').element.value).toBe('80')
    resetUrl()
  })
})

describe('the date editor', () => {
  test('a quick pick applies the day; switching to month re-expresses it', async () => {
    vi.useFakeTimers({ now: new Date(2026, 8, 15), toFake: ['Date'] })
    try {
      const wrapper = await mountBar()

      await addFilter(wrapper, 'Start date')
      const today = wrapper.findAll('.column-filter-popover .filter-date-preset').find((button) => button.text() === 'Today')
      await today.trigger('click')
      expect(chipTexts(wrapper)).toEqual(['Start date: 15/09/2026'])
      expect(await lastQuery(wrapper)).toMatchObject({ start_date: '2026-09-15' })

      await pickMode(wrapper, 'Month')
      expect(chipTexts(wrapper)).toEqual(['Start date: 09/2026'])
      expect(await lastQuery(wrapper)).toMatchObject({ start_date: '2026-09' })

      await pickMode(wrapper, 'Between')
      expect(chipTexts(wrapper)).toEqual(['Start date: 01/09/2026 – 30/09/2026'])
      expect(await lastQuery(wrapper)).toMatchObject({ start_date: '2026-09-01...2026-09-30' })

      await pickMode(wrapper, 'From')
      expect(chipTexts(wrapper)).toEqual(['Start date: from 01/09/2026'])
      expect(await lastQuery(wrapper)).toMatchObject({ start_date: '2026-09-01...' })
    } finally {
      vi.useRealTimers()
    }
  })

  test('a restored open-ended range opens in the matching one-sided mode', async () => {
    seedUrl('start_date=...2026-10')
    const wrapper = await mountSeeded()

    expect(chipTexts(wrapper)).toEqual(['Start date: until 10/2026'])
    await chip(wrapper, 'Start date').open()

    const checked = wrapper.findAll('.column-filter-popover .filter-mode input').find((input) => input.element.checked)
    expect(wrapper.get(`label[for="${checked.attributes('id')}"]`).text()).toBe('Until')
    resetUrl()
  })
})

describe('the select editor', () => {
  test('a short static list needs no search box; picks accumulate, comma-joined on the wire', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Kind')
    expect(wrapper.find('.column-filter-popover input').exists()).toBe(false)
    const options = () => wrapper.findAll('.column-filter-popover [role="option"]')
    expect(options().map((option) => option.text())).toEqual(['Alpha', 'Bravo'])

    await options()[1].trigger('click')
    expect(chipTexts(wrapper)).toEqual(['Kind: Bravo'])
    expect(wrapper.find('.column-filter-popover').exists()).toBe(true)
    expect(await lastQuery(wrapper)).toMatchObject({ kind: 'b' })

    await options()[0].trigger('click')
    expect(chipTexts(wrapper)).toEqual(['Kind: Bravo, Alpha'])
    expect(options().map((option) => option.attributes('aria-selected'))).toEqual(['true', 'true'])
    expect(await lastQuery(wrapper)).toMatchObject({ kind: 'b,a' })

    await options()[1].trigger('click')
    expect(chipTexts(wrapper)).toEqual(['Kind: Alpha'])
    expect(await lastQuery(wrapper)).toMatchObject({ kind: 'a' })
  })

  test('an autocomplete list loads for the typed term and picks by value', async () => {
    const wrapper = await mountBar()

    await addFilter(wrapper, 'Owner')
    await flushPromises()
    expect(wrapper.vm.loadOptions).toHaveBeenCalledWith('')
    expect(wrapper.findAll('.column-filter-popover [role="option"]').map((option) => option.text())).toEqual(['Acme', 'Beta', 'Gamma'])

    await editorInput(wrapper, 'owner').setValue('gam')
    await new Promise((resolve) => setTimeout(resolve, 300))
    await flushPromises()
    expect(wrapper.vm.loadOptions).toHaveBeenLastCalledWith('gam')
    expect(wrapper.findAll('.column-filter-popover [role="option"]').map((option) => option.text())).toEqual(['Gamma'])

    await editorInput(wrapper, 'owner').trigger('keydown', { key: 'ArrowDown' })
    await editorInput(wrapper, 'owner').trigger('keydown', { key: 'Enter' })
    await flushPromises()

    // Under the spec's `param`, not the column id — and the chip names the
    // pick from the list it was picked off, not the id on the wire.
    const query = await lastQuery(wrapper)
    expect(query).toMatchObject({ owner_id: '3' })
    expect(query).not.toHaveProperty('owner')
    expect(chipTexts(wrapper)).toEqual(['Owner: Gamma'])
    expect(window.location.hash).toContain('owner_id=3')
  })

  test('a restored id is named through resolveLabels, asked once', async () => {
    seedUrl('owner_id=2,3')
    const wrapper = await mountSeeded()
    await flushPromises()

    expect(wrapper.vm.resolveLabels).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.resolveLabels).toHaveBeenCalledWith(['2', '3'])
    expect(chipTexts(wrapper)).toEqual(['Owner: Beta, Gamma'])
    expect(wrapper.vm.queries[0]).toMatchObject({ owner_id: '2,3' })
    resetUrl()
  })

  test('a pick with a comma in it rides the wire escaped and reads back whole', async () => {
    seedUrl('kind=Wacht\\, op onderdelen,b')
    const wrapper = await mountSeeded()

    expect(chipTexts(wrapper)).toEqual(['Kind: Wacht, op onderdelen, Bravo'])
    expect(wrapper.vm.queries[0]).toMatchObject({ kind: 'Wacht\\, op onderdelen,b' })
    resetUrl()
  })
})
