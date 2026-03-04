<template>
  <div class="app-page" v-if="location">
    <header>

      <div class='page-title' v-if="location">
        <h3>
          <IBiShopWindow></IBiShopWindow>
          <span @click="goBack" class="backlink">{{ $trans("Locations") }}</span>
          / {{ location.name }}
        </h3>
        <router-link :to="{name: editLink, params: {pk: this.pk}}" class="btn primary">{{$trans('Edit location')}}</router-link>
      </div>
      <SearchModal
          id="search-modal"
          ref="search-modal"
          @do-search="handleSearchOk"
        />
    </header>

    <div class='page-detail flex-columns'>
      <div class='panel col-1-3 sidebar'>
        <h6>{{ $trans('Location details') }}</h6>
        <dl>
          <dt>{{ $trans('Name') }}</dt>
          <dd v-if="location">{{ location.name }}</dd>
          <dt v-if="hasQr" class="align-top-verdomme">{{ $trans('QR code') }}</dt>
          <dd v-if="hasQr">
            <div v-if="location.qr_path" class="qr-container">
              <BLink
                class="btn btn-sm btn-outline" :href="location.qr_path"
                target="_blank"
                :title="$trans('Open QR in new tab')">
                <img alt="QR code" class="qr-code-image" :src="location.qr_path" />
              </BLink>
              <p>
                <a href="javascript:" @click="download(location)">
                  {{ $trans("Download") }}
                </a>
              </p>
            </div>
            <img v-if="!location.qr_path" :alt="$trans('No QR yet')" class="qr-code-image" :src="NO_IMAGE_URL" />
            <p>
              <BButton @click="recreate_qr">
                {{ $trans("Recreate")}}
              </BButton>
            </p>
          </dd>
        </dl>
        <dt class="align-top-verdomme">{{ $trans('Equipment') }}</dt>
        <dd>
          <b-table
            id="equipment-table"
            :small="true"
            :busy='isLoading'
            :fields="equipmentFields"
            :items="equipmentObjects"
            responsive="md"
            class="data-table"
          >
            <template #cell(name)="data">
              <router-link :to="{name: viewMaterialLink, params: {pk: data.item.id}}">
                {{ data.item.name }}
              </router-link><br/>
            </template>
          </b-table>
        </dd>
      </div>

      <div class='panel col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Orders')">
            <div class='flex-columns space-between align-items-center'>
              <h6>{{ $trans("Past orders") }}</h6>
              <span>
                <BButton-group>
                  <ButtonLinkRefresh
                  v-bind:method="function() { loadData() }"
                  v-bind:title="$trans('Refresh')"
                  />
                  <ButtonLinkSearch
                  v-bind:method="function() { showSearchModal() }"
                  />
                </BButton-group>
              </span>
            </div>
            <ul class='listing order-list'>
              <li v-for="item in orders" :key="item.id">
                <OrderTableInfo
                  v-bind:order="item"
                />
              </li>
            </ul>
            <b-pagination
              v-if="orderService.count > 20"
              class="pt-4"
              v-model="currentPage"
              :total-rows="orderService.count"
              :per-page="orderService.perPage"
              aria-controls="customer-past-table"
            ></b-pagination>
          </b-tab>
          <b-tab key="stats" :title="$trans('Insights')" @click="renderStats">
            <OrderStats
              :data-in="statsData"
              ref="order-stats"
            />
          </b-tab>
          <b-tab key="docs" :title="$trans('Documents')">
            <DocumentsComponent
              :location="location"
              :is-view="true"
            />
          </b-tab>
        </b-tabs>
      </div>
    </div>
  </div>
</template>

<script>
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderStats from "../../components/OrderStats";

import {NO_IMAGE_URL} from '@/constants'

