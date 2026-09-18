<template>
  <div>
    <h6>{{ $trans('Documents') }}</h6>

    <p v-if="!documents.length">
      <i>{{ $trans('No documents') }}</i>
    </p>
    <b-container
      v-else
      fluid="sm"
    >
      <b-row
        v-for="(document, index) of documents"
        :key="document.id ?? index"
        no-gutters
        style="padding-bottom: 10px"
      >
        <b-col :cols="isView ? 12 : 9">
          <BLink
            v-if="document.url"
            :href="document.url"
            target="_blank"
          >
            {{ document.name }} <IBiDownload font-scale=".8" />
          </BLink>
          <span v-else>{{ document.name }}</span>
        </b-col>
        <b-col
          v-if="!isView"
          cols="3"
        >
          <div class="h2 float-right">
            <RowAction icon="edit"
              :method="() => startEdit(index)"
              :title="$trans('Edit')"
            />
            <RowAction icon="delete"
              :title="$trans('Delete')"
              :method="() => markDeleted(index)"
            />
          </div>
        </b-col>
        <b-col
          v-if="document.status"
          cols="12"
        >
          <ApiResult
            :error="document.status === 'failed' ? document.error ?? undefined : undefined"
            :success-message="$trans('Document created')"
          />
        </b-col>
      </b-row>
    </b-container>

    <div v-if="showForm">
      <b-form>
        <p>{{ isEditing ? $trans('Edit document') : $trans('Add document(s)') }}</p>
        <BFormGroup
          :label="$trans('Choose files')"
          label-cols="3"
        >
          <b-form-file
            v-model="files"
            multiple
            :placeholder="$trans('Choose a file or drop it here...')"
          />
        </BFormGroup>

        <template v-if="isEditing">
          <DocumentEditFields
            id-prefix="equipment"
            v-model:name="draft.name"
            v-model:description="draft.description"
          />
        </template>
      </b-form>

      <footer class="modal-footer">
        <BButton
          class="m-2"
          type="button"
          size="sm"
          variant="secondary"
          @click="cancelEdit"
        >
          {{ $trans('Cancel') }}
        </BButton>
        <BButton
          v-if="isEditing"
          type="button"
          size="sm"
          variant="primary"
          @click="applyEdit"
        >
          {{ $trans('Edit document') }}
        </BButton>
      </footer>
    </div>

    <b-container
      v-if="hasChanges"
      class="pt-4"
    >
      <BButton
        type="button"
        size="sm"
        variant="secondary"
        @click="load"
      >
        {{ $trans('Discard changes') }}
      </BButton>
      &nbsp;
      <BButton
        type="button"
        size="sm"
        variant="primary"
        @click="save"
      >
        {{ $trans('Save changes') }}
      </BButton>
    </b-container>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'bootstrap-vue-next'
import ApiResult from '@/features/forms/ApiResult.vue'
import RowAction from '@/components/RowAction.vue'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { readAsDataUrl } from '@/features/shared/file-helpers'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { useDocumentCollection, type DocumentRow } from '@/features/documents/use-document-collection'
import DocumentEditFields from '@/features/documents/DocumentEditFields.vue'
import { equipmentDocumentResource, locationDocumentResource } from './document-resources'

/**
 * The document panel a record's form and detail page both show.
 *
 * A small editor over one collection: rows are read from the server, then
 * added, edited and marked for deletion locally, and `save` reconciles the
 * whole set in one pass. That shape is the server's - uploads arrive base64
 * inside JSON and each row is its own request - so the panel reconciles rather
 * than saving per field.
 *
 * Which endpoint it talks to is `useDocumentCollection`'s business; this
 * component is the same editor either way.
 *
 * Two things cross this component's seam and are pinned by a spec of their
 * own, because nothing else fails when they break: `parentCreated`, which a
 * create form calls once its own record exists, and `isView`, which is the
 * only thing standing between a detail page and its edit controls.
 */
const props = withDefaults(defineProps<{
  /**
   * Which record's documents these are.
   *
   * Explicit rather than inferred from which of the two props below is set: the
   * panel resolves its endpoint once, at setup, and "is the prop absent?" is not
   * a contract. A create form holds no record yet, and a panel that read that as
   * "so this must be equipment" would send a location's uploads to the equipment
   * endpoint - a wrong path whose body still validates, which is the worst kind
   * of wrong.
   */
  kind: 'equipment' | 'location'
  /** The location whose documents these are, when `kind` is `location`. */
  location?: {id?: number} | null
  /** The equipment whose documents these are, when `kind` is `equipment`. */
  equipment?: {id?: number} | null
  /** On a detail page the panel is read-only: no add, edit or delete. */
  isView?: boolean
}>(), {
  location: null,
  equipment: null,
  isView: false,
})

