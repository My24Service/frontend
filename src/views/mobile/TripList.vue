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

    <b-modal
      id="delete-trip-modal"
      ref="delete-trip-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this trip?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.tripModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.tripModel.count"
      :per-page="this.tripModel.perPage"
      aria-controls="trip-table"
    ></b-pagination>

    <b-table
      id="trip-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="trips"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="mobile-trips-add"
                v-bind:title="$trans('New trip')"
              />
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
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="mobile-trips-edit"
            v-bind:router_params="{pk: data.item.id}"
            v-bind:title="$trans('Edit')"
          />
          <IconLinkDelete
            v-bind:title="$trans('Delete')"
            v-bind:method="function() { showDeleteModal(data.item.id) }"
          />
        </div>
      </template>
    </b-table>

  </div>
</template>

<script>
import tripModel from '@/models/mobile/Trip.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'TripList',
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      tripModel,
      isLoading: false,
      trips: [],
      tripPk: null,
      fields: [
        {key: 'trip_date', label: this.$trans('Date'), sortable: true},
        {key: 'last_status', label: this.$trans('Status'), sortable: true},
        {key: 'description', label: this.$trans('Description'), sortable: true},
        {key: 'required_users', label: this.$trans('Required users'), sortable: true},
        {key: 'num_orders', label: this.$trans('# orders'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.tripModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.tripModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      tripModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.tripPk = id
      this.$refs['delete-trip-modal'].show()
    },
    async doDelete() {
      try {
        await tripModel.delete(this.tripPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Trip has been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting trip', error)
        this.errorToast(this.$trans('Error deleting trip'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await tripModel.list()
        this.trips = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching trips', error)
        this.errorToast(this.$trans('Error loading trips'))
        this.isLoading = false
      }
    }
  }
}
</script>
