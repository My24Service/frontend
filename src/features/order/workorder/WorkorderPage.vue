<template>
  <div class="container-fluid">
    <div
      v-if="data"
      class="pdf-container"
    >
      <div class="row">
        <div class="col-sm-2 logo">
          <img
            class="thumbnail"
            :src="companyLogo"
            style="border:0; max-height: 120px; max-width: 120px"
            :alt="data.member.name"
          >
        </div>

        <div class="col-sm-4 info">
          <b>{{ data.member.name }}</b><br>
          {{ data.member.address }}<br>
          {{ data.member.postal }} {{ data.member.city }}<br>
          {{ data.member.tel }} - {{ data.member.email }}
        </div>
        <div class="col-sm-6 panel panel-default">
          <div class="panel-body">
            <div class="row">
              <div class="pull-left col-sm-4"><b>{{ $trans('Order ID') }}</b></div>
              <div class="col-sm-6 underline">
                <span class="pull-right">{{ data.order.order_id }}</span>
              </div>
            </div>
            <div
              v-if="showRelatedOrders && parentOrder?.companycode"
              class="row"
            >
              <div class="pull-left col-sm-4"><b>{{ $trans('Original order ID') }}</b></div>
              <div class="col-sm-6 underline">
                <span class="pull-right">
                  {{ parentOrder.companycode }} - {{ parentOrder.order_id }}
                </span>
              </div>
            </div>
            <div
              v-if="showRelatedOrders && data.copied_order_data.length"
              class="row"
            >
              <div class="pull-left col-sm-4"><b>{{ $trans('Partner order ID(s)') }}</b></div>
              <div class="col-sm-6 underline">
                <div
                  v-for="copied in data.copied_order_data"
                  :key="copied.companycode"
                  class="pull-right"
                >
                  {{ copied.companycode }} - {{ copied.order_id }}
                </div>
              </div>
            </div>
            <div class="row">
              <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
              <span class="col-sm-6 underline">
                <span class="pull-right">{{ data.order.order_reference }}&nbsp;</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-sm-6">
          <div class="row">
            <div class="pull-left col-sm-6"><b>{{ $trans('Customer ID') }}</b></div>
            <div class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.customer_id }}</span>
            </div>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_name }}</span>
            </span>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_address }}</span>
            </span>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_country_code }}-{{ data.order.order_postal }} {{ data.order.order_city }}</span>
            </span>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Order type') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_type }}</span>
            </span>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Date') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_date }}</span>
            </span>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Contact') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.order_contact }}</span>
            </span>
          </div>
          <div class="row">
            <span class="pull-left col-sm-6"><b>{{ $trans('Customer reference') }}</b></span>
            <span class="col-sm-6 underline">
              <span class="pull-right">{{ data.order.customer_reference }}</span>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="data.order.orderlines.length"
        class="row"
      >
        <p><b>{{ $trans('Orderlines') }}</b></p>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>{{ $trans('Equipment') }}</th>
              <th>{{ $trans('Location') }}</th>
              <th>{{ $trans('Remarks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="orderline in data.order.orderlines"
              :key="orderline.id"
            >
              <td>{{ orderline.product }}</td>
              <td>{{ orderline.location }}</td>
              <td>{{ orderline.remarks }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="row">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>{{ $trans("Date") }}</th>
              <th colspan="2">{{ $trans('Work hours') }}</th>
              <th>{{ $trans('Engineer') }}</th>
              <th colspan="2">{{ $trans('Travel time') }}</th>
              <th>{{ $trans('Distance to') }}</th>
              <th>{{ $trans('Distance back') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&nbsp;</td>
              <td><b>{{ $trans('From') }}</b></td>
              <td><b>{{ $trans('To') }}</b></td>
              <td>&nbsp;</td>
              <td><b>{{ $trans('To') }}</b></td>
              <td><b>{{ $trans('Back') }}</b></td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
            <tr
              v-for="(activity, index) in data.assigned_order_activity"
              :key="index"
            >
              <td>{{ activity.date }}</td>
              <td>{{ activity.work_start }}</td>
              <td>{{ activity.work_end }}</td>
              <td>{{ activity.full_name }}</td>
              <td>{{ activity.travel_to }}</td>
              <td>{{ activity.travel_back }}</td>
              <td>{{ activity.distance_to }}</td>
              <td>{{ activity.distance_back }}</td>
            </tr>
            <tr>
              <td><b>{{ $trans('Total') }}</b></td>
              <td>&nbsp;</td>
              <td><b>{{ totals.work_total }}</b></td>
              <td>&nbsp;</td>
              <td><b>{{ totals.travel_to_total }}</b></td>
              <td><b>{{ totals.travel_back_total }}</b></td>
              <td><b>{{ totals.distance_to_total }}</b></td>
              <td><b>{{ totals.distance_back_total }}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="data.assigned_order_extra_work.length"
        class="row"
      >
        <p><b>{{ $trans('Extra work') }}</b></p>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>{{ $trans('Engineer') }}</th>
              <th>{{ $trans('Description') }}</th>
              <th>{{ $trans('Hours') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(extraWork, index) in data.assigned_order_extra_work"
              :key="index"
            >
              <td>{{ extraWork.full_name }}</td>
              <td>{{ extraWork.extra_work_description }}</td>
              <td>{{ extraWork.extra_work }}</td>
            </tr>
            <tr>
              <td colspan="2"><b>{{ $trans('Total') }}</b></td>
              <td><b>{{ totals.extra_work_total }}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="data.assigned_order_materials.length"
        class="row"
      >
        <p><b>{{ $trans('Materials') }}</b></p>
        <table class="table table-bordered">
          <thead>
            <tr>
              <th>{{ $trans('Engineer') }}</th>
              <th>{{ $trans('Material') }}</th>
              <th>{{ $trans('Identifier') }}</th>
              <th>{{ $trans('Amount') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(material, index) in data.assigned_order_materials"
              :key="index"
            >
              <td>{{ material.engineer }}</td>
              <td>{{ material.name }}</td>
              <td>{{ material.identifier }}</td>
              <td>{{ material.amount }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="data.equipment.length"
        class="row"
      >
        <div class="col-sm-12">
          <p><b>{{ $trans('Equipment used') }}</b></p>
          <table class="table">
            <tbody>
              <tr
                v-for="eq in data.equipment"
                :key="eq.user"
              >
                <td width="30%">{{ eq.user }}</td>
                <td width="70%">{{ eq.equipment }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="data.description_work.length"
        class="row"
      >
        <div class="col-sm-12">
          <p><b>{{ $trans('Description work') }}</b></p>
          <table class="table">
            <tbody>
              <tr
                v-for="(work, index) in data.description_work"
                :key="index"
              >
                <td width="30%">{{ work.user }}</td>
                <td width="70%">{{ work.description_work }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div
        v-if="data.signatures"
        class="row avoid-page-break"
      >
        <div class="col-sm-12">
          <p><b>{{ $trans('Signatures') }}</b></p>
        </div>
        <div class="col-sm-6 avoid-page-break">
          <div>
            <p>{{ $trans('Name employee') }}: {{ data.signatures.signature_name_user }}</p>
            <hr>
            <p><img
              width="400"
              :src="data.signatures.signature_user"
            ></p>
          </div>
        </div>
        <div class="col-sm-6 avoid-page-break">
          <div>
            <p>{{ $trans('Name customer') }}: {{ data.signatures.signature_name_customer }}</p>
            <hr>
            <p><img
              width="400"
              :src="data.signatures.signature_customer"
            ></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'

import { orderWorkorderDataRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { $trans } from '@/services/i18n'
import { useMainStore } from '@/stores/main'

/**
 * The workorder as a printable page, on the public `workorder-view` route
 * (no login: the address is what the customer's e-mail carries). One read,
 * `/order/workorder-data/{uuid}/`, rendered as-is.
 */
const props = defineProps<{
  uuid: string
}>()

const mainStore = useMainStore()

const query = useQuery(() => orderWorkorderDataRetrieveOptions({path: {id: props.uuid}}))
useQueryErrorToast(query.error, $trans('Error loading workorder'))

const data = computed(() => query.data.value)

const companyLogo = computed(
  () => data.value?.member.companylogo_workorder || data.value?.member.companylogo || undefined,
)

const showRelatedOrders = computed(() => mainStore.getWorkorderShowRelatedOrders)
const parentOrder = computed(() => data.value?.order.parent_order_data ?? null)

// The activity totals are a free-form dict in the schema; the keys the
// table shows are what the backend has always sent.
const totals = computed(() => (data.value?.assigned_order_activity_totals ?? {}) as Record<string, unknown>)
</script>
