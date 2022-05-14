<template>
  <div class="app-grid">

    <b-pagination
      v-if="this.tripAvailabilityModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.tripAvailabilityModel.count"
      :per-page="this.tripAvailabilityModel.perPage"
      aria-controls="trip-table"
    ></b-pagination>

    <b-table
      id="trip-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="tripAvailability"
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
            </b-button-group>
          </b-button-toolbar>
        </div>
      </template>
      <template #cell(trip)="data">
        <b>{{ $trans('Trip') }}</b>: <router-link class="px-1" :to="{name: 'mobile-trip-availability-detail', params: {pk: data.item.id}}">trip-{{ data.item.id }}</router-link><br/>
        <b>{{ $trans('Description') }}</b>: {{ data.item.description }}<br/>
        <b>{{ $trans('Date') }}</b>: {{ data.item.trip_date }}
      </template>
      <template #table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
          <strong>{{ $trans('Loading...') }}</strong>
        </div>
      </template>
    </b-table>

  </div>
</template>

<script>
import tripAvailabilityModel from '@/models/mobile/Trip.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'

export default {
  name: 'TripAvailabilityList',
  components: {
    ButtonLinkRefresh,
  },
  data() {
    return {
      currentPage: 1,
      tripAvailabilityModel,
      isLoading: false,
      tripAvailability: [],
      fields: [
        {key: 'trip', label: this.$trans('Trip'), sortable: false},
        {key: 'required_users', label: this.$trans('Required users'), sortable: true},
        {key: 'users_trip_set_as_available', label: this.$trans('Available users'), sortable: true},
        {key: 'assigned_user_count', label: this.$trans('Assigned users'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.tripAvailabilityModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.tripAvailabilityModel.currentPage
    this.loadData()
  },
  methods: {
    async loadData() {
      this.isLoading = true;

      try {
        const data = tripAvailabilityModel.list()
        this.tripAvailability = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching trips', error);
        this.errorToast(this.$trans('Error loading trips'))
        this.isLoading = false
      }
    }
  }
}
</script>
