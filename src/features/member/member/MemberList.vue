<template>
  <div class="app-page">
    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :page-details="false"
      :title="$trans('Members')"
      :search-label="$trans('Search name, companycode or city')"
      :refresh="refresh"
      :empty-text="$trans('No members found')"
      :label="variantLabel"
      :delete-modal="{
        modalId: 'delete-member-modal',
        confirmText: $trans('Are you sure you want to delete this member?'),
        destroyMutation: memberMemberDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: memberMemberListQueryKey()}),
        deletedDetail: $trans('Member has been deleted'),
        deleteError: $trans('Error deleting member'),
      }"
    >
      <template #add>
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
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import {
  memberMemberDestroyMutation,
  memberMemberListOptions,
  memberMemberListQueryKey,
} from '@/api/@tanstack/vue-query.gen'
import type { MemberMemberListData, PaginatedMemberList } from '@/api/types.gen'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'

const props = withDefaults(defineProps<{
  variant?: 'active' | 'deleted' | 'requested'
}>(), {
  variant: 'active',
})

const authStore = useAuthStore()

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated. Typed structurally because
// ServerTable is generic over the row type.
const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')

const VARIANT_DEFINITIONS = {
  active: {
    label: () => $trans('Member'),
    // Backend excludes soft-deleted/requested unless explicitly asked,
    // so the active variant sends no filters for any role.
    filters: () => ({}),
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

const variantDefinition = computed(() => VARIANT_DEFINITIONS[props.variant] ?? VARIANT_DEFINITIONS.active)
const variantLabel = computed(() => variantDefinition.value.label())

type MemberRow = ListRow<PaginatedMemberList>

const columnHelper = createAppColumnHelper<MemberRow>()

const columns = columnHelper.columns([
  columnHelper.display({
    id: 'member_logo',
    header: '',
    meta: {width: '20%'},
    cell: (info) => h('img', {src: info.row.original.companylogo ?? undefined, width: 100, alt: ''}),
  }),
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
  columnHelper.accessor('member_type', {
    header: $trans('Type'),
    enableColumnFilter: false,
    meta: {width: '10%'},
  }),
  columnHelper.accessor('created', {
    header: $trans('Created'),
    meta: {width: '10%'},
  }),
  // Delete-only, like before: the row's member_info cell already links to the
  // edit form, so there is no edit icon and no editRoute.
  createActionColumn(columnHelper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type MemberListQueryParams = NonNullable<MemberMemberListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<MemberRow>({
  key: 'member-table',
  columns,
  listOptions: (query) => memberMemberListOptions({
    query: {
      ...variantDefinition.value.filters(),
      ...baseListParams(query),
    } as MemberListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading members'),
})
</script>
