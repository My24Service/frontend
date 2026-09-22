<template>
  <div class="page-detail mt-4">
    <div class="row">

      <!-- details -->
      <div class="col-xxl-9 col-xl-6 col-md-12 mb-4">
        <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ detailsTitle }}</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div v-for="col in [1, 2]" :key="col" :class="col === 1 ? 'col-md-5' : 'col-md-7'">
                <ul class="list-group list-group-light list-group-small">
                  <template v-for="field in fields.filter((f) => (f.col || 1) === col)" :key="field.label">
                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ field.label }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ field.value }}</li>
                  </template>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- QR code -->
      <div v-if="$slots.qr" class="col-xxl-3 col-xl-6 col-md-12 mb-4">
        <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ $trans('QR code') }}</h5>
          </div>
          <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
            <slot name="qr" />
          </div>
        </div>
      </div>

      <!-- orders -->
      <div class="col-12 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header py-3 bg-transparent border-bottom d-flex justify-content-between align-items-center">
            <div></div>
            <h5 class="mb-0 text-center text-primary mx-auto">{{ ordersTitle }}</h5>
            <div class="d-flex align-items-center">
              <BButton-group size="sm">
                <slot name="orders-actions" />
              </BButton-group>
            </div>
          </div>
          <div class="card-body">
            <div class="order-list-container">
              <slot name="orders" />
            </div>
          </div>
        </div>
      </div>

      <!-- workorders -->
      <div v-if="$slots.workorders" class="col-12 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ $trans('Latest Workorders') }}</h5>
          </div>
          <div class="card-body">
            <slot name="workorders" />
          </div>
        </div>
      </div>

      <!-- documents (+ order types beside it when given) -->
      <div :class="$slots['order-types'] ? 'col-8 mb-4' : 'col-12 mb-4'">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ $trans('Documents') }}</h5>
          </div>
          <div class="card-body">
            <slot name="documents" />
          </div>
        </div>
      </div>
      <div v-if="$slots['order-types']" class="col-4 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ $trans('Order types') }}</h5>
          </div>
          <div class="card-body">
            <slot name="order-types" />
          </div>
        </div>
      </div>

      <!-- equipment -->
      <div v-if="$slots.equipment" class="col-12 mb-4">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-header py-3 bg-transparent border-bottom">
            <h5 class="mb-0 text-center text-primary">{{ $trans('Equipment') }}</h5>
          </div>
          <div class="card-body">
            <slot name="equipment" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { DetailField } from './detail-fields'

// The card-grid frame of a detail page (equipment, location): cards on a
// grid. The view owns the data and fills the slots; a card only renders when
// its slot is given. See DetailLayoutSidebar for the other frame.
// Slots: qr, orders-actions, orders, workorders, documents, order-types, equipment.
defineProps<{
  detailsTitle: string
  ordersTitle: string
  /** `col` 1 is the left column, 2 the right. */
  fields: DetailField[]
}>()
</script>

<style scoped>
.card {
  border: 0px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 10px 20px 0px;
  background-color: rgb(255, 255, 255);
  border-radius: 0.25rem;
}
.card-header {
  background-color: rgba(255, 255, 255, 0);
  border-bottom: 2px solid #f5f5f5;
}

.list-group-item {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.13);
  margin-top: 5px;
}

.list-group-light .list-group-item {
  padding: 0.5rem 0;
  border: 2px solid #f5f5f5;
  border-left-width: 0px;
  border-right-width: 0px;
  border-top-width: 0px;
}
.list-group-light > .list-group-item:last-of-type {
  border-bottom-width: 0px;
}

.text-primary {
  color: rgb(30, 58, 123) !important;
}
.text-secondary {
  color: rgb(23, 157, 160) !important;
}

.page-detail {
  background-color: rgb(241, 249, 249);
  padding: 1rem;
  border-radius: 0.25rem;
}
</style>