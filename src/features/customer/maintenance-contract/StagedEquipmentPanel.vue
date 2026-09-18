<template>
  <div class="panel col-2-3">
    <b-modal
      id="new-equipment-modal"
      ref="newEquipmentModal"
      v-bind:title="$trans('New equipment')"
      @ok="submitCreateEquipment"
      @cancel="cancelCreateEquipment"
    >
      <form @submit.stop.prevent="submitCreateEquipment">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Equipment name')"
                label-for="maintenance_equipment_new_equipment"
              >
                <BFormInput
                  id="maintenance_equipment_new_equipment"
                  size="sm"
                  v-model="newEquipmentName"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <h6 :class="!customerId ? 'dimmed' : ''">{{ $trans('Equipment') }}</h6>
    <hr />

    <h3 v-if="!customerId" class="text-center">
      <IBiInfoSquare variant="primary"></IBiInfoSquare> &nbsp;
      <span class="dimmed">{{ $trans('Select a customer to add equipment to this contract.') }}</span>
    </h3>

    <div class="maintenance-contract-equipment" v-else>
      <b-row>
        <b-col cols="12">
          <b-table
            v-if="rows.length > 0"
            small
            :fields="equipmentFields"
            :items="rows" responsive="md"
          >
            <template #cell(tariff)="data">
              {{ rowDinero(data.item).toFormat('$0.00')}}
            </template>
            <template #cell(icons)="data">
              <div class="float-end">
                <BLink class="h5 mx-2" @click="editEquipment(data.item, data.index)">
                  <IBiPencil></IBiPencil>
                </BLink>
                <BLink class="h5 mx-2" @click.prevent="deleteEquipment(data.index)">
                  <IBiTrash></IBiTrash>
                </BLink>
              </div>
            </template>
          </b-table>
          <b-form-invalid-feedback :state="!error">
            {{ error }}
          </b-form-invalid-feedback>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="12" role="group">
          <BFormGroup
            label-size="sm"
            v-bind:label="$trans('Add equipment')"
          >
            <VueMultiselect
              id="maintenance-contract-equipment-name"
              ref="equipmentMultiselect"
              :key="customerId"
              track-by="id"
              label="name"
              :placeholder="$trans('Type to search')"
              open-direction="bottom"
              :options="equipmentOptions"
              :multiple="false"
              :loading="loading"
              :internal-search="false"
              :clear-on-select="true"
              :close-on-select="true"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :show-no-results="true"
              :hide-selected="true"
              @search-change="searchTerm = $event"
              @select="selectEquipment"
            >
              <template #noResult>
                <p>
                  <IBiInfoSquare variant="primary"></IBiInfoSquare>
                  {{ $trans('No equipment found. Consider changing the search query, or add a new equipment:')}}
                </p>
                <p>
                  <BButton
                    @click="showAddEquipmentModal"
                    class="btn btn-primary"
                    size="sm"
                    type="button"
                    variant="primary"
                  >
                    {{ $trans("Add equipment") }}
                  </BButton>
                </p>
              </template>
            </VueMultiselect>
          </BFormGroup>
        </b-col>
      </b-row>
      <b-row>
        <b-col cols="3" role="group">
          <BFormGroup
            label-size="sm"
            v-bind:label="$trans('Name')"
            label-for="maintenance-contract-equipment-name"
          >
            <BFormInput
              readonly
              id="maintenance-contract-equipment-name"
              size="sm"
              v-model="rowEdit.equipment_name"
            ></BFormInput>
            <b-form-invalid-feedback :state="!rowErrors.equipment">
              {{ rowErrors.equipment }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </b-col>
        <b-col cols="2" role="group">
          <BFormGroup
            label-size="sm"
            v-bind:label="$trans('Frequency')"
            :placeholder="$trans('times per year')"
            label-for="maintenance-contract-equipment-times_per_year"
          >
            <BFormInput
              id="maintenance-contract-equipment-times_per_year"
              size="sm"
              ref="timesPerYear"
              v-model="rowEdit.times_per_year"
            ></BFormInput>
            <b-form-invalid-feedback :state="!rowErrors.times_per_year">
              {{ rowErrors.times_per_year }}
            </b-form-invalid-feedback>
          </BFormGroup>
        </b-col>
        <b-col cols="3" role="group">
          <BFormGroup
            label-size="sm"
            v-bind:label="$trans('Tariff')"
            label-for="maintenance-contract-equipment-tariff"
          >
            <PriceInput
              v-model="rowEdit.tariff"
              :currency="rowEdit.tariff_currency"
            />
          </BFormGroup>
        </b-col>
        <b-col cols="4" role="group">
          <BFormGroup
            label-size="sm"
            v-bind:label="$trans('Remarks')"
            label-for="maintenance-contract-equipment-remarks"
          >
            <BFormTextarea
              id="maintenance-contract-equipment-remarks"
              v-model="rowEdit.remarks"
              rows="1"
            ></BFormTextarea>
          </BFormGroup>
        </b-col>
      </b-row>
      <footer class="modal-footer">
        <BButton
          @click="cancelEditEquipment"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="secondary"
        >
          {{ $trans('Cancel') }}
        </BButton>
        &nbsp;
        <BButton
          v-if="editingIndex !== null"
          @click="doEditEquipment"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="warning">
          {{ $trans('Edit equipment') }}
        </BButton>
        <BButton
          v-if="editingIndex === null"
          @click="addEquipment"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="primary"
          :disabled="rowEdit.equipment === null"
        >
          {{ $trans('Add equipment') }}
        </BButton>
      </footer>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import VueMultiselect from 'vue-multiselect'

import PriceInput from '@/components/PriceInput.vue'
import { $trans } from '@/services/i18n'
import type { EquipmentStaging } from './useEquipmentStaging'

const props = defineProps<{
  /** The staged set, owned by the contract form. This panel renders it. */
  staging: EquipmentStaging
  customer: {id?: number} | null
  loading: boolean
  error?: string
}>()

const customerId = computed(() => props.customer?.id)

const {
  rows,
  isLoading,
  equipmentOptions,
  searchTerm,
  selectEquipment,
  rowEdit,
  rowErrors,
  editingIndex,
  addEquipment,
  editEquipment,
  doEditEquipment,
  cancelEditEquipment,
  deleteEquipment,
  rowDinero,
  newEquipmentName,
  submitCreateEquipment,
  cancelCreateEquipment,
  showAddEquipmentModal,
  timesPerYear,
  equipmentMultiselect,
  newEquipmentModal,
} = props.staging

const equipmentFields = [
  {key: 'equipment_name', label: $trans('Name')},
  {key: 'times_per_year', label: $trans('Times / year')},
  {key: 'tariff', label: $trans('Tariff')},
  {key: 'remarks', label: $trans('Remarks')},
  {key: 'icons', label: ''},
]
</script>
