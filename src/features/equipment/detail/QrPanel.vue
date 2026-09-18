<template>
  <div
    v-if="qrUrl"
    class="qr-container mb-3"
  >
    <BLink
      class="btn btn-sm btn-outline mb-2"
      :href="qrUrl"
      target="_blank"
      :title="$trans('Open QR in new tab')"
    >
      <img
        :alt="$trans('QR code')"
        class="qr-code-image img-fluid"
        :src="qrUrl"
      >
    </BLink>
    <p class="mb-0">
      <a
        href="javascript:"
        @click="$emit('download')"
      >{{ $trans('Download') }}</a>
    </p>
  </div>
  <img
    v-else
    :alt="$trans('No QR yet')"
    class="qr-code-image img-fluid mb-3"
    :src="NO_IMAGE_URL"
  >
  <p>
    <BButton
      variant="primary"
      size="sm"
      @click="$emit('recreate')"
    >
      {{ $trans('Recreate') }}
    </BButton>
  </p>
</template>

<script setup lang="ts">
import { BButton, BLink } from 'bootstrap-vue-next'
import { NO_IMAGE_URL } from '@/constants'
import { $trans } from '@/services/i18n'

// The QR block inside a detail page's `#qr` slot: the linked code with its
// download, or the placeholder while there is none, and the recreate button.
// Presentational on purpose - the create-QR mutation and the download live in
// `useQrCode`, which the page wires to these two events. Whether the slot is
// filled at all stays the page's decision (`hasQr`), because the layouts only
// render the QR card while the slot is given.
defineProps<{
  qrUrl?: string
}>()

defineEmits<{
  (event: 'download'): void
  (event: 'recreate'): void
}>()
</script>

<style scoped>
.qr-code-image {
  width: 250px;
  height: 250px;
}
.qr-container {
  text-align: center;
}
</style>
