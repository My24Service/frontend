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

      <table
        v-if="item.questions.length"
        class="table table-sm data-table"
      >
        <thead>
          <tr>
            <th>{{ $trans('Question') }}</th>
            <th>{{ $trans('Answer') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(question, questionIndex) in item.questions"
            :key="questionIndex"
            class="checklist-answer"
          >
            <td class="question">{{ question.question }}</td>
            <td class="answer">{{ question.answer }}</td>
          </tr>
        </tbody>
      </table>
      <small
        v-else
        class="dimmed"
      >{{ $trans('No answers') }}</small>

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
.signatures {
  gap: 1rem;
  margin-top: 1rem;
}
.signature img {
  max-width: 100%;
  width: 200px;
}
</style>
