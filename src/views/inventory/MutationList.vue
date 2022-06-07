<template>
  <div class="mt-4">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-pagination
      v-if="this.mutationModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.mutationModel.count"
      :per-page="this.mutationModel.perPage"
      aria-controls="stock-location-table"
    ></b-pagination>

    <b-table
      id="stock-location-table"
      small
      :busy='isLoading'
      :fields="fields"
      :items="mutations"
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
      <template #cell(summary)="data">
        <span v-html="data.item.summary"></span>
      </template>
    </b-table>
  </div>
</template>

<script>
import mutationModel from '@/models/inventory/Mutation.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      mutationModel,
      isLoading: false,
      mutations: [],
      fields: [
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'summary', label: this.$trans('Mutation'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'modified', label: this.$trans('Date'), sortable: true},
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.mutationModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.mutationModel.currentPage
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      mutationModel.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await mutationModel.list()
        this.mutations = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching mutations', error)
        this.errorToast(this.$trans('Error loading mutations'))
        this.isLoading = false
      }
    }
  }
}
</script>
