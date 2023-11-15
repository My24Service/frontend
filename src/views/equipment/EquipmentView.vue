<template>
  <div class="app-page" v-if="equipment">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="tools"></b-icon>
          <span class="backlink" @click="goBack">{{ $trans('Equipment') }}</span> /
          <span>{{ equipment.name }}</span>
        </h3>
        <b-button-toolbar>
          <router-link
          :to="{name: editLink, params:{pk: this.pk}}"
          class="btn"
          >{{ `${$trans('Edit')} ${$trans('equipment')}`}}</router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class='page-detail flex-columns' v-if="equipment && !isLoading">
      <div class='panel sidebar col-1-3'>
        <h6>Equipment details</h6>
        <dl>
          <dt>{{ $trans('Name') }}</dt>
          <dd>{{ equipment.name }}</dd>
          <dt>{{ $trans('Brand') }}</dt>
          <dd>{{ equipment.brand }}</dd>
          <dt>{{ $trans('Identifier') }}</dt>
          <dd>{{ equipment.identifier }}</dd>
          <dt>{{ $trans('Description') }}</dt>
          <dd>{{ equipment.description }}</dd>
          <dt>{{ $trans('Installation date') }}</dt>
          <dd>{{ equipment.installation_date ? this.$moment(equipment.installation_date).format('DD-MM-YYYY') : '' }}</dd>
          <dt>{{ $trans('Production date') }}</dt>
          <dd>{{ equipment.production_date ? this.$moment(equipment.production_date).format('DD-MM-YYYY') : ''}}</dd>
          <dt>{{ $trans('Serial number') }}</dt>
          <dd>{{ equipment.serialnumber }}</dd>
          <dt>{{ $trans('Standard hours') }}</dt>
          <dd>{{ equipment.standard_hours }}</dd>
          <dt>{{ $trans('Lifespan (months)') }}</dt>
          <dd>{{ equipment.default_replace_months }}</dd>
          <dt>{{ $trans('Price') }}</dt>
          <dd>{{ equipment.price_dinero.toFormat('$0.00') }}</dd>
        </dl>
      </div>

      <div class='panel wide col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Orders')">
            <div class='flex-columns space-between align-items-center'>
              <h6>{{ $trans('Orders')}}</h6>
              <span>
                <b-button-group class="">
                  <ButtonLinkRefresh
                    v-bind:method="function() { loadData() }"
                    v-bind:title="$trans('Refresh')" />
                  <ButtonLinkSearch v-bind:method="function() { showSearchModal() }"/>
                </b-button-group>
              </span>
            </div>
            <hr>
            <ul class='listing order-list'>
              <li v-for="item in orders" :key="item.id">
                <OrderTableInfo
                  v-bind:order="item"
                />
              </li>
            </ul>
            <b-pagination
              v-if="this.orderPastModel.count > 20"
              class="pt-4"
              v-model="currentPage"
              :total-rows="this.orderPastModel.count"
              :per-page="this.orderPastModel.perPage"
              aria-controls="customer-past-table"
            ></b-pagination>
          </b-tab>
          <b-tab :title="$trans('Insights')">
            <h6>Stats for {{ equipment.name }}</h6>
            <OrderStats
              v-if="!isLoading"
              ref="order-stats"
            />
          </b-tab>
        </b-tabs>
      </div>
    </div>
  </div>

</template>

<script>
import { OrderPastService } from '../../models/orders/OrderPast.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import { OrderService } from '../../models/orders/Order.js'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import { EquipmentService } from "../../models/equipment/equipment";
import moment from 'moment/min/moment-with-locales'

export default {
  mixins: [componentMixin],
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      isLoading: false,
      orderPastService: new OrderPastService(),
      orderService: new OrderService(),
      equipmentService: new EquipmentService(),
      buttonDisabled: false,
      equipment: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: this.$trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: this.$trans('Equipment'),
          to: {name: this.listLink()}
        },
        {
          text: this.$trans('Detail'),
          active: true
        },
      ],
    }
  },
  computed: {
    editLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-edit'
      } else {
        return 'customers-equipment-edit'
      }
    },
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    currentPage: function(val) {
      this.orderPastService.currentPage = val
      this.loadData()
    }
  },
  methods: {
    listLink() {
      if (this.hasBranches) {
        return 'equipment-equipment-list'
      } else {
        return 'customers-equipment-list'
      }
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.orderPastService.setSearchQuery(val)
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

      const equipmentData = await this.equipmentService.detail(this.pk)
      this.equipment = new this.equipmentService.model(equipmentData)
      try {
        const orderTypeStatsData = await this.orderService.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await this.orderService.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await this.orderService.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await this.orderService.getCountsYearOrdertypeStatsEquipment(this.pk)

        this.$refs['order-stats'].render(
          orderTypeStatsData, monthsStatsData, orderTypesMonthStatsData, countsYearOrdertypeStats
        )

      } catch(error) {
        console.log('error fetching equipment detail data', error)
        this.errorToast(`${this.$trans('Error fetching equipment detail:')} ${error}`)
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        this.orderPastService.addListArg(`equipment=${this.pk}`)
        const results = await this.orderPastService.list()
        this.orders = results.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching history orders', error)
        this.errorToast(this.$trans('Error fetching orders'))
        this.isLoading = false
      }
    }
  },
  created() {
    this.loadData()
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment;
    this.$moment.locale(lang)
  },
  async mounted () {
  }
}
</script>

<style scoped>
.wide {
  min-width: 66%;
  max-width: unset;
}
</style>
