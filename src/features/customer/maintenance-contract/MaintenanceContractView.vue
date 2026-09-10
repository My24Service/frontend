<template>
  <div class="app-page" v-if="!isLoading && maintenanceContract">
    <header>
      <div class='page-title'>
        <h3>
          <IBiFileEarmarkLock></IBiFileEarmarkLock>
          <router-link :to="{name: 'maintenance-contracts'}" class='backlink'>{{ $trans('Maintenance contracts') }}</router-link> /
          <span>{{ maintenanceContract.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link
            class="btn btn-primary"
            :to="{name: 'maintenance-contract-edit', params:{ pk: pk}}"
          >
            {{ $trans("Edit contract") }}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class='page-detail'>

      <div class='flex-columns'>
      <div class='panel col-1-3 sidebar'>
        <h6>{{ $trans('Contract')}}</h6>
        <dl>
          <dt>{{ $trans('Value') }}</dt>
          <dd>{{ sumTariffsDinero.toFormat('$0.00') }}</dd>
          <dt>{{ $trans('Remarks') }}</dt>
          <dd>{{ maintenanceContract.remarks }}</dd>
        </dl>
        <h6>{{ $trans('Customer') }}</h6>
        <CustomerCard :customer="customerRecord"/>
        <dl>
          <dt></dt>
          <dd>
            <router-link
              class="btn btn-primary"
              :to="{name: 'customer-view', params: {pk: customerRecord.id}}">
              <IBiBuilding></IBiBuilding>
              {{ $trans('view customer details') }}
            </router-link>
          </dd>
        </dl>
      </div>

      <div class='panel col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Equipment')">
            
            <div class="flex-columns" style="justify-content: end;">
              <span>
                {{ $trans('Create order?') }}&nbsp;
                <BButton
                  @click="selectEquipment"
                  class="btn btn-primary"
                  size="sm"
                  type="button"
                  variant="primary"
                  :disabled="staging"
                >
                  {{ $trans("Select equipment") }}
                </BButton>
              </span>
            </div>
            <hr/>
            <div>
              <b-table
                small
                :fields="equipmentFieldsCreate"
                :items="orderLinesData" responsive="md"
              >
                <template #cell(id)="data">
                  <BFormCheckbox
                    :id="`equipment${data.item.equipment_pk}`"
                    v-model="data.item.useAsOrderLine"
                  >
                  </BFormCheckbox>
                </template>
                  <template #cell(frequency)="data">
                    <span>
                      <strong>{{ data.item.times_per_year }}</strong> &times; {{ $trans('yearly') }}
                    </span>
                    <small class="dimmed">({{ data.item.num_order_equipment }} {{ $trans('in orders') }})</small>
                </template>
                <template #cell(amount)="data">
                  <BFormGroup
                  label-cols="4">
                  <BFormInput
                    :value="`${data.item.amount}`"
                    v-model="data.item.amount"
                    type="number"
                    min="1"
                  />
                </BFormGroup>
                </template>
              </b-table>
              <footer class="modal-footer">
                <BButton @click="cancelForm" class="btn btn-secondary" type="reset" variant="secondary">
                  {{ $trans('Cancel') }}
                </BButton>
                <BButton @click="createOrder" :disabled="buttonDisabled" class="btn btn-primary" type="submit" variant="primary">
                  {{ $trans('Add equipment') }}
                </BButton>
              </footer>

            </div>

            
            <div v-if="equipmentRows.length > 0" >
              <b-table

                :fields="equipmentFields"
                :items="equipmentRows" responsive="md"
              >
                <template #cell(times_per_year)="data">
                  <span>
                    <strong>{{ data.item.times_per_year }}</strong> &times; {{ $trans('yearly') }}
                  </span>
                  <small class="dimmed">({{ data.item.num_order_equipment ?? 0 }} {{ $trans('in orders') }})</small>
                </template>
                <template #cell(tariff)="data">
                  <div style="text-align: end;">{{ rowDinero(data.item).toFormat('$0.00')}}</div>
                </template>
              </b-table>
            </div>
          </b-tab>
          <b-tab
          :title="`${$trans('Orders')} (${maintenanceOrders.length})`"
          >
            
            <div class="flex-columns" style="justify-content: end;">
              <span>
                <BButton-toolbar>
                  <BButton-group class="me-1">
                    <ButtonLinkRefresh
                      v-bind:method="refreshOrders"
                      v-bind:title="$trans('Refresh')"
                    />
                  </BButton-group>
                </BButton-toolbar>
              </span>
            </div>
            <hr/>
            <OrdersTable
              :orders="maintenanceOrders"
              :busy="ordersQuery.isLoading.value"
              :hide-columns="['order_name']"
              show-empty
              :empty-text="`${$trans('No orders for')} ${$trans('contract')}.`"
            />
            <b-pagination
              v-if="ordersCount > 20"
              class="pt-4"
              v-model="ordersPage"
              :total-rows="ordersCount"
              :per-page="ordersPerPage"
              aria-controls="maintenance-orders-table"
            ></b-pagination>

          </b-tab>
        </b-tabs>

      </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'

import {
  customerMaintenanceContractRetrieveOptions,
  customerMaintenanceEquipmentListOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Customer, MaintenanceContract, MaintenanceEquipment } from '@/api/types.gen'
import CustomerCard from '@/components/CustomerCard.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import client from '@/services/api'
import { useMainStore } from '@/stores/main'
import { toDinero, errorToast, $trans } from '@/utils'
import { rowDinero as sharedRowDinero, tryToDinero } from './dinero-helpers'




const props = withDefaults(defineProps<{
  pk?: string | number | null
}>(), {
  pk: null,
})

const router = useRouter()
const mainStore = useMainStore()
const {create} = useToast()

const contractId = computed(() => Number(props.pk))

const detailQuery = useQuery(() =>
  customerMaintenanceContractRetrieveOptions({path: {id: contractId.value}}),
)
const maintenanceContract = computed(() => detailQuery.data.value as MaintenanceContract | undefined)

const customerRecord = computed<Customer>(() => maintenanceContract.value?.customer_view ?? ({} as Customer))

const equipmentQuery = useQuery(() =>
  customerMaintenanceEquipmentListOptions({query: {contract: contractId.value, page: 1}}),
)
const equipmentRows = computed(() => equipmentQuery.data.value?.results ?? [])

function rowDinero(row: MaintenanceEquipment) {
  return sharedRowDinero(row, row.tariff_currency || mainStore.getDefaultCurrency)
}


const sumTariffsDinero = computed(() => {
  const contract = maintenanceContract.value
  if (!contract) return toDinero('0.00', mainStore.getDefaultCurrency)
  return tryToDinero(contract.sum_tariffs, mainStore.getDefaultCurrency)
    ?? toDinero('0.00', mainStore.getDefaultCurrency)
})



const ordersPerPage = 20
const ordersPage = ref(1)

interface MaintenanceOrderRow {
  id: number
  order_name?: string
  [key: string]: unknown
}

interface MaintenanceOrdersEnvelope {
  count?: number
  results?: MaintenanceOrderRow[]
}

const ordersQuery = useQuery(() => ({
  queryKey: ['orderOrderMaintenanceOrders', contractId.value, ordersPage.value],
  queryFn: async (): Promise<MaintenanceOrdersEnvelope> => {

    const response = await client.get('/order/order/maintenance_orders/', {
      params: {contract: contractId.value, page: ordersPage.value},
    })
    return response.data
  },
}))
const maintenanceOrders = computed(() => ordersQuery.data.value?.results ?? [])
const ordersCount = computed(() => ordersQuery.data.value?.count ?? 0)

function refreshOrders() {
  ordersQuery.refetch()
}




watch(
  () => detailQuery.error.value,
  (error) => {
    if (error) loadErrorToast(error)
  },
)

watch(
  () => equipmentQuery.error.value,
  (error) => {
    if (error) loadErrorToast(error)
  },
)

watch(
  () => ordersQuery.error.value,
  (error) => {
    if (error) loadErrorToast(error)
  },
)

function loadErrorToast(error: unknown) {
  const axiosError = error as {response?: {status?: number; statusText?: string}}
  errorToast(
    create,
    `${$trans('Error loading maintenance contract')}: ${axiosError.response?.status} ${axiosError.response?.statusText}`,
  )
}



interface OrderLine {
  contract_pk: string | number | null
  customer_pk?: number
  equipment_pk: number | null | undefined
  name: string
  times_per_year?: number
  num_order_equipment: number
  amount: number
  contract_amount: number
  useAsOrderLine: boolean
  remarks?: string | null
}

const orderLinesData = ref<OrderLine[]>([])
const staging = ref(false)

function selectEquipment() {
  orderLinesData.value = equipmentRows.value.map((row) => ({
    contract_pk: props.pk,
    customer_pk: customerRecord.value.id,
    equipment_pk: row.equipment,
    name: row.equipment_name,
    times_per_year: row.times_per_year,
    num_order_equipment: row.num_order_equipment ? row.num_order_equipment : 0,
    amount: 1,
    contract_amount: 1,
    useAsOrderLine: false,
    remarks: row.remarks,
  }))
  staging.value = true
}

function cancelForm() {
  staging.value = false
}

const buttonDisabled = computed(
  () => orderLinesData.value.filter((m) => m.useAsOrderLine === true).length === 0,
)

function createOrder() {

  const orderlines = orderLinesData.value.filter((m) => m.useAsOrderLine === true)
  const data = {
    maintenanceEquipment: orderlines,
    customer_pk: customerRecord.value.id,
    contract_pk: props.pk,
  }
  mainStore.setMaintenanceEquipment(data)


  router.push({name: 'order-add-maintenance'})
}



const equipmentFields = [
  {key: 'equipment_name', label: $trans('Name')},
  {key: 'times_per_year', label: $trans('Frequency')},
  {key: 'tariff', label: $trans('Tariff'), thAttr: {style: 'text-align: right;'}},
  {key: 'remarks', label: $trans('Remarks')},
  {key: 'icons', label: ''},
]

const equipmentFieldsCreate = [
  {key: 'id', label: $trans('id'), thAttr: {width: '5%'}},
  {key: 'name', label: $trans('Name')},
  {key: 'frequency', label: $trans('Frequency'), thAttr: {width: '50%'}},
  {key: 'amount', label: $trans('Amount'), thAttr: {width: '15%'}},
]

const isLoading = computed(() => detailQuery.isLoading.value || equipmentQuery.isLoading.value)
</script>
<style scoped>
div.new-equipment {
  background-color: #f6cdd1;
  padding: 20px;
}
</style>
