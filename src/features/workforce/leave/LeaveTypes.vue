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
      :title="$trans('Leave Types')"
      :search-label="$trans('Search leave types')"
      :label="$trans('Leave types')"
      :empty-text="$trans('No leave types found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-leave-modal',
        confirmText: $trans('Are you sure you want to delete this leave type?'),
        destroyMutation: companyLeaveTypeDestroyMutation,
        invalidate: invalidateLeaveTypeList,
        deletedDetail: $trans('Leave type has been deleted'),
        deleteError: $trans('Error deleting leave type'),
      }"
    >
      <template #subnav><SubNav /></template>
      <template #icon><IBiFileEarmarkCheckFill /></template>
      <template #add>
        <BButton
          type="button"
          variant="primary"
          @click="openCreate"
        >
          <IBiFileEarmarkPlus />{{ $trans('Add leave types') }}
        </BButton>
      </template>
    </ServerTable>

    <b-modal
      id="add-edit-leave-type-modal"
      ref="form-modal"
      :title="editingId === null ? $trans('Create leave type') : $trans('Update leave type')"
      @ok="submit"
      @hidden="reset"
    >
      <b-overlay :show="submitting" rounded="sm">
        <div class="flex-columns">
          <BFormGroup
            label-class=""
            :label="$trans('Name')"
            label-for="name"
            cols="4"
          >
            <BFormInput
              id="name"
              v-model="values.name"
              placeholder="Name"
              :state="submitClicked ? !errors.name : null"
            />
            <b-form-invalid-feedback :state="submitClicked ? !errors.name : null">
              {{ errors.name }}
            </b-form-invalid-feedback>
          </BFormGroup>
          <BFormGroup
            :label="$trans('Counts as leave')"
            cols="4"
          >
            <BFormCheckbox
              id="count_as_leave"
              v-model="values.counts_as_leave"
              name="count_as_leave"
            />
          </BFormGroup>
        </div>
      </b-overlay>
    </b-modal>
  </div>
</template>

<script setup lang="ts">
import IBiFileEarmarkCheckFill from '~icons/bi/file-earmark-check-fill'
import IBiFileEarmarkPlus from '~icons/bi/file-earmark-plus'
import IBiPencil from '~icons/bi/pencil'
import {
  companyLeaveTypeCreateMutation,
  companyLeaveTypeDestroyMutation,
  companyLeaveTypeListOptions,
  companyLeaveTypePartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { LeaveType, LeaveTypeRequest, PaginatedLeaveTypeList } from '@/api/types.gen'
import RowAction from '@/components/RowAction.vue'
import { ServerTable, baseListParams, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import SubNav from '../SubNav.vue'
import { invalidateLeaveTypeList } from './invalidation'
import {
  LEAVE_TYPE_LABELS,
  emptyLeaveType,
  leaveTypeFromRecord,
  parseLeaveType,
  validateLeaveType,
  type LeaveTypeFieldErrors,
} from './schemas'

/**
 * The tenant's leave types: a list with an add/edit modal and a delete
 * confirmation, both the legacy screen's down to the modal ids and the copy.
 *
 * The save path is the one behaviour this screen changes. The legacy handler
 * called `this.$bvModal.hide('add-edit-leave-type-modal')` from its `$nextTick`
 * callback; `$bvModal` is a bootstrap-vue 2 global that nothing in this
 * application installs (these two call sites were its only readers), so the
 * call threw and took the reload after it with it - the modal stayed open and
 * the list never refreshed. Here the modal is a template ref and the write
 * invalidates the list query, so a save closes the modal and refetches behind
 * it.
 */
type LeaveTypeRow = ListRow<PaginatedLeaveTypeList>

const queryClient = useQueryClient()
const {create: toast} = useToast()

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const formModal = useTemplateRef<{show: () => void; hide: () => void}>('form-modal')

const helper = createAppColumnHelper<LeaveTypeRow>()

const columns = helper.columns([
  helper.accessor('name', {
    header: $trans('Name'),
  }),
  helper.display({
    id: 'icons',
    header: '',
    enableSorting: false,
    cell: ({row}) => h('div', {class: 'h2 float-end'}, [
      h(IBiPencil, {
        class: 'edit-icon',
        onClick: () => openEdit(row.original),
      }),
      h(RowAction, {
        icon: 'delete',
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  }),
])

const {table, searchDraft, pagination, count, isLoading, isFetching, refresh} = useServerTable<LeaveTypeRow>({
  key: 'leave-type-table',
  columns,
  enableSorting: false,
  listOptions: (query) => companyLeaveTypeListOptions({
    query: {
      ...baseListParams(query),
    },
  }),
  urlSync: true,
  loadError: $trans('Error loading leave types'),
})

const values = ref<LeaveTypeRequest>(emptyLeaveType())
const errors = ref<LeaveTypeFieldErrors>({})
const submitClicked = ref(false)
const submitting = ref(false)
/** null while the modal is creating; the row's id while it is editing. */
const editingId = ref<number | null>(null)

const createMutation = useMutation(companyLeaveTypeCreateMutation())
const updateMutation = useMutation(companyLeaveTypePartialUpdateMutation())

function openCreate() {
  editingId.value = null
  values.value = emptyLeaveType()
  submitClicked.value = false
  formModal.value?.show()
}

function openEdit(record: LeaveType) {
  editingId.value = record.id
  values.value = leaveTypeFromRecord(record)
  submitClicked.value = false
  formModal.value?.show()
}

/** `@hidden` fires for a cancel as well as a save, so the form is blank either way. */
function reset() {
  values.value = emptyLeaveType()
  errors.value = {}
  submitClicked.value = false
  editingId.value = null
}

async function submit(event: {preventDefault: () => void}) {
  event.preventDefault()
  submitClicked.value = true
  errors.value = validateLeaveType(values.value)
  if (Object.keys(errors.value).length > 0) return

  const id = editingId.value
  submitting.value = true
  try {
    if (id === null) {
      await createMutation.mutateAsync({
        body: parseLeaveType(values.value),
      })
      infoToast(toast, $trans('Created'), $trans('Leave type has been created'))
    } else {
      await updateMutation.mutateAsync({
        path: {id},
        body: parseLeaveType(values.value),
      })
      infoToast(toast, $trans('Updated'), $trans('Leave type has been updated'))
    }
    await invalidateLeaveTypeList(queryClient)
    formModal.value?.hide()
  } catch {
    errorToast(toast, id === null ? $trans('Error creating leave types') : $trans('Error updating leave type'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.edit-icon {
  color: #ff9933;
}
.edit-icon:hover {
  cursor: pointer;
}
</style>
