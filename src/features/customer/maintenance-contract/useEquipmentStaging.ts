import {
  customerMaintenanceEquipmentListOptions,
  equipmentEquipmentAutocompleteListOptions,
  equipmentEquipmentCreateQuickCreateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { MaintenanceEquipment, MaintenanceEquipmentRowRequest } from '@/api/types.gen'
import { useMainStore } from '@/stores/main'
import { errorToast, $trans } from '@/services/i18n'
import { toDinero } from '@/services/money'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import {
  emptyEquipmentRow,
  equipmentRowErrors,
  equipmentRowFromRecord,
  parseEquipmentSetBody,
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

  /**
   * The staged set as the save's `equipment` list. The contract form puts it in
   * the same body as the contract's own fields, so the whole set — the creates,
   * the updates and, by their absence, the deletes — travels in one request and
   * lands in the server's one transaction. No write is made from here: the save
   * belongs to the form, which is the only party that knows the contract.
   */
  function equipmentBody(): MaintenanceEquipmentRowRequest[] {
    return parseEquipmentSetBody(rows.value)
  }

  /**
   * Adopt the rows a save stored. The response carries them with their ids, so
   * the staged set stops being a set of drafts the moment the write lands: a
   * later save sends those ids and updates the stored rows instead of creating
   * a second copy of every one of them. This is the same adoption the read
   * below does with the rows the contract already has.
   */
  function adoptStoredRows(records: readonly MaintenanceEquipment[]) {
    rows.value = records.map((row) => equipmentRowFromRecord(row, defaultCurrency()))
  }

  // The contract's equipment set -------------------------------------------

  // A save sends the staged set as the contract's whole equipment set, so the
  // form needs every row of the contract: a page-1 read would hide the ones
  // past 20 and then send a set that deletes them. `WHOLE_COLLECTION_PAGE_SIZE`
  // is the API's own ceiling (`My24Pagination.max_page_size`, my24service
  // `source/apps/core/rest.py:236`), which DRF clamps a larger value down to
  // rather than rejecting it.

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
      adoptStoredRows(data.results ?? [])
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
    // Dropping the row is the whole delete: the save sends the staged set, and
    // a stored row the set no longer names is what the server removes.
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
    if (row.tariff_dinero) return row.tariff_dinero
    return toDinero(row.tariff || '0.00', row.tariff_currency || defaultCurrency())
  }

  const totalDinero = computed(() => {
    const base = toDinero('0.00', defaultCurrency())
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
    equipmentBody,
    adoptStoredRows,
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

/** What the contract form hands its equipment panel: the whole staged set. */
export type EquipmentStaging = ReturnType<typeof useEquipmentStaging>
