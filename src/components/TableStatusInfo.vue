<template>
  <BOverlay
    :show="isLoading"
    rounded="sm"
    class="status"
    :title="model.last_status_full"
    :style="{'--status-color': statusColorCode}"
  >
    <IBiCircleFill
      class="color-icon"
      v-bind:style="`color:${statusColorCode}`"
      :title="model.last_status_full"
    ></IBiCircleFill>
    <BFormSelect
      v-if="statuscodes.length"
      :title="statusCodeComputed ?? undefined"
      :id="model.id + '-change-status'"
      v-model="statusCodeModel"
      :options="statuscodes"
      size="sm"
      value-field="statuscode"
      text-field="statuscode"
      style="border-color: transparent;"
      @change="handleStatusChange(model.id, $event)"
    ></BFormSelect>
  </BOverlay>
</template>
<script setup lang="ts">
import my24 from '@/services/my24.js'
import { $trans, errorToast } from '@/services/i18n'

const props = withDefaults(defineProps<{
  statusCodeService?: { insert?: (s: unknown) => Promise<unknown> }
  statusService: { insert: (s: Record<string, unknown>) => Promise<unknown> }
  model: { id: number | string; last_status?: string | null; last_status_full?: string | null }
  modelName: string
  statuscodes: { statuscode: string }[]
}>(), {
  statuscodes: () => [],
})

const { create } = useToast()

const statusCodeModel = ref<string | null>(null)
const statusColorCode = ref<string | null>(null)
const isLoading = ref(false)

const statusCodeComputed = computed<string | null>(() => {
  const statusCode = my24.getStatuscode(props.statuscodes, props.model.last_status)
  return statusCode ? statusCode.statuscode : null
})

function syncStatus() {
  statusCodeModel.value = statusCodeComputed.value
  statusColorCode.value = my24.status2color(props.statuscodes, statusCodeModel.value)
}

syncStatus()

watch(() => props.statuscodes, syncStatus, { deep: true })

function handleStatusChange(id: number | string, _event: unknown) {
  void changeStatus(id, statusCodeModel.value)
  statusColorCode.value = my24.status2color(props.statuscodes, statusCodeModel.value)
}

async function changeStatus(id: number | string, value: string | null) {
  const status: Record<string, unknown> = {
    [props.modelName]: id,
    status: value,
  }
  try {
    await props.statusService.insert(status)
  } catch (error) {
    console.error('Error creating status', error)
    errorToast(create, $trans('Error creating status'))
  }
}
</script>
<style scoped>
.status {
  display: flex;
  align-items: center;
  width: 80%;
}
.color-icon {
 margin-right: 10px;
}
</style>
