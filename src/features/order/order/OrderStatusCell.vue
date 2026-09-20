<template>
  <StatusCell
    :row-id="order.id"
    :title="order.last_status_full"
    :color="color"
    :statuscodes="statuscodes"
    :selected="selected"
    :is-pending="isPending"
    :current="current"
    :current-code="currentCode"
    @change="change"
  />
</template>

<script lang="ts" setup>
import { orderStatusCreateMutation } from '@/api/@tanstack/vue-query.gen'
import type { Order, Statuscode } from '@/api/types.gen'
import { $trans, errorToast } from '@/services/i18n'
import StatusCell from '@/features/shared/StatusCell.vue'
import { useStatusCell } from '@/features/shared/use-status-cell'

/**
 * An order's last status as a coloured select: picking another code posts a
 * new status row for the order. The legacy `TableStatusInfo` did the same for
 * orders, invoices and quotations through their model services; this is the
 * order-only version on the generated op, kept to the same element ids.
 *
 * The row carries its statuscode id and colour, so the current option is the
 * code with that id and the dot is the row's colour — no string matching.
 */
const props = defineProps<{
  order: Pick<Order, 'id' | 'last_status' | 'last_status_full' | 'statuscode_id' | 'color'>
  statuscodes: Statuscode[]
}>()

const emit = defineEmits<{changed: [status: string]}>()

const {create} = useToast()
const {mutateAsync} = useMutation({...orderStatusCreateMutation()})

// The select keeps showing the attempted status once its write lands, until
// the list reload answers for the row; a failed write rolls it back to the
// row's status rather than displaying a value nothing stored.
const {currentCode, current, selected, color, isPending, change} = useStatusCell({
  row: () => props.order,
  statuscodes: () => props.statuscodes,
  write: (status) => mutateAsync({body: {order: props.order.id, status}}),
  keepOptimisticOnSuccess: true,
  onSuccess: (status) => emit('changed', status),
  onError: () => errorToast(create, $trans('Error creating status')),
})
</script>
