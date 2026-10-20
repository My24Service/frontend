<template>
  <StatusCell
    :row-id="quotation.id"
    :title="quotation.last_status_full"
    :color="color"
    :statuscodes="statuscodes"
    :selected="selected"
    :is-pending="isPending"
    :current="current"
    :current-code="currentCode"
    show-unresolved-option
    :is-disabled-option="isAutomatic"
    :empty-text="quotation.last_status"
    @change="change"
  />
</template>

<script setup lang="ts">
import { parse } from 'valibot'

import {
  StatusCell,
  useStatusCell,
} from '@/features/shared'

/**
 * A quotation's last status as a coloured select, on the shared status cell.
 * The legacy `TableStatusInfo` disabled the codes that carry a `settings_key`
 * (the ones the server sets itself); so does this.
 */
const props = defineProps<{
  quotation: Pick<Api.Quotation, 'id' | 'last_status' | 'last_status_full' | 'statuscode_id' | 'color'>
  statuscodes: Api.Statuscode[]
}>()

function isAutomatic(code: Api.Statuscode) {
  return Boolean(code.settings_key)
}

const { toast: create, queryClient } = useCommon()
const {mutateAsync} = useMutation({...Api.QuotationStatus.create.mutation()})

const {currentCode, current, selected, color, isPending, change} = useStatusCell({
  row: () => props.quotation,
  statuscodes: () => props.statuscodes,
  isDisabledOption: isAutomatic,
  write: (status) => mutateAsync({body: parse(schemas.vQuotationStatusRequest, {quotation: props.quotation.id, status})}),
  onSuccess: () => Api.QuotationQuotation.invalidate(queryClient),
  onError: () => errorToast(create, $trans('Error creating status')),
})
</script>
