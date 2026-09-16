<template>
  <div class="app-page" v-show="equipment">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class="page-title">
        <h3>
          <IBiTools></IBiTools>
          <span class="backlink" @click="goBack">{{ $trans('Equipment') }}</span> /
          <span v-if="equipment">{{ equipment.name }}</span>
        </h3>
        <!-- default: always, to the plain edit route; shltr: from settings
             only, to the typed edit route -->
        <BButton-toolbar v-if="isDefaultFamily || from_settings">
          <router-link
            :to="editRoute"
            :class="isDefaultFamily ? 'btn' : 'btn btn-primary'"
          >{{ `${$trans('Edit')} ${$trans('equipment')}` }}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <component
      :is="layout"
      v-if="equipment && !isLoading"
      :details-title="$trans('Equipment details')"
      :orders-title="$trans('Orders')"
      :fields="detailFields"
      @render-stats="renderStats"
    >
      <template v-if="hasQr" #qr>
        <div v-if="qrUrl" class="qr-container mb-3">
          <BLink
            class="btn btn-sm btn-outline mb-2" :href="qrUrl"
            target="_blank"
            :title="$trans('Open QR in new tab')">
            <img :alt="$trans('QR code')" class="qr-code-image img-fluid" :src="qrUrl" />
          </BLink>
          <p class="mb-0">
            <a href="javascript:" @click="download(equipment)">
              {{ $trans("Download") }}
            </a>
          </p>
        </div>
        <img v-else :alt="$trans('No QR yet')" class="qr-code-image img-fluid mb-3" :src="NO_IMAGE_URL" />
        <p>
          <BButton @click="recreate_qr" variant="primary" size="sm">
            {{ $trans("Recreate") }}
          </BButton>
        </p>
      </template>

      <template #orders-actions>
        <ButtonLinkRefresh
          v-bind:method="function() { loadData() }"
          v-bind:title="$trans('Refresh')" />
        <ButtonLinkSearch v-bind:method="function() { showSearchModal() }"/>
      </template>

      <template #orders>
        <OrdersTable :orders="orders" />
        <b-pagination
          v-if="orderService.count > 20"
          class="pt-4"
          v-model="currentPage"
          :total-rows="orderService.count"
          :per-page="orderService.perPage"
          aria-controls="customer-past-table"
        ></b-pagination>
      </template>

      <!-- default only: the Insights tab -->
      <template v-if="isDefaultFamily" #stats>
        <h6>{{ $trans('Stats for') }} {{ equipment.name }}</h6>
        <OrderStats
          :data-in="statsData"
          ref="order-stats"
        />
      </template>

      <!-- shltr only: latest workorders and the order-type pie -->
      <template v-if="!isDefaultFamily" #workorders>
        <WorkOrdersTable :equipment-pk="pk" :hide-columns="['equipment']" />
      </template>

      <template #documents>
        <DocumentsComponent
          :equipment="equipment"
          :is-view="true"
        />
      </template>

      <template v-if="!isDefaultFamily" #order-types>
        <OrderTypesPie :equipment-pk="pk" />
      </template>
    </component>
  </div>
</template>

<script>
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrdersTable from '@/components/OrdersTable.vue'
import SearchModal from '@/components/SearchModal.vue'
import OrderStats from "@/components/OrderStats";
import WorkOrdersTable from '@/components/WorkOrdersTable.vue'
import OrderTypesPie from "@/components/OrderTypesPie.vue";
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import { BButton, BButtonToolbar, BLink, BPagination } from "bootstrap-vue-next";
import { EQUIPMENT_TYPES } from "@/constants";

import DetailLayoutDefault from './components/DetailLayoutDefault.vue'
import DetailLayoutShltr from './components/DetailLayoutShltr.vue'
import equipmentViewMixin from './equipment_view/equipmentViewMixin.js'

// The equipment detail page for both product families. The data lives in
// equipmentViewMixin; the frame is a layout component per family that this
// view fills through named slots. Family branches here: the edit toolbar,
// the edit route, the Insights tab (default), workorders and the order-type
// pie (shltr).
export default {
  name: 'EquipmentView',
  components: {
    BLink,
    BButton,
    BPagination,
    BButtonToolbar,
    DocumentsComponent,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrdersTable,
    SearchModal,
    OrderStats,
    WorkOrdersTable,
    OrderTypesPie,
  },
  props: {
    from_settings: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      required: false,
      default: EQUIPMENT_TYPES.TECHNICAL
    },
  },
  extends: equipmentViewMixin,
  setup(props, ctx) {
    return {
      ...equipmentViewMixin.setup(props, ctx)
    }
  },
  computed: {
    layout() {
      return this.isDefaultFamily ? DetailLayoutDefault : DetailLayoutShltr
    },
    editRoute() {
      const name = this.isDefaultFamily
        ? `${this.route_prefix}-edit`
        : `${this.route_prefix}-edit-${this.type}`
      return {name, params: {pk: this.pk}}
    },
    detailFields() {
      const e = this.equipment
      const date = (value) => value ? this.$moment(value).format('DD-MM-YYYY') : ''
      return [
        {label: this.$trans('Name'), value: e.name, col: 1},
        {label: this.$trans('Brand'), value: e.brand, col: 1},
        {label: this.$trans('Identifier'), value: e.identifier, col: 1},
        {label: this.$trans('Description'), value: e.description, col: 2},
        {label: this.$trans('Installation date'), value: date(e.installation_date), col: 2},
        {label: this.$trans('Production date'), value: date(e.production_date), col: 2},
        {label: this.$trans('Serial number'), value: e.serialnumber, col: 1},
        {label: this.$trans('Standard hours'), value: e.standard_hours, col: 1},
        {label: this.$trans('Lifespan (months)'), value: e.default_replace_months, col: 2},
        {label: this.$trans('Price'), value: e.price_dinero ? e.price_dinero.toFormat('$0.00') : '', col: 2},
      ]
    },
  },
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
