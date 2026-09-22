<template>
  <div class="page-detail flex-columns">
    <div class="panel sidebar col-1-3">
      <h6>{{ detailsTitle }}</h6>
      <dl>
        <template v-for="field in fields" :key="field.label">
          <dt>{{ field.label }}</dt>
          <dd>{{ field.value }}</dd>
        </template>
        <template v-if="$slots.qr">
          <dt class="align-top-verdomme">{{ $trans('QR code') }}</dt>
          <dd><slot name="qr" /></dd>
        </template>
      </dl>
    </div>

    <div class="panel wide col-2-3">
      <b-tabs>
        <b-tab :title="$trans('Orders')">
          <div class="flex-columns space-between align-items-center">
            <h6>{{ ordersTitle }}</h6>
            <span>
              <BButton-group>
                <slot name="orders-actions" />
              </BButton-group>
            </span>
          </div>
          <hr>
          <slot name="orders" />
        </b-tab>
        <b-tab v-if="$slots.stats" key="stats" :title="$trans('Insights')" @click="$emit('render-stats')">
          <slot name="stats" />
        </b-tab>
        <b-tab key="docs" :title="$trans('Documents')">
          <slot name="documents" />
        </b-tab>
        <b-tab v-if="$slots.equipment" key="equipment" :title="$trans('Equipment')">
          <slot name="equipment" />
        </b-tab>
      </b-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DetailField } from './detail-fields'

// The sidebar-and-tabs frame of a detail page (equipment, location): a
// sidebar with the details list and the QR code, and a tabbed panel. The view
// owns the data and fills the slots; see DetailLayoutCards for the card frame.
// Slots: qr, orders-actions, orders, stats, documents, equipment.
defineProps<{
  detailsTitle: string
  ordersTitle: string
  /** `col` is the shltr column and is ignored here. */
  fields: DetailField[]
}>()

defineEmits<{(event: 'render-stats'): void}>()
</script>

<style scoped>
.wide {
  min-width: 66%;
  max-width: unset;
}
</style>