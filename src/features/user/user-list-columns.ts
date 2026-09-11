import { h, toValue } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { RouterLink } from 'vue-router'
import type { RowData } from '@tanstack/vue-table'

import { $trans } from '@/services/i18n'
import type { createAppColumnHelper } from '@/features/table/table'

/**
 * The five columns six of the seven user lists show: the name, linking to that
 * user's own screen, then username, email, last login and date joined.
 *
 * Those six screens - sales, planning, employee, engineer, customer and
 * student - declared the same five columns themselves, accessor for accessor
 * and width for width, each with its own copy of the paragraph explaining why
 * none of them sorts. The set lives here now, and so does that explanation.
 *
 * What a screen genuinely decides for itself is what it passes in:
 *
 * - `nameRoute` is the route the name cell links to. Six screens link to their
 *   edit form; the student list links to its detail screen, as the legacy list
 *   did, so the option is named for what it is rather than for the six.
 * - `widths` is required rather than defaulted. The five columns are laid out
 *   in percentages and three sets are in use - 25/20/20/15/10 (sales,
 *   planning, employee), 20/15/15/15/10 (engineer) and 20/15/15/10/10
 *   (customer, student) - so no set is a majority worth hiding behind a
 *   default that half the call sites would then override. Widths are
 *   presentation the screen owns and states in full.
 *
 * The columns come back by name rather than as one array, because four of the
 * six screens interleave a column of their own: engineer and student put a
 * mobile column after username, customer a linked-customer column after email,
 * student an active toggle at the end. An array would have forced index
 * arithmetic on those call sites; naming them keeps the column order where the
 * reader can see it.
 *
 * The API-user list is the seventh screen and shares none of this: it has no
 * full_name, email, last_login or date_joined column, and the column it does
 * link is `username`. Its block stays as it is.
 */

/**
 * What these columns read off a row. Every generated user-list item satisfies
 * it structurally - the kit's `createActionColumn` states its own row
 * requirement the same way. `username` is optional because the student
 * serializer declares it so; the other five are required on every list.
 */
export type UserListRow = {
  id: number
  full_name: string
  username?: string
  email: string
  last_login?: string | null
  date_joined?: string
}

/**
 * `AnyColumnHelper<TData>` types against `createAppColumnHelper`'s own return
 * type rather than restating the framework's generic `ColumnHelper`
 * signature - the same seam `list-columns.ts` hides behind.
 */
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
    /** The route the name cell links to: the screen's edit form, or its detail screen. */
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
