<template>
  <div class="mt-4">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Mutation')"
      />

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
                <ButtonLinkAdd
                  router_name="mutation-add"
                  v-bind:title="$trans('Add')"
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
        <template #cell(summary)="data">
          <span v-html="data.item.summary"></span>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import mutationModel from '@/models/inventory/Mutation.js'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
    ButtonLinkAdd,
  },
  data() {
    return {
      searchQuery: null,
      model: mutationModel,
      isLoading: false,
      mutations: [],
      fields: [
        {key: 'material_name', label: this.$trans('Material'), sortable: true},
        {key: 'summary', label: this.$trans('Mutation'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'modified', label: this.$trans('Date'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  created() {
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
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
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
