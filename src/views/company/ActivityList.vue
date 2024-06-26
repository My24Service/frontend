<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="receipt-cutoff"></b-icon>
          {{$trans('Activity')}}
        </h3>
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
    </header>
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="panel overflow-auto">
      
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
        
        <template #table-busy>
          <div class="text-center my-2">
            <br>
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
            <br>
          </div>
        </template>
        <template #cell(created)="data">
          <small>{{  data.item.created }}</small>
        </template>
      </b-table>
    </div>
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Activity')"
    />
  </div>
</template>

<script>
import activityModel from '@/models/company/Activity.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'ActivityList',
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      model: activityModel,
      isLoading: false,
      activity: [],
      activityFields: [
        {key: 'text', label: this.$trans('Activity'), sortable: true},
        {key: 'created', label: this.$trans('Date'), sortable: true},
        {key: 'icons', label: ''},
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route?.query.page || 1
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
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
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
