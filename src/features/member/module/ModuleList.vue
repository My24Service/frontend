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

    <ListPagination
      v-if="!isLoading"
      :count="count"
      :label="$trans('Module')"
      controls-id="module-table"
    />
  </div>
</template>

<script lang="ts" setup>
import {
  memberModuleDestroyMutation,
  memberModuleListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedModuleList } from '@/api/types.gen'
import SearchModal from '@/components/SearchModal.vue'
import ListPagination from '../ListPagination.vue'
import { usePagedListScreen } from '../paged-list-screen'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import { invalidateModuleListQueries } from './list-invalidation'
import { $trans } from '@/utils'

/**
 * The Module list — the tracer bullet's list pattern applied to a second
 * resource (#322).
 *
 * Reads go through the generated query options; the delete goes through the
 * generated mutation and invalidates the list queries on success. Page and
 * search term are read from the route and folded into the query key
 * reactively, so a navigation re-fetches whether or not TheAppLayout's
 * `:key="$route.fullPath"` remount happens. The screen skeleton around the
 * table is the Slice's shared `usePagedListScreen`; what remains here is this
 * resource's factories, invalidation helper, copy and columns.
 */

const {
  searchModal,
  deleteModal,
  isLoading,
  items: modules,
  count,
  showSearchModal,
  handleSearchOk,
  showDeleteModal,
  doDelete,
  refresh,
} = usePagedListScreen<PaginatedModuleList>({
  listOptions: (query) => memberModuleListOptions({ query }),
  destroyMutation: memberModuleDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateModuleListQueries(queryClient),
  copy: {
    loadError: $trans('Error loading modules'),
    deletedDetail: $trans('Module has been deleted'),
    deleteError: $trans('Error deleting module'),
  },
})

const fields = [
  {key: 'name', label: $trans('Name'), thAttr: {width: '70%'}, sortable: true},
  {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}, sortable: true},
  {key: 'modified', label: $trans('Modified'), thAttr: {width: '10%'}, sortable: true},
  {key: 'icons', thAttr: {width: '10%'}},
]
</script>
