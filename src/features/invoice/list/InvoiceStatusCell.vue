<template>
  <span class="status" :title="invoice.last_status_full ?? undefined" :style="{'--status-color': color}">
    <IBiCircleFill class="color-icon" :style="{color}" />
    <select
      v-if="statuscodes.length"
      :id="`${invoice.id}-change-status`"
      class="form-select form-select-sm"
      :aria-label="$trans('Change status')"
      :value="selected"
      :disabled="isPending"
      style="border-color: transparent;"
      @change="changeStatus"
    >
      <option v-if="!currentCode" :value="invoice.last_status" disabled>{{ invoice.last_status }}</option>
      <option v-for="code in statuscodes" :key="code.id" :value="code.statuscode" :disabled="isAutomatic(code)">
        {{ code.statuscode }}
      </option>
    </select>
    <span v-else>{{ invoice.last_status }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import { parse } from 'valibot'
import { invoiceInvoiceDetailRetrieveQueryKey, invoiceInvoiceStatusCreateMutation } from '@/api/@tanstack/vue-query.gen'
import type { Invoice, Statuscode } from '@/api/types.gen'
import { vInvoiceStatusRequest } from '@/api/valibot.gen'
import { $trans, errorToast } from '@/services/i18n'
import { statuscodeFor, statusColor } from '@/features/statuscode/status-color'
import { invalidateInvoiceLists } from './invalidation'

const props = defineProps<{
  invoice: Invoice
  statuscodes: Statuscode[]
}>()

const currentCode = computed(() => statuscodeFor(props.statuscodes, props.invoice.last_status))
const current = computed(() => currentCode.value?.statuscode ?? props.invoice.last_status)
const selected = ref(current.value)
watch(current, (value) => { selected.value = value })
const color = computed(() => statusColor(props.statuscodes, props.invoice.last_status))

function isAutomatic(code: Statuscode) {
  return Boolean(code.settings_key || code.roles?.length)
}

const queryClient = useQueryClient()
const {create} = useToast()
const {mutateAsync, isPending} = useMutation({
  ...invoiceInvoiceStatusCreateMutation(),
  onSuccess: () => Promise.all([
    invalidateInvoiceLists(queryClient),
    props.invoice.uuid ? queryClient.invalidateQueries({
      queryKey: invoiceInvoiceDetailRetrieveQueryKey({path: {id: props.invoice.uuid}}),
    }) : Promise.resolve(),
  ]),
  onError: () => errorToast(create, $trans('Error creating status')),
})

async function changeStatus(event: Event) {
  const select = event.target
  if (!(select instanceof HTMLSelectElement)) return
  const code = props.statuscodes.find((item) => item.statuscode === select.value)
  if (!code || isAutomatic(code) || code.statuscode === current.value || isPending.value) {
    select.value = selected.value
    return
  }
  selected.value = code.statuscode
  try {
    await mutateAsync({body: parse(vInvoiceStatusRequest, {invoice: props.invoice.id, status: code.statuscode})})
    selected.value = current.value
  } catch {
    selected.value = current.value
    select.value = current.value
  }
}
</script>

<style scoped>
.status { display: flex; align-items: center; width: 80%; }
.color-icon { margin-right: 10px; }
</style>
