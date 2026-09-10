<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-api-user-modal"
      :confirm-text="$trans('Are you sure you want to delete this API user?')"
      :destroy-mutation="companyApiuserDestroyMutation"
      :invalidate="(qc) => qc.invalidateQueries({queryKey: companyApiuserListQueryKey()})"
      :deleted-detail="$trans('API user has been deleted')"
      :delete-error="$trans('Error deleting API user')"
    />

    <b-modal
      id="revoke-api-user-modal"
      ref="revokeModal"
      :title="$trans('Revoke?')"
      @ok.prevent="handleRevokeOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to revoke this API key?') }}</p>
    </b-modal>

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('People')"
      :search-label="$trans('Search API users')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No API users found')"
        :label="$trans('API user')"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
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
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'

const authStore = useAuthStore()
const queryClient = useQueryClient()
const {create} = useToast()

type ApiUserRow = ListRow<PaginatedApiUserList>

const deleteModalRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('deleteModalRef')

const columnHelper = createAppColumnHelper<ApiUserRow>()

/**
 * `DD/MM/YYYY`, parsed from the date part only: the wire carries a full
 * timestamp, and constructing a Date from it directly would shift the day in
 * timezones behind UTC. A record without a start (the endpoint leaves it
 * optional) has no window to show.
 */
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
    onDelete: (id: number) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type ApiUserListQueryParams = NonNullable<CompanyApiuserListData['query']>

const paged = useServerPagedList<ApiUserRow>({
  listOptions: (query) => companyApiuserListOptions({
    query: {
      ...baseListParams(query),
    } as ApiUserListQueryParams,
  }),
  loadError: $trans('Error loading API users'),
})

const table = useAppTable({
  key: 'api-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

// The revoke flow has no kit helper — it is the only list with a second
// confirmed action — so it mirrors useListDelete's shape locally: a modal the
// template owns, a pending id, and a barrier the OK handler waits behind.
const revokeModal = useTemplateRef<{show: () => void; hide: () => void}>('revokeModal')
const revokingId = ref<number | null>(null)

const revokeMutation = useMutation({
  ...companyApiuserRevokeCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Revoked'), $trans('API key has been revoked'))
    await queryClient.invalidateQueries({queryKey: companyApiuserListQueryKey()})
  },
  onError: () => {
    errorToast(create, $trans('Error revoking API key'))
  },
})

function showRevokeModal(id: number) {
  revokingId.value = id
  revokeModal.value?.show()
}

async function handleRevokeOk(bvEvent: {preventDefault: () => void}) {
  bvEvent.preventDefault()
  if (revokingId.value === null || revokeMutation.isPending.value) return
  try {
    await revokeMutation.mutateAsync({path: {id: revokingId.value}})
    revokeModal.value?.hide()
  } catch {
    // The mutation's onError already told the user; staying on the list is
    // the contract, not a silent swallow.
  }
}
</script>
