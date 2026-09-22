<template>
  <details open>
    <summary class="flex-columns space-between">
      <h6>{{ $trans('Documents') }}</h6>
      <IBiChevronDown />
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
        <template #cell(name)="data">
          <BLink
            v-if="linkOf(data.item)"
            :href="linkOf(data.item)"
            target="_blank"
          >
            {{ data.item.name }} <IBiDownload font-scale=".8" />
          </BLink>
          <span v-else>{{ data.item.name }}</span>
        </template>
        <template #cell(icons)="data">
          <div
            v-if="!isView"
            class="h2 float-end"
          >
            <RowAction icon="edit"
              :method="() => editDocument(data.index)"
              :title="$trans('Edit')"
            />
            <RowAction icon="delete"
              :title="$trans('Delete')"
              :method="() => deleteDocument(data.index)"
            />
          </div>
        </template>
      </b-table>
      <div
        v-for="(row, index) in failedRows"
        :key="row.id ?? `failed-${index}`"
      >
        <ApiResult :error="row.error ?? undefined" />
      </div>
    </div>

    <div v-if="showForm">
      <b-form v-if="!editing">
        <h4>{{ $trans("Add document(s)") }}</h4>
        <BFormGroup
          label-cols="3"
          :label="$trans('Choose files')"
        >
          <b-form-file
            multiple
            :placeholder="$trans('Choose a file or drop it here...')"
            @change="chooseFiles"
          />
        </BFormGroup>
      </b-form>

      <b-form v-else-if="editRow">
        <h4>{{ $trans("Edit document") }}</h4>
        <BFormGroup
          label-cols="3"
          :label="$trans('Choose files')"
        >
          <b-form-file
            :placeholder="$trans('Choose a file or drop it here...')"
            @change="chooseReplacement"
          />
        </BFormGroup>

        <DocumentEditFields
          :id-prefix="idPrefix"
          v-model:name="editRow.name"
          v-model:description="editRow.description"
        />

        <BFormGroup
          v-if="showUserCanView"
          label-cols="3"
          :label="$trans('User can view document?')"
          :label-for="`${idPrefix}-document-user_can_view`"
        >
          <BFormCheckbox
            :id="`${idPrefix}-document-user_can_view`"
            v-model="editRow.user_can_view"
          />
        </BFormGroup>
      </b-form>

      <footer class="modal-footer">
        <BButton
          :disabled="isLoading"
          type="button"
          size="sm"
          variant="secondary"
          @click="cancelEditDocument"
        >
          {{ $trans('Cancel') }}
        </BButton>
        <BButton
          v-if="editing"
          type="button"
          size="sm"
          variant="warning"
          :disabled="!isDocumentValid"
          @click="commitEdit"
        >
          {{ $trans('Edit document') }}
        </BButton>
      </footer>
    </div>

    <footer
      v-if="!showForm && !isView && !dirty"
      class="modal-footer"
    >
      <BButton
        type="button"
        variant="primary"
        :disabled="isLoading"
        @click="newDocument"
      >
        {{ $trans('Add document(s)') }}
      </BButton>
    </footer>

    <b-container v-if="hasChanges">
      <b-row>
        <b-col cols="12">
          <BButton
            type="button"
            variant="secondary"
            :disabled="isLoading"
            @click="discardChanges"
          >
            {{ $trans('Discard changes') }}
          </BButton>
          &nbsp;
          <BButton
            type="button"
            variant="primary"
            :disabled="isLoading"
            @click="save"
          >
            <b-spinner small v-if="saving" />
            {{ $trans('Save changes') }}
          </BButton>
        </b-col>
      </b-row>
    </b-container>
  </details>
</template>

<script lang="ts" setup>
import {
  ApiResult,
  useQueryErrorToast,
} from '@/features/forms'
import RowAction from '@/components/RowAction.vue'
import DocumentEditFields from './DocumentEditFields.vue'
import {
  useDocumentCollection,
  type DocumentResource,
  type DocumentRow,
} from './use-document-collection'
import { fileListOf, readAsDataUrl } from '@/features/shared'
/**
 * The one document editor: the customer, equipment, location and quotation
 * panels are all this component with a different resource.
 *
 * Rows are read from the server, then added, edited and marked for deletion
 * locally, and `save` reconciles the whole set in one pass — uploads arrive
 * base64 inside JSON and each row is its own request. Which endpoint it talks
 * to is the caller's business: the resource (and with it the parent field) is
 * injected, so this editor never switches on a kind.
 *
 * Two things cross this component's seam: `parentCreated`, which a create form
 * calls once its own record exists (the panel mounts before that and reads
 * nothing until then), and `isView`, which is the only thing standing between
 * a detail page and its edit controls.
 */

/** A row plus the local state the editor adds to it. */
export interface EditedDocumentRow extends DocumentRow {
  user_can_view?: boolean
  /** Set once `save` has answered for this row, so the row can report itself. */
  status?: 'saved' | 'failed'
  /** An AxiosError; `ApiResult` reads `response.status`/`response.data` off it. */
  error?: Record<string, unknown> | null
}

const props = withDefaults(defineProps<{
  /** The endpoint this editor reads and writes; the parent field rides along. */
  resource: DocumentResource
  /** The record whose documents these are; null until a create form reports it. */
  parentId?: number | null
  /** `customer`, `equipment`, `location` or `quotation`; the field id prefix. */
  idPrefix: string
  /** On a detail page the panel is read-only: no add, edit or delete. */
  isView?: boolean
  /** Offer the "user can view" flag the customer documents carry. */
  showUserCanView?: boolean
}>(), {
  parentId: null,
  isView: false,
  showUserCanView: false,
})

const {create} = useToast()

const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'icons', label: ''},
]
const fieldsView = [
  {key: 'name', label: $trans('Name')},
]

