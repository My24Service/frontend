<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <IBiChevronDown></IBiChevronDown>
    </summary>

    <!-- list -->
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
            class="h2 float-right"
            v-if="data.item.id && !isView"
          >
            <IconLinkEdit
              :method="function() { editDocument(data.index) }"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { deleteDocument(data.index) }"
            />
          </div>
        </template>
      </b-table>
    </div>

    <!-- form -->
    <div v-if="showForm">
      <b-form v-if="!editing">
        <h4>{{ $trans("Add document(s)") }}</h4>
        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Choose files')"
        >
          <!-- The legacy screen bound its add flow to `@input`, an event
               b-form-file never emits, so chosen files never joined the
               collection — the flow was dead. It listens to `change` here,
               exactly as LogoUploadField does; declared in the Slice README. -->
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

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Name')"
          label-for="customer-document-name"
        >
          <BFormInput
            id="customer-document-name"
            size="sm"
            v-model="editRow.name"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Description')"
          label-for="customer-document-description"
        >
          <BFormTextarea
            id="customer-document-description"
            v-model="editRow.description"
            rows="1"
          ></BFormTextarea>
        </BFormGroup>

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
import * as v from 'valibot'
import { computed, ref, watch } from 'vue'
import type { CustomerDocument } from '@/api/types.gen'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  customerDocumentCreateMutation,
  customerDocumentDestroyMutation,
  customerDocumentListOptions,
  customerDocumentPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import { errorToast, infoToast, $trans } from '@/utils'
import { invalidateDocumentListQueries } from './list-invalidation'
import {
  documentCreateSchema,
  documentPatchSchema,
  type DocumentRow,
} from './document-schemas'

/**
 * The documents panel of a customer, in the form (isView=false) and on the
 * detail view (isView=true).
 *
 * Reads go through the generated query options; the staged writes go through
 * the generated mutations when "Save changes" lands. Staging is local and
 * deliberately legacy-shaped: rows load once, edits mutate the rows in place,
 * deletes only mark, and "Save changes" replays creates and updates in row
 * order, then the deletes — stopping at the first failure with the API's
 * error toast, exactly as the legacy `updateCollection` loop did. While
 * staged changes exist the panel ignores refetches (the same rows a reload
 * would have to clobber); "Discard changes" drops the staging and refetches.
 *
 * A stored file's URL lives on the row as `storedFile` and is structurally
 * barred from the wire — the legacy screen deleted any `file` starting with
 * `http` before saving, so a stored document is never re-uploaded; a newly
 * chosen file rides out as a base64 `data:` URL, which the request schema's
 * `url()` rule accepts.
 *
 * The add flow is repaired, not preserved: the legacy screen bound its file
 * handler to `@input`, which b-form-file never emits, so chosen files never
 * joined the collection and nothing could be added. It listens to `change`
 * here, as LogoUploadField learned to at #325. Declared in the Slice README.
 */

const props = defineProps({
  customer: {
    type: Object,
    default: null,
  },
  isView: {
    type: Boolean,
    default: false,
  },
})

const queryClient = useQueryClient()
const {create} = useToast()

const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'icons', label: ''},
]
const fieldsView = [
  {key: 'name', label: $trans('Name')},
]

// reads -----------------------------------------------------------------

const customerId = computed(() => props.customer?.id as number | undefined)

const documentsQuery = useQuery({
  ...customerDocumentListOptions({query: {customer: customerId.value, page: 1}}),
  // The panel only mounts for a record that exists, but the guard keeps a
  // bare mount from firing against `undefined`.
  enabled: customerId.value !== undefined,
})

watch(
  () => documentsQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading documents'))
  },
)

// staging ---------------------------------------------------------------

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

// Keyed on dataUpdatedAt, not data: a refetch that returns byte-identical
// rows keeps the same data reference (query-core's structural sharing), and
// a staged deletion must still be rolled back when Discard refetches.
watch(
  () => documentsQuery.dataUpdatedAt.value,
  () => {
    const data = documentsQuery.data.value
    if (!data || dirty.value) return
    rows.value = (data.results ?? []).map(rowOf)
    deletedIds.value = []
    // The legacy load opened the add form by itself when the customer had no
    // documents — in edit mode only, where it can be acted on.
    if (!props.isView && rows.value.length === 0) {
      showAdd.value = true
    }
  },
  {immediate: true},
)

