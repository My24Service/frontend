import { describe, expect, test, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import ServerTable from '@/features/table/ServerTable.vue'
import { createAppColumnHelper, useServerTable } from '@/features/table/table'
import { settle } from '../../support/api-seam/index.js'
import { mountListView } from '../../support/form-harness.js'
import { modal } from '../../support/modal.js'

// `useServerTable` toasts load failures through `useToast`, so it needs
// the same toast seam every list spec installs — see form-harness.js.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The shared list screen (src/features/table/ServerTable.vue).
 *
 * The screen only wires an engine through, so the spec builds a real one:
 * `useServerTable` against an inline `queryFn` (no HTTP involved — the
 * engine only needs `queryKey`/`queryFn` options). Clicking through to page
 * two then proves the whole loop the component exists to close: the engine's
 * pagination reaches the pagination controls, whose buttons drive the table,
 * whose state change refetches the engine.
 *
 * The delete modal is rendered by the component under test, so the screen's
 * only handle on it is the exposed `showDeleteModal` — the call the icon
 * column makes. It is pinned here for that reason: an unpinned imperative
 * handle is the part of a restructure that breaks silently.
 */

const TOTAL = 45

const TableHost = defineComponent({
  components: { ServerTable },
  props: {
    empty: { type: Boolean, default: false },
    boxed: { type: Boolean, default: false },
  },
  setup(props) {
    const tableRef = ref(null)
    const columnHelper = createAppColumnHelper()
    const columns = columnHelper.columns([
      columnHelper.accessor('name', { header: 'Name', enableSorting: false }),
    ])
    const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable({
      key: 'shell-table',
      columns,
      listOptions: (query) => ({
        queryKey: ['shell-table', props.empty, query.page, query.page_size],
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
    return {
      tableRef,
      table,
      searchDraft,
      pagination,
      count,
      isLoading,
      isFetching,
      refresh,
      rowClass: (row) => (row.id === 1 ? 'hl' : ''),
    }
  },
  template: `
    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :row-class="rowClass"
      :page-details="boxed"
      title="Things"
      search-label="Search things"
      :refresh="refresh"
      empty-text="No things found"
      label="Thing"
      :delete-modal="{
        modalId: 'delete-thing-modal',
        confirmText: 'Delete this thing?',
        destroyMutation: () => ({ mutationFn: async () => ({}) }),
        invalidate: () => {},
        deletedDetail: 'Thing has been deleted',
        deleteError: 'Error deleting thing',
      }"
    >
      <template #add><a class="btn test-add" href="/things/add">Add thing</a></template>
    </ServerTable>
  `,
})

async function mountTable(props = {}) {
  const wrapper = await mountListView(TableHost, { deep: true, props })
  return wrapper
}

/** The text of every body row, one string per row. */
function rowTexts(wrapper) {
  return wrapper.findAll('tbody tr').map((row) => row.text())
}

describe('ServerTable', () => {
  test('renders the table rows it was given', async () => {
    const wrapper = await mountTable()
    await settle()

    expect(rowTexts(wrapper).length).toBe(20)
    expect(rowTexts(wrapper)[0]).toContain('User 1')
  })

  test('renders the header it was given, with the screen own add link', async () => {
    const wrapper = await mountTable()
    await settle()

    expect(wrapper.get('h3').text()).toContain('Things')
    expect(wrapper.get('input[aria-label="Search things"]').attributes('placeholder')).toBe('Search things')
    expect(wrapper.get('.test-add').text()).toBe('Add thing')
  })

  test('renders the panel shell: the box, the table wrapper and the pagination', async () => {
    const wrapper = await mountTable()
    await settle()

    expect(wrapper.find('.app-detail.panel.overflow-auto > .data-table > table.table').exists()).toBe(true)
    expect(wrapper.find('.server-table-pagination').exists()).toBe(true)
  })

  test('hides the pagination while loading, shows it after', async () => {
    const wrapper = await mountTable()

    expect(wrapper.find('.server-table-pagination').exists()).toBe(false)

    await settle()

    expect(wrapper.find('.server-table-pagination').exists()).toBe(true)
  })

  test('forwards the count and the label to the pagination', async () => {
    const wrapper = await mountTable()
    await settle()

    const status = wrapper.find('.server-table-pagination').text()
    expect(status).toContain('45')
    expect(status).toContain('Thing')
  })

  test('the next-page button refetches through the forwarded pagination state', async () => {
    const wrapper = await mountTable()
    await settle()

    await wrapper.get('button[aria-label="Next page"]').trigger('click')
    await settle()

    expect(rowTexts(wrapper)[0]).toContain('User 21')
    expect(wrapper.find('.server-table-pagination').text()).toContain('Page 2 / 3')
  })

  test('forwards the row class to the table', async () => {
    const wrapper = await mountTable()
    await settle()

    expect(wrapper.findAll('tbody tr')[0].classes()).toContain('hl')
    expect(wrapper.findAll('tbody tr')[1].classes()).not.toContain('hl')
  })

  test('shows the empty text when the backend returned nothing', async () => {
    const wrapper = await mountTable({ empty: true })
    await settle()

    expect(wrapper.text()).toContain('No things found')
  })

  test('boxes the table in the page-details panel only when asked', async () => {
    const unboxed = await mountTable()
    await settle()
    expect(unboxed.find('.page-details.panel').exists()).toBe(false)

    const boxed = await mountTable({ boxed: true })
    await settle()
    expect(boxed.find('.page-details.panel .app-detail.panel').exists()).toBe(true)
  })

  test('the exposed showDeleteModal opens the delete confirmation', async () => {
    const wrapper = await mountTable()
    await settle()

    expect(modal('delete-thing-modal').isOpen()).toBe(false)

    wrapper.vm.tableRef.showDeleteModal(7)
    await settle()

    expect(modal('delete-thing-modal').isOpen()).toBe(true)
    expect(document.getElementById('delete-thing-modal').textContent).toContain('Delete this thing?')
  })
})
