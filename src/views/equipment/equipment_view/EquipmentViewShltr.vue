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
          <span class="backlink" @click="goBack">{{ this.$trans('Equipment') }}</span> /
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

    <div class='page-detail mt-4' v-if="equipment && !isLoading">
      <div class="row">

        <!-- Col 1: Basisgegevens -->
        <div class="col-xxl-9 col-xl-6 col-md-12 mb-4">
          <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ this.$trans("Equipment details") }}</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-5">
                  <ul class="list-group list-group-light list-group-small">
                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Name') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.name }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Brand') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.brand }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Identifier') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.identifier }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Serial number') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.serialnumber }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Standard hours') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.standard_hours }}</li>
                  </ul>
                </div>
                <div class="col-md-7">
                  <ul class="list-group list-group-light list-group-small">
                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Installation date') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.installation_date ? this.$moment(equipment.installation_date).format('DD-MM-YYYY') : '' }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Production date') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.production_date ? this.$moment(equipment.production_date).format('DD-MM-YYYY') : ''}}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Lifespan (months)') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.default_replace_months }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Price') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.price_dinero ? equipment.price_dinero.toFormat('$0.00') : '' }}</li>

                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ this.$trans('Description') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ equipment.description }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Col 2: Foto's (QR code) -->
        <div class="col-xxl-3 col-xl-6 col-md-12 mb-4">
          <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ this.$trans('QR code') }}</h5>
            </div>
            <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
              <template v-if="hasQr">
                <div v-if="equipment.qr_path" class="qr-container mb-3">
                  <BLink
                    class="btn btn-sm btn-outline mb-2" :href="equipment.qr_path"
                    target="_blank"
                    :title="$trans('Open QR in new tab')">
                    <img :alt="$trans('QR code')" class="qr-code-image img-fluid" :src="equipment.qr_path" />
                  </BLink>
                  <p class="mb-0">
                    <a href="javascript:" @click="download(equipment)">
                      {{ this.$trans("Download") }}
                    </a>
                  </p>
                </div>
                <img v-else :alt="$trans('No QR yet')" class="qr-code-image img-fluid mb-3" :src="NO_IMAGE_URL" />
                <p>
                  <BButton @click="recreate_qr" variant="primary" size="sm">
                    {{ this.$trans("Recreate")}}
                  </BButton>
                </p>
              </template>
            </div>
          </div>
        </div>

        <!-- Col 3: Orders -->
        <div class="col-12 mb-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header py-3 bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <div></div>
              <h5 class="mb-0 text-center text-primary mx-auto">{{ this.$trans('Orders')}}</h5>
              <div class="d-flex align-items-center">
                <BButton-group size="sm">
                  <ButtonLinkRefresh
                    v-bind:method="function() { loadData() }"
                    v-bind:title="$trans('Refresh')" />
                  <ButtonLinkSearch v-bind:method="function() { showSearchModal() }"/>
                </BButton-group>
              </div>
            </div>
            <div class="card-body">
              <div class="order-list-container">
                <ul class='listing order-list p-0' style="list-style-type: none;">
                  <li v-for="item in orders" :key="item.id">
                    <OrderTableInfo
                      v-bind:order="item"
                    />
                  </li>
                </ul>
              </div>
              <b-pagination
                v-if="orderService.count > 20"
                class="pt-4"
                v-model="currentPage"
                :total-rows="orderService.count"
                :per-page="orderService.perPage"
                aria-controls="customer-past-table"
              ></b-pagination>
            </div>
          </div>
        </div>

        <!-- Col 5: Workorders -->
        <div class="col-12 mb-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ this.$trans('Work Orders') }}</h5>
            </div>
            <div class="card-body">
              <p v-if="!workOrders.length">
                <i>{{ $trans("No work orders") }}</i>
              </p>
              <WorkOrdersTable v-else :work-orders="workOrders" :is-loading="isWorkordersLoading" :hide-columns="['equipment']" />
            </div>
          </div>
        </div>

        <!-- Col 4: Documents -->
        <div class="col-12 mb-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ this.$trans('Documents') }}</h5>
            </div>
            <div class="card-body">
              <DocumentsComponent
                :equipment="equipment"
                :is-view="true"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

</template>

<script>
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import OrderTableInfo from '@/components/OrderTableInfo.vue'
import SearchModal from '@/components/SearchModal.vue'

import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import {
  BButton,
  BButtonGroup,
  BButtonToolbar, BLink,
  BPagination,
  BTab,
  BTabs
} from "bootstrap-vue-next";

import orderService from '@/models/orders/Order.js'
import equipmentViewMixin from './equipmentViewMixin.js'
import WorkOrdersTable from '@/components/WorkOrdersTable.vue'

export default {
  components: {
    BLink,
    BButton,
    BTabs,
    BButtonGroup,
    BPagination,
    BTab,
    BButtonToolbar,
    DocumentsComponent,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    WorkOrdersTable,
  },
  extends: equipmentViewMixin,
  setup(props, ctx) {
    return {
      ...equipmentViewMixin.setup(props, ctx)
    }
  },
  data() {
    return {
      workOrders: [],
      isWorkordersLoading: false,
    }
  },
  async created() {
    await this.loadWorkOrders()
  },
  methods: {
    async loadWorkOrders() {
      this.isWorkordersLoading = true
      try {
        this.workOrders = await orderService.getEquipmentWorkorders(this.pk)
      } catch (error) {
        console.error('error fetching equipment workorders', error)
        this.workOrders = []
      } finally {
        this.isWorkordersLoading = false
      }
    }
  }
}
</script>

<style scoped>
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

/* Card Styling */
.card {
  border: 0px;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 10px 20px 0px;
  background-color: rgb(255, 255, 255);
  border-radius: 0.25rem;
}
.card-header {
  background-color: rgba(255, 255, 255, 0);
  border-bottom: 2px solid #f5f5f5;
}

/* List Group Customizations */
.list-group-item {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.13);
  margin-top: 5px;
}

.list-group-light .list-group-item {
  padding: 0.5rem 0;
  border: 2px solid #f5f5f5;
  border-left-width: 0px;
  border-right-width: 0px;
  border-top-width: 0px;
}
.list-group-light > .list-group-item:last-of-type {
  border-bottom-width: 0px;
}

/* Custom Text Colors from template */
.text-primary {
  color: rgb(30, 58, 123) !important;
}
.text-secondary {
  color: rgb(23, 157, 160) !important;
}

/* Base adjustments */
.page-detail {
  background-color: rgb(241, 249, 249);
  padding: 1rem;
  border-radius: 0.25rem;
}
</style>
