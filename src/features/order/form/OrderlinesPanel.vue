<template>
  <QuickCreateModal
    id="new-equipment-modal"
    ref="new-equipment-modal"
    v-model="newEquipmentName"
    :title="$trans('New equipment')"
    :label="$trans('Equipment name')"
    input-id="maintenance_equipment_new_equipment"
    @ok="submitCreateEquipment"
  />
  <QuickCreateModal
    id="new-location-modal"
    ref="new-location-modal"
    v-model="newLocationName"
    :title="$trans('New location')"
    :label="$trans('Location name')"
    input-id="new_location"
    @ok="submitCreateLocation"
  />

  <div class="order-lines section">
    <h6>{{ $trans('Order lines') }}</h6>
    <b-container fluid="sm">
      <b-row
        v-for="(orderline, index) of orderlines.rows.value"
        :key="orderline.id ?? `new-${index}`"
        no-gutters
        style="padding-bottom: 10px"
      >
        <b-col cols="9">
          <div>{{ $trans("Product") }}: <b>{{ orderline.product }}</b></div>
          <div>{{ $trans("Location") }}: <b>{{ orderline.location }}</b></div>
          <div>{{ $trans("Remarks") }}: <b>{{ orderline.remarks }}</b></div>
        </b-col>
        <b-col cols="3">
          <div class="float-right">
            <BLink
              class="h5 mx-2"
              :title="$trans('Edit')"
              @click.prevent="orderlines.edit(index)"
            ><IBiPencil /></BLink>
            <BLink
              class="h5 mx-2"
              :title="$trans('Delete')"
              @click.prevent="orderlines.remove(index)"
            ><IBiTrash /></BLink>
          </div>
        </b-col>
      </b-row>
    </b-container>

    <hr v-if="orderlines.rows.value.length > 0">

    <div v-if="usesEquipment && role !== 'customer'">
      <h5 v-if="orderlines.isEditing.value">{{ $trans("Edit") }}</h5>
      <h5 v-else>{{ $trans("New") }}</h5>

      <BFormGroup :label="$trans('Equipment')">
        <VueMultiselect
          id="maintenance-contract-equipment-name"
          ref="equipmentMultiselect"
          track-by="id"
          label="name"
          :placeholder="$trans('(type to search)')"
          open-direction="bottom"
          :options="equipmentOptions"
          :multiple="false"
          :internal-search="false"
          :clear-on-select="true"
          :close-on-select="true"
          :options-limit="30"
          :limit="10"
          :max-height="600"
          :show-no-results="true"
          :hide-selected="true"
          :disabled="!ownerChosen"
          @search-change="(term: string) => (equipmentTerm = term)"
          @select="selectEquipment"
        >
          <template #noResult>
            <h5>{{ $trans('No equipment found') }}</h5>
            <p v-if="canQuickCreateEquipment">
              <BButton
                type="button"
                variant="primary"
                @click="showAddEquipmentModal"
              >{{ $trans("Add new equipment") }}</BButton>
            </p>
          </template>
        </VueMultiselect>
        <span>
          <strong>{{ orderlines.rowEdit.value.product }}</strong>
          <IBiCheck v-if="orderlines.rowEdit.value.equipment" />
        </span>
      </BFormGroup>

      <BFormGroup :label="$trans('Location')">
        <VueMultiselect
          id="location-name"
          ref="locationMultiselect"
          track-by="id"
          label="name"
          :placeholder="$trans('(type to search)')"
          open-direction="bottom"
          :options="locationOptions"
          :multiple="false"
          :internal-search="false"
          :clear-on-select="true"
          :close-on-select="true"
          :options-limit="30"
          :limit="10"
          :max-height="600"
          :show-no-results="true"
          :hide-selected="true"
          :disabled="!ownerChosen || locationLockedByEquipment"
          @search-change="(term: string) => (locationTerm = term)"
          @select="selectLocation"
        >
          <template #noResult>
            <h5>{{ $trans('No locations found') }}</h5>
            <p v-if="canQuickCreateLocation">
              <BButton
                type="button"
                variant="primary"
                @click="showAddLocationModal"
              >{{ $trans("Add new location") }}</BButton>
            </p>
          </template>
        </VueMultiselect>
        <span>
          <strong>{{ orderlines.rowEdit.value.location }}</strong>
          <IBiCheck v-if="orderlines.rowEdit.value.equipment_location" />
        </span>
      </BFormGroup>

      <BFormGroup
        v-if="maintenance"
        :label="$trans('Amount')"
        label-for="order-orderline-amount"
        label-cols="3"
      >
        <BFormInput
          id="order-orderline-amount"
          v-model.number="orderlines.rowEdit.value.amount"
          type="number"
        />
      </BFormGroup>
      <BFormGroup
        v-else
        label-for="order-orderline-remarks"
        :label="$trans('Remarks')"
      >
        <BFormTextarea
          id="order-orderline-remarks"
          v-model="orderlines.rowEdit.value.remarks"
          rows="1"
        />
      </BFormGroup>
    </div>

    <div v-else>
      <BFormGroup
        :label="$trans('Equipment')"
        label-for="order-orderline-product"
        label-cols="3"
      >
        <BFormInput
          id="order-orderline-product"
          v-model="orderlines.rowEdit.value.product"
          placeholder="(item name)"
        />
      </BFormGroup>
      <BFormGroup
        :label="$trans('Location')"
        label-for="order-orderline-location"
        label-cols="3"
      >
        <BFormInput
          id="order-orderline-location"
          v-model="orderlines.rowEdit.value.location"
          placeholder="(location name)"
        />
      </BFormGroup>
      <BFormGroup
        :label="$trans('Remarks')"
        label-for="order-orderline-remarks"
        label-cols="3"
      >
        <BFormInput
          id="order-orderline-remarks"
          v-model="orderlines.rowEdit.value.remarks"
          placeholder="(notes)"
        />
      </BFormGroup>
    </div>

    <BFormGroup class="text-right">
      <BButton
        v-if="orderlines.isEditing.value"
        type="button"
        variant="warning"
        :disabled="!orderlineComplete"
        @click="commitOrderline"
      >{{ $trans('Edit orderline') }}</BButton>
      <BButton
        v-else
        type="button"
        variant="primary"
        :disabled="!orderlineComplete"
        @click="addOrderline"
      >{{ $trans('Add orderline') }}</BButton>
    </BFormGroup>
  </div>
