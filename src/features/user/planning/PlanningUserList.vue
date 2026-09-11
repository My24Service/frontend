<template>
  <div class="app-page">
    <ListDeleteModal
      ref="deleteModalRef"
      modal-id="delete-planning-user-modal"
      :confirm-text="$trans('Are you sure you want to delete this planning user?')"
      :destroy-mutation="companyPlanninguserDestroyMutation"
      :invalidate="(queryClient) => queryClient.invalidateQueries({queryKey: companyPlanninguserListQueryKey()})"
      :deleted-detail="$trans('planning user has been deleted')"
      :delete-error="$trans('Error deleting planning user')"
    />

    <ListPageHeader
      v-model:search-draft="searchDraft"
      :title="$trans('People')"
      :search-label="$trans('Search planning users')"
      :refresh="refresh"
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
    </ListPageHeader>

    <div class="page-details panel">
      <ListTablePanel
        :table="table"
        :pagination="pagination"
        :count="count"
        :is-loading="isLoading"
        :is-fetching="isFetching"
        :empty-text="$trans('No planning users found')"
        :label="$trans('Planning user')"
      />
    </div>
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
import { createAppColumnHelper, useAppTable } from '@/features/table/table'
import { baseListParams, useServerPagedList } from '@/features/table/server-paged-list'
import ListPageHeader from '@/features/table/ListPageHeader.vue'
import ListTablePanel from '@/features/table/ListTablePanel.vue'
import ListDeleteModal from '@/features/table/ListDeleteModal.vue'
import { createActionColumn, type ListRow } from '@/features/table/list-columns'
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

const deleteModalRef = ref<InstanceType<typeof ListDeleteModal> | null>(null)

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
    onDelete: (id) => deleteModalRef.value?.showDeleteModal(id),
    width: '10%',
  }),
])

type PlanningUserListQueryParams = NonNullable<CompanyPlanninguserListData['query']>

const paged = useServerPagedList<PlanningUserRow>({
  listOptions: (query) => companyPlanninguserListOptions({
    query: {
      ...baseListParams(query),
    } as PlanningUserListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading planning users'),
})

const table = useAppTable({
  key: 'planning-user-table',
  columns,
  ...paged.tableOptions,
})

const {searchDraft, pagination, isLoading, isFetching, count, refresh} = paged
</script>
