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
      <table
        v-else
        id="order-document-table"
        class="table table-sm data-table"
      >
        <thead>
          <tr>
            <th>{{ $trans('Name') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="row.id ?? `new-${index}`"
          >
            <td>{{ row.name }}</td>
            <td>
              <div class="h2 float-end">
                <RowAction icon="edit"
                  :method="() => editDocument(index)"
                  :title="$trans('Edit')"
                />
                <RowAction icon="delete"
                  :title="$trans('Delete')"
                  :method="() => deleteDocument(index)"
                />
              </div>
            </td>          </tr>
        </tbody>
      </table>
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

      <b-form v-else-if="rowEdit">
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
        <BFormGroup
          label-cols="3"
          :label="$trans('Name')"
          label-for="order-document-name"
        >
          <BFormInput
            id="order-document-name"
            v-model="rowEdit.name"
            size="sm"
          />
        </BFormGroup>
        <BFormGroup
          label-cols="3"
          :label="$trans('Description')"
          label-for="order-document-description"
        >
          <BFormTextarea
            id="order-document-description"
            v-model="rowEdit.description"
            rows="1"
          />
        </BFormGroup>
      </b-form>

      <footer class="modal-footer">
        <BButton
          type="button"
          size="sm"
          variant="secondary"
          @click="cancelEditDocument"
        >
          {{ $trans('Cancel') }}
        </BButton>
        <BButton
          v-if="editing"
          size="sm"
          type="button"
          variant="warning"
          @click="commitEditDocument"
        >
          {{ $trans('Edit document') }}
        </BButton>
      </footer>
    </div>

    <footer
      v-if="!showForm"
      class="modal-footer"
    >
      <BButton
        type="button"
        variant="primary"
        @click="showAdd = true"
      >
        {{ $trans('Add document(s)') }}
      </BButton>
    </footer>
  </details>
</template>

<script lang="ts" setup>
import * as v from 'valibot'
import {
  orderDocumentCreateMutation,
  orderDocumentDestroyMutation,
  orderDocumentPartialUpdateMutation,
} from '@/api/@tanstack/vue-query.gen'
import type { OrderDocument } from '@/api/types.gen'
import { vOrderDocumentRequest, vPatchedOrderDocumentRequest } from '@/api/valibot.gen'
import RowAction from '@/components/RowAction.vue'
import { fileListOf, readAsDataUrl } from '@/features/shared/file-helpers'
import { $trans, infoToast } from '@/services/i18n'
import { useStagedRows } from './use-staged-rows'

/**
 * The order's documents, staged in the form and replayed with the order's
 * save: new files POSTed, edited rows PATCHed, removed ids DELETEd. The
 * form hands over the detail's `documents` (an edit) or nothing (a create)
 * and calls `replay(orderId)` once the order exists.
 *
 * The Customer Slice's `DocumentPanel` is the same shape with its own save
 * button and a `user_can_view` flag; the order's documents have neither.
 */
type DocumentRow = {
  id?: number
  name: string
  description: string
  /** A newly chosen file as a data URL; absent on a stored document. */
  file?: string
}

const props = defineProps<{
  documents: OrderDocument[]
}>()

const {create} = useToast()

// The staging the orderlines and infolines share; this panel adds only the
// file picking and the add/edit form the documents need.
const {
  rows,
  rowEdit,
  isEditing: editing,
  seed,
  edit,
  commitEdit,
  cancelEdit,
  remove,
  replay: replayRows,
} = useStagedRows<DocumentRow>(() => ({name: '', description: ''}))

/** Whether anything is staged since the last seed or replay. */
const dirty = ref(false)
const hasChanges = computed(() => dirty.value)

function seedRows(documents: OrderDocument[]) {
  seed(documents.map((record) => ({
    id: record.id,
    name: record.name ?? record.filename,
    description: record.description ?? '',
  })))
  dirty.value = false
}

watch(
  () => props.documents,
  (documents) => seedRows(documents),
  {immediate: true},
)

const showAdd = ref(false)
const showForm = computed(() => editing.value || showAdd.value)

function editDocument(index: number) {
  edit(index)
}

function commitEditDocument() {
  commitEdit()
  dirty.value = true
}

function cancelEditDocument() {
  showAdd.value = false
  cancelEdit()
}

function deleteDocument(index: number) {
  const stored = rows.value[index].id !== undefined
  if (stored) {
    infoToast(create, $trans('Marked for delete'), $trans('Document marked for delete'))
  }
  remove(index)
  // Staging a file and removing it again leaves nothing to write; removing a
  // stored row does. A staged-then-removed file may leave the flag raised,
  // which only replays the untouched rows — what the save always did.
  if (stored) dirty.value = true
}

async function chooseFiles(event: Event | {files?: FileList}) {
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return
  for (const file of files) {
    rows.value.push({name: file.name, description: '', file: await readAsDataUrl(file)})
  }
  showAdd.value = false
  dirty.value = true
}

async function chooseReplacement(event: Event | {files?: FileList}) {
  const files = Array.from(fileListOf(event))
  if (files.length === 0) return
  rowEdit.value.file = await readAsDataUrl(files[0])
}

const createMutation = useMutation({...orderDocumentCreateMutation()})
const updateMutation = useMutation({...orderDocumentPartialUpdateMutation()})
const destroyMutation = useMutation({...orderDocumentDestroyMutation()})

function bodyOf(row: DocumentRow, order: number) {
  return {
    order,
    name: row.name,
    description: row.description,
    ...(row.file ? {file: row.file} : {}),
  }
}

async function replay(orderId: number) {
  const result = await replayRows(orderId, {
    create: (row, parent) => createMutation.mutateAsync({body: v.parse(vOrderDocumentRequest, bodyOf(row, parent))}),
    update: (id, row, parent) => updateMutation.mutateAsync({path: {id}, body: v.parse(vPatchedOrderDocumentRequest, bodyOf(row, parent))}),
    destroy: (id) => destroyMutation.mutateAsync({path: {id}}),
  })
  // A failed replay throws past this line, so the flag stays raised and a
  // retry replays what is left; a clean replay leaves nothing staged.
  dirty.value = false
  return result
}

defineExpose({replay, hasChanges})
</script>
