<template>
  <div class="app-page">
    <b-modal
      id="delete-member-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this member?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>{{ $trans("Members") }} — TanStack Table PROTOTYPE</h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
          </BButton-group>
          <input
            v-model="searchDraft"
            class="form-control form-control-sm w-auto mr-2"
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
        </BButton-toolbar>
      </div>
    </header>

    <!-- PROTOTYPE: state surface. Shows what the table state is and what
         wire query it maps to; deleted with the experiment. -->
    <div class="panel p-2 mb-2 small text-muted prototype-state">
      PROTOTYPE STATE —
      sorting: <code>{{ sorting.length ? JSON.stringify(sorting) : '—' }}</code>,
      filters: <code>{{ columnFilters.length ? JSON.stringify(columnFilters) : '—' }}</code>,
      q: <code>"{{ globalFilter }}"</code>,
      page: <code>{{ pagination.pageIndex + 1 }}/{{ Math.max(table.getPageCount(), 1) }} × {{ pagination.pageSize }}</code>
      <br/>
      wire: <code>?{{ wireString }}</code>
    </div>

    <div class="app-detail panel overflow-auto">
      <div class="data-table">
        <ServerDataTable
          :table="table"
          :is-loading="isLoading"
          empty-text="No members found"
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
import type { MemberMemberListData, MemberTypeEnum, PaginatedMemberList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { useAuthStore } from '@/stores/auth'
import { invalidateMemberListQueries } from './list-invalidation'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

/**
 * PROTOTYPE — throwaway for the TanStack Table experiment. Answers one
 * question: does `@tanstack/vue-table` (v9) on top of the generated
 * vue-query client give the Member list better server-side search, sorting
 * and column filtering than the bootstrap-vue-next `<b-table>`, for an
 * amount of code we are willing to own? Delete with the verdict.
 *
 * The screen is now only its own remainder: the variant definitions, the
 * column definitions and the two resource-specific mappings (variant
 * filters, column-filter → `<field>__<lookup>` params). Everything shared —
 * the table state, the wire query, the query itself, the delete flow, the
 * markup — lives in `src/features/table/` (promoted out of this Slice when
 * the Customer list prototype became the kit's second consumer):
 * `table.ts` (the shared `createTableHook` kit), `server-paged-list.ts`
 * (state + query engine), `use-list-delete.ts` and the two presentational
 * components.
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
    cell: (info) => h('img', {src: info.row.original.companylogo ?? undefined, width: 100, alt: ''}),
  }),
  columnHelper.accessor('companycode', {
    header: $trans('Companycode'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
    // The companycode opens the member's form, as the legacy screen's
    // member_info cell did for the whole composite cell.
    cell: (info) => h(RouterLink, {
      to: {name: 'member-edit', params: {pk: info.row.original.id}},
    }, () => info.getValue()),
  }),
  columnHelper.accessor('name', {header: $trans('Name')}),
  columnHelper.accessor('city', {
    header: $trans('City'),
    filterFn: 'includesString',
    enableColumnFilter: true,
    meta: {filterVariant: 'text'},
  }),
  columnHelper.accessor('member_type', {
    header: $trans('Type'),
    filterFn: 'equalsString',
    enableColumnFilter: true,
    meta: {
      filterVariant: 'select',
      selectOptions: [
        {value: 'maintenance', label: 'maintenance'},
        {value: 'temps', label: 'temps'},
      ],
    },
  }),
  columnHelper.accessor('created', {header: $trans('Created')}),
  columnHelper.display({
    id: 'icons',
    header: '',
    cell: (info) => h('div', {class: 'h2 float-right'}, [
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
      // MEMBER_ORDERING_PARAMETER allow-list).
      ...query,
    } as MemberListQueryParams,
  }),
  columnFilterParam: (id, value) => {
    if (id === 'companycode') return {companycode__icontains: value}
    if (id === 'city') return {city__icontains: value}
    if (id === 'member_type') return {member_type: value as MemberTypeEnum}
    return null
  },
  getRowId: (row: MemberRow) => String(row.id),
  loadError: $trans('Error loading members'),
})

const table = useAppTable({
  key: 'member-table',
  columns,
  ...paged.tableOptions,
})

// Top-level refs so the template unwraps them.
const {searchDraft, pagination, sorting, columnFilters, globalFilter, wireQuery, isLoading, isFetching, count, refresh} = paged

/** The exact query string the client sends — for the state surface above. */
const wireString = computed(() => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(wireQuery.value)) {
    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  return params.toString()
})

// ── delete flow ─────────────────────────────────────────────────────────────

const {deleteModal, showDeleteModal, doDelete} = useListDelete({
  destroyMutation: memberMemberDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateMemberListQueries(queryClient),
  copy: {
    deletedDetail: $trans('Member has been deleted'),
    deleteError: $trans('Error deleting member'),
  },
})
</script>
