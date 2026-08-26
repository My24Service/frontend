<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="searchModal"
      @do-search="handleSearchOk"
    />

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
        <h3>
          {{ $trans("Members") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">
            <ButtonLinkRefresh
              :method="refresh"
              :title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              :method="showSearchModal"
            />
          </BButton-group>
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

      <div class="overflow-auto">
        <b-table
          id="member-table"
          small
          :busy="isLoading"
          :fields="fields"
          :items="members"
          responsive="md"
          class="data-table"
          sort-icon-left
        >
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(member_logo)="data">
            <img :src="data.item.companylogo ?? undefined" width="100" alt=""/>
          </template>
          <template #cell(member_info)="data">
            <router-link :to="{name: 'member-edit', params: {pk: data.item.id}}">
              {{ $trans('Companycode') }}: {{ data.item.companycode }} <span v-if="!data.item.is_public">({{ $trans('private') }})</span> <br/>
              {{ $trans('Name') }}: {{ data.item.name }}<br/>
              {{ data.item.country_code }}-{{ data.item.postal }} {{ data.item.city }}<br/>
              {{ data.item.email }}<br/>
              <p v-if="data.item.has_api_users">
                <strong>{{ $trans('Has API users') }}</strong>
              </p>
              <p v-if="data.item.has_branches">
                <strong>{{ $trans('Has branches') }}</strong>
              </p>
            </router-link>
          </template>
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <IconLinkDelete
                :title="$trans('Delete')"
                v-bind:method="function() { showDeleteModal(data.item.id) }"
              />
            </div>
          </template>
        </b-table>
      </div>
    </div>

    <ListPagination
      v-if="!isLoading"
      :count="count"
      :label="variantLabel"
      controls-id="member-table"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import {
  memberMemberDestroyMutation,
  memberMemberListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { PaginatedMemberList } from '@/api/types.gen'
import SearchModal from '@/components/SearchModal.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ListPagination from '../ListPagination.vue'
import { usePagedListScreen } from '../paged-list-screen'
import { invalidateMemberListQueries } from './list-invalidation'
import { useAuthStore } from '@/stores/auth'
import { $trans } from '@/utils'

/**
 * The Member list, in all three of its variants (#324).
 *
 * The legacy screen took two independent booleans from three route
 * definitions; two booleans encode four states, one of them meaningless. The
 * They are now a single `variant`, and each folds its own filter into the
 * query key — distinct cache entries, so switching variants can never show a
 * stale or foreign set. That collapse is the ticket's declared behaviour
 * change (#324); the URLs did not move.
 *
 * The active variant keeps its characterised asymmetry: a superuser asks for
 * "no deleted, no requested" explicitly, while a plain staff user sends no
 * filter at all — the backend's filterset applies only when a parameter is
 * present (source/apps/member/views.py:143-149), so staff see soft-deleted
 * members on this variant. Characterised, not endorsed.
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

/** Everything the three variants differ in, in one place. */
const VARIANT_DEFINITIONS = {
  active: {
    label: () => $trans('Member'),
    // A superuser narrows explicitly; a plain staff user does not, which is
    // why their list shows soft-deleted rows too.
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

/**
 * The filter this variant asks the backend for, on top of page and search.
 *
 * Real booleans, because the generated client validates the query against the
 * request schema before anything goes out. The recordings spell these
 * Django-style (`False`) because the legacy screen hand-built its URLs; the
 * typed client sends lowercase, and that casing difference is a declared
 * exception on #324 — the backend's filterset reads both.
 */
const variantDefinition = computed(() => VARIANT_DEFINITIONS[props.variant as VariantKey])

const {
  searchModal,
  deleteModal,
  isLoading,
  items: members,
  count,
  showSearchModal,
  handleSearchOk,
  showDeleteModal,
  doDelete,
  refresh,
} = usePagedListScreen<PaginatedMemberList>({
  listOptions: (query) =>
    memberMemberListOptions({
      query: {
        ...variantDefinition.value.filters(authStore.isSuperuser),
        ...query,
      },
    }),
  destroyMutation: memberMemberDestroyMutation,
  invalidateAfterDelete: (queryClient) => invalidateMemberListQueries(queryClient),
  copy: {
    loadError: $trans('Error loading members'),
    deletedDetail: $trans('Member has been deleted'),
    deleteError: $trans('Error deleting member'),
  },
})

const variantLabel = computed(() => variantDefinition.value.label())

const fields = [
  {key: 'member_logo', label: '', thAttr: {width: '20%'}},
  {key: 'member_info', label: $trans('Member'), thAttr: {width: '20%'}},
  {key: 'contract_text', label: $trans('Contract'), thAttr: {width: '30%'}},
  {key: 'member_type', label: $trans('Type'), thAttr: {width: '10%'}},
  {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}},
  {key: 'icons', thAttr: {width: '10%'}},
]
</script>
