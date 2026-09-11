import { h, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { RouterLink } from 'vue-router'
import type { RowData } from '@tanstack/vue-table'

import { $trans } from '@/services/i18n'
import type { createAppColumnHelper } from '@/features/table'

export type UserListRow = {
  id: number
  full_name: string
  username?: string
  email: string
  last_login?: string | null
  date_joined?: string
}

type AnyColumnHelper<TData extends RowData> = ReturnType<typeof createAppColumnHelper<TData>>

/** The widths a screen gives the shared columns, as the table's colgroup reads them. */
export type UserColumnWidths = {
  name: string
  username: string
  email: string
  lastLogin: string
  dateJoined: string
}

export function createUserColumns<TData extends RowData & UserListRow>(
  columnHelper: AnyColumnHelper<TData>,
  options: {
    nameRoute: MaybeRefOrGetter<string>
    widths: UserColumnWidths
  },
) {
  const {widths} = options

  // The user list endpoints declare no `ordering` parameter, so the backend
  // would silently drop a sort the wire carried - every column here stays
  // non-sortable rather than sending a parameter nothing honours. This
  // paragraph used to sit above each of these five columns on each of the six
  // screens.
  //
  // The columns read their field through a function and name their id, rather
  // than `accessor('full_name')`: the row type here is still the caller's
  // generic, and TanStack resolves a string key through `DeepKeys<TData>`,
  // which sees no literal key on an unresolved generic. The two forms pick the
  // same cell - the id is what the table keys the column by, and it is
  // unchanged.
  return {
    name: columnHelper.accessor((row) => row.full_name, {
      id: 'full_name',
      header: $trans('Name'),
      enableSorting: false,
      meta: {width: widths.name},
      cell: (info) => h(RouterLink, {
        to: {name: toValue(options.nameRoute), params: {pk: info.row.original.id}},
      }, () => info.row.original.full_name),
    }),
    username: columnHelper.accessor((row) => row.username, {
      id: 'username',
      header: $trans('Username'),
      enableSorting: false,
      meta: {width: widths.username},
    }),
    email: columnHelper.accessor((row) => row.email, {
      id: 'email',
      header: $trans('Email'),
      enableSorting: false,
      meta: {width: widths.email},
    }),
    lastLogin: columnHelper.accessor((row) => row.last_login, {
      id: 'last_login',
      header: $trans('Last login'),
      enableSorting: false,
      meta: {width: widths.lastLogin},
    }),
    dateJoined: columnHelper.accessor((row) => row.date_joined, {
      id: 'date_joined',
      header: $trans('Date joined'),
      enableSorting: false,
      meta: {width: widths.dateJoined},
    }),
  }
}