</template>

<script lang="ts" setup>
import VueMultiselect from 'vue-multiselect'

import QuickCreateModal from './QuickCreateModal.vue'
import {
  emptyOrderline,
  isOrderlineComplete,
  orderlineFromRecord,
  type FormRole,
  type OrderFormValues,
  type OrderlineRow,
} from './schemas'
import { useEquipmentPickers, type EquipmentOption } from './use-order-pickers'
import { useStagedRows } from './use-staged-rows'

/**
 * The order's lines, staged here and sent in the order body. A tenant with equipment
 * picks each line's equipment and location, scoped to the order's owner,
 * with a quick-create for either when allowed; one without types them.
 */
const props = defineProps<{
  /** The lines on the record; a change (a load) replaces the staged set. */
  lines: Api.OrderLine[]
  role: FormRole
  hasBranches: boolean
  usesEquipment: boolean
  /** A maintenance-contract order: lines carry an amount instead of remarks. */
  maintenance: boolean
}>()

/** Read for the owner the pickers are scoped to; never written here. */
const order = defineModel<OrderFormValues>('order', {required: true})

const orderlines = useStagedRows<OrderlineRow>(emptyOrderline)

watch(() => props.lines, (lines) => orderlines.seed(lines.map(orderlineFromRecord)), {immediate: true})

const {
  ownerChosen,
  equipmentTerm,
  equipmentOptions,
  locationTerm,
  locationOptions,
  createEquipment,
  createLocation,
  canQuickCreateEquipment,
  canQuickCreateLocation,
} = useEquipmentPickers(order, {
  hasBranches: () => props.hasBranches,
  scopedByOwner: () => props.role === 'planning',
})

const orderlineComplete = computed(() => isOrderlineComplete(orderlines.rowEdit.value))
const locationLockedByEquipment = ref(false)

function selectEquipment(option: EquipmentOption) {
  orderlines.rowEdit.value.equipment = option.id
  orderlines.rowEdit.value.product = option.name ?? ''
  if (option.location) {
    orderlines.rowEdit.value.equipment_location = option.location.id
    orderlines.rowEdit.value.location = option.location.name
    locationLockedByEquipment.value = true
  } else {
    locationLockedByEquipment.value = false
  }
}

function selectLocation(option: {id: number; name: string | null}) {
  orderlines.rowEdit.value.equipment_location = option.id
  orderlines.rowEdit.value.location = option.name ?? ''
}

function addOrderline() {
  orderlines.add()
  locationLockedByEquipment.value = false
}

function commitOrderline() {
  orderlines.commitEdit()
  locationLockedByEquipment.value = false
}

// The quick-create modals: the search term typed so far becomes the name.
type Multiselect = {deactivate?: () => void; $refs?: {search?: {value?: string}}}
const equipmentMultiselect = useTemplateRef<Multiselect>('equipmentMultiselect')
const locationMultiselect = useTemplateRef<Multiselect>('locationMultiselect')
const newEquipmentModal = useTemplateRef<InstanceType<typeof QuickCreateModal>>('new-equipment-modal')
const newLocationModal = useTemplateRef<InstanceType<typeof QuickCreateModal>>('new-location-modal')
const newEquipmentName = ref('')
const newLocationName = ref('')

function typedTerm(picker: Multiselect | null): string {
  picker?.deactivate?.()
  return picker?.$refs?.search?.value ?? ''
}

function showAddEquipmentModal() {
  newEquipmentName.value = typedTerm(equipmentMultiselect.value)
  newEquipmentModal.value?.show()
}

function showAddLocationModal() {
  newLocationName.value = typedTerm(locationMultiselect.value)
  newLocationModal.value?.show()
}

async function submitCreateEquipment() {
  const created = await createEquipment(newEquipmentName.value)
  if (!created) return
  selectEquipment(created)
  newEquipmentModal.value?.hide()
}

async function submitCreateLocation() {
  const created = await createLocation(newLocationName.value)
  if (!created) return
  selectLocation(created)
  newLocationModal.value?.hide()
}

/** The staged lines, for the order body. */
const rows = orderlines.rows

/** Take the lines the save returned, so the staged set carries the stored ids. */
function adopt(lines: Api.OrderLineNested[]) {
  orderlines.seed(lines.map(orderlineFromRecord))
}

/** Stage a line from outside the editor (the maintenance contract's equipment). */
function stage(row: OrderlineRow) {
  orderlines.rows.value.push(row)
}

defineExpose({rows, adopt, stage})
</script>
