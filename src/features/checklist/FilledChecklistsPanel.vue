<template>
  <div
    v-if="visits.length"
    class="panel col-1-3 filled-checklists"
  >
    <div
      v-for="visit in visits"
      :key="visit.assignedOrder"
      class="section filled-checklist"
    >
      <h6>{{ $trans('Checklist') }}</h6>
      <table
        v-if="visit.answers.length"
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
            v-for="answer in visit.answers"
            :key="answer.id"
          >
            <td>{{ answer.question_text }}</td>
            <td class="answer">{{ answer.answer }}</td>
          </tr>
        </tbody>
      </table>
      <small
        v-else
        class="dimmed"
      >{{ $trans('No answers') }}</small>

      <div
        v-for="signature in visit.signatures"
        :key="signature.id"
        class="flex-columns signatures"
      >
        <div class="signature">
          <p>{{ $trans('Name employee') }}: {{ signature.signature_name_user }}</p>
          <img
            v-if="signature.signature_user"
            :src="signature.signature_user"
            :alt="$trans('Signature employee')"
          >
        </div>
        <div class="signature">
          <p>{{ $trans('Name customer') }}: {{ signature.signature_name_customer }}</p>
          <img
            v-if="signature.signature_customer"
            :src="signature.signature_customer"
            :alt="$trans('Signature customer')"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQueryErrorToast } from '@/features/forms'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

/**
 * The checklists engineers filled in for an order, read-only: per assigned
 * order its answers and the signatures given under them. Filling one in is the
 * engineer's job in the app, so there is nothing to edit here.
 *
 * An order nobody filled a checklist in for renders nothing at all, which is
 * most orders.
 */
const props = defineProps<{
  orderId: number
}>()

const whole = {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}

const answersQuery = useQuery(() =>
  Api.MobileChecklistAnswer.list.options({query: {order: props.orderId, ...whole}}))
const signaturesQuery = useQuery(() =>
  Api.MobileChecklistSignature.list.options({query: {order: props.orderId, ...whole}}))

useQueryErrorToast(answersQuery.error, $trans('Error loading checklist answers'))
useQueryErrorToast(signaturesQuery.error, $trans('Error loading checklist signatures'))

interface Visit {
  assignedOrder: number
  answers: Api.AssignedOrderChecklistAnswer[]
  signatures: Api.AssignedOrderChecklistSignature[]
}

/** One entry per assigned order, in the order the API first names each. */
const visits = computed<Visit[]>(() => {
  const byAssignedOrder = new Map<number, Visit>()
  const visitOf = (assignedOrder: number) => {
    let visit = byAssignedOrder.get(assignedOrder)
    if (!visit) {
      visit = {assignedOrder, answers: [], signatures: []}
      byAssignedOrder.set(assignedOrder, visit)
    }
    return visit
  }
  for (const answer of answersQuery.data.value?.results ?? []) visitOf(answer.assigned_order).answers.push(answer)
  for (const signature of signaturesQuery.data.value?.results ?? []) visitOf(signature.assigned_order).signatures.push(signature)
  return [...byAssignedOrder.values()]
})
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
