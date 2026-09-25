<template>
  <StatusCell
    :row-id="invoice.id"
    :title="invoice.last_status_full"
    :color="color"
    :statuscodes="statuscodes"
    :selected="selected"
    :is-pending="isPending"
    :current="current"
    :current-code="currentCode"
    show-unresolved-option
    :is-disabled-option="isAutomatic"
    :empty-text="invoice.last_status"
    @change="change"
  />
</template>

<script setup lang="ts">
import { parse } from 'valibot'
import { invoiceInvoiceDetailRetrieveQueryKey, invoiceInvoiceStatusCreateMutation } from '@/api/@tanstack/vue-query.gen'
import type { Invoice, Statuscode } from '@/api/types.gen'
import { vInvoiceStatusRequest } from '@/api/valibot.gen'
import { InvoiceInvoice } from '@/api/resources.gen'
import {
  StatusCell,
  useStatusCell,
} from '@/features/shared'

const props = defineProps<{
  invoice: Invoice
  statuscodes: Statuscode[]
}>()

function isAutomatic(code: Statuscode) {
  return Boolean(code.settings_key || code.roles?.length)
}

const queryClient = useQueryClient()
const {create} = useToast()
const {mutateAsync} = useMutation({...invoiceInvoiceStatusCreateMutation()})

const {currentCode, current, selected, color, isPending, change} = useStatusCell({
  row: () => props.invoice,
  statuscodes: () => props.statuscodes,
  isDisabledOption: isAutomatic,
  write: (status) => mutateAsync({body: parse(vInvoiceStatusRequest, {invoice: props.invoice.id, status})}),
  onSuccess: () => Promise.all([
    InvoiceInvoice.invalidate(queryClient),
    props.invoice.uuid ? queryClient.invalidateQueries({
      queryKey: invoiceInvoiceDetailRetrieveQueryKey({path: {id: props.invoice.uuid}}),
    }) : Promise.resolve(),
  ]),
  onError: () => errorToast(create, $trans('Error creating status')),
})
</script>
