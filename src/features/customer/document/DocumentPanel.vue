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
import { customerDocumentListQueryKey } from '@/api/@tanstack/vue-query.gen'
import { fileListOf, readAsDataUrl } from '@/features/shared/file-helpers'
import { vCustomerDocumentRequest, vPatchedCustomerDocumentRequest } from '@/api/valibot.gen'
import { type DocumentRow } from './document-schemas'




const props = withDefaults(defineProps<{
  customer?: {id?: number} | null
  isView?: boolean
}>(), {
  customer: null,
  isView: false,
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



const customerId = computed(() => props.customer?.id)

const documentsQuery = useQuery({
  ...customerDocumentListOptions({query: {customer: customerId.value, page: 1}}),

  enabled: customerId.value !== undefined,
})

watch(
  () => documentsQuery.error.value,
  (error) => {
    if (error) errorToast(create, $trans('Error loading documents'))
  },
)



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
  () => documentsQuery.dataUpdatedAt.value,
  () => {
    const data = documentsQuery.data.value
    if (!data || dirty.value) return
    rows.value = (data.results ?? []).map(rowOf)
    deletedIds.value = []

    if (!props.isView && rows.value.length === 0) {
      showAdd.value = true
    }
  },
  {immediate: true},
)

const isLoading = computed(() => documentsQuery.isLoading.value || saving.value)




const showAdd = ref(false)

const editRow = ref<DocumentRow | null>(null)

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
  editRow.value = rows.value[index]
}

function cancelEditDocument() {
  showAdd.value = false
  editRow.value = null
}


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



const createMutation = useMutation({...customerDocumentCreateMutation()})
const updateMutation = useMutation({...customerDocumentPartialUpdateMutation()})
const destroyMutation = useMutation({...customerDocumentDestroyMutation()})

const saving = ref(false)

async function submitDocuments() {
  if (saving.value) return
  saving.value = true

  try {

    for (const row of rows.value) {

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
          body: v.parse(vPatchedCustomerDocumentRequest, body),
        })
      } else {
        await createMutation.mutateAsync({
          body: v.parse(vCustomerDocumentRequest, body),
        })
      }
    }
    for (const id of deletedIds.value) {
      await destroyMutation.mutateAsync({path: {id}})
    }

    infoToast(create, $trans('Updated'), $trans('Documents have been updated'))
    dirty.value = false
    await queryClient.invalidateQueries({queryKey: customerDocumentListQueryKey()})
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
  await documentsQuery.refetch()
}
</script>
