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
        resource: Api.CompanyLeaveType,
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
      @ok.prevent="submitForm()"
    >
      <b-overlay :show="saving" rounded="sm">
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
import IBiPencil from '~icons/bi/pencil'

import RowAction from '@/components/RowAction.vue'
import { ServerTable, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import SubNav from '../SubNav.vue'
import { useResourceForm } from '@/features/forms'
import { emptyLeaveType, leaveTypeFromRecord, leaveTypeWrite } from './schemas'

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
type LeaveTypeRow = ListRow<Api.PaginatedLeaveTypeList>

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
  resource: Api.CompanyLeaveType,
  urlSync: true,
  loadError: $trans('Error loading leave types'),
})

/** null while the modal is creating; the row's id while it is editing. */
const editingId = ref<number | null>(null)

const {values, errors, submitClicked, isLoading: saving, submitForm, reset} = useResourceForm({
  pk: () => editingId.value,
  resource: Api.CompanyLeaveType,
  empty: emptyLeaveType,
  fromRecord: leaveTypeFromRecord,
  contract: leaveTypeWrite,
  afterSave: () => formModal.value?.hide(),
  copy: {
    fetchError: $trans('Error fetching leave type'),
    created: $trans('Created'),
    createdDetail: $trans('Leave type has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Leave type has been updated'),
    createError: $trans('Error creating leave types'),
    updateError: $trans('Error updating leave type'),
  },
})

function open(id: number | null) {
  editingId.value = id
  reset()
  formModal.value?.show()
}

const openCreate = () => open(null)
const openEdit = (record: Api.LeaveType) => open(record.id)
</script>

<style scoped>
.edit-icon {
  color: #ff9933;
}
.edit-icon:hover {
  cursor: pointer;
}
</style>
