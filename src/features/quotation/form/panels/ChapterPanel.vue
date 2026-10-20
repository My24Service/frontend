<template>
  <b-overlay :show="isLoading" rounded="sm">
    <h5>{{ $trans('Chapters') }}</h5>

    <div>
      <b-modal
        id="delete-chapter-modal"
        ref="delete-chapter-modal"
        :title="$trans('Delete?')"
        @ok="doDelete"
      >
        <p class="my-4">
          {{ $trans("Are you sure you want to delete this chapter, it's quotation lines and costs?") }}
        </p>
      </b-modal>

      <div v-if="!chapters.length && isView">
        <p><i>{{ $trans('No chapters') }}</i></p>
      </div>

      <b-table
        small
        :busy="isLoading"
        :fields="fields"
        :items="chapters"
        responsive="md"
        class="data-table"
        v-if="!showForm && chapters.length"
      >
        <template #cell(chapter)="data">
          <h6>
            <BLink @click.prevent="emit('chapter-loaded', data.item)">
              {{ data.item.name }}
            </BLink>
          </h6>
          <p>{{ data.item.description }}</p>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right" v-if="editable">
            <RowAction icon="edit" :method="() => editChapter(data.item)" :title="$trans('Edit')" class="pr-2" />
            <RowAction icon="delete" :title="$trans('Delete')" :method="() => showDeleteModal(data.item.id)" />
          </div>
        </template>
      </b-table>

      <div v-if="showForm">
        <h3>{{ editing.id ? $trans('Edit chapter') : $trans('New chapter') }}</h3>
        <ValidatedForm
          name="chapter"
          v-model="editing"
          :errors="errors"
          :labels="FIELD_LABELS"
          :submitted="submitClicked"
        >
          <ValidatedFormField name="name" label-cols="3" />
          <ValidatedFormField name="description" textarea label-cols="3" />
        </ValidatedForm>

        <footer class="modal-footer">
          <BButton :disabled="isLoading" @click="cancelEdit" class="btn btn-secondary update-button" type="button" size="sm" variant="secondary">
            {{ $trans('Cancel') }}
          </BButton>
          <BButton v-if="editing.id" @click="submitChapter" class="btn btn-primary" size="sm" type="button" variant="warning">
            {{ $trans('Edit chapter') }}
          </BButton>
          <BButton v-else @click="submitChapter" class="btn btn-primary" size="sm" type="button" variant="primary">
            {{ $trans('Add chapter') }}
          </BButton>
        </footer>
      </div>

      <footer class="modal-footer" v-if="!showForm && editable">
        <BButton @click="newChapter" class="btn btn-primary update-button" type="button" variant="primary">
          {{ $trans('New chapter') }}
        </BButton>
      </footer>
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import * as v from 'valibot'

import RowAction from '@/components/RowAction.vue'
import {
  fieldErrors,
  useQueryErrorToast,
  ValidatedForm,
  ValidatedFormField,
  type FieldErrors,
} from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/**
 * A quotation's chapters: the list (a name opens the chapter's lines and
 * costs), and on a preliminary quotation the add/edit form and the delete.
 * With no chapters yet the new-chapter form opens by itself.
 */
const props = withDefaults(defineProps<{
  quotation: Pick<Api.Quotation, 'id' | 'preliminary'>
  isView?: boolean
}>(), {isView: false})

const emit = defineEmits<{
  'chapter-created': [chapter: Api.Chapter]
  'chapter-loaded': [chapter: Api.Chapter]
}>()

const { toast: create, queryClient } = useCommon()

const FIELD_LABELS = {
  name: () => $trans('Name'),
  description: () => $trans('Description'),
}

const fields = [
  {key: 'chapter', label: $trans('Chapter'), thAttr: {width: '80%'}},
  {key: 'icons', label: '', thAttr: {width: '20%'}},
]

const chaptersQuery = useQuery(() => Api.QuotationChapter.list.options({
  query: {quotation: props.quotation.id, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
}))
useQueryErrorToast(chaptersQuery.error, $trans('Error loading chapters'))
const chapters = computed(() => chaptersQuery.data.value?.results ?? [])

const editable = computed(() => !props.isView && Boolean(props.quotation.preliminary))

type ChapterDraft = {id?: number; name: string; description: string | null}
const editing = ref<ChapterDraft>({name: '', description: null})
const formOpen = ref(false)
const submitClicked = ref(false)
const errors = ref<FieldErrors<'name' | 'description'>>({})
const showForm = computed(() => !props.isView && formOpen.value)

// An empty quotation has nothing to list: start with the form for the first chapter.
watch(() => chaptersQuery.data.value?.results?.length, (count) => {
  if (count === 0 && !props.isView) newChapter()
}, {immediate: true})

const createMutation = useMutation(Api.QuotationChapter.create.mutation())
const updateMutation = useMutation(Api.QuotationChapter.update.mutation())
const destroyMutation = useMutation(Api.QuotationChapter.destroy.mutation())
const isLoading = computed(() => chaptersQuery.isLoading.value || createMutation.isPending.value
  || updateMutation.isPending.value || destroyMutation.isPending.value)

function newChapter() {
  editing.value = {name: '', description: null}
  submitClicked.value = false
  errors.value = {}
  formOpen.value = true
}
function editChapter(chapter: Api.Chapter) {
  editing.value = {id: chapter.id, name: chapter.name, description: chapter.description ?? null}
  submitClicked.value = false
  errors.value = {}
  formOpen.value = true
}
function cancelEdit() {
  formOpen.value = false
}

async function submitChapter() {
  submitClicked.value = true
  const values = {quotation: props.quotation.id, name: editing.value.name, description: editing.value.description || null}
  errors.value = fieldErrors(schemas.vChapterRequest, values, {}, FIELD_LABELS)
  if (Object.keys(errors.value).length) return
  const body = v.parse(schemas.vChapterRequest, values)
  try {
    if (editing.value.id) {
      await updateMutation.mutateAsync({path: {id: editing.value.id}, body})
    } else {
      emit('chapter-created', await createMutation.mutateAsync({body}))
    }
    formOpen.value = false
    await Api.QuotationChapter.invalidate(queryClient)
  } catch {
    errorToast(create, editing.value.id ? $trans('Error updating chapter') : $trans('Error creating chapter'))
  }
}

const deleteModal = useTemplateRef<{show: () => void}>('delete-chapter-modal')
const deletePk = ref<number | null>(null)
function showDeleteModal(id: number) {
  deletePk.value = id
  deleteModal.value?.show()
}
async function doDelete() {
  if (deletePk.value === null) return
  try {
    await destroyMutation.mutateAsync({path: {id: deletePk.value}})
    infoToast(create, $trans('Deleted'), $trans('Chapter has been deleted'))
    await Api.QuotationChapter.invalidate(queryClient)
  } catch {
    errorToast(create, $trans('Error deleting chapter'))
  }
}
</script>
