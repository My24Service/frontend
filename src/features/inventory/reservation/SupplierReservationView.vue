<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3><IBiFileEarmarkLock></IBiFileEarmarkLock>
          <router-link :to="{name:'supplier-reservation-list'}">{{ $trans("Reservations") }}</router-link> / {{ pk }}
        </h3>
        <div class="flex-columns">
          <BButton @click="goBack" class="btn btn-info" type="button" variant="secondary">
            {{ $trans('Back') }}</BButton>
          <router-link
            class="btn btn-primary"
            :to="{name: 'supplier-reservation-edit', params: {pk: pk}}"
          >
            {{ $trans("Edit") }}
          </router-link>
        </div>
      </div>
    </header>
    <div class="page-details panel">
      <b-overlay :show="isLoading" rounded="sm">
        <h3 v-if="reservation">{{ $trans('Reservation info') }}</h3>
        <b-row v-if="reservation">
          <b-col cols="6">
            <b-table-simple>
              <b-tr>
                <b-td><strong>{{ $trans('Supplier') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.name }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Address') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.address }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Country/Postal/city') }}:</strong></b-td>
                <b-td>
                  {{ reservation.supplier_view.country_code }}-
                  {{ reservation.supplier_view.postal }} {{ reservation.supplier_view.city }}
                </b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Contact') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.contact }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Tel') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.tel }}</b-td>
              </b-tr>
            </b-table-simple>
          </b-col>
          <b-col cols="6">
            <b-table-simple>
              <b-tr>
                <b-td><strong>{{ $trans('Created') }}:</strong></b-td>
                <b-td>{{ reservation.created }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Modified') }}:</strong></b-td>
                <b-td>{{ reservation.modified }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Mobile') }}:</strong></b-td>
                <b-td>{{ reservation.supplier_view.mobile }}</b-td>
              </b-tr>
              <b-tr>
                <b-td><strong>{{ $trans('Email') }}:</strong></b-td>
                <b-td>
                  <BLink class="px-1" v-bind:href="`mailto:${reservation.supplier_view.email}`">
                    {{ reservation.supplier_view.email }}
                  </BLink>
                </b-td>
              </b-tr>
            </b-table-simple>
          </b-col>
        </b-row>
        <b-row v-if="reservation && reservation.materials.length">
          <b-col cols="12">
            <h4>{{ $trans('Products') }}</h4>
            <MaterialRowsTable
              dark
              table-id="reservation-materials-table"
              :items="reservation.materials"
            />
            </b-col>
        </b-row>
      </b-overlay>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQueryErrorToast } from '@/features/forms'
import { MaterialRowsTable } from '../material-rows'

/** One supplier reservation, read-only: the supplier's details and the products reserved. */
const props = defineProps<{
  pk: string | number
}>()

const router = useRouter()

const query = useQuery(() => Api.InventorySupplierReservation.retrieve.options({path: {id: Number(props.pk)}}))
useQueryErrorToast(query.error, $trans('Error fetching reservation'))
const reservation = computed(() => query.data.value)
const isLoading = computed(() => query.isLoading.value)

function goBack() {
  router.go(-1)
}
</script>
