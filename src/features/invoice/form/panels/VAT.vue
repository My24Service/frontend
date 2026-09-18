<template>
  <BFormSelect
    v-model="vatType"
    :options="vatTypes"
    size="sm"
  ></BFormSelect>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMainStore } from '@/stores/main'

const mainStore = useMainStore()
const defaultVat = mainStore.getInvoiceDefaultVat
const props = withDefaults(defineProps<{
  modelValue?: string | number
}>(), { modelValue: undefined })
const vatTypes = computed(() => mainStore.getVATTypes)
const emit = defineEmits<{ vatChanged: [value: string | number]; 'update:modelValue': [value: string | number] }>()
const vatType = computed({
  get: () => props.modelValue ?? defaultVat,
  set: (value: string | number) => {
    emit('update:modelValue', value)
    emit('vatChanged', value)
  },
})
</script>

<style scoped>
select {
  width: 8ch;
}
</style>
