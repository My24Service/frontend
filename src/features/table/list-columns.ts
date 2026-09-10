import { h } from 'vue'
import type { RowData } from '@tanstack/vue-table'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import { $trans } from '@/services/i18n'
import type { createAppColumnHelper } from './table'

/**
 * Column helpers shared by every list screen's column definitions.
 *
 * `AnyColumnHelper<TData>` types against `createAppColumnHelper`'s own
 * return type rather than restating the framework's generic `ColumnHelper`
 * signature — the same seam `useAppTable`/`createAppColumnHelper` already
 * hide behind `table.ts`.
 */
type AnyColumnHelper<TData extends RowData> = ReturnType<typeof createAppColumnHelper<TData>>

/**
 * The row type every server-paged list works with: the generated paginated
 * envelope's `results` array element. Replaces the hand-spelled
 * `NonNullable<PaginatedXList['results']>[number]` aliases.
 */
export type ListRow<T extends {results?: unknown[]}> = NonNullable<T['results']>[number]

/**
 * The icons column every list screen hand-built: an optional edit link (a
 * router-link; screens that have no edit route simply omit it) plus the
 * delete icon that opens the screen's `ListDeleteModal`. `editRoute` is a
 * route name — every screen's edit route takes the same `{pk: id}` param,
 * so there is nothing else to parameterise.
 */
export function createActionColumn<TData extends RowData & {id: number}>(
  columnHelper: AnyColumnHelper<TData>,
  options: {
    editRoute?: string
    onDelete: (id: number) => void
    width?: string
  },
) {
  return columnHelper.display({
    id: 'icons',
    header: '',
    ...(options.width ? {meta: {width: options.width}} : {}),
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      options.editRoute
        ? h(IconLinkEdit, {
            router_name: options.editRoute,
            router_params: {pk: info.row.original.id},
            title: $trans('Edit'),
          })
        : null,
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => options.onDelete(info.row.original.id),
      }),
    ]),
  })
}
