<template>
  <BFormSelect
    @change="update"
    :value="defaultVat"
    v-model="vatType"
    :options="vatTypes"
    size="sm"
  ></BFormSelect>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMainStore } from '@/stores/main'

const mainStore = useMainStore()
const defaultVat = mainStore.getInvoiceDefaultVat
const vatType = ref(defaultVat)
const vatTypes = computed(() => mainStore.getVATTypes)
const emit = defineEmits<{ vatChanged: [value: string | number] }>()
function update() {
  emit('vatChanged', vatType.value)
}
</script>

<style scoped>
select {
  width: 8ch;
}
</style>
