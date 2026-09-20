<template>
  <DocumentCollectionEditor
    :resource="customerDocumentResource"
    :parent-id="customerId"
    id-prefix="customer"
    :is-view="isView"
    show-user-can-view
  />
</template>

<script lang="ts" setup>
import DocumentCollectionEditor from '@/features/documents/DocumentCollectionEditor.vue'
import { customerDocumentResource } from './customer-document-resource'

const props = withDefaults(defineProps<{
  customer?: {id?: number} | null
  isView?: boolean
}>(), {
  customer: null,
  isView: false,
})

// The collection reads nothing until the record exists; the panel only mounts
// once it does (CustomerFinancialsPanel renders it under `v-if="values.id"`),
// so null here is a type-level state, not a mounted one.
const customerId = computed(() => props.customer?.id ?? null)
</script>
