<template>
  <div class="app-page" v-if="location">
    <header>

      <div class='page-title' v-if="location">
        <h3>
          <IBiShopWindow></IBiShopWindow>
          <span @click="goBack" class="backlink">{{ $trans("Locations") }}</span>
          / {{ location.name }}
        </h3>
        <router-link
          :to="{name: editLink, params: {pk: this.pk}}"
          class="btn btn-primary"
        >
          {{$trans('Edit location')}}
        </router-link>
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
            <div v-if="qrUrl" class="qr-container">
              <BLink
                class="btn btn-sm btn-outline" :href="qrUrl"
                target="_blank"
                :title="$trans('Open QR in new tab')">
                <img :alt="$trans('QR code')" class="qr-code-image" :src="qrUrl" />
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
          <b-tab key="docs" :title="$trans('Equipment')">
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
          </b-tab>
        </b-tabs>
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
  BLink,
  BPagination,
  BTab,
  BTabs
} from "bootstrap-vue-next";

import locationViewMixin from './locationViewMixin.js'

export default {
  components: {
    BLink,
    BButton,
    BTabs,
    BPagination,
    BTab,
    BButtonGroup,
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
.qr-container {
  text-align: center;
}
</style>