<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form>
        <h2 v-if="isCreate">{{ $trans('New checklist') }}</h2>
        <h2 v-if="!isCreate">{{ $trans('Edit checklist') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <BFormGroup
              label-size="sm"
              :label="$trans('Name')"
              label-for="checklist_name"
            >
              <BFormInput
                v-model="checklist.name"
                id="checklist_name"
                size="sm"
                autofocus
                :state="submitClicked ? !errors.name : null"
              ></BFormInput>
              <b-form-invalid-feedback
                id="checklist_name-feedback"
                :state="submitClicked ? !errors.name : null">
                {{ errors.name || PLACEHOLDERS.name() }}
              </b-form-invalid-feedback>
            </BFormGroup>
          </b-col>
        </b-row>

        <div class="checklist-questions section">
          <h6>{{ $trans('Questions') }}</h6>
          <p v-if="questions.rows.value.length === 0" class="text-muted">
            {{ $trans('This checklist has no questions yet') }}
          </p>
          <b-row
            v-for="(row, index) of questions.rows.value"
            :key="row.id ?? `new-${index}`"
            class="checklist-question"
            no-gutters
          >
            <b-col cols="11" role="group" class="pr-2">
              <BFormInput
                v-model="row.question"
                :id="`checklist_question-${index}`"
                size="sm"
                :aria-label="$trans('Question')"
                :state="submitClicked ? !questionError(row) : null"
              ></BFormInput>
              <b-form-invalid-feedback :state="submitClicked ? !questionError(row) : null">
                {{ questionError(row) }}
              </b-form-invalid-feedback>
            </b-col>
            <b-col cols="1">
              <BButton
                class="remove-question"
                variant="light"
                size="sm"
                :title="$trans('Delete')"
                @click="questions.remove(index)"
              ><IBiTrash /></BButton>
            </b-col>
          </b-row>
          <BButton
            class="add-question"
            type="button"
            size="sm"
            variant="outline-primary"
            @click="addQuestion"
          >
            {{ $trans('Add question') }}
          </BButton>
        </div>

        <div class="mx-auto">
          <footer class="modal-footer">
            <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
              {{ $trans('Cancel') }}
            </BButton>
            <BButton @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </BButton>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script lang="ts" setup>
import { useQueryErrorToast, useResourceForm, useStagedRows } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'
import { invalidateChecklistQueries } from './invalidation'
import {
  checklistWrite,
  emptyChecklist,
  PLACEHOLDERS,
  questionError,
  questionFromRecord,
  type ChecklistFieldErrors,
  type QuestionRow,
} from './schemas'

/**
 * The checklist create/edit form: its name and its questions on one screen,
 * because a question means nothing outside its checklist.
 *
 * The questions are a resource of their own, so the save is a sequence: the
 * checklist, then each staged question against its id. A failure past the
 * checklist write reports as a failed save and keeps the user on the form; a
 * retry then updates what already landed instead of creating it twice.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const questions = useStagedRows<QuestionRow>(() => ({question: ''}))

/** The stored text per question id, so a save only rewrites the ones that changed. */
const stored = new Map<number, string>()

const createQuestion = useMutation(Api.ChecklistChecklistQuestion.create.mutation())
const updateQuestion = useMutation(Api.ChecklistChecklistQuestion.update.mutation())
const destroyQuestion = useMutation(Api.ChecklistChecklistQuestion.destroy.mutation())

const {
  values: checklist,
  errors,
  submitClicked,
  isCreate,
  id,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitForm,
  cancelForm,
} = useResourceForm<Api.ChecklistChecklist.CreateInput, Api.Checklist, ReturnType<typeof checklistWrite.parse>, ChecklistFieldErrors>({
  pk: () => props.pk,
  resource: Api.ChecklistChecklist,
  invalidate: invalidateChecklistQueries,
  empty: emptyChecklist,
  fromRecord: (record) => ({name: record.name}),
  validate: (values, context) => {
    // The API strips a question before it checks it, so spaces alone are blank.
    for (const row of questions.rows.value) row.question = row.question.trim()
    const found: ChecklistFieldErrors = checklistWrite.validate(values, context)
    const refused = questions.rows.value.map(questionError).find((error) => error !== undefined)
    if (refused) found.questions = refused
    return found
  },
  parse: (values, context) => checklistWrite.parse(values, context),
  onSaved: async (result, context) => {
    const checklistId = context.isCreate ? (result as Api.Checklist).id : context.id
    await questions.replay(checklistId, {
      create: async (row, parent) => {
        const created = await createQuestion.mutateAsync({body: {checklist: parent, question: row.question}})
        stored.set(created.id, created.question)
        return created
      },
      update: async (questionId, row) => {
        if (stored.get(questionId) === row.question) return
        await updateQuestion.mutateAsync({path: {id: questionId}, body: {question: row.question}})
        stored.set(questionId, row.question)
      },
      destroy: (questionId) => destroyQuestion.mutateAsync({path: {id: questionId}}),
    })
  },
  copy: {
    fetchError: $trans('Error fetching checklist'),
    created: $trans('Created'),
    createdDetail: $trans('Checklist has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Checklist has been updated'),
    createError: $trans('Error creating checklist'),
    updateError: $trans('Error updating checklist'),
  },
})

// Every question of this checklist, not the first page of them: 1000 is the
// API's ceiling for one response. They arrive in the checklist's own order.
const questionsQuery = useQuery(() => ({
  ...Api.ChecklistChecklistQuestion.list.options({
    query: {checklist: isCreate.value ? undefined : id.value, page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE},
  }),
  enabled: !isCreate.value,
}))

useQueryErrorToast(questionsQuery.error, $trans('Error loading questions'))

// Seeded once per checklist: the refetch a save or a window focus triggers
// must not replace what the user has typed since.
let seededFor: number | null = null

watch(
  [() => questionsQuery.data.value, id, isCreate],
  ([page, checklistId, creating]) => {
    if (creating || !page || seededFor === checklistId) return
    seededFor = checklistId
    const own = page.results ?? []
    stored.clear()
    for (const question of own) stored.set(question.id, question.question)
    questions.seed(own.map(questionFromRecord))
  },
  {immediate: true},
)

function addQuestion() {
  questions.rows.value.push({question: ''})
}

const isLoading = computed(() => baseIsLoading.value || questionsQuery.isLoading.value)
</script>

<style scoped>
.checklist-questions {
  margin-top: 1.5rem;
}
.checklist-question {
  align-items: flex-start;
  gap: 0.5rem;
  flex-wrap: nowrap;
  padding-bottom: 10px;
}
</style>
