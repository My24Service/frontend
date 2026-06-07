<template>
  <div class="app-page" v-show="location">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class='page-title'>
        <h3>
          <IBiShopWindow></IBiShopWindow>
          <span class="backlink" @click="goBack">{{ $trans('Locations') }}</span> /
          <span v-if="location">{{ location.name }}</span>
        </h3>
        <BButton-toolbar>
          <router-link
          :to="{name: editLink, params:{pk: this.pk}}"
          class="btn"
          >{{ `${$trans('Edit')} ${$trans('location')}`}}</router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class='page-detail mt-4' v-if="location && !isLoading">
      <div class="row">

        <!-- Col 1: Location Details -->
        <div class="col-xxl-9 col-xl-6 col-md-12 mb-4">
          <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ $trans("Location details") }}</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-5">
                  <ul class="list-group list-group-light list-group-small">
                    <li class="list-group-item px-1 pb-0 text-secondary fw-bold border-0">{{ $trans('Name') }}</li>
                    <li class="list-group-item px-1 pt-0 small">{{ location.name }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Col 2: QR code -->
        <div class="col-xxl-3 col-xl-6 col-md-12 mb-4">
          <div class="card w-100 d-flex flex-column h-100 border-0 shadow-sm">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ $trans('QR code') }}</h5>
            </div>
            <div class="card-body text-center d-flex flex-column justify-content-center align-items-center">
              <template v-if="hasQr">
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
                    {{ $trans("Recreate")}}
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
              <h5 class="mb-0 text-center text-primary mx-auto">{{ $trans('Orders')}}</h5>
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

        <!-- Col 5: Documents -->
        <div class="col-12 mb-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ $trans('Documents') }}</h5>
            </div>
            <div class="card-body">
              <DocumentsComponent
                :location="location"
                :is-view="true"
              />
            </div>
          </div>
        </div>

        <!-- Col 6: Equipment -->
        <div class="col-12 mb-4">
          <div class="card border-0 shadow-sm h-100">
            <div class="card-header py-3 bg-transparent border-bottom">
              <h5 class="mb-0 text-center text-primary">{{ $trans('Equipment') }}</h5>
            </div>
            <div class="card-body">
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
import OrderStats from "@/components/OrderStats";

import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import {
  BButton,
  BButtonGroup,
  BButtonToolbar, BLink,
  BPagination,
} from "bootstrap-vue-next";

import locationViewMixin from './locationViewMixin.js'

export default {
  components: {
    BLink,
    BButton,
    BButtonGroup,
    BPagination,
    BButtonToolbar,
    DocumentsComponent,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    OrderTableInfo,
    SearchModal,
    OrderStats,
  },
  extends: locationViewMixin,
  setup(props, ctx) {
    return {
      ...locationViewMixin.setup(props, ctx)
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