<template>
  <div class="app-page">
    <b-modal
      id="revoke-api-user-modal"
      ref="revokeModal"
      :title="$trans('Revoke?')"
      @ok.prevent="handleRevokeOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to revoke this API key?') }}</p>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('People')"
      :search-label="$trans('Search API users')"
      :refresh="refresh"
      :empty-text="$trans('No API users found')"
      :label="$trans('API user')"
      :delete-modal="{
        modalId: 'delete-api-user-modal',
        confirmText: $trans('Are you sure you want to delete this API user?'),
        destroyMutation: companyApiuserDestroyMutation,
        invalidate: (qc) => qc.invalidateQueries({queryKey: companyApiuserListQueryKey()}),
        deletedDetail: $trans('API user has been deleted'),
        deleteError: $trans('Error deleting API user'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          v-if="authStore.isStaff || authStore.isSuperuser"
          :to="{name: 'apiuser-add'}"
          class="btn btn-primary"
        >
          {{ $trans("Add API user") }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import { addDays, format } from 'date-fns'

import {
  companyApiuserDestroyMutation,
  companyApiuserListOptions,
  companyApiuserListQueryKey,
  companyApiuserRevokeCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyApiuserListData, PaginatedApiUserList } from '@/api/types.gen'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useAuthStore } from '@/features/auth'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useConfirmedAction,
  useServerTable,
  type ListRow,
} from '@/features/table'

const authStore = useAuthStore()
const queryClient = useQueryClient()
const {create} = useToast()

type ApiUserRow = ListRow<PaginatedApiUserList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const columnHelper = createAppColumnHelper<ApiUserRow>()

function validUntil(expireStartDt: string | undefined, expireInDays: number): string {
  if (!expireStartDt) return '—'
  const [year, month, day] = expireStartDt.slice(0, 10).split('-').map(Number)
  return format(addDays(new Date(year, month - 1, day), expireInDays), 'dd/MM/yyyy')
}

async function copyToken(token: string) {
  try {
    await navigator.clipboard.writeText(token)
    infoToast(create, $trans('Copy'), $trans('Token copied to clipboard'))
  } catch {
    // Clipboard access is denied in some contexts (permissions, insecure
    // origin); the token is on screen to copy by hand either way.
    errorToast(create, $trans('Error copying token'))
  }
}

const columns = columnHelper.columns([
  columnHelper.accessor('username', {
    header: $trans('Username'),
    // The api-user list endpoint declares no `ordering` parameter, so the
    // backend would silently drop a sort the wire carried — the column stays
    // non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '15%'},
    cell: (info) => h(RouterLink, {
      to: {name: 'apiuser-edit', params: {pk: info.row.original.id}},
    }, () => info.row.original.username),
  }),
  columnHelper.display({
    id: 'name',
    header: $trans('Name'),
    meta: {width: '15%'},
    cell: (info) => info.row.original.api_user?.name ?? '',
  }),
  // The token lifecycle the legacy `#cell(token)` slot rendered: the token
  // itself with a copy affordance, then Revoked — or Active with the revoke
  // action and the validity window.
  columnHelper.display({
    id: 'token',
    header: $trans('Token'),
    meta: {width: '60%'},
    cell: (info) => {
      const row = info.row.original
      const sub = row.api_user
      const token = sub?.token ?? ''
      const revoked = sub?.token_is_revoked ?? false
      const children = [
        h('div', {class: 'd-flex align-items-center gap-2'}, [
          h('code', {class: 'text-break'}, token),
          h('button', {
            type: 'button',
            class: 'btn btn-link btn-sm p-0',
            title: $trans('Copy token'),
            onClick: () => copyToken(token),
          }, $trans('Copy')),
        ]),
      ]
      if (revoked) {
        children.push(h('div', $trans('Revoked')))
      } else {
        children.push(h('div', [
          h('span', $trans('Active')),
          ' — ',
          h('button', {
            type: 'button',
            class: 'btn btn-link btn-sm p-0',
            onClick: () => showRevokeModal(row.id),
          }, $trans('Revoke')),
          h('div', `${$trans('Valid until')}: ${validUntil(sub?.expire_start_dt, sub?.expire_in_days ?? 0)}`),
        ]))
      }
      return h('div', children)
    },
  }),
  createActionColumn(columnHelper, {
    editRoute: 'apiuser-edit',
    onDelete: (id: number) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ApiUserListQueryParams = NonNullable<CompanyApiuserListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<ApiUserRow>({
  key: 'api-user-table',
  columns,
  listOptions: (query) => companyApiuserListOptions({
    query: {
      ...baseListParams(query),
    } as ApiUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading API users'),
})

// The screen's second confirmed action: the revoke modal the template owns,
// wired through the same helper as the delete modal above — it is the
// confirmed-action flow, not a delete, that the two share.
const {confirm: showRevokeModal, handleOk: handleRevokeOk} = useConfirmedAction({
  modalRefName: 'revokeModal',
  mutationOptions: () => ({
    ...companyApiuserRevokeCreateMutation(),
    onSuccess: async () => {
      infoToast(create, $trans('Revoked'), $trans('API key has been revoked'))
      await queryClient.invalidateQueries({queryKey: companyApiuserListQueryKey()})
    },
    onError: () => {
      errorToast(create, $trans('Error revoking API key'))
    },
  }),
})
</script>
