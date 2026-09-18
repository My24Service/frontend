import type { RowData } from '@tanstack/vue-table'

import type { MinimalMember } from '@/api/types.gen'
import type { createAppColumnHelper } from '@/features/table'
import { $trans } from '@/services/i18n'

type AnyColumnHelper<TData extends RowData> = ReturnType<typeof createAppColumnHelper<TData>>

/** The member views a partner row can nest. */
type PartnerMemberViewKey = 'partner_view' | 'to_member_view' | 'from_member_view'

type RowWithMemberView<K extends PartnerMemberViewKey> = { [P in K]: MinimalMember }

/**
 * The member columns every partner list shows: the name and the three
 * identity fields that ride with it. A request row nests two views - the
 * sender and the destination - so the caller names the one it renders. The
 * name column's sort id derives from that key, because the endpoint's
 * ordering allow-list spells the term the same way (`partner_view` carries
 * `partner__name`).
 */
export function partnerColumns<
  K extends PartnerMemberViewKey,
  TData extends RowData & RowWithMemberView<K>,
>(
  columnHelper: AnyColumnHelper<TData>,
  viewKey: K,
) {
  const nameId = `${viewKey.replace(/_view$/, '')}__name`

  return {
    name: columnHelper.accessor((row: TData) => row[viewKey].name, {
      id: nameId,
      header: $trans('Name'),
    }),
    companycode: columnHelper.display({
      id: 'companycode',
      header: $trans('Company code'),
      enableSorting: false,
      cell: ({ row }) => row.original[viewKey].companycode,
    }),
    city: columnHelper.display({
      id: 'city',
      header: $trans('City'),
      enableSorting: false,
      cell: ({ row }) => row.original[viewKey].city,
    }),
    email: columnHelper.display({
      id: 'email',
      header: $trans('Email'),
      enableSorting: false,
      cell: ({ row }) => row.original[viewKey].email,
    }),
  }
}
