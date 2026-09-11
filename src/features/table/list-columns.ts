import { h } from 'vue'
import type { RowData } from '@tanstack/vue-table'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import { $trans } from '@/services/i18n'
import type { createAppColumnHelper } from './table'

type AnyColumnHelper<TData extends RowData> = ReturnType<typeof createAppColumnHelper<TData>>

export type ListRow<T extends {results?: unknown[]}> = NonNullable<T['results']>[number]

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
