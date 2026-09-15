<template>
  <b-modal
    :id="id"
    ref="modal"
    :title="title"
    @ok="emit('ok')"
  >
    <form @submit.stop.prevent="emit('ok')">
      <BFormGroup
        :label="label"
        :label-for="inputId"
      >
        <BFormInput
          :id="inputId"
          v-model="name"
        />
      </BFormGroup>
    </form>
  </b-modal>
</template>

<script lang="ts" setup>
import { useTemplateRef } from 'vue'

/**
 * A one-field modal to create an equipment or a location by name from the
 * orderline pickers, when the tenant allows it. The caller pre-fills the
 * name with what was typed into the picker so far.
 */
defineProps<{
  id: string
  title: string
  label: string
  inputId: string
}>()

const emit = defineEmits<{ok: []}>()

const name = defineModel<string>({required: true})

const modal = useTemplateRef<{show: () => void; hide: () => void}>('modal')

defineExpose({
  show: () => modal.value?.show(),
  hide: () => modal.value?.hide(),
})
</script>