/**
 * The id a create form reported through `parentCreated`. Props are read-only,
 * and a form's record does not exist when this panel mounts, so the id the
 * panel learns later is its own state and takes precedence once it arrives.
 */
const createdParentId = ref<number | null>(null)
const effectiveParentId = computed(() => createdParentId.value ?? props.parentId)

const collection = useDocumentCollection(props.resource, effectiveParentId)
useQueryErrorToast(collection.error, $trans('Error loading documents'))

const rows = ref<EditedDocumentRow[]>([])
const deleted = ref<EditedDocumentRow[]>([])
const dirty = ref(false)
const saving = ref(false)
const showAdd = ref(false)
const editRow = ref<EditedDocumentRow | null>(null)
const editIndex = ref<number | null>(null)

/**
 * Replace the staged set with the server's answer.
 *
 * The watch below calls this whenever the collection's rows change, but a
 * refetch that answers with identical data changes nothing - TanStack shares
 * the previous reference - so callers that need the server's truth back
 * regardless (discard, a clean save) call it directly after their refetch.
 */
function reloadRows(serverRows: readonly DocumentRow[]) {
  rows.value = serverRows.map((row) => ({...row}))
  deleted.value = []

  // An empty answer in edit mode opens the add form by itself; while the
  // read is pending or failed there is no answer yet, so nothing opens.
  if (!props.isView && rows.value.length === 0 && !collection.isLoading.value && collection.error.value == null) {
    showAdd.value = true
  }
}

watch(
  collection.rows,
  (serverRows) => {
    // Staged edits belong to the editor until it saves or discards them; a
    // background refetch must not overwrite them.
    if (dirty.value) return
    reloadRows(serverRows)
  },
  {immediate: true},
)

const isLoading = computed(() => collection.isLoading.value || saving.value)
const editing = computed(() => editRow.value !== null)
const showForm = computed(() => !props.isView && (editing.value || showAdd.value))
const hasChanges = computed(() =>
  dirty.value && !showForm.value && effectiveParentId.value != null
  && (rows.value.length > 0 || deleted.value.length > 0))
const failedRows = computed(() => rows.value.filter((row) => row.status === 'failed'))

const isDocumentValid = computed(() =>
  editRow.value !== null && editRow.value.file != null)

/** Where the row's file lives, when the server already has it. */
function linkOf(row: EditedDocumentRow): string | undefined {
  if (row.url) return row.url
  if (row.file?.startsWith('http')) return row.file
  return undefined
}

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
  const [row] = rows.value.splice(index, 1)
  // Only a row the server already has needs deleting; one that was never saved
  // simply stops existing.
  if (row.id) deleted.value.push(row)
  dirty.value = true
  infoToast(create, $trans('Marked for delete'), $trans('Document marked for delete'))
}

async function chooseFiles(event: Event | {files?: FileList}) {
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return

  const staged: EditedDocumentRow[] = []
  for (const file of files) {
    staged.push({
      name: file.name,
      description: '',
      file: await readAsDataUrl(file),
      ...(props.showUserCanView ? {user_can_view: true} : {}),
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

/**
 * What a row sends: its editable fields, without the editor's own state
 * (`url`, `status`, `error`) and without a stored file URL, which is not a
 * payload - the server keeps the file it has.
 */
function payloadOf(row: EditedDocumentRow): DocumentRow {
  const payload: DocumentRow = {
    id: row.id,
    name: row.name,
    description: row.description,
  }
  if (row.file && !row.file.startsWith('http')) payload.file = row.file
  if (props.showUserCanView) (payload as EditedDocumentRow).user_can_view = row.user_can_view ?? true
  return payload
}

async function save() {
  if (saving.value) return []
  if (!rows.value.length && !deleted.value.length) return []
  saving.value = true

  try {
    // Mounted-guaranteed on an edit, handed over on a create; either way a
    // missing parent fails loudly here rather than riding along as a null
    // body field.
    const parent = effectiveParentId.value
    if (parent == null) {
      errorToast(create, $trans('Error updating documents'))
      return []
    }

    const saved: EditedDocumentRow[] = []
    const failures: EditedDocumentRow[] = []

    for (const row of rows.value) {
      try {
        const payload = payloadOf(row)
        const result = row.id
          ? await collection.update(payload, parent)
          : await collection.create(payload, parent)
        saved.push({...result, status: 'saved'})
      } catch (error) {
        const failed = {...row, status: 'failed' as const, error: error as Record<string, unknown>}
        saved.push(failed)
        failures.push(failed)
      }
    }

    for (const row of deleted.value) {
      try {
        await collection.destroy(row.id as number)
      } catch (error) {
        const failed = {...row, status: 'failed' as const, error: error as Record<string, unknown>}
        saved.push(failed)
        failures.push(failed)
      }
    }

    deleted.value = []

    if (failures.length) {
      // The rows this just built - including each per-row result - stay staged
      // so the panel reports them; only the cached list is marked stale.
      rows.value = saved
      errorToast(create, $trans('Error updating documents'))
      await collection.invalidate()
    } else {
      infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
      dirty.value = false
      // The saved rows stay staged, but the list behind them is stale: reload
      // it the way a discard does, and mark the cached list stale with it.
      await collection.invalidate()
      await collection.refetch()
      reloadRows(collection.rows.value)
    }

    return failures
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

/**
 * Hand the panel the parent id it did not have when it mounted, then save.
 *
 * A create form renders this panel before its own record exists, and only
 * knows the new id once its own create answered. This is that moment: stamp
 * the staged rows with it and submit them.
 */
async function parentCreated(pk: number) {
  createdParentId.value = pk
  return save()
}

defineExpose({parentCreated, save, hasChanges: computed(() => hasChanges.value)})
</script>
