<template>
  <div class="app-page" v-show="location">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class="page-title">
        <h3>
          <IBiShopWindow></IBiShopWindow>
          <span class="backlink" @click="goBack">{{ $trans('Locations') }}</span> /
          <span v-if="location">{{ location.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link
            :to="{name: `${route_prefix}-edit`, params: {pk}}"
            :class="isDefaultFamily ? 'btn btn-primary' : 'btn'"
          >{{ `${$trans('Edit')} ${$trans('location')}` }}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <component
      :is="layout"
      v-if="location && !isLoading"
      :details-title="$trans('Location details')"
      :orders-title="isDefaultFamily ? $trans('Past orders') : $trans('Orders')"
      :fields="[{label: $trans('Name'), value: location.name, col: 1}]"
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
            <a href="javascript:" @click="download(location)">
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
        <OrderStats
          :data-in="statsData"
          ref="order-stats"
        />
      </template>

      <template #documents>
        <DocumentsComponent
          :location="location"
          :is-view="true"
        />
      </template>

      <template #equipment>
        <b-table
          id="equipment-table"
          :small="true"
          :busy="isLoading"
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
          <template #cell(customer)="data">
            <span v-if="data.item.customer_branch_view">
              {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
            </span>
          </template>
          <template #cell(branch)="data">
            <span v-if="data.item.customer_branch_view">
              {{ data.item.customer_branch_view.name }} - {{ data.item.customer_branch_view.city }}
            </span>
          </template>
        </b-table>
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
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import { BButton, BButtonToolbar, BLink, BPagination } from "bootstrap-vue-next";

import DetailLayoutDefault from './components/DetailLayoutDefault.vue'
import DetailLayoutShltr from './components/DetailLayoutShltr.vue'
import locationViewMixin from './location_view/locationViewMixin.js'

// The location detail page for both product families. The data lives in
// locationViewMixin; the frame is a layout component per family that this
// view fills through named slots. Family branches here: the edit link
// class, the orders title, the Insights tab (default).
export default {
  name: 'LocationView',
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
  },
  extends: locationViewMixin,
  setup(props, ctx) {
    return {
      ...locationViewMixin.setup(props, ctx)
    }
  },
  computed: {
    layout() {
      return this.isDefaultFamily ? DetailLayoutDefault : DetailLayoutShltr
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
