<template>
  <span
    class="status"
    :title="order.last_status_full ?? undefined"
    :style="{'--status-color': color}"
  >
    <IBiCircleFill
      class="color-icon"
      :style="`color:${color}`"
    />
    <select
      v-if="statuscodes.length"
      :id="`${order.id}-change-status`"
      class="form-select form-select-sm"
      :aria-label="$trans('Change status')"
      :disabled="isPending"
      :value="selected"
      style="border-color: transparent;"
      @change="onChange"
    >
      <option
        v-for="code in statuscodes"
        :key="code.statuscode"
        :value="code.statuscode"
      >{{ code.statuscode }}</option>
    </select>
  </span>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import { orderStatusCreateMutation } from '@/api/@tanstack/vue-query.gen'
import type { Order, Statuscode } from '@/api/types.gen'
import { $trans, errorToast } from '@/services/i18n'
import { statusColor } from '@/features/statuscode/status-color'

/**
 * An order's last status as a coloured select: picking another code posts a
 * new status row for the order. The legacy `TableStatusInfo` did the same for
 * orders, invoices and quotations through their model services; this is the
 * order-only version on the generated op, kept to the same element ids.
 */
const props = defineProps<{
  order: Pick<Order, 'id' | 'last_status' | 'last_status_full'>
  statuscodes: Statuscode[]
}>()

const emit = defineEmits<{changed: [status: string]}>()

const current = computed(() => props.order.last_status)
const color = computed(() => statusColor(props.statuscodes, current.value))

// The select shows the attempted status while the write is in flight; a
// failed write rolls it back to the row's status rather than displaying a
// value nothing stored.
const selected = ref(current.value)
watch(current, (value) => { selected.value = value })

const {create} = useToast()
const {mutate, isPending} = useMutation({
  ...orderStatusCreateMutation(),
  onSuccess: (_data, variables) => emit('changed', variables.body.status),
  onError: () => {
    selected.value = current.value
    errorToast(create, $trans('Error creating status'))
  },
})

function onChange(event: Event) {
  const status = (event.target as HTMLSelectElement).value
  if (!status || status === current.value) return
  selected.value = status
  mutate({body: {order: props.order.id, status}})
}
</script>
