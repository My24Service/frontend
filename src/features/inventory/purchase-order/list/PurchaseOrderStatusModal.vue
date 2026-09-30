<template>
  <b-modal
    id="purchaseorder-change-status-modal"
    ref="modal"
    :title="$trans('Add status')"
    @ok.prevent="submitForm()"
  >
    <b-overlay
      :show="saving"
      rounded="sm"
    >
      <form @submit.prevent="submitForm()">
        <b-container fluid>
          <b-row role="group">
            <b-col cols="6">
              <BFormGroup
                :label="$trans('New status')"
                label-for="change-status-status"
              >
                <BFormInput
                  id="change-status-status"
                  v-model="values.status"
                  size="sm"
                  autofocus
                  :state="submitClicked ? !errors.status : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.status : null">
                  {{ errors.status }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-overlay>
  </b-modal>
</template>

<script setup lang="ts">
import { useResourceForm } from '@/features/forms'
import {
  emptyPurchaseOrderStatus,
  purchaseOrderStatusFromRecord,
  purchaseOrderStatusWrite,
} from './schemas'

/**
 * The "Add status" modal of the purchase order list: one status line for the
 * order it was opened on. It writes to the status endpoint, and the orders'
 * own reads are refreshed with it - the list shows each order's last status.
 */
const modal = useTemplateRef<{show: () => void; hide: () => void}>('modal')

const {values, errors, submitClicked, isLoading: saving, submitForm, reset} = useResourceForm({
  // A status is only ever created here; there is no record to open.
  pk: () => null,
  resource: Api.InventoryPurchaseorderStatus,
  invalidate: async (queryClient) => {
    await Api.InventoryPurchaseorderStatus.invalidate(queryClient)
    await Api.InventoryPurchaseorder.invalidate(queryClient)
  },
  empty: emptyPurchaseOrderStatus,
  fromRecord: purchaseOrderStatusFromRecord,
  contract: purchaseOrderStatusWrite,
  afterSave: () => modal.value?.hide(),
  copy: {
    fetchError: $trans('Error fetching status'),
    created: $trans('Created'),
    createdDetail: $trans('Status has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Status has been updated'),
    createError: $trans('Error creating status'),
    updateError: $trans('Error updating status'),
  },
})

/** Open the modal on a blank status for this order. */
function show(purchaseOrderId: number) {
  reset()
  values.value.purchase_order = purchaseOrderId
  modal.value?.show()
}

defineExpose({show})
</script>
