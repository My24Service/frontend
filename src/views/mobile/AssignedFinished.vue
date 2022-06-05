<template>
  <div class="app-grid">

    <b-modal
      id="search-modal"
      ref="search-modal"
      v-bind:title="$trans('Search')"
      @ok="handleSearchOk"
    >
      <form ref="search-form" @submit.stop.prevent="handleSearchSubmit">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Search')"
                label-for="search-query"
              >
                <b-form-input
                  size="sm"
                  autofocus
                  id="search-query"
                  ref="searchQuery"
                  v-model="searchQuery"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

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
    <b-pagination
      v-if="this.assignedFinishedModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.assignedFinishedModel.count"
      :per-page="this.assignedFinishedModel.perPage"
      aria-controls="assigned-finished-table"
    ></b-pagination>

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

  </div>
</template>

<script>
import moment from 'moment'

import assignedFinishedModel from '@/models/mobile/AssignedFinished.js'

import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'

export default {
  name: "AssignedFinished",
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
  },
  data() {
    return {
      today: null,
      year: null,
      month: null,
      monthText: null,
      currentPage: 1,
      searchQuery: null,
      assignedFinishedModel,
      isLoading: true,
      assignedOrders: [],
      fields: [
        {key: 'order', label: this.$trans('Order'), sortable: true},
        {key: 'engineer', label: this.$trans('Engineer'), sortable: true},
        {key: 'started', label: this.$trans('Started'), sortable: true},
        {key: 'ended', label: this.$trans('Ended'), sortable: true},
        {key: 'activity_totals.work_total', label: this.$trans('Work hours'), sortable: true},
        {key: 'activity_totals.travel_to_total', label: this.$trans('Travel to'), sortable: true},
        {key: 'activity_totals.travel_back_total', label: this.$trans('Travel back'), sortable: true},
        {key: 'activity_totals.distance_to_total', label: this.$trans('Distance to'), sortable: true},
        {key: 'activity_totals.distance_back_total', label: this.$trans('Distance back'), sortable: true},
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

    this.currentPage = this.assignedFinishedModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      assignedFinishedModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
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

      assignedFinishedModel.setListArgs(args.join('&'))

      this.loadData()
    },
    backMonth() {
      this.today.subtract(1, 'month')
      this.setDates()

      let args = []
      args.push(`month=${this.month}`)
      args.push(`year=${this.year}`)

      assignedFinishedModel.setListArgs(args.join('&'))

      this.loadData()
    },
    async loadData() {
      this.isLoading = true

      try {
        const data = await assignedFinishedModel.list()
        this.assignedOrders = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching assigned orders', error)
        this.errorToast(this.$trans('Error loading orders'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
</style>
