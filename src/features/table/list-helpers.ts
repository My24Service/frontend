import { h } from 'vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import { $trans } from '@/utils'
import type { createAppColumnHelper } from './table'

export type ListRow<T extends { results?: unknown[] | null }> = NonNullable<NonNullable<T['results']>[number]>

export function createActionColumn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helper: any,
  opts: { onDelete: (id: number) => void },
) {
  return helper.display({
    id: 'icons',
    header: '',
    meta: { width: '10%' },
    cell: (info: { row: { original: { id: number } } }) =>
      h('div', { class: 'h2 float-end' }, [
        h(IconLinkDelete, {
          title: $trans('Delete'),
          method: () => opts.onDelete((info.row.original as { id: number }).id),
        }),
      ]),
  })
}

export function dateColumn(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  helper: any, id: string, header: string) {
  return helper.accessor(id as never, { header, meta: { width: '10%' } })
}