const isLoading = computed(() => documentsQuery.isLoading.value || saving.value)

// form state ------------------------------------------------------------

/** The add form is open (the legacy `newItem` flag). */
const showAdd = ref(false)
/** The row being edited, or null (the legacy `isEdit`/`editItem` pair — the
 * edit form binds straight onto the row, edits and all, as it always did). */
const editRow = ref<DocumentRow | null>(null)

const editing = computed(() => editRow.value !== null)
const showForm = computed(() => !props.isView && (editing.value || showAdd.value))
const showChangesBlock = computed(() =>
  !showForm.value && (rows.value.length > 0 || deletedIds.value.length > 0) && dirty.value)

/** The edit form's save button, as the legacy `isDocumentValid` gated it. */
const isDocumentValid = computed(() =>
  editRow.value !== null && (editRow.value.file ?? editRow.value.storedFile) != null)

function newDocument() {
  showAdd.value = true
}

function editDocument(index: number) {
  editRow.value = rows.value[index]
}

function cancelEditDocument() {
  showAdd.value = false
  editRow.value = null
}

/** Commit the edit form: the legacy `doEditCollectionItem`, minus the copy —
 * the edits already live on the row, so committing is marking the staging. */
function commitEdit() {
  if (!editRow.value) return
  dirty.value = true
  editRow.value = null
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

// files -----------------------------------------------------------------

/** The chosen files, wherever b-form-file put them: a re-emitted `change`
 * carries the FileList on the event itself (its `target` is null by then);
 * a plain native event keeps them under `target`. */
function fileListOf(event: Event | {files?: FileList} | null | undefined): FileList | [] {
  if (!event) return []
  const shaped = event as {files?: FileList, target?: {files?: FileList}}
  return shaped.files ?? shaped.target?.files ?? []
}

function readAsDataUrl(file: File): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = (event) => resolve(String(event.target?.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

/** The add form: every chosen file joins the collection as a new row — the
 * legacy `filesSelected`, which the dead `@input` binding never let run. */
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

/** The edit form: a replacement file becomes the row's outgoing file. */
async function chooseReplacement(event: Event | {files?: FileList}) {
  if (!editRow.value) return
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return

  editRow.value.file = await readAsDataUrl(files[0])
}

// writes ----------------------------------------------------------------

const createMutation = useMutation({...customerDocumentCreateMutation()})
const updateMutation = useMutation({...customerDocumentPartialUpdateMutation()})
const destroyMutation = useMutation({...customerDocumentDestroyMutation()})

const saving = ref(false)

async function submitDocuments() {
  if (saving.value) return
  saving.value = true

  try {
    // Creates and updates in row order, then the deletes — the legacy
    // `updateCollection` loop's exact order, stopping at the first failure.
    for (const row of rows.value) {
      // A stored file's URL never rides out; a chosen data URL does.
      const file = row.file && !row.file.startsWith('http') ? row.file : undefined
      const body = {
        customer: row.customer,
        name: row.name,
        description: row.description ?? null,
        ...(file !== undefined ? {file} : {}),
        user_can_view: row.user_can_view,
      }

      if (row.id) {
        await updateMutation.mutateAsync({
          path: {id: row.id},
          body: v.parse(documentPatchSchema, body),
        })
      } else {
        await createMutation.mutateAsync({body: v.parse(documentCreateSchema, body)})
      }
    }
    for (const id of deletedIds.value) {
      await destroyMutation.mutateAsync({path: {id}})
    }

    infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
    dirty.value = false
    await invalidateDocumentListQueries(queryClient)
  } catch {
    // Already told the user; the staging stays as it was, the legacy way.
    errorToast(create, $trans('Error updating documents'))
  } finally {
    saving.value = false
  }
}

async function discardChanges() {
  dirty.value = false
  showAdd.value = false
  editRow.value = null
  await documentsQuery.refetch()
}
</script>
