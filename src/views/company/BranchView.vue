<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
        <header v-if="branch">
          <div class='page-title'>
            <h3>
              <b-icon icon="shop"></b-icon>
              <span class='backlink' @click="goBack">{{ $trans("Branches") }}</span> /
              <strong>{{ branch.name }}</strong>
            </h3>
            <router-link
            :to="{name: 'company-branch-edit', params: {pk: pk}}"
            class="btn"
            >{{ $trans("Edit branch") }}</router-link>
          </div>
        </header>
        <div class='page-detail flex-columns'>
          <div class="branch-details panel col-1-3" v-if="!isBranchEmployee">
            <BranchCard :branch="branch"/>
          </div>

          <div class='panel col-2-3'>
            <b-tabs>
              <b-tab :title="$trans('Insights')">
                <OrderStats
                  :data-in="statsData"
                  ref="order-stats"
                />
              </b-tab>
              <b-tab :title="$trans('Equipment')">
                  <b-table
                    id="equipment-table"
                    small
                    :busy='isLoading'
                    :fields="equipmentFields"
                    :items="equipment"
                    responsive="md"
                    class="data-table"
                  >
                    <template #cell(icons)="data">
                      <div class="h2 float-right">
                        <span class="button-container">
                          <b-button
                            :to="{name: 'equipment-equipment-edit', params: {pk: data.item.id}}"
                            class="btn btn-outline-secondary"
                            size="sm"
                            type="button"
                            variant="outline-secondary"
                          >
                            {{ $trans('Edit') }}
                          </b-button>
                        </span>
                      </div>
                    </template>
                  </b-table>

                  <b-row align-h="end">
                    <span class="button-container">
                      <b-button
                        class="btn btn-outline-secondary"
                        :to="{name: 'equipment-equipment-add'}"
                        size="sm"
                        type="button"
                        variant="outline-secondary"
                      >
                        {{ $trans('New') }}
                      </b-button>
                    </span>
                    <span class="button-container">
                      <b-button
                        class="btn btn-outline-secondary"
                        :to="{name: 'equipment-equipment-list'}"
                        size="sm"
                        type="button"
                        variant="outline-secondary"
                      >
                        {{ $trans('Manage >>') }}
                      </b-button>
                    </span>
                  </b-row>
              </b-tab>
              <b-tab :title="$trans('Locations')">
                <b-table
                    id="branch-location-table"
                    small
                    :busy='isLoading'
                    :fields="locationFields"
                    :items="locations"
                    responsive="md"
                    class="data-table"
                  >
                  <template #cell(icons)="data">
                    <div class="h2 float-right">
                      <span class="button-container">
                        <b-button
                          :to="{name: 'equipment-location-edit', params: {pk: data.item.id}}"
                          class="btn btn-outline-secondary"
                          size="sm"
                          type="button"
                          variant="outline-secondary"
                        >
                          {{ $trans('Edit') }}
                        </b-button>
                      </span>
                    </div>
                  </template>
                </b-table>
                <span class="button-container">
                  <b-button
                    class="btn btn-outline-secondary"
                    :to="{name: 'equipment-location-add'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('New') }}
                  </b-button>
                </span>
                <span class="button-container">
                  <b-button
                    class="btn btn-outline-secondary"
                    :to="{name: 'equipment-location-list'}"
                    size="sm"
                    type="button"
                    variant="outline-secondary"
                  >
                    {{ $trans('Manage >>') }}
                  </b-button>
                </span>
              </b-tab>
              <b-tab :title="$trans('Past orders')">

                <div>

                <SearchModal
                  id="search-modal"
                  ref="search-modal"
                  @do-search="handleSearchOk"
                />

                <div class='flex-columns' style="justify-content: space-between;">
                  <span></span>
                  <span>
                  <b-button-toolbar>
                    <b-button-group class="mr-1">
                      <ButtonLinkRefresh
                        v-bind:method="function() { loadData() }"
                        v-bind:title="$trans('Refresh')"
                      />
                      <ButtonLinkSearch
                        v-bind:method="function() { showSearchModal() }"
                      />
                    </b-button-group>
                  </b-button-toolbar>
                  </span>
                </div>
                <br>
                <ul class='listing order-list'>
                  <li v-for="order in orders" :key="order.id">
                    <OrderTableInfo
                      v-bind:order="order"
                      />
                  </li>
                </ul>
                <b-pagination
                  v-if="orderService.count > 20"
                  class="pt-4"
                  v-model="currentPage"
                  :total-rows="orderService.count"
                  :per-page="orderService.perPage"
                  aria-controls="orders-table"
                ></b-pagination>
              </div>
              </b-tab>
              <template #tabs-end>

              </template>
            </b-tabs>
          </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import OrderStats from "../../components/OrderStats";

