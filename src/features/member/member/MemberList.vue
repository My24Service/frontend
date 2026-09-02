<template>
  <div class="app-page">
    <b-modal
      id="delete-member-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this member?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Members") }}</h3>
        <BButton-toolbar>
          <BButton-group class="me-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto me-2"
            :aria-label="$trans('Search name, companycode or city')"
            :placeholder="$trans('Search name, companycode or city')"
          />
          <router-link
            v-if="variant === 'active' && authStore.isSuperuser"
            :to="{name: 'member-add'}"
            class="btn"
          >
            {{$trans('Add member')}}
          </router-link>
          <router-link
            v-if="variant === 'requested'"
            :to="{name: 'member-request'}"
            class="btn"
          >
            {{$trans('Request new member')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          :empty-text="$trans('No members found')"
        />
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="variantLabel"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, h } from 'vue'
import { RouterLink } from 'vue-router'
import {
  memberMemberDestroyMutation,
  memberMemberListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberMemberListData, PaginatedMemberList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { useAuthStore } from '@/stores/auth'
import { memberMemberListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * See README/ADR for context.
 */

const props = defineProps({
  variant: {
    type: String,
    default: 'active',
    validator: (value: string) => ['active', 'deleted', 'requested'].includes(value),
  },
})

const authStore = useAuthStore()
type VariantKey = keyof typeof VARIANT_DEFINITIONS

const VARIANT_DEFINITIONS = {
  active: {
    label: () => $trans('Member'),
    filters: (isSuperuser: boolean) =>
      isSuperuser ? {is_requested: false, is_deleted: false} : {},
  },
  deleted: {
    label: () => $trans('Deleted member'),
    filters: () => ({is_deleted: true}),
  },
  requested: {
    label: () => $trans('Requested member'),
    filters: () => ({is_requested: true}),
  },
} as const

const variantDefinition = computed(() => VARIANT_DEFINITIONS[props.variant as VariantKey])
const variantLabel = computed(() => variantDefinition.value.label())

// ── columns ─────────────────────────────────────────────────────────────────

type MemberRow = NonNullable<PaginatedMemberList['results']>[number]

const columnHelper = createAppColumnHelper<MemberRow>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'member_logo',
    header: '',
    meta: {width: '20%'},
    cell: (info) => h('img', {src: info.row.original.companylogo ?? undefined, width: 100, alt: ''}),
  }),
  // The original screen's composite member_info cell, mirrored verbatim: one
  // router-link per member wrapping the companycode (+ private marker), the
  // name, the address line and the email, then the two bold flags. A pure
  // display column — there is no single backing field, so it neither sorts
  // nor filters; free text over companycode/name/city belongs to the
  // toolbar's q search, which reaches the same three fields.
  columnHelper.display({
    id: 'member_info',
    header: $trans('Member'),
    meta: {width: '20%'},
    cell: (info) => {
      const row = info.row.original
      return h(RouterLink, {
        to: {name: 'member-edit', params: {pk: row.id}},
      }, () => [
        `${$trans('Companycode')}: ${row.companycode} `,
        row.is_public ? null : `(${$trans('private')}) `,
        h('br'),
        `${$trans('Name')}: ${row.name}`,
        h('br'),
        `${row.country_code ?? ''}-${row.postal ?? ''} ${row.city ?? ''}`,
        h('br'),
        `${row.email ?? ''}`,
        h('br'),
        row.has_api_users ? h('p', [h('strong', $trans('Has API users'))]) : null,
        row.has_branches ? h('p', [h('strong', $trans('Has branches'))]) : null,
      ])
    },
  }),
  // Derived display string (the serializer's get_contract_text), like the
  // original: no model column behind it, so the backend can neither sort nor
  // filter it — sending ordering=contract_text would be silently dropped by
  // the allow-list, so the column stays non-sortable and gets no filter.
  columnHelper.accessor('contract_text', {
    header: $trans('Contract'),
    enableSorting: false,
    meta: {width: '30%'},
  }),
  // No column filter: the previous screen could not narrow on type either,
  // and a filter row holding one lonely select under an otherwise empty row
  // is worse than no filter row at all (ServerDataTable drops the row when
  // no column takes a filter).
  columnHelper.accessor('member_type', {
    header: $trans('Type'),
    enableColumnFilter: false,
    meta: {width: '10%'},
  }),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    meta: {width: '10%'},
  }),
  columnHelper.display({
    id: 'icons',
    header: '',
    meta: {width: '10%'},
    cell: (info) => h('div', {class: 'h2 float-end'}, [
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => showDeleteModal(info.row.original.id),
      }),
    ]),
  }),
])

// ── the engine: state + wire query + query ──────────────────────────────────

type MemberListQueryParams = NonNullable<MemberMemberListData['query']>

const paged = useServerPagedList<MemberRow>({
  listOptions: (query) => memberMemberListOptions({
    query: {
      ...variantDefinition.value.filters(authStore.isSuperuser),
      // One cast at the wire seam: the engine's ordering is string[], while
      // the generated client narrows it to the schema's enum (the backend's
      // MEMBER_ORDERING_PARAMETER allow-list). The column filters need no
      // mapping: they ride the shared bare-name grammar (the backend's
      // filter kind decides the lookup).
      ...query,
    } as MemberListQueryParams,
  }),
  getRowId: (row: MemberRow) => String(row.id),
  loadError: $trans('Error loading members'),
})

const table = useAppTable({
  key: 'member-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

// ── delete flow ─────────────────────────────────────────────────────────────

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: memberMemberDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: memberMemberListQueryKey()}),
  copy: {
    deletedDetail: $trans('Member has been deleted'),
    deleteError: $trans('Error deleting member'),
  },
})
</script>
