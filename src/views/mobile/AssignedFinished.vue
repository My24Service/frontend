<template>
  <div class="app-page">
    <header></header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="panel overflow-auto">
      <b-row>
        <b-col cols="2">
          <b-link class="px-1" @click.prevent="backMonth" v-bind:title="$trans('Month back')">
            <b-icon-arrow-left font-scale="1.8"></b-icon-arrow-left>
          </b-link>
        </b-col>
        <b-col cols="8">
          {{ $trans('Assigned finished') }} {{ monthText}} {{ year }}
        </b-col>
        <b-col cols="2">
          <div class="float-right">
            <b-link class="px-1" @click.prevent="nextMonth" v-bind:title="$trans('Next month') ">
              <b-icon-arrow-right font-scale="1.8"></b-icon-arrow-right>
            </b-link>
          </div>
        </b-col>
      </b-row>

      <b-table
        id="assigned-finished-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="assignedOrders"
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
        <template #cell(order)="data">
          <router-link class="px-1" :to="{name: 'order-view', params: {pk: data.item.order.id}}">
            {{ data.item.order.order_name }}<br/>
            {{ data.item.order.order_city }}
          </router-link>
        </template>
        <template #cell(engineer)="data">
          {{ data.item.engineer.user.first_name }} {{ data.item.engineer.user.last_name }}
        </template>
      </b-table>

      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Order')"
      />
    </div>
  </div>
</template>

<script>
import moment from 'moment/min/moment-with-locales'

import assignedFinishedModel from '@/models/mobile/AssignedFinished.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: "AssignedFinished",
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      today: null,
      year: null,
      month: null,
      monthText: null,
      currentPage: 1,
      searchQuery: null,
      model: assignedFinishedModel,
      isLoading: true,
      assignedOrders: [],
      fields: [
        {key: 'order', label: $trans('Order'), sortable: true},
        {key: 'engineer', label: $trans('Engineer'), sortable: true},
        {key: 'started', label: $trans('Started'), sortable: true},
        {key: 'ended', label: $trans('Ended'), sortable: true},
        {key: 'activity_totals.work_total', label: $trans('Work hours'), sortable: true},
        {key: 'activity_totals.travel_to_total', label: $trans('Travel to'), sortable: true},
        {key: 'activity_totals.travel_back_total', label: $trans('Travel back'), sortable: true},
        {key: 'activity_totals.distance_to_total', label: $trans('Distance to'), sortable: true},
        {key: 'activity_totals.distance_back_total', label: $trans('Distance back'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.assignedFinishedModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    // moment
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.today = this.$moment()

    this.setDates()

    // reset searchQuery
    this.searchQuery = null
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.model.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // rest
    setDates() {
      this.month = this.today.month() + 1
      this.monthText = this.today.format('MMM')
      this.year = this.today.year()
    },
    nextMonth() {
      this.today.add(1, 'month')
      this.setDates()

      let args = []
      args.push(`month=${this.month}`)
      args.push(`year=${this.year}`)

      this.model.setListArgs(args.join('&'))

      this.loadData()
    },
    backMonth() {
      this.today.subtract(1, 'month')
      this.setDates()

      let args = []
      args.push(`month=${this.month}`)
      args.push(`year=${this.year}`)

      this.model.setListArgs(args.join('&'))

      this.loadData()
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.model.list()
        this.assignedOrders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching assigned orders', error)
        errorToast(create, $trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
