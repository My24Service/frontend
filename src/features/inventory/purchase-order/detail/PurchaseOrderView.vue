<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3>
          <IBiFileEarmarkMedical></IBiFileEarmarkMedical>
          <span class="backlink" @click="goBack">{{ $trans('Purchase orders') }}</span> /
          {{ purchaseOrder?.purchase_order_id }} <span class="dimmed">{{ purchaseOrder?.order_name }}</span>
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
          {{ $trans('Back') }}</BButton>
          <router-link :to="{name: 'purchaseorder-edit', params: {pk: pk}}" class="btn">
            <IBiPencil></IBiPencil>
            {{ $trans('Edit purchase order') }}
          </router-link>
        </div>
      </div>
    </header>
    <div v-if="purchaseOrder" class="page-detail flex-columns">
      <div class="panel">
        <h3><strong>{{ purchaseOrder.purchase_order_id }}</strong> <br/><small>{{ purchaseOrder.order_name }}</small>
        </h3>

          <dl>
            <dt>{{ $trans('Expected entry date') }}</dt>
            <dd>{{ purchaseOrder.expected_entry_date }}</dd>

            <dt>{{ $trans('Supplier') }}</dt>
            <dd>{{ purchaseOrder.order_name }}</dd>

            <dt>{{ $trans('Address') }}</dt>
            <dd>{{ purchaseOrder.order_address }}</dd>

            <dt>{{ $trans('Country/Postal/city') }}</dt>
            <dd>
              {{ purchaseOrder.order_country_code }}-
              {{ purchaseOrder.order_postal }} {{ purchaseOrder.order_city }}
            </dd>

            <dt>{{ $trans('Contact') }}</dt>
            <dd>{{ purchaseOrder.order_contact }}</dd>

            <dt>{{ $trans('Tel') }}</dt>
            <dd>{{ purchaseOrder.order_tel }}</dd>
          </dl>

          <dl>
            <dt>{{ $trans('Mobile') }}</dt>
            <dd>{{ purchaseOrder.order_mobile }}</dd>

            <dt>{{ $trans('Email') }}</dt>
            <dd>
              <BLink class="px-1" v-bind:href="`mailto:${purchaseOrder.order_email}`">
                {{ purchaseOrder.order_email }}
              </BLink>
            </dd>

            <dt>{{ $trans('Order reference') }}</dt>
            <dd>{{ purchaseOrder.order_reference }}</dd>

            <dt>{{ $trans('Supplier remarks') }}</dt>
            <dd>{{ purchaseOrder.supplier_remarks}}</dd>
          </dl>

        <h6>{{$trans('History')}}</h6>

          <ul class="listing">
            <li v-for="status in purchaseOrder.statuses" :key="status.id">
              <div class="listing-item">
                <small>{{ status.created }}</small> <span>{{ status.status }}</span>
              </div>
            </li>
          </ul>

      </div>

      <div class="panel col-2-3">
        <b-row v-if="purchaseOrder.materials.length">
        <b-col cols="12">
          <h6>{{ $trans('Products') }}</h6>
          <MaterialRowsTable
            table-id="purchaseorder-materials-table"
            :items="purchaseOrder.materials"
          />
          </b-col>
        </b-row>

        <b-row v-if="purchaseOrder.reservation_materials && purchaseOrder.reservation_materials.length">
          <b-col cols="12">
            <h6>{{ $trans('Reserved products') }}</h6>
            <MaterialRowsTable
              table-id="purchaseorder-reservation_materials-table"
              :items="purchaseOrder.reservation_materials"
            />
          </b-col>
        </b-row>

        <b-row v-if="purchaseOrder.entries && purchaseOrder.entries.length">
          <b-col cols="12">
            <h6>{{ $trans('Entries') }}</h6>
            <b-table
              id="purchaseorder-entries-table"
              :sort-by="[{key: 'purchase_order_material_view.name', order: 'asc'}]"
              :fields="entryFields"
              :items="purchaseOrder.entries"
              responsive="sm"
            ></b-table>
          </b-col>
        </b-row>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQueryErrorToast } from '@/features/forms'
import { MaterialRowsTable } from '../../material-rows'

/**
 * One purchase order, read-only: the supplier's copy of the address, the
 * status history, the products ordered, the reserved products it was made
 * from, and the entries booked against it.
 */
const props = defineProps<{
  pk: string | number
}>()

const router = useRouter()

const query = useQuery(() => Api.InventoryPurchaseorder.retrieveOptions(Number(props.pk)))
useQueryErrorToast(query.error, $trans('Error fetching purchase order'))
const purchaseOrder = computed(() => query.data.value)

const entryFields = [
  {key: 'material_name', label: $trans('Product')},
  {key: 'amount', label: $trans('Amount')},
  {key: 'entry_date', label: $trans('Date')},
]

function goBack() {
  router.go(-1)
}
</script>
