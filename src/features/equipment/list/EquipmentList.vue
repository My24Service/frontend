<template>
  <div class="app-page">
    <b-modal
      id="add-state-modal"
      ref="addStateModal"
      :title="$trans('Add state')"
      @ok.prevent="addState"
    >
      <form>
        <b-container>
          <b-row>
            <b-col cols="7">
              <BFormGroup
                :label="$trans('State')"
                label-for="add-state-state"
              >
                <BFormInput
                  id="add-state-state"
                  v-model="state.state"
                  size="sm"
                />
              </BFormGroup>
            </b-col>
            <b-col cols="5">
              <BFormGroup
                :label="$trans('Lifespan')"
                label-for="add-state-replace_months"
              >
                <BFormInput
                  id="add-state-replace_months"
                  v-model="state.replace_months"
                  size="sm"
                />
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Equipment')"
      :search-label="$trans('Search equipment')"
      :label="$trans('Equipment')"
      :empty-text="$trans('No equipment found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-equipment-modal',
        confirmText: $trans('Are you sure you want to delete this equipment?'),
        destroyMutation: equipmentEquipmentDestroyMutation,
        invalidate: invalidateEquipmentList,
        deletedDetail: $trans('Equipment has been deleted'),
        deleteError: $trans('Error deleting equipment'),
      }"
    >
      <template #icon><IBiTools /></template>
      <template #toolbar-extra>
        <ButtonLinkDownload
          :method="downloadList"
          :title="$trans('Download QR-codes')"
        />
      </template>
      <template #add>
        <router-link
          v-if="from_settings || !hasBranches"
          :to="{name: `${route_prefix}-add`}"
          class="btn btn-primary"
        >{{ $trans('Add Equipment') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { h, reactive, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import IBiTools from '~icons/bi/tools'
import {
  equipmentEquipmentDestroyMutation,
  equipmentEquipmentListOptions,
  equipmentEquipmentStateCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { EquipmentEquipmentListData, EquipmentTypeEnum, PaginatedEquipmentList } from '@/api/types.gen'
import ButtonLinkDownload from '@/components/ButtonLinkDownload.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import { EQUIPMENT_TYPES } from '@/constants'
import { useAuthStore } from '@/features/auth/store'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import my24 from '@/services/my24'
import { useMainStore } from '@/stores/main'
import { invalidateEquipmentList } from './invalidation'

const props = withDefaults(defineProps<{
  /** Mounted by the settings layout, which adds the row actions and the add link. */
  from_settings?: boolean
  /** The route name stem this mount answers to (`equipment-equipment`, `settings-equipment`, ...). */
  route_prefix: string
  /** The equipment type the address asked for; the router's path carries it. */
  type?: EquipmentTypeEnum
}>(), {
  from_settings: false,
  type: EQUIPMENT_TYPES.TECHNICAL,
})

type EquipmentRow = ListRow<PaginatedEquipmentList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const addStateModal = useTemplateRef<{show: () => void, hide: () => void}>('addStateModal')

// Read once, as the legacy screen read them in `created()`: the member's branch
// setting and the user's role do not change while a list is mounted, and the
// column set is structural rather than per row.
const hasBranches = useMainStore().getMemberHasBranches
const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles are the ones that see neither the owner column nor
// the brand column.
const planning = !authStore.isEmployee && !authStore.isCustomer

const helper = createAppColumnHelper<EquipmentRow>()

// The owner column is the only difference between the customer and branch
// variants. It is also the one cell that links on a foreign key - the row's
// `customer`/`branch` - rather than on the row's own id.
function ownerColumn(key: 'customer' | 'branch', routeName: string) {
  return helper.display({
    id: key,
    header: key === 'customer' ? $trans('Customer') : $trans('Branch'),
    cell: ({row}) => {
      const owner = row.original.customer_branch_view
      if (!owner) return ''
      const label = `${owner.name} - ${owner.city}`
      // The FK is nullable in the generated type, and a <router-link> with a
      // null param cannot resolve at all - it throws while the row renders.
      // The legacy screen linked unconditionally and would have thrown here;
      // the label is what the user needs, so it stays as plain text.
      const ownerId = row.original[key]
      if (ownerId == null) return label
      return h(RouterLink, {to: {name: routeName, params: {pk: ownerId}}}, () => label)
    },
  })
}

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Equipment'),
    cell: ({row}) => h(RouterLink, {
      to: hasBranches
        ? {name: `${props.route_prefix}-view-${props.type}`, params: {pk: row.original.id}}
        : {name: `${props.route_prefix}-view`, params: {pk: row.original.id}},
    }, () => row.original.name),
  }),
  ...(planning && hasBranches ? [ownerColumn('branch', 'company-branch-view')] : []),
  ...(planning && !hasBranches ? [ownerColumn('customer', 'customer-view')] : []),
  // `name`, `brand` and `num_orders` are each in the endpoint's ordering
  // allow-list, so they sort on the wire. `customer` and `branch` are not, so
  // those headers stay unsortable rather than sending an `ordering` term the
  // contract does not admit - the legacy screen sorted on them through the
  // older `sort_field` contract, which took any column name.
  ...(planning ? [helper.accessor('brand', {header: $trans('Brand')})] : []),
  helper.accessor('location_name', {header: $trans('Location')}),
  // State is the row's latest child record, not a column: nothing to sort or
  // filter on.
  helper.display({
    id: 'latest_state',
    header: $trans('State'),
    cell: ({row}) => {
      const latest = row.original.latest_state
      if (!latest) return ''
      return `${latest.state} (${$trans('replace in ')} ${latest.replace_months} ${$trans('months')})`
    },
  }),
  helper.accessor('num_orders', {header: $trans('Orders')}),
  ...(props.from_settings ? [helper.display({
    id: 'icons',
    header: '',
    cell: ({row}) => h('div', {class: 'h2 float-right icons'}, [
      h(IconLinkPlus, {
        type: 'tr',
        title: $trans('Add state'),
        method: () => showAddStateModal(row.original.id),
      }),
      h(IconLinkEdit, {
        router_name: hasBranches
          ? `${props.route_prefix}-edit-${props.type}`
          : `${props.route_prefix}-edit`,
        router_params: {pk: row.original.id},
        title: $trans('Edit'),
      }),
      h(IconLinkDelete, {
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  })] : []),
])

type EquipmentListQueryParams = NonNullable<EquipmentEquipmentListData['query']>

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<EquipmentRow>({
  key: 'equipment-table',
  columns,
  listOptions: (query) => equipmentEquipmentListOptions({
    query: {
      ...baseListParams(query),
      // Always sent: the endpoint scopes the list by type, and the legacy
      // screen sent its default (`technical`) the same way.
      type: props.type,
    } as EquipmentListQueryParams,
  }),
  urlSync: true,
  loadError: $trans('Error loading equipment'),
})

// The state row the add-state modal is filling in. `replace_months` stays a
// string while it is being typed - it is the wire shape that is a number.
const state = reactive({equipment: 0, state: '', replace_months: ''})

const {create} = useToast()
const createState = useMutation(equipmentEquipmentStateCreateMutation())

function showAddStateModal(id: number) {
  state.equipment = id
  state.state = ''
  state.replace_months = ''
  addStateModal.value?.show()
}

async function addState() {
  try {
    await createState.mutateAsync({
      body: {
        equipment: state.equipment,
        state: state.state,
        // Omitted rather than sent as an empty string: the field is an
        // optional integer and the legacy text input's '' was neither.
        ...(state.replace_months === '' ? {} : {replace_months: Number(state.replace_months)}),
      },
    })
    state.equipment = 0
    state.state = ''
    state.replace_months = ''
    addStateModal.value?.hide()
    infoToast(create, $trans('Created'), $trans('State added'))
    refresh()
  } catch {
    errorToast(create, $trans('Error adding state'))
  }
}

function downloadList() {
  // Commit the toolbar's 300 ms debounce first, or a term typed and exported
  // straight away is still only in the draft and the file answers a different
  // question than the one on screen.
  globalFilter.value = searchDraft.value

  // URLSearchParams rather than concatenation: a term with '&' in it would
  // otherwise end the query.
  const params = new URLSearchParams()
  if (globalFilter.value) params.set('q', globalFilter.value)

  // Only `q` goes out, not the equipment type - the legacy export forwarded
  // the search term and nothing else, so the file covers every type. Kept as
  // it is: narrowing it is a product decision, not a migration.
  my24.downloadItemAuth(`/api/equipment/equipment-export-qr/?${params.toString()}`, 'equipment.xlsx')
}
</script>

<style scoped>
:deep(.icons) {
  display: inline-block;
  min-width: 140px;
}
</style>
