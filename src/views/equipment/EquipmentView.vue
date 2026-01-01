<template>
  <div class="app-page" v-show="equipment">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class='page-title'>
        <h3>
          <IBiTools></IBiTools>
          <span class="backlink" @click="goBack">{{ $trans('Equipment') }}</span> /
          <span v-if="equipment">{{ equipment.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link
          :to="{name: editLink, params:{pk: this.pk}}"
          class="btn"
          >{{ `${$trans('Edit')} ${$trans('equipment')}`}}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class='page-detail flex-columns' v-if="equipment && !isLoading">
      <div class='panel sidebar col-1-3'>
        <h6>{{ $trans("Equipment details") }}</h6>
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
          <dt v-if="hasQr" class="align-top-verdomme">{{ $trans('QR code') }}</dt>
          <dd v-if="hasQr">
            <div v-if="equipment.qr_path" class="qr-container">
              <BLink
                class="btn btn-sm btn-outline" :href="equipment.qr_path"
                target="_blank"
                :title="$trans('Open QR in new tab')">
                <img alt="QR code" class="qr-code-image" :src="equipment.qr_path" />
              </BLink>
              <p>
                <a href="javascript:" @click="download(equipment)">
                  {{ $trans("Download") }}
                </a>
              </p>
            </div>
            <img v-if="!equipment.qr_path" :alt="$trans('No QR yet')" class="qr-code-image" :src="NO_IMAGE_URL" />
            <p>
              <BButton @click="recreate_qr">
                {{ $trans("Recreate")}}
              </BButton>
            </p>
          </dd>
        </dl>
      </div>

      <div class='panel wide col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Orders')">
            <div class='flex-columns space-between align-items-center'>
              <h6>{{ $trans('Orders')}}</h6>
              <span>
                <BButton-group class="">
                  <ButtonLinkRefresh
                    v-bind:method="function() { loadData() }"
                    v-bind:title="$trans('Refresh')" />
                  <ButtonLinkSearch v-bind:method="function() { showSearchModal() }"/>
                </BButton-group>
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
              v-if="orderService.count > 20"
              class="pt-4"
              v-model="currentPage"
              :total-rows="orderService.count"
              :per-page="orderService.perPage"
              aria-controls="customer-past-table"
            ></b-pagination>
          </b-tab>
          <b-tab key="stats" :title="$trans('Insights')" @click="renderStats">
            <h6>Stats for {{ equipment.name }}</h6>
            <OrderStats
              :data-in="statsData"
              ref="order-stats"
            />
          </b-tab>
          <b-tab key="docs" :title="$trans('Documents')">
            <DocumentsComponent
              :equipment="equipment"
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
import my24 from "@/services/my24";

import { OrderService } from '@/models/orders/Order'
import { EquipmentService } from "@/models/equipment/equipment";

import moment from 'moment/min/moment-with-locales'
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";

export default {

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
      orderService: new OrderService(),
      equipmentService: new EquipmentService(),
      buttonDisabled: false,
      equipment: null,
      orders: [],
      orderPastFields: [
        { key: 'id', label: $trans('Order'), thAttr: {width: '95%'} },
        { key: 'icons', thAttr: {width: '5%'} },
      ],
      breadcrumb: [
        {
          text: $trans('Equipment'),
          to: {name: this.listLink()}
        },
        {
          text: $trans('Detail'),
          active: true
        }
      ],
      statsData: null
    }
  },
  computed: {
    hasQr() {
      const qrType = this.$store.getters.getEquipmentQrType;
      return qrType !== 'none'
    },
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
      this.orderService.currentPage = val
      this.loadData()
    }
  },
  methods: {
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
        console.log('error fetching equipment stats data', error)
        errorToast(create, `${$trans('Error fetching equipment stats:')} ${error}`)
        // this.isLoading = false
      }
    },
    download(equipment) {
      my24.downloadItem(equipment.qr_path, `${equipment.name} ${equipment.uuid}.png`)
    },
    async recreate_qr() {
      const result = await this.equipmentService.recreateQr(this.pk)
      this.equipment = {
        ...this.equipment,
        qr_path: result.qr_path
      }
    },
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

        const equipmentData = await this.equipmentService.detail(this.pk)
        this.equipment = new this.equipmentService.model(equipmentData)

      } catch(error) {
        console.log('error fetching equipment detail data', error)
        errorToast(create, `${$trans('Error fetching equipment detail:')} ${error}`)
        this.isLoading = false
      }
    },

    async loadHistory() {
      try {
        const results = await this.orderService.getAllForEquipmentLocation(this.pk, null)
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
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment;
    this.$moment.locale(lang)
  },
  mounted () {
  }
}
</script>

<style scoped>
.wide {
  min-width: 66%;
  max-width: unset;
}
.qr-code-image {
  width: 250px;
  height: 250px;
}
span.space {
  width: 10px;
}
.qr-container {
  text-align: center;
}
</style>