/** A row plus the local state the editor adds to it. */
interface EditedRow extends DocumentRow {
  /** Set once `save` has answered for this row, so the row can report itself. */
  status?: 'saved' | 'failed'
  /** An AxiosError; `ApiResult` reads `response.status`/`response.data` off it. */
  error?: Record<string, unknown> | null
}

/**
 * The id a create form reported through `parentCreated`. Props are read-only, and
 * a form's record does not exist when this panel mounts, so the id the panel
 * learns later is its own state and takes precedence once it arrives.
 */
const createdParentId = ref<number | null>(null)
const parentId = computed(() => createdParentId.value
  ?? ((props.kind === 'location' ? props.location?.id : props.equipment?.id) ?? null))

const collection = useDocumentCollection(
  props.kind === 'location' ? locationDocumentResource : equipmentDocumentResource,
  parentId,
)
useQueryErrorToast(collection.error, $trans('Error loading documents'))

/** The rows as the editor holds them, before the server has answered. */
const documents = ref<EditedRow[]>([])
const deleted = ref<EditedRow[]>([])
const draft = ref<EditedRow>({})
const files = ref<File[]>([])
const editingIndex = ref<number | null>(null)
const dirty = ref(false)

const {create} = useToast()

watch(collection.rows, (rows) => {
  // Staged edits belong to the editor until it saves or discards them; a
  // background refetch must not overwrite them (the customer panel guards
  // the same way).
  if (dirty.value) return
  documents.value = rows.map((row) => ({...row}))
  deleted.value = []
}, {immediate: true})

const isEditing = computed(() => editingIndex.value !== null)
const showForm = computed(() => !props.isView && (isEditing.value || documents.value.length === 0))
const hasChanges = computed(() => dirty.value && !showForm.value && parentId.value != null)

function load() {
  dirty.value = false
  return collection.refetch()
}

function startEdit(index: number) {
  draft.value = {...documents.value[index]}
  editingIndex.value = index
}

function applyEdit() {
  const index = editingIndex.value
  if (index === null) return
  documents.value.splice(index, 1, {...draft.value})
  editingIndex.value = null
  dirty.value = true
}

function cancelEdit() {
  editingIndex.value = null
  draft.value = {}
}

function markDeleted(index: number) {
  const [row] = documents.value.splice(index, 1)
  // Only a row the server already has needs deleting; one that was never saved
  // simply stops existing.
  if (row.id) deleted.value.push(row)
  dirty.value = true
  infoToast(create, $trans('Marked for delete'), $trans('Document marked for delete'))
}

// No parent guard here on purpose: a create form renders this panel before its
// record exists, and the rows it stages are stamped by `parentCreated`.
watch(files, async (picked) => {
  if (!picked.length) return

  for (const file of picked) {
    documents.value.push({
      name: file.name,
      description: '',
      file: await readAsDataUrl(file),
    })
  }

  files.value = []
  draft.value = {}
  dirty.value = true
})

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

async function save() {
  if (!documents.value.length && !deleted.value.length) return []

  const parent = parentId.value
  if (parent == null) {
    errorToast(create, $trans('Error updating documents (no equipment or location)'))
    return []
  }

  const saved: EditedRow[] = []
  const failures: EditedRow[] = []

  for (const row of documents.value) {
    // A row the server already has holds the API's URL in `file`, which is not
    // a payload: the server keeps the file it has.
    if (row.file?.startsWith('http')) delete row.file

    try {
      const result = row.id
        ? await collection.update(row, parent)
        : await collection.create(row, parent)
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

  documents.value = saved
  deleted.value = []

  if (failures.length) {
    errorToast(create, $trans('Error updating documents'))
  } else {
    infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
    dirty.value = false
  }

  // Refetching here would replace the rows this just built - including the
  // per-row result the panel is showing - so the cached list is only marked
  // stale and a later mount re-reads it.
  await collection.invalidate()

  return failures
}

defineExpose({parentCreated})
</script>
