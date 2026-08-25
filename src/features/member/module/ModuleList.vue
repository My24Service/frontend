<template>
  <div class="mt-4">
    <b-modal
      id="delete-module-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <ListPagination
        v-if="!isLoading"
        :count="count"
        :label="$trans('Module')"
        controls-id="module-table"
      />

      <b-table
        id="module-table"
        small
        :busy="isLoading"
        :fields="fields"
        :items="modules"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkAdd
                  router_name="module-add"
                  :title="$trans('New module')"
                />
                <ButtonLinkRefresh
                  :method="refresh"
                  :title="$trans('Refresh')"
                />
                <ButtonLinkSearch
                  :method="showSearchModal"
                />
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="module-edit"
              v-bind:router_params="{pk: data.item.id}"
              :title="$trans('Edit')"
            />
            <IconLinkDelete
              :title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, useTemplateRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  memberModuleDestroyMutation,
  memberModuleListOptions,
} from '@/api/@tanstack/vue-query.gen'
import SearchModal from '@/components/SearchModal.vue'
import ListPagination from '../ListPagination.vue'
import { useRoutePagedList } from '../route-paged-list'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import { invalidateModuleListQueries } from './list-invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Module list — the tracer bullet's list pattern applied to a second
 * resource (#322).
 *
 * Reads go through the generated query options; the delete goes through the
 * generated mutation and invalidates the list queries on success. Page and
 * search term are read from the route and folded into the query key
 * reactively, so a navigation re-fetches whether or not TheAppLayout's
 * `:key="$route.fullPath"` remount happens.
 */

defineOptions({ name: 'ModuleList' })

const queryClient = useQueryClient()
const { create } = useToast()

const {page, searchQuery, handleSearchTerm, goToPage} = useRoutePagedList()

const searchModal = useTemplateRef('searchModal')
const deleteModal = useTemplateRef('deleteModal')

const listOptions = computed(() =>
  memberModuleListOptions({
    query: { page: page.value, ...(searchQuery.value ? { q: searchQuery.value } : {}) },
  }),
)
const listQuery = useQuery(listOptions)

watch(
  () => listQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading modules'))
  },
)

const isLoading = computed(() => listQuery.isLoading.value)
const modules = computed(() => listQuery.data.value?.results ?? [])
const count = computed(() => listQuery.data.value?.count ?? 0)

const fields = [
  {key: 'name', label: $trans('Name'), thAttr: {width: '70%'}, sortable: true},
  {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}, sortable: true},
  {key: 'modified', label: $trans('Modified'), thAttr: {width: '10%'}, sortable: true},
  {key: 'icons', thAttr: {width: '10%'}},
]

// search
function handleSearchOk(val: string | null) {
  searchModal.value?.hide()
  handleSearchTerm(val)
}

function showSearchModal() {
  searchModal.value?.show()
}

// delete
const deletingPk = ref<number | null>(null)

const deleteMutation = useMutation({
  ...memberModuleDestroyMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Deleted'), $trans('Module has been deleted'))
    await invalidateModuleListQueries(queryClient)
  },
  onError: () => {
    errorToast(create, $trans('Error deleting module'))
  },
})

function showDeleteModal(id: number) {
  deletingPk.value = id
  deleteModal.value?.show()
}

async function doDelete() {
  if (deletingPk.value === null || deleteMutation.isPending.value) return
  try {
    await deleteMutation.mutateAsync({path: {id: deletingPk.value}})
  } catch {
    // Already handled: onError told the user and left the row in place.
  }
}

// refresh
function refresh() {
  listQuery.refetch()
}
</script>
