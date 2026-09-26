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
        resource: Api.EquipmentEquipment,
        deletedDetail: $trans('Equipment has been deleted'),
        deleteError: $trans('Error deleting equipment'),
      }"
    >
      <template #icon><IBiTools /></template>
      <template #toolbar-extra>
        <ActionButton icon="download"
          :method="downloadList"
          :title="$trans('Download QR-codes')"
        />
      </template>
      <template #add>
        <router-link
          v-if="from_settings || !hasBranches"
          :to="addRoute"
          class="btn btn-primary"
        >{{ $trans('Add Equipment') }}</router-link>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { equipmentEquipmentExportQrRetrieve } from '@/api/sdk.gen'
import { useFileDownload, XLSX_MIME } from '@/features/shared'

import { EQUIPMENT_TYPES } from '@/constants'
import { ServerTable, useServerTable, type ListRow } from '@/features/table'
import { useEquipmentColumns } from './use-equipment-columns'
const props = withDefaults(defineProps<{
  /** Mounted by the settings layout, which adds the row actions and the add link. */
  from_settings?: boolean
  /** The route name stem this mount answers to (`equipment-equipment`, `settings-equipment`, ...). */
  route_prefix: 'customers-equipment' | 'equipment-equipment' | 'settings-equipment'
  /** The equipment type the address asked for; the router's path carries it. */
  type?: Api.EquipmentTypeEnum
}>(), {
  from_settings: false,
  type: EQUIPMENT_TYPES.TECHNICAL,
})

type EquipmentRow = ListRow<Api.PaginatedEquipmentList>

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const addStateModal = useTemplateRef<{show: () => void, hide: () => void}>('addStateModal')

// Read through computeds, not once: the member's branch setting and the
// user's role must stay live while the list is mounted, and the template's
// add link reads the branch setting on every render.
const mainStore = useMainStore()
const hasBranches = computed(() => mainStore.getMemberHasBranches)
const authStore = useAuthStore()
// "Planning" in the legacy screen's sense: neither a branch employee nor a
// customer. Those two roles are the ones that see neither the owner column nor
// the brand column.
const planning = computed(() => !authStore.isEmployee && !authStore.isCustomer)

const addRoute = computed(() => toRoute(`${props.route_prefix}-add` as RouteName))

const columns = useEquipmentColumns({
  routePrefix: props.route_prefix,
  type: props.type,
  fromSettings: props.from_settings,
  planning: planning.value,
  onDelete: (id) => tableRef.value?.showDeleteModal(id),
  onAddState: (id) => showAddStateModal(id),
})

const {table, searchDraft, globalFilter, pagination, count, isLoading, isFetching, refresh} = useServerTable<EquipmentRow>({
  key: 'equipment-table',
  columns,
  // `type` always rides along: the endpoint scopes the list by type, and the
  // legacy screen sent its default (`technical`) the same way.
  listOptions: (query) => Api.EquipmentEquipment.listOptions({...query, type: props.type}),
  urlSync: true,
  loadError: $trans('Error loading equipment'),
})

// The state row the add-state modal is filling in. `replace_months` stays a
// string while it is being typed - it is the wire shape that is a number.
const state = reactive({equipment: 0, state: '', replace_months: ''})

const {create} = useToast()
const createState = useMutation(Api.EquipmentEquipmentState.create.mutation())

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

const download = useFileDownload()

function downloadList() {
  // Commit the toolbar's 300 ms debounce first, or a term typed and exported
  // straight away is still only in the draft and the file answers a different
  // question than the one on screen.
  globalFilter.value = searchDraft.value

  // The type too, and always: this screen is mounted per type and lists one
  // type's rows, so a spreadsheet covering both answers a different question
  // than the one on screen. The legacy export forwarded the search term alone.
  const q = globalFilter.value
  download.fromApi(
    () => equipmentEquipmentExportQrRetrieve({query: {...(q ? {q} : {}), type: props.type}, throwOnError: true}),
    'equipment.xlsx', XLSX_MIME)
}
</script>

<style scoped>
:deep(.icons) {
  display: inline-block;
  min-width: 140px;
}
</style>
