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
      id="delete-customer-modal"
      ref="delete-customer-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this customer?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.customerModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.customerModel.count"
      :per-page="this.customerModel.perPage"
      aria-controls="customer-table"
    ></b-pagination>

    <b-table
      id="customer-table"
      small
      :busy='isLoading'
      :fields="customerFields"
      :items="customers"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="customer-add"
                v-bind:title="$trans('New customer')"
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
      <template #cell(id)="data">
        <router-link :to="{name: 'customer-view', params: {pk: data.item.id}}">{{ data.item.name }}</router-link><br/>
        <b>{{ $trans('Customer ID') }}</b>: {{ data.item.customer_id }}<br/>
        <span v-if="data.item.contact && data.item.contact.trim() !== ''">
            <b>{{ $trans('Contact') }}</b>: {{ data.item.contact }}<br/>
        </span>
        <span v-if="data.item.order_email">
          {{ $trans('Email') }}: <b-link class="px-1" v-bind:href="`mailto:${data.item.email}`">{{ data.item.email }}</b-link><br/>
        </span>
        <span v-if="data.item.mobile && data.item.mobile.trim() !== ''">
            <b>{{ $trans('Mobile') }}</b>: {{ data.item.mobile }}<br/>
        </span>
        <span v-if="data.item.remarks && data.item.remarks.trim() != ''">
            <b>{{ $trans('Remarks') }}</b>: {{ data.item.remarks }}<br/>
        </span>
        <span v-if="data.item.maintenance_contract && data.item.maintenance_contract.trim() != ''">
            <b>{{ $trans('Maintenance contract') }}</b>: {{ data.item.maintenance_contract }}<br/>
        </span>
        <span v-if="data.item.standard_hours_txt !== '0:00'">
            <b>{{ $trans('Standard hours') }}</b>: {{ data.item.standard_hours_txt }}<br/>
        </span>
        <b-row>
          <b-col cols="12" v-if="data.item.documents.length > 0">
            <b>{{ $trans('Documents') }}</b>:
            <span v-for="item in data.item.documents" :key="item.file">
              <b-link v-bind:href="item.url" target="_blank">
                {{ item.name }} <b-icon-download font-scale="1"></b-icon-download>
              </b-link>&nbsp;
            </span>
          </b-col>
        </b-row>
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="customer-edit"
            v-bind:router_params="{pk: data.item.id}"
            v-bind:title="$trans('Edit')"
          />
          <IconLinkDocuments
            router_name="customer-documents"
            v-bind:router_params="{customerPk: data.item.id}"
            v-bind:title="$trans('Documents')"
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
import customerModel from '@/models/customer/Customer.js'
import IconLinkDocuments from '@/components/IconLinkDocuments.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  name: 'CustomerList',
  components: {
    IconLinkDocuments,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      customerModel,
      isLoading: false,
      customers: [],
      customerFields: [
        {key: 'id', label: this.$trans('Company'), sortable: true},
        {key: 'tel', label: this.$trans('Tel.'), sortable: true},
        {key: 'address', label: this.$trans('Address'), sortable: true},
        {key: 'country_code', label: this.$trans('Postal'), sortable: true},
        {key: 'city', label: this.$trans('City'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.customerModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.customerModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      customerModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-customer-modal'].show()
    },
    async doDelete() {
      try {
        await customerModel.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Customer has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting customer', error)
        this.errorToast(this.$trans('Error deleting customer'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await customerModel.list()
        this.customers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching customers', error)
        this.errorToast(this.$trans('Error loading customers'))
        this.isLoading = false
      }
    }
  }
}
</script>
