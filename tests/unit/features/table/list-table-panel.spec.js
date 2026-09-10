import { describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'

import ListTablePanel from '@/features/table/ListTablePanel.vue'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { settle } from '../../support/api-seam/index.js'
import { mountListView } from '../../support/form-harness.js'

// `useServerPagedList` toasts load failures through `useToast`, so it needs
// the same toast seam every list spec installs — see form-harness.js.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The shared list-screen panel (src/features/table/ListTablePanel.vue).
 *
 * The panel only wires a table instance through, so the spec builds a real
 * one: `useServerPagedList` against an inline `queryFn` (no HTTP involved —
 * the engine only needs `queryKey`/`queryFn` options) plus `useAppTable`.
 * Clicking through to page two then proves the whole loop the panel exists
 * to close: its `:pagination` reaches our `ServerTablePagination`, whose
 * buttons drive the table, whose state change refetches the engine.
 */

const TOTAL = 45

const PanelHost = defineComponent({
  components: { ListTablePanel },
  props: {
    empty: { type: Boolean, default: false },
  },
  setup(props) {
    const columnHelper = createAppColumnHelper()
    const columns = columnHelper.columns([
      columnHelper.accessor('name', { header: 'Name', enableSorting: false }),
    ])
    const paged = useServerPagedList({
      listOptions: (query) => ({
        queryKey: ['shell-panel', props.empty, query.page, query.page_size],
        queryFn: async ({ queryKey }) => {
          const page = queryKey[2]
          const pageSize = queryKey[3]
          if (props.empty) return { count: 0, results: [] }
          const start = (page - 1) * pageSize
          const end = Math.min(start + pageSize, TOTAL)
          const results = []
          for (let id = start + 1; id <= end; id++) results.push({ id, name: `User ${id}` })
          return { count: TOTAL, results }
        },
      }),
    })
    const table = useAppTable({ key: 'shell-panel-table', columns, ...paged.tableOptions })
    return {
      table,
      pagination: paged.pagination,
      count: paged.count,
      isLoading: paged.isLoading,
      isFetching: paged.isFetching,
      rowClass: (row) => (row.id === 1 ? 'hl' : ''),
    }
  },
  template: `
    <ListTablePanel
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      empty-text="No things found"
      label="Thing"
      :row-class="rowClass"
    />
  `,
})

async function mountPanel(props = {}) {
  const wrapper = await mountListView(PanelHost, { deep: true, props })
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('ListTablePanel', () => {
  test('renders the table rows it was given', async () => {
    const wrapper = await mountPanel()
    await settle()

    expect(rowTexts(wrapper).length).toBe(20)
    expect(rowTexts(wrapper)[0]).toContain('User 1')
  })

  test('hides the pagination while loading, shows it after', async () => {
    const wrapper = await mountPanel()

    expect(wrapper.find('.server-table-pagination').exists()).toBe(false)

    await settle()

    expect(wrapper.find('.server-table-pagination').exists()).toBe(true)
  })

  test('forwards the count and the label to the pagination', async () => {
    const wrapper = await mountPanel()
    await settle()

    const status = wrapper.find('.server-table-pagination').text()
    expect(status).toContain('45')
    expect(status).toContain('Thing')
  })

  test('the next-page button refetches through the forwarded pagination state', async () => {
    const wrapper = await mountPanel()
    await settle()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(rowTexts(wrapper)[0]).toContain('User 21')
    expect(wrapper.find('.server-table-pagination').text()).toContain('Page 2 / 3')
  })

  test('forwards the row class to the table', async () => {
    const wrapper = await mountPanel()
    await settle()

    expect(wrapper.findAll('tbody tr')[0].classes()).toContain('hl')
    expect(wrapper.findAll('tbody tr')[1].classes()).not.toContain('hl')
  })

  test('shows the empty text when the backend returned nothing', async () => {
    const wrapper = await mountPanel({ empty: true })
    await settle()

    expect(wrapper.text()).toContain('No things found')
  })
})
