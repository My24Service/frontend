import { describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'

import { vPaginatedSalesUserList } from '@/api/valibot.gen'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import { createActionColumn } from '@/features/table/list-columns'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { fixtureFor, itemSchemaOf } from '../../helpers/schema-fixture.js'
import { settle } from '../../support/api-seam/index.js'
import { mountListView } from '../../support/form-harness.js'

// `useServerPagedList` toasts load failures through `useToast`, so it needs
// the same toast seam every list spec installs — see form-harness.js.
vi.mock('bootstrap-vue-next', async (importOriginal) => {
  const { toastCreate } = await import('../../support/form-harness.js')
  return { ...(await importOriginal()), useToast: () => ({ create: toastCreate }) }
})

/**
 * The shared list column helpers (src/features/table/list-columns.ts).
 *
 * The rows are real generated-envelope items — `itemSchemaOf` over the
 * sales-user paginated schema, i.e. the `ListRow<PaginatedSalesUserList>`
 * shape without hand-spelling it — rendered through a real table, so the
 * specs prove generated rows flow through `createActionColumn` as the
 * `ListRow` contract promises. (`ListRow` itself is a type and leaves no
 * runtime trace; its definition and constraint compile under `npm run
 * typecheck`, which covers src.)
 */

const ITEM = itemSchemaOf(vPaginatedSalesUserList)

function salesRow(overrides = {}) {
  return fixtureFor(ITEM, {
    id: 7,
    username: 'sale-ana',
    full_name: 'Ana Sales',
    ...overrides,
  })
}

async function mountActionTable({ editRoute = 'shell-edit', rows } = {}) {
  const onDelete = vi.fn()
  const Host = defineComponent({
    components: { ServerDataTable },
    setup() {
      const columnHelper = createAppColumnHelper()
      const columns = columnHelper.columns([
        columnHelper.accessor('username', { header: 'Username', enableSorting: false }),
        createActionColumn(columnHelper, {
          ...(editRoute ? { editRoute } : {}),
          onDelete,
          width: '10%',
        }),
      ])
      const paged = useServerPagedList({
        listOptions: (query) => ({
          queryKey: ['shell-columns', query.page, query.page_size],
          queryFn: async () => ({ count: rows.length, results: rows }),
        }),
      })
      const table = useAppTable({ key: 'shell-columns-table', columns, ...paged.tableOptions })
      return { table }
    },
    template: '<ServerDataTable :table="table" />',
  })
  const wrapper = await mountListView(Host, {
    deep: true,
    routes: [{ path: '/shell/:pk', name: 'shell-edit', component: { template: '<div />' } }],
  })
  await settle()
  return { wrapper, onDelete }
}

describe('createActionColumn', () => {
  test('renders generated-envelope rows with an edit link per row id', async () => {
    const { wrapper } = await mountActionTable({ rows: [salesRow()] })

    expect(wrapper.text()).toContain('sale-ana')
    const edit = wrapper.get('a[title="Edit"]')
    expect(edit.attributes('href')).toBe('/shell/7')
  })

  test('the delete icon reports its own row id', async () => {
    const { wrapper, onDelete } = await mountActionTable({
      rows: [salesRow({ id: 7 }), salesRow({ id: 8, username: 'sale-bas' })],
    })

    const deletes = wrapper.findAll('button[title="Delete"]')
    expect(deletes.length).toBe(2)

    await deletes[1].trigger('click')

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(8)
  })

  test('without an edit route only the delete icon renders', async () => {
    const { wrapper, onDelete } = await mountActionTable({ editRoute: null, rows: [salesRow()] })

    expect(wrapper.find('a[title="Edit"]').exists()).toBe(false)

    await wrapper.get('button[title="Delete"]').trigger('click')

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(onDelete).toHaveBeenCalledWith(7)
  })
})
