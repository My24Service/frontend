<template>
  <div
    v-if="checklists.length"
    class="panel col-1-3 filled-checklists"
  >
    <div
      v-for="(item, index) in checklists"
      :key="index"
      class="section filled-checklist"
    >
      <h6 class="checklist-title">
        {{ item.checklist.name }}<template v-if="item.equipment"> - {{ item.equipment.name }}</template>
      </h6>
      <p class="checklist-user dimmed">{{ item.user }}</p>

      <dl
        v-if="item.score !== null || item.rejected_count !== null || item.valid_until"
        class="checklist-result"
      >
        <template v-if="item.score !== null">
          <dt>{{ $trans('Condition score') }}</dt>
          <dd class="checklist-score">{{ item.score }}</dd>
        </template>
        <template v-if="item.rejected_count !== null">
          <dt>{{ $trans('Rejected points') }}</dt>
          <dd class="checklist-rejected">{{ item.rejected_count }}</dd>
        </template>
        <template v-if="item.valid_until">
          <dt>{{ $trans('Valid until') }}</dt>
          <dd class="checklist-valid-until">{{ displayIsoDate(item.valid_until) }}</dd>
        </template>
      </dl>

      <template
        v-for="(group, groupIndex) in groupQuestions(item.questions)"
        :key="groupIndex"
      >
        <h6
          v-if="group.name"
          class="checklist-group"
        >{{ group.name }}</h6>
        <table class="table table-sm data-table">
          <tbody>
            <tr
              v-for="(question, questionIndex) in group.questions"
              :key="questionIndex"
              class="checklist-answer"
            >
              <td class="question">
                {{ question.question }}
                <small
                  v-if="question.part_name"
                  class="dimmed part-name"
                >({{ question.part_name }})</small>
              </td>
              <td class="result">
                <span
                  v-if="question.result"
                  :class="resultClass(question.result)"
                >{{ resultLabel(question.result) }}</span>
              </td>
              <td class="answer">
                {{ question.answer }}
                <div
                  v-if="question.photos?.length"
                  class="photos"
                >
                  <!-- No lightbox: a click opens the photo itself, in a new tab. -->
                  <a
                    v-for="photo in question.photos"
                    :key="photo.url"
                    :href="photo.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="photo"
                  ><img
                    :src="photo.url"
                    :alt="$trans('Photo')"
                  ></a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
      <small
        v-if="item.questions.length === 0"
        class="dimmed"
      >{{ $trans('No answers') }}</small>

      <table
        v-if="item.parts.length"
        class="table table-sm data-table part-scores"
      >
        <thead>
          <tr>
            <th>{{ $trans('Part') }}</th>
            <th>{{ $trans('Condition score') }}</th>
            <th>{{ $trans('Rejected points') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="part in item.parts"
            :key="part.name"
          >
            <td>{{ part.name }}</td>
            <td>{{ part.score }}</td>
            <td>{{ part.rejected_count }}</td>
          </tr>
        </tbody>
      </table>

      <div
        v-if="item.remarks"
        class="checklist-remarks"
      >
        <h6>{{ $trans('General remark') }}</h6>
        <p>{{ item.remarks }}</p>
      </div>

      <div class="flex-columns signatures">
        <div class="signature">
          <p>{{ $trans('Name employee') }}: {{ item.signatures.signature_name_user }}</p>
          <img
            v-if="item.signatures.signature_user"
            :src="item.signatures.signature_user"
            :alt="$trans('Signature employee')"
          >
        </div>
        <div class="signature">
          <p>{{ $trans('Name customer') }}: {{ item.signatures.signature_name_customer }}</p>
          <img
            v-if="item.signatures.signature_customer"
            :src="item.signatures.signature_customer"
            :alt="$trans('Signature customer')"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { orderOrderChecklistsListOptions } from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms'
import { displayIsoDate, groupQuestions, resultClass, resultLabel } from './inspection'

/**
 * The checklists engineers finished for an order, read-only: one block per
 * finished checklist. Filling one in is the engineer's job in the app, so
 * there is nothing to edit here.
 *
 * It reads the order's `checklists` action, not the answer and signature
 * lists: the action also returns the checklists a partner tenant filled in for
 * a copy of this order, so a planner of the tenant that made the order sees
 * them. Planning users only.
 *
 * An order nobody finished a checklist for renders nothing at all, which is
 * most orders.
 */
const props = defineProps<{
  orderId: number
}>()

const checklistsQuery = useQuery(() => orderOrderChecklistsListOptions({path: {id: props.orderId}}))

useQueryErrorToast(checklistsQuery.error, $trans('Error loading checklists'))

const checklists = computed(() => checklistsQuery.data.value ?? [])
</script>

<style scoped>
.answer {
  white-space: pre-line;
}
.checklist-group {
  margin-top: 1rem;
}
.checklist-result {
  display: grid;
  grid-template-columns: max-content auto;
  column-gap: 1rem;
}
.photos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}
.photo img {
  width: 64px;
  height: 64px;
  object-fit: cover;
}
.signatures {
  gap: 1rem;
  margin-top: 1rem;
}
.signature img {
  max-width: 100%;
  width: 200px;
}
</style>