import BranchCard from '../../components/BranchCard.vue'

import {BranchService, BranchModel} from '@/models/company/Branch'
import {OrderService} from '@/models/orders/Order'
import {LocationService} from "@/models/equipment/location";
import {EquipmentService} from "@/models/equipment/equipment";

export default {

  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
    BranchCard
},
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderService: new OrderService(),
      branchService: new BranchService(),
      locationService: new LocationService(),
      equipmentService: new EquipmentService(),
      buttonDisabled: false,
      branch: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: $trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: $trans('Branches'),
          to: {name: 'company-branches'}
        },
        {
          text: $trans('Detail'),
          active: true
        },
      ],

      locations: [],
      locationFields: [
        {key: 'name', label: $trans('Name')},
        {key: 'created', label: $trans('Created')},
        {key: 'modified', label: $trans('Modified')},
        {key: 'icons', label: ""}
      ],

      equipment: [],
      equipmentFields: [
        {key: 'name', label: $trans('Equipment')},
        {key: 'brand', label: $trans('Brand')},
        {key: 'created', label: $trans('Created')},
        {key: 'icons', label: ""}
      ],
      statsData: null
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
  methods: {
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

      await this.loadHistory()

      try {
        if (!this.isBranchEmployee) {
          this.branch = await this.branchService.detail(this.pk)

          const orderTypeStatsData = await this.orderService.getOrderTypesStatsBranch(this.pk)
          const monthsStatsData = await this.orderService.getMonthsStatsBranch(this.pk)
          const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsBranch(this.pk)
          const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsBranch(this.pk)

          this.statsData = {
            orderTypeStatsData,
            monthsStatsData,
            orderTypesMonthStatsData,
            countsYearOrdertypeStats
          }

          this.locationService.setListArgs(`branch=${this.pk}`)
          let data = await this.locationService.list()
          this.locations = data.results

          this.equipmentService.setListArgs(`branch=${this.pk}`)
          data = await this.equipmentService.list()
          this.equipment = data.results

          this.isLoading = false
          return
        }

        const orderTypeStatsData = await this.orderService.getOrderTypesStatsBranch()
        const monthsStatsData = await this.orderService.getMonthsStatsBranch()
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsBranch()
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsBranch()

        this.statsData = {
          orderTypeStatsData,
          monthsStatsData,
          orderTypesMonthStatsData,
          countsYearOrdertypeStats
        }

        let data = await this.locationService.list()
        this.locations = data.results

        data = await this.equipmentService.list()
        this.equipment = data.results

      } catch(error) {
        console.log('error fetching branch detail data', error)
        errorToast(create, $trans('Error fetching branch detail'))
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        this.orderService.setListArgs(`branch=${this.pk}`)
        const results = await this.orderService.list()
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching history orders', error)
        errorToast(create, $trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
  },
  async mounted () {
  }
}
</script>

<style scoped>
span.button-container {
  padding: 8px;
}
span.spacer {
  width: 10px;
}
div.spacer {
  margin: 10px;
}
</style>
