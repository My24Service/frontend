<template>
  <div class="app-page">
    <header>
      <div class='search-form'>
        <SearchForm @do-search="handleSearchOk" :placeholderText="`${$trans('Search quotations')}`"/>
      </div>
      <div class="page-title">
        <h3>
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <span>{{ $trans("Quotations") }}</span>
        </h3>

        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
          </b-button-group>
          <router-link class="btn button" :to="{name:'quotation-add'}">
            <b-icon icon="file-earmark-plus"></b-icon> {{ $trans('Add quotation') }}
          </router-link>
        </b-button-toolbar>
      </div>
    </header>

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

    <div class="panel overflow-auto">
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
        <template #cell(name)="data">
          <router-link
            :to="{name: quotationEditRoute(data.item), params: {pk: data.item.id}}"
          >{{ data.item.name }}</router-link>
        </template>
        <template #cell(quotation_name)="data">
          <router-link
            :to="{name: quotationEditRoute(data.item), params: {pk: data.item.id}}"
          >{{ data.item.quotation_name }}</router-link>
        </template>
        <template #cell(status)="data">
          <TableStatusInfo
            :statusCodeService="quotationStatuscodeService"
            :statuscodes="statuscodes"
            :model="data.item"
            :modelName="'quotation'"
            :statusService="statusService"
          />
        </template>
        <template #cell(icons)="data">
          <div class="h2 quotation-icons">
            <router-link
              class="px-1"
              v-if="!data.item.preliminary"
              :title="$trans('Send quotation')"
              :to="{name: 'quotation-send',
                query: {quotationId: data.item.id}}"
            >
              <b-icon-mailbox
                aria-hidden="true"
                class="edit-icon"
              ></b-icon-mailbox>
            </router-link>
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
            <b-link
              class="px-1"
              v-if="!data.item.preliminary"
              :title="$trans('Create order')"
              @click="function() { createOrder(data.item.id) }"
            >
              <b-icon-arrow-up-right-circle
                aria-hidden="true"
                class="edit-icon"
              ></b-icon-arrow-up-right-circle>
            </b-link>
          </div>
        </template>
      </b-table>
      <Pagination
        v-if="!isLoading"
        :model="this.quotationService"
        :model_name="$trans('Quotation')"
      />
    </div>
  </div>
</template>

<script>
import {QuotationService} from '@/models/quotations/Quotation.js'
import {QuotationStatuscodeService} from '@/models/quotations/QuotationStatuscode.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import IconLinkDocuments from '@/components/IconLinkDocuments.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import ButtonLinkSort from "@/components/ButtonLinkSort.vue";
import SearchForm from "@/components/SearchForm.vue";
import TableStatusInfo from '../../components/TableStatusInfo.vue'
import { StatusService } from '@/models/quotations/Status.js'

export default {
  name: 'QuotationList',
  components: {
    SearchForm, ButtonLinkSort,
    IconLinkEdit,
    IconLinkDelete,
    IconLinkDocuments,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    TableStatusInfo
  },
  data() {
    return {
      quotationService: new QuotationService(),
      quotationStatuscodeService: new QuotationStatuscodeService(),
      statusService: new StatusService(),
      searchQuery: null,
      quotationPk: null,
      isLoading: false,
      quotations: [],
      statuscodes: [],
      fields: [
        {key: 'name', label: this.$trans('Name')},
        {key: 'quotation_name', label: this.$trans('Customer')},
        {key: 'quotation_city', label: this.$trans('City')},
        {key: 'total', label: this.$trans('Total')},
        {key: 'vat', label: this.$trans('Vat')},
        {key: 'status', label: this.$trans('Status')},
        {key: 'icons', label: ''},
      ]
    }
  },
  created () {
    this.quotationService.currentPage = this.$route.query.page || 1
    this.loadData()
    this.loadStatusCodes()
  },
  methods: {
    quotationEditRoute(quotation) {
      return quotation.preliminary ? 'quotation-edit-preliminary': 'quotation-edit'
    },
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
    },
    async loadStatusCodes () {
      this.isLoading = true;

      try {
        const data = await this.quotationStatuscodeService.list();
        this.statuscodes = data.results.map((statuscode) => {
          if (statuscode.settings_key) {
            statuscode.disabled = true
          }
          return statuscode
        });
        this.isLoading = false;
      } catch (error) {
        console.log("error fetching statuscodes", error);
        this.errorToast(this.$trans("Error loading statuscodes"));
        this.isLoading = false;
      }
    }
  },
  watch: {
    '$route.name': {
      handler: function(search) {
        if (this.$route.name === 'preliminary-quotations') {
          this.quotationService.queryMode = 'preliminary'
        } else if(this.$route.name === 'quotations-sent') {
          this.quotationService.queryMode = 'sent'
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
<style scoped>
.quotation-icons {
  display: flex;
  justify-content: flex-end;
}
</style>
