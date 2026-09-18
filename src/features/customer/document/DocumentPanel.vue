<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>


    <div v-if="!showForm">
      <p v-if="rows.length === 0">
        <i>{{ $trans("No documents") }}</i>
      </p>
      <b-table
        v-else
        small
        id="document-table"
        :busy="isLoading"
        :fields="isView ? fieldsView : fields"
        :items="rows"
        responsive="md"
        class="data-table"
      >
        <template #cell(icons)="data">
          <div
            class="h2 float-end"
            v-if="data.item.id && !isView"
          >
            <RowAction icon="edit"
              :method="function() { editDocument(data.index) }"
              v-bind:title="$trans('Edit')"
            />
            <RowAction icon="delete"
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { deleteDocument(data.index) }"
            />
          </div>
        </template>
      </b-table>
    </div>


    <div v-if="showForm">
      <b-form v-if="!editing">
        <h4>{{ $trans("Add document(s)") }}</h4>
        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >

          <b-form-file
            multiple
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @change="chooseFiles"
          ></b-form-file>
        </BFormGroup>
      </b-form>

      <b-form v-else-if="editRow">
        <h4>{{ $trans("Edit document") }}</h4>
        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <b-form-file
            v-bind:placeholder="$trans('Choose a file or drop it here...')"
            @change="chooseReplacement"
          ></b-form-file>
        </BFormGroup>

        <DocumentEditFields
          id-prefix="customer"
          v-model:name="editRow.name"
          v-model:description="editRow.description"
        />

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('User can view document?')"
          label-for="customer-document-user_can_view"
        >
          <BFormCheckbox
            id="customer-document-user_can_view"
            v-model="editRow.user_can_view"
          >
          </BFormCheckbox>
        </BFormGroup>
      </b-form>

      <footer class="modal-footer">
        <BButton
          :disabled="isLoading"
          @click="cancelEditDocument"
          class="btn btn-secondary update-button"
          type="button"
          size="sm"
          variant="secondary"
        >
          {{ $trans('Cancel') }}
        </BButton>
        <BButton
          v-if="editing"
          @click="commitEdit"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="warning"
          :disabled="!isDocumentValid"
        >
          {{ $trans('Edit document') }}
        </BButton>
      </footer>

    </div>

    <footer
      class="modal-footer"
      v-if="!showForm && !isView"
    >
      <BButton
        @click="newDocument"
        :disabled="isLoading"
        class="btn btn-primary update-button"
        type="button"
        variant="primary"
      >
        {{ $trans('Add document(s)') }}
      </BButton>
    </footer>

    <b-container v-if="showChangesBlock">
      <b-row>
        <b-col cols="12">
          <BButton
            @click="discardChanges"
            :disabled="isLoading"
            class="btn btn-secondary"
            type="button"
          >
            {{ $trans('Discard changes') }}
          </BButton>
          &nbsp;
          <BButton
            @click="submitDocuments"
            :disabled="isLoading"
            class="btn btn-danger"
            type="button"
            variant="danger"
          >
            <b-spinner small v-if="saving"></b-spinner>
            {{ $trans('Save changes') }}
          </BButton>
        </b-col>
      </b-row>
    </b-container>
  </details>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import type { CustomerDocument } from '@/api/types.gen'
import { useToast } from 'bootstrap-vue-next'

import RowAction from '@/components/RowAction.vue'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { useDocumentCollection } from '@/features/documents/use-document-collection'
import { fileListOf, readAsDataUrl } from '@/features/shared/file-helpers'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import DocumentEditFields from '@/features/documents/DocumentEditFields.vue'
import { customerDocumentResource } from './customer-document-resource'
import { type DocumentRow } from './document-schemas'




const props = withDefaults(defineProps<{
  customer?: {id?: number} | null
  isView?: boolean
}>(), {
  customer: null,
  isView: false,
})

const {create} = useToast()

const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'icons', label: ''},
]
const fieldsView = [
  {key: 'name', label: $trans('Name')},
]



const customerId = computed(() => props.customer?.id)

// The collection reads nothing until the record exists; the panel only mounts
// once it does (CustomerFinancialsPanel renders it under `v-if="values.id"`),
// so null here is a type-level state, not a mounted one.
const parentId = computed(() => customerId.value ?? null)
const collection = useDocumentCollection(customerDocumentResource, parentId)

useQueryErrorToast(collection.error, $trans('Error loading documents'))



const rows = ref<DocumentRow[]>([])
const deletedIds = ref<number[]>([])
const dirty = ref(false)