import { OrderService } from '@/models/orders/Order'
import { LocationService } from "@/models/equipment/location";
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import my24 from "@/services/my24";
import {useToast} from "bootstrap-vue-next";
import {useMainStore} from "@/stores/main";
import {$trans, errorToast} from "@/utils";
import {EquipmentService} from "@/models/equipment/equipment";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  components: {
    DocumentsComponent,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
  },
  data() {
    return {
      NO_IMAGE_URL,
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      buttonDisabled: false,
      location: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Location'),
          to: {name: this.listLink()}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
      ],
      locationService: new LocationService(),
      orderService: new OrderService(),
      equipmentService: new EquipmentService(),
      statsData: null,
      equipmentFields: [],
      equipmentObjects: [],
      equipmentFieldsCustomerPlanning: [
        {key: 'name', label: $trans('Equipment'), sortable: true},
        {key: 'customer', label: $trans('Customer'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsBranchPlanning: [
        {key: 'name', label: $trans('Equipment'), sortable: true},
        {key: 'branch', label: $trans('Branch'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsCustomerNonPlanning: [
        {key: 'name', label: $trans('Equipment'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
      equipmentFieldsBranchNonPlanning: [
        {key: 'name', label: $trans('Equipment'), sortable: true},
        {key: 'num_orders', label: $trans('Orders'), sortable: true},
      ],
    }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    currentPage: function(val) {
      this.orderService.currentPage = val
      this.loadData()
    }
  },
  computed: {
    hasQr() {
      const qrType = this.mainStore.getEquipmentQrType;
      return qrType !== 'none'
    },
    editLink() {
      if (this.hasBranches) {
        return 'equipment-location-edit'
      } else {
        return 'customers-location-edit'
      }
    },
    viewMaterialLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-view'
      } else {
        return 'customers-equipment-view'
      }
    },
  },
  methods: {
    $trans,
    async renderStats() {
      try {
        // this.isLoading = true
        const orderTypeStatsData = await this.orderService.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await this.orderService.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsEquipment(this.pk)

        this.statsData = {
          orderTypeStatsData,
          monthsStatsData,
          orderTypesMonthStatsData,
          countsYearOrdertypeStats
        }
        // this.isLoading = false
      } catch(error) {
        console.log('error fetching location stats', error)
        errorToast(this.create, `${this.$trans('Error fetching location insights:')} ${error}`)
        // this.isLoading = false
      }
    },
    download(equipment) {
      my24.downloadItem(equipment.qr_path, `${equipment.name} ${equipment.uuid}.png`)
    },
    async recreate_qr() {
      const result = await this.locationService.recreateQr(this.pk)
      this.location = {
        ...this.location,
        qr_path: result.qr_path
      }
    },
    listLink() {
      if (this.hasBranches) {
        return 'equipment-location-list'
      } else {
        return 'customers-location-list'
      }
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.orderService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // rest
    goBack() {
      this.$router.go(-1)
    },
    async loadData() {
      this.isLoading = true

      try {
        await this.loadHistory()
        this.location = await this.locationService.detail(this.pk)
        this.equipmentService.addListArg(`location=${this.pk}`)
        this.equipmentService.addListArg('page_size=1000')
        const response = await this.equipmentService.list()
        this.equipmentObjects = response.results
        console.log(this.equipmentObjects)
      } catch(error) {
        console.log('error fetching location detail data', error)
        errorToast(this.create, this.$trans('Error fetching location detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        const results = await this.orderService.getAllForEquipmentLocation(null, this.pk)
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching history orders', error)
        errorToast(this.create, this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  async created() {
    if (this.hasBranches) {
      if (this.isEmployee) {
        this.equipmentFields = this.equipmentFieldsBranchNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsBranchPlanning
      }
    } else {
      if (this.isCustomer) {
        this.equipmentFields = this.equipmentFieldsCustomerNonPlanning
      } else {
        this.equipmentFields = this.equipmentFieldsCustomerPlanning
      }
    }

    await this.loadData()
  },
  async mounted () {
  }
}
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
