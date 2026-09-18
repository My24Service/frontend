import { computed, nextTick, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  customerMaintenanceEquipmentCreateMutation,
  customerMaintenanceEquipmentDestroyMutation,
  customerMaintenanceEquipmentListOptions,
  customerMaintenanceEquipmentPartialUpdateMutation,
  equipmentEquipmentAutocompleteListOptions,
  equipmentEquipmentCreateQuickCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import { useMainStore } from '@/stores/main'
import { errorToast, $trans } from '@/services/i18n'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table/server-paged-list'
import { rowDinero as sharedRowDinero, zeroDinero } from './dinero-helpers'
import {
  emptyEquipmentRow,
  equipmentRowErrors,
  equipmentRowFromRecord,
  parseEquipmentBody,
  type ContractFieldErrors,
  type EquipmentRowState,
} from './schemas'

/** What the equipment picker hands back when an option is selected. */
export interface EquipmentOption {
  id: number
  name: string
}

interface EquipmentStagingOptions {
  contractId: () => number
  isCreate: () => boolean
  customerId: () => number | undefined
}

export function useEquipmentStaging(options: EquipmentStagingOptions) {
  const mainStore = useMainStore()
  const {create} = useToast()

  const defaultCurrency = () => mainStore.getDefaultCurrency

  // The staged set ---------------------------------------------------------

  const rows = ref<EquipmentRowState[]>([])
  const deletedIds = ref<number[]>([])

  const createEquipmentRow = useMutation({...customerMaintenanceEquipmentCreateMutation()})
  const updateEquipmentRow = useMutation({...customerMaintenanceEquipmentPartialUpdateMutation()})
  const destroyEquipmentRow = useMutation({...customerMaintenanceEquipmentDestroyMutation()})

  async function replay(contractPk: number) {
    for (const row of rows.value) {
      const body = parseEquipmentBody(row, contractPk)
      if (row.id) {
        await updateEquipmentRow.mutateAsync({path: {id: row.id}, body})
      } else {
        await createEquipmentRow.mutateAsync({body})
      }
    }
    for (const id of deletedIds.value) {
      await destroyEquipmentRow.mutateAsync({path: {id}})
    }
  }

  // The contract's equipment set -------------------------------------------

  // The staged rows are replayed on save, so the form needs every row of the
  // contract: a page-1 read would hide the ones past 20 and then leave them
  // untouched on save. `WHOLE_COLLECTION_PAGE_SIZE` is the API's own ceiling
  // (`My24Pagination.max_page_size`, my24service `source/apps/core/rest.py:236`),
  // which DRF clamps a larger value down to rather than rejecting it.

  const equipmentQuery = useQuery(() => ({
    ...customerMaintenanceEquipmentListOptions({
      query: {contract: options.contractId(), page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
    }),
    enabled: !options.isCreate(),
  }))

  watch(
    () => equipmentQuery.data.value,
    (data) => {
      if (!data) return
      rows.value = (data.results ?? []).map(
        (row) => equipmentRowFromRecord(row, defaultCurrency()),
      )
      deletedIds.value = []
    },
    {immediate: true},
  )

  // The picker -------------------------------------------------------------

  const searchTerm = ref('')
  const searchQueryTerm = refDebounced(searchTerm, 500)

  const searchQuery = useQuery(() => ({
    ...equipmentEquipmentAutocompleteListOptions({
      query: {q: searchQueryTerm.value, customer: options.customerId() as number},
    }),
    enabled: options.customerId() !== undefined && searchQueryTerm.value.length > 0,
  }))
  const equipmentOptions = computed(() => searchQuery.data.value ?? [])

  // The row being edited ---------------------------------------------------

  const rowEdit = ref<EquipmentRowState>(emptyEquipmentRow(defaultCurrency()))
  const editingIndex = ref<number | null>(null)
  const rowErrors = computed(() => equipmentRowErrors(rowEdit.value))

  function stagedErrors(): ContractFieldErrors {
    const committedBad = rows.value.some(
      (row) => Object.keys(equipmentRowErrors(row)).length > 0,
    )
    const pendingBad = rowEdit.value.equipment !== null &&
      Object.keys(equipmentRowErrors(rowEdit.value)).length > 0
    if (!committedBad && !pendingBad) return {}
    return {equipment: $trans('Please fix the equipment rows before saving')}
  }

  function selectEquipment(option: EquipmentOption) {
    const existing = rows.value.find((row) => row.equipment === option.id)
    if (existing) {
      editEquipment(existing, rows.value.indexOf(existing))
      return
    }

    rowEdit.value.equipment = option.id
    rowEdit.value.equipment_name = option.name
    nextTick(() => timesPerYear.value?.focus())
  }

  function addEquipment() {
    if (rowEdit.value.equipment === null) return

    rows.value.push({...rowEdit.value})
    rowEdit.value = emptyEquipmentRow(defaultCurrency())
  }

  function editEquipment(item: EquipmentRowState, index: number) {
    editingIndex.value = index
    rowEdit.value = {...item}
  }

  function doEditEquipment() {
    if (editingIndex.value === null) return
    rows.value.splice(editingIndex.value, 1, {...rowEdit.value})
    editingIndex.value = null
    rowEdit.value = emptyEquipmentRow(defaultCurrency())
  }

  function cancelEditEquipment() {
    editingIndex.value = null
    rowEdit.value = emptyEquipmentRow(defaultCurrency())
  }

  function deleteEquipment(index: number) {
    const row = rows.value[index]
    if (row.id) {
      deletedIds.value.push(row.id)
    }
    rows.value.splice(index, 1)
    // The row being edited is tracked by index, so the ones after the deleted
    // row did not move.
    if (editingIndex.value !== null) {
      if (editingIndex.value === index) {
        editingIndex.value = null
        rowEdit.value = emptyEquipmentRow(defaultCurrency())
      } else if (editingIndex.value > index) {
        editingIndex.value -= 1
      }
    }
  }

  // Money ------------------------------------------------------------------

  function rowDinero(row: EquipmentRowState) {
    return sharedRowDinero(row, defaultCurrency())
  }

  const totalDinero = computed(() => {
    const base = zeroDinero(defaultCurrency())
    if (!rows.value.length) return base
    return rows.value.reduce(
      (total, row) => total.add(rowDinero(row)),
      base,
    )
  })

  // The quick-create modal -------------------------------------------------

  const newEquipmentName = ref('')
  const quickCreateEquipment = useMutation({...equipmentEquipmentCreateQuickCreateMutation()})

  async function submitCreateEquipment() {
    if (!mainStore.getMemberHasBranches) {
      errorToast(create, $trans('Not creating equipment from branch environment'))
      return
    }

    deactivateEquipmentMultiselect()

    try {
      const customerId = options.customerId()
      if (customerId == null) {
        errorToast(create, $trans('Error adding equipment'))
        return
      }
      const response = await quickCreateEquipment.mutateAsync({
        body: {customer: customerId, name: newEquipmentName.value},
      })

      rowEdit.value.equipment = response.id
      rowEdit.value.equipment_name = response.name
      newEquipmentModal.value?.hide()
      nextTick(() => timesPerYear.value?.focus())
    } catch {
      errorToast(create, $trans('Error adding equipment'))
    }
  }

  function cancelCreateEquipment() {
    newEquipmentModal.value?.hide()
  }

  // What the panel binds to its own DOM. Declared here because the focus and
  // the modal choreography above is part of what this composable owns; the
  // panel's template binds them by name.
  const timesPerYear = ref<{focus: () => void} | null>(null)
  const equipmentMultiselect = ref<{
    deactivate?: () => void
    $refs?: {search?: {value?: string}}
  } | null>(null)
  const newEquipmentModal = ref<{show: () => void; hide: () => void} | null>(null)

  function deactivateEquipmentMultiselect() {
    equipmentMultiselect.value?.deactivate?.()
    return equipmentMultiselect.value?.$refs?.search?.value ?? ''
  }

  function showAddEquipmentModal() {
    newEquipmentName.value = deactivateEquipmentMultiselect()
    newEquipmentModal.value?.show()
  }

  return {
    rows,
    deletedIds,
    replay,
    isLoading: computed(() => equipmentQuery.isLoading.value),
    equipmentOptions,
    searchTerm,
    selectEquipment,
    rowEdit,
    rowErrors,
    editingIndex,
    stagedErrors,
    addEquipment,
    editEquipment,
    doEditEquipment,
    cancelEditEquipment,
    deleteEquipment,
    rowDinero,
    totalDinero,
    newEquipmentName,
    submitCreateEquipment,
    cancelCreateEquipment,
    showAddEquipmentModal,
    timesPerYear,
    equipmentMultiselect,
    newEquipmentModal,
  }
}
