<template>
  <div class="app-page">

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
      <div class='panel'>
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

          <b-table
            id="customer-past-table"
            small
            :busy='isLoading'
            :fields="orderPastFields"
            :items="orders"
            responsive="md"
            class="data-table"
          >
          <template #head(icons)="">
            <div class="float-right">
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
            </div>
          </template>
          <template #table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
              <strong>{{ $trans('Loading...') }}</strong>
            </div>
          </template>
          <template #cell(id)="data">
            <OrderTableInfo
              v-bind:order="data.item"
            />
          </template>
          </b-table>
          <b-pagination
            v-if="this.orderPastModel.count > 20"
            class="pt-4"
            v-model="currentPage"
            :total-rows="this.orderPastModel.count"
            :per-page="this.orderPastModel.perPage"
            aria-controls="customer-past-table"
          ></b-pagination>
      </div>

      <div class='panel wide'>
        <h6>Stats for {{ equipment.name }}</h6>
        <OrderStats
          v-if="!isLoading"
          ref="order-stats"
        />
      </div>
    </div>
  </div>

</template>

<script>
import orderPastModel from '../../models/orders/OrderPast.js'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import OrderTableInfo from '../../components/OrderTableInfo.vue'
import SearchModal from '../../components/SearchModal.vue'
import orderModel from '../../models/orders/Order.js'
import OrderStats from "../../components/OrderStats";
import {componentMixin} from "../../utils";
import equipmentModel from "../../models/equipment/equipment";
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
      orderPastModel,
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
      this.orderPastModel.currentPage = val
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
      orderPastModel.setSearchQuery(val)
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

      const equipmentData = await equipmentModel.detail(this.pk)
      this.equipment = new equipmentModel.model(equipmentData)
      try {
        const orderTypeStatsData = await orderModel.getOrderTypesStatsEquipment(this.pk)
        const monthsStatsData = await orderModel.getMonthsStatsEquipment(this.pk)
        const orderTypesMonthStatsData = await orderModel.getOrderTypesMonthsStatsEquipment(this.pk)
        const countsYearOrdertypeStats = await orderModel.getCountsYearOrdertypeStatsEquipment(this.pk)

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
        orderPastModel.addListArg(`equipment=${this.pk}`)
        const results = await orderPastModel.list()
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
