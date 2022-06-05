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

    <b-pagination
      v-if="this.activityModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.activityModel.count"
      :per-page="this.activityModel.perPage"
      aria-controls="activity-table"
    ></b-pagination>

    <b-table
      id="activity-table"
      small
      :busy='isLoading'
      :fields="activityFields"
      :items="activity"
      responsive="md"
      class="data-table"
      sort-icon-left
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
    </b-table>

  </div>
</template>

<script>
import activityModel from '@/models/company/Activity.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'

export default {
  name: 'ActivityList',
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      activityModel,
      isLoading: false,
      activity: [],
      activityFields: [
        {key: 'text', label: this.$trans('Activity'), sortable: true, thAttr: {width: '80%'}},
        {key: 'created', label: this.$trans('Date'), sortable: true, thAttr: {width: '10%'}},
        {key: 'icons', thAttr: {width: '10%'}},
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.activityModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.activityModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      activityModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await activityModel.list()
        this.activity = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching activity', error);
        this.errorToast(this.$trans('Error loading activity'))

        this.isLoading = false
      }
    }
  }
}
</script>
