<template>
  <b-modal
    ref="workorder-viewer"
    size="xl"
  >
    <div
      v-if="iframeLoading"
      class="d-flex flex-row justify-content-center align-items-center iframe-loader"
    >
      <b-spinner medium />
    </div>
    <iframe
      v-if="opened"
      v-show="!iframeLoading"
      :src="workorderUrl"
      frameborder="0"
      @load="iframeLoading = false"
    />

    <template #footer="{ ok }">
      <BButton
        class="btn button btn-secondary"
        @click="openInNewTab"
      >
        {{ $trans('Open in a new tab') }}
      </BButton>
      <BButton
        v-if="canRecreate"
        id="recreateWorkorderPdfButtonGotenberg"
        class="btn btn-secondary"
        type="button"
        variant="secondary"
        :disabled="recreate.isPending.value"
        @click="recreatePdf"
      >
        <b-spinner v-if="recreate.isPending.value" small />
        {{ $trans('re-generate PDF') }}
      </BButton>
      <BLink
        v-if="pdfUrl"
        class="btn button btn-primary"
        :href="pdfUrl"
        target="_blank"
        :title="`${$trans('Download PDF')} (${pdfUrl})`"
      >
        <IBiFileEarmarkPdf />{{ $trans('Download PDF') }}
      </BLink>
      <BButton
        variant="primary"
        @click="ok()"
      >
        {{ $trans("close") }}
      </BButton>
    </template>
  </b-modal>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import { orderOrderRecreatePdfCreateMutation } from '@/api/@tanstack/vue-query.gen'
import { $trans, errorToast, infoToast } from '@/services/i18n'

/**
 * The workorder as the customer sees it, in an iframe on the public
 * `workorder-view` route, with the PDF download and — for planning — the
 * "re-generate PDF" action beside it. The parent opens it with `show()`.
 */
const props = defineProps<{
  orderId: number
  uuid: string
  pdfUrl?: string | null
  canRecreate: boolean
}>()

const emit = defineEmits<{recreated: []}>()

const router = useRouter()
const modal = useTemplateRef<{show: () => void}>('workorder-viewer')
const iframeLoading = ref(true)
// The iframe gets its src on the first open, not at mount: a detail view
// must not load the workorder page behind a closed modal.
const opened = ref(false)

const workorderUrl = computed(() => {
  const route = router.resolve({name: 'workorder-view', params: {uuid: props.uuid}})
  return `${document.location.origin}/${route.href}`
})

function show() {
  iframeLoading.value = true
  opened.value = true
  modal.value?.show()
}

function openInNewTab() {
  window.open(workorderUrl.value, '_blank')
}

const {create} = useToast()
const recreate = useMutation({
  ...orderOrderRecreatePdfCreateMutation(),
  onSuccess: () => {
    infoToast(create, $trans('Success'), $trans('Workorder recreated'))
    emit('recreated')
  },
  onError: () => errorToast(create, $trans('Error recreating workorder')),
})

function recreatePdf() {
  recreate.mutate({path: {id: props.orderId}, query: {gotenberg: 1}})
}

defineExpose({show})
</script>

<style scoped>
.iframe-loader {
  min-height: 720px;
}

iframe {
  min-height: 720px;
  width: 100%;
}
</style>
