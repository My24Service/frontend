<template>
  <div class="app-grid">
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />
    <b-modal
      id="delete-quotation-modal"
      ref="delete-quotation-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">
        {{ $trans('Are you sure you want to delete this quotation?') }}
      </p>
    </b-modal>
    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.quotationService"
        :model_name="$trans('Quotation')"
      />
      <b-table
        small
        id="document-table"
        :busy='isLoading'
        :fields="fields"
        :items="quotations"
        responsive="md"
        class="data-table"
      >
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #head(icons)>
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="quotation-add"
                  v-bind:title="$trans('New quotation')"
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
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="quotation-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
            <b-button
              size="sm"
              v-if="!data.item.preliminary"
              :title="$trans('Create order')"
              @click="function() { createOrder(data.item.id) }"
            >
              <b-icon-arrow-up-right-circle
                aria-hidden="true"
              ></b-icon-arrow-up-right-circle>
            </b-button>
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import {QuotationService} from '@/models/quotations/Quotation.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  name: 'QuotationList',
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  props: {
    orderPk: {
      type: [String, Number],
      default: null
    },
  },
  data() {
    return {
      quotationService: new QuotationService(),
      searchQuery: null,
      quotationPk: null,
      isLoading: false,
      quotations: [],
      fields: [
        {key: 'quotation_name', label: this.$trans('Name')},
        {key: 'quotation_city', label: this.$trans('City')},
        {key: 'total', label: this.$trans('Total')},
        {key: 'vat', label: this.$trans('Vat')},
        {key: 'accepted', label: this.$trans('Accepted')},
        {key: 'icons', value: ''},
      ]
    }
  },
  created () {
    this.quotationService.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    async createOrder(id) {
      await this.$router.push({name: 'order-add-quotation', params: {quotation_id: id}})
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.quotationService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.quotationPk = id
      this.$refs['delete-quotation-modal'].show()
    },
    async doDelete() {
      this.isLoading = true

      try {
        await this.quotationService.delete(this.quotationPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Quotation has been deleted'))
        this.isLoading = false
        await this.loadData()
      } catch(error) {
        this.isLoading = false
        console.log('Error deleting quotation', error)
        this.errorToast(this.$trans('Error deleting quotation'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true

      try {
        const data = await this.quotationService.list()
        this.quotations = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotations', error)
        this.errorToast(this.$trans('Error loading quotations'))
        this.isLoading = false
      }
    }
  },
  watch: {
    '$route.name': {
      handler: function(search) {
        if (this.$route.name === 'preliminary-quotations') {
          this.quotationService.queryMode = 'preliminary'
        } else {
          this.quotationService.queryMode = 'all'
        }
      },
      deep: true,
      immediate: true
    }
  }
}
</script>
