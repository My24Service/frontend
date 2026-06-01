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

    <div class='page-detail flex-columns' v-if="equipment && !isLoading">
      <div class='panel sidebar col-1-3'>
        <h6>{{ this.$trans("Equipment details") }}</h6>
        <dl>
          <dt>{{ this.$trans('Name') }}</dt>
          <dd>{{ equipment.name }}</dd>
          <dt>{{ this.$trans('Brand') }}</dt>
          <dd>{{ equipment.brand }}</dd>
          <dt>{{ this.$trans('Identifier') }}</dt>
          <dd>{{ equipment.identifier }}</dd>
          <dt>{{ this.$trans('Description') }}</dt>
          <dd>{{ equipment.description }}</dd>
          <dt>{{ this.$trans('Installation date') }}</dt>
          <dd>{{ equipment.installation_date ? this.$moment(equipment.installation_date).format('DD-MM-YYYY') : '' }}</dd>
          <dt>{{ this.$trans('Production date') }}</dt>
          <dd>{{ equipment.production_date ? this.$moment(equipment.production_date).format('DD-MM-YYYY') : ''}}</dd>
          <dt>{{ this.$trans('Serial number') }}</dt>
          <dd>{{ equipment.serialnumber }}</dd>
          <dt>{{ this.$trans('Standard hours') }}</dt>
          <dd>{{ equipment.standard_hours }}</dd>
          <dt>{{ this.$trans('Lifespan (months)') }}</dt>
          <dd>{{ equipment.default_replace_months }}</dd>
          <dt>{{ this.$trans('Price') }}</dt>
          <dd>{{ equipment.price_dinero.toFormat('$0.00') }}</dd>
          <dt v-if="hasQr" class="align-top-verdomme">{{ this.$trans('QR code') }}</dt>
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
                  {{ this.$trans("Download") }}
                </a>
              </p>
            </div>
            <img v-if="!equipment.qr_path" :alt="$trans('No QR yet')" class="qr-code-image" :src="NO_IMAGE_URL" />
            <p>
              <BButton @click="recreate_qr">
                {{ this.$trans("Recreate")}}
              </BButton>
            </p>
          </dd>
        </dl>
      </div>

      <div class='panel wide col-2-3'>
        <b-tabs>
          <b-tab :title="$trans('Orders')">
            <div class='flex-columns space-between align-items-center'>
              <h6>{{ this.$trans('Orders')}}</h6>
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
  BTab,
  BTabs
} from "bootstrap-vue-next";

import equipmentViewMixin from './equipmentViewMixin.js'

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
    OrderStats,
  },
  extends: equipmentViewMixin,
  setup(props, ctx) {
    return {
      ...equipmentViewMixin.setup(props, ctx)
    }
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