function rowOf(record: CustomerDocument): DocumentRow {
  return {
    id: record.id,
    customer: record.customer,
    name: record.name,
    description: record.description ?? null,
    storedFile: record.file,
    user_can_view: record.user_can_view,
  }
}


watch(
  collection.rows,
  (serverRows) => {
    if (dirty.value) return
    reloadRows(serverRows)
  },
  {immediate: true},
)

/**
 * Replace the staged set with the server's answer.
 *
 * The watch above calls this whenever the collection's rows change, but a
 * refetch that answers with identical data changes nothing - TanStack shares
 * the previous reference - so callers that need the server's truth back
 * regardless (discard) call it directly after their refetch.
 */
function reloadRows(serverRows: readonly unknown[]) {
  // The collection's rows are the server's records verbatim; the panel's
  // editor keeps its own shape (`storedFile`, `user_can_view`), which the
  // shared row contract deliberately does not carry, so the narrowing back
  // to `CustomerDocument` happens once here at the feature boundary.
  rows.value = serverRows.map((serverRow) => rowOf(serverRow as unknown as CustomerDocument))
  deletedIds.value = []

  // An empty answer in edit mode opens the add form by itself; while the
  // read is pending or failed there is no answer yet, so nothing opens.
  if (!props.isView && rows.value.length === 0 && !collection.isLoading.value && collection.error.value == null) {
    showAdd.value = true
  }
}

const isLoading = computed(() => collection.isLoading.value || saving.value)




const showAdd = ref(false)

const editRow = ref<DocumentRow | null>(null)
const editIndex = ref<number | null>(null)

const editing = computed(() => editRow.value !== null)
const showForm = computed(() => !props.isView && (editing.value || showAdd.value))
const showChangesBlock = computed(() =>
  !showForm.value && (rows.value.length > 0 || deletedIds.value.length > 0) && dirty.value)


const isDocumentValid = computed(() =>
  editRow.value !== null && (editRow.value.file ?? editRow.value.storedFile) != null)

function newDocument() {
  showAdd.value = true
}

function editDocument(index: number) {
  editIndex.value = index
  editRow.value = {...rows.value[index]}
}

function cancelEditDocument() {
  showAdd.value = false
  editRow.value = null
  editIndex.value = null
}


function commitEdit() {
  if (!editRow.value || editIndex.value === null) return
  rows.value[editIndex.value] = editRow.value
  dirty.value = true
  editRow.value = null
  editIndex.value = null
}

function deleteDocument(index: number) {
  const row = rows.value[index]
  if (row.id) {
    deletedIds.value.push(row.id)
  }
  rows.value.splice(index, 1)
  dirty.value = true
  infoToast(create, $trans('Marked for delete'), $trans('Document marked for delete'))
}






async function chooseFiles(event: Event | {files?: FileList}) {
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return

  const staged: DocumentRow[] = []
  for (let i = 0; i < files.length; i++) {
    staged.push({
      customer: customerId.value as number,
      file: await readAsDataUrl(files[i]),
      name: files[i].name,
      description: '',
      user_can_view: true,
    })
  }
  rows.value.push(...staged)
  showAdd.value = false
  dirty.value = true
}


async function chooseReplacement(event: Event | {files?: FileList}) {
  if (!editRow.value) return
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return

  editRow.value.file = await readAsDataUrl(files[0])
}



const saving = ref(false)

async function submitDocuments() {
  if (saving.value) return
  saving.value = true

  try {
    // Mounted-guaranteed: the panel only mounts for an existing customer,
    // but the type cannot know it, so a missing parent fails loudly here
    // rather than riding along as a null body field.
    const parent = parentId.value
    if (parent == null) throw new Error('No customer for document save')

    for (const row of rows.value) {
      // A row the server already has holds the API's URL in `file`, which
      // is not a payload: the server keeps the file it has.
      if (row.file?.startsWith('http')) delete row.file

      if (row.id) {
        await collection.update(row, parent)
      } else {
        await collection.create(row, parent)
      }
    }
    for (const id of deletedIds.value) {
      await collection.destroy(id)
    }

    infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
    dirty.value = false
    // The saved rows stay staged, but the list behind them is stale: reload
    // it the way a discard does, rather than only marking it. (The shared
    // invalidate deliberately refetches nothing — the equipment editor
    // shows per-row results that a refetch would replace.)
    await collection.refetch()
    reloadRows(collection.rows.value)
  } catch {

    errorToast(create, $trans('Error updating documents'))
  } finally {
    saving.value = false
  }
}

async function discardChanges() {
  dirty.value = false
  showAdd.value = false
  editRow.value = null
  editIndex.value = null
  await collection.refetch()
  reloadRows(collection.rows.value)
}
</script>
