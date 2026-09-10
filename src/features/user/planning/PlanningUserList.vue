<template>
  <div class="app-page">
    <b-modal
      id="delete-planning-user-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok.prevent="handleDeleteOk"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this planning user?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3><IBiPeople></IBiPeople>{{ $trans("People") }}</h3>
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
            :aria-label="$trans('Search planning users')"
            :placeholder="$trans('Search planning users')"
          />
          <router-link
            :to="{name: addRoute}"
            class="btn btn-primary"
          >
            <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add planner") }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="page-details panel">
      <div class="app-detail panel overflow-auto">
        <div class="data-table">
          <ServerDataTable
            :table="table"
            :is-loading="isLoading"
            :empty-text="$trans('No planning users found')"
          />
        </div>
      </div>
    </div>

    <ServerTablePagination
      v-if="!isLoading"
      :table="table"
      :pagination="pagination"
      :count="count"
      :label="$trans('Planning user')"
      :is-fetching="isFetching"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, h } from 'vue'
import { RouterLink } from 'vue-router'

import {
  companyPlanninguserDestroyMutation,
  companyPlanninguserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyPlanninguserListData, PaginatedPlanningUserList } from '@/api/types.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import { $trans } from '@/utils'
import { companyPlanninguserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import { useListDelete } from '@/features/table/use-list-delete'
import ServerDataTable from '@/features/table/ServerDataTable.vue'
import ServerTablePagination from '@/features/table/ServerTablePagination.vue'

const props = withDefaults(defineProps<{
  fromSettings?: boolean
}>(), {
  fromSettings: false,
})

// The list mounts twice — under /company and under /settings — and each tree
// has its own add/edit route names. The legacy list switched them with
// linkAdd/linkEdit computeds; the converted screen keeps that prop contract
// so both routers mount the same component.
const addRoute = computed(() => props.fromSettings ? 'settings-planninguser-add' : 'planninguser-add')
const editRoute = computed(() => props.fromSettings ? 'settings-planninguser-edit' : 'planninguser-edit')

type PlanningUserRow = NonNullable<PaginatedPlanningUserList['results']>[number]

const columnHelper = createAppColumnHelper<PlanningUserRow>()

const columns = columnHelper.columns([
  columnHelper.accessor('full_name', {
    header: $trans('Name'),
    // The planning-user list endpoint declares no `ordering` parameter, so
    // the backend would silently drop a sort the wire carried — the column
    // stays non-sortable rather than sending a parameter nothing honours.
    enableSorting: false,
    meta: {width: '25%'},
    cell: (info) => h(RouterLink, {
      to: {name: editRoute.value, params: {pk: info.row.original.id}},
    }, () => info.row.original.full_name),
  }),
  columnHelper.accessor('username', {meta: {width: '20%'}, header: $trans('Username'), enableSorting: false}),
  columnHelper.accessor('email', {meta: {width: '20%'}, header: $trans('Email'), enableSorting: false}),
  columnHelper.accessor('last_login', {meta: {width: '15%'}, header: $trans('Last login'), enableSorting: false}),
  columnHelper.accessor('date_joined', {meta: {width: '10%'}, header: $trans('Date joined'), enableSorting: false}),
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

type PlanningUserListQueryParams = NonNullable<CompanyPlanninguserListData['query']>

const paged = useServerPagedList<PlanningUserRow>({
  listOptions: (query) => companyPlanninguserListOptions({
    query: {
      ...baseListParams(query),
    } as PlanningUserListQueryParams,
  }),
  getRowId: (row: PlanningUserRow) => String(row.id),
  loadError: $trans('Error loading planning users'),
})

const table = useAppTable({
  key: 'planning-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged

const {deleteModal, showDeleteModal, handleDeleteOk} = useListDelete({
  destroyMutation: companyPlanninguserDestroyMutation,
  invalidateAfterDelete: (queryClient) => queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()}),
  copy: {
    deletedDetail: $trans('planning user has been deleted'),
    deleteError: $trans('Error deleting planning user'),
  },
})
</script>
