<template>
  <div class="mt-4">
    <b-modal
      id="delete-module-part-modal"
      ref="deleteModal"
      :title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this module part?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <div v-if="!isLoading" class="my24-pagination">
        <span class="count-section">
          {{ $trans('Module part') }}
          <strong><b>{{ currentItemsStart }}</b> - <b>{{ currentItemsEnd }}</b></strong>
          / {{ count }}
        </span>
        <br>
        <span class="pagination-section">
          <b-pagination
            v-if="count > PER_PAGE"
            class="pt-4"
            :model-value="page"
            :total-rows="count"
            :per-page="PER_PAGE"
            aria-controls="module-part-table"
            @update:model-value="goToPage"
          ></b-pagination>
        </span>
      </div>

      <b-table
        id="module-part-table"
        small
        :busy="isLoading"
        :fields="fields"
        :items="moduleParts"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkAdd
                  router_name="module-part-add"
                  :title="$trans('New module part')"
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
        <template #cell(is_always_selected)="data">
          <IBiCheckSquare v-if="data.item.is_always_selected"></IBiCheckSquare>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="module-part-edit"
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
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  memberModulePartDestroyMutation,
  memberModulePartListOptions,
} from '@/api/@tanstack/vue-query.gen'
import SearchModal from '@/components/SearchModal.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import { invalidateModulePartListQueries } from './list-invalidation'
import { errorToast, infoToast, $trans } from '@/utils'

/**
 * The Module Part list — the tracer-bullet Slice's first screen (#321).
 *
 * Reads go through the generated query options; the delete goes through the
 * generated mutation and invalidates the list queries on success. The screen
 * holds no state of its own: page and search term are read from the route and
 * folded into the query key reactively, so a navigation re-fetches. In the
 * application TheAppLayout also remounts the view on every route change
 * (`:key="$route.fullPath"`); watching the key here keeps the behaviour the
 * same whether or not that remount happens.
 */

defineOptions({ name: 'ModulePartList' })

const PER_PAGE = 20

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const { create } = useToast()

const searchModal = useTemplateRef('searchModal')
const deleteModal = useTemplateRef('deleteModal')

const page = computed(() => Number(route.query.page) || 1)
const searchQuery = computed(() =>
  typeof route.query.q === 'string' && route.query.q !== '' ? route.query.q : undefined,
)

const listOptions = computed(() =>
  memberModulePartListOptions({
    query: { page: page.value, ...(searchQuery.value ? { q: searchQuery.value } : {}) },
  }),
)
const listQuery = useQuery(listOptions)

watch(
  () => listQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading module parts'))
  },
)

const isLoading = computed(() => listQuery.isLoading.value)
const moduleParts = computed(() => listQuery.data.value?.results ?? [])
const count = computed(() => listQuery.data.value?.count ?? 0)

const currentItemsStart = computed(() => {
  if (count.value <= PER_PAGE) return count.value > 0 ? 1 : 0
  return (page.value - 1) * PER_PAGE + 1
})
const currentItemsEnd = computed(() => {
  if (count.value <= PER_PAGE) return count.value
  return Math.min(page.value * PER_PAGE, count.value)
})

const fields = [
  {key: 'name', label: $trans('Name'), thAttr: {width: '30%'}, sortable: true},
  {key: 'module_name', label: $trans('Module'), thAttr: {width: '20%'}, sortable: true},
  {key: 'is_always_selected', label: $trans('Always selected?'), thAttr: {width: '20%'}, sortable: true},
  {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}, sortable: true},
  {key: 'modified', label: $trans('Modified'), thAttr: {width: '10%'}, sortable: true},
  {key: 'icons', thAttr: {width: '10%'}},
]

// search
function handleSearchOk(val: string | null) {
  searchModal.value?.hide()

  // The term lives in the URL from the moment it is searched, so it survives a
  // page change by construction. A blank search clears an existing term, and a
  // new term restarts at page one — so both `page` and any previous `q` go.
  const {page: _page, q: _q, ...rest} = route.query
  router.push({
    query: {
      ...rest,
      ...(val ? {q: val} : {}),
    },
  })
}

function showSearchModal() {
  searchModal.value?.show()
}

// pagination
async function goToPage(target: number | string) {
  await router.push({query: {...route.query, page: String(target)}})
}

// delete
const deletingPk = ref<number | null>(null)

const deleteMutation = useMutation({
  ...memberModulePartDestroyMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Deleted'), $trans('Module part has been deleted'))
    await invalidateModulePartListQueries(queryClient)
  },
  onError: () => {
    errorToast(create, $trans('Error deleting module part'))
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
