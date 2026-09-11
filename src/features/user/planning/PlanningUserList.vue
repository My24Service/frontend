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
      :title="$trans('People')"
      :search-label="$trans('Search planning users')"
      :refresh="refresh"
      :empty-text="$trans('No planning users found')"
      :label="$trans('Planning user')"
      :delete-modal="{
        modalId: 'delete-planning-user-modal',
        confirmText: $trans('Are you sure you want to delete this planning user?'),
        destroyMutation: companyPlanninguserDestroyMutation,
        invalidate: (queryClient) => queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()}),
        deletedDetail: $trans('planning user has been deleted'),
        deleteError: $trans('Error deleting planning user'),
      }"
    >
      <template #icon><IBiPeople></IBiPeople></template>
      <template #add>
        <router-link
          :to="{name: addRoute}"
          class="btn btn-primary"
        >
          <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add planner") }}
        </router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import {
  companyPlanninguserDestroyMutation,
  companyPlanninguserListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { CompanyPlanninguserListData, PaginatedPlanningUserList } from '@/api/types.gen'
import { $trans } from '@/services/i18n'
import { companyPlanninguserListQueryKey } from '@/api/@tanstack/vue-query.gen'
import {
  ServerTable,
  baseListParams,
  createActionColumn,
  createAppColumnHelper,
  useServerTable,
  type ListRow,
} from '@/features/table'
import { createUserColumns } from '../user-list-columns'

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

type PlanningUserRow = ListRow<PaginatedPlanningUserList>

// The screen's handle on the table: the icon column calls the delete modal
// through it, before this ref is populated.
const tableRef = ref<{showDeleteModal: (id: number) => void} | null>(null)

const columnHelper = createAppColumnHelper<PlanningUserRow>()

const userColumns = createUserColumns(columnHelper, {
  nameRoute: editRoute,
  widths: {name: '25%', username: '20%', email: '20%', lastLogin: '15%', dateJoined: '10%'},
})

const columns = columnHelper.columns([
  userColumns.name,
  userColumns.username,
  userColumns.email,
  userColumns.lastLogin,
  userColumns.dateJoined,
  createActionColumn(columnHelper, {
    onDelete: (id) => tableRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type PlanningUserListQueryParams = NonNullable<CompanyPlanninguserListData['query']>

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<PlanningUserRow>({
  key: 'planning-user-table',
  columns,
  listOptions: (query) => companyPlanninguserListOptions({
    query: {
      ...baseListParams(query),
    } as PlanningUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading planning users'),
})
</script>
