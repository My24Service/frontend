<template xmlns="http://www.w3.org/1999/html">
  <div class="mt-4">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-supplier-reservation-modal"
      ref="delete-supplier-reservation-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this reservation?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Reservation')"
      />

      <b-table
        id="supplier-reservation-table"
        small
        sort-by="supplier"
        :busy='isLoading'
        :fields="fields"
        :items="reservations"
        responsive="md"
        class="data-table"
        tbody-tr-class="reservation-row"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="supplier-reservation-add"
                  v-bind:title="$trans('New reservation')"
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
          <b-row>
            <b-col cols="3">
              <router-link :to="{name: 'supplier-reservation-view', params: {pk: data.item.id}}">
                {{ data.item.supplier_view.name }}, {{ data.item.supplier_view.city }}
              </router-link><br/>
              {{ $trans('Created') }}: {{ data.item.created }}
            </b-col>
            <b-col cols="9">
              <b-table
                id="supplier-reservation-materials-table"
                dark borderless small
                sort-by="supplier"
                :busy='isLoading'
                :fields="material_fields"
                :items="data.item.materials"
                responsive="sm"
                class="data-table"
                sort-icon-left
              >
              </b-table>
            </b-col>
          </b-row>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="supplier-reservation-edit"
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
  </div>
</template>

<script>
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import IconLinkPlus from '@/components/IconLinkPlus.vue'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
    IconLinkPlus,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: supplierReservationModel,
      supplierReservationPk: null,
      isLoading: false,
      reservations: [],
      fields: [
        {thAttr: {width: '85%'}, key: 'id', label: this.$trans('Reservation')},
        {thAttr: {width: '15%'}, key: 'icons'}
      ],
      material_fields: [
        {key: 'material_view.name', label: this.$trans('Product')},
        {key: 'remarks', label: this.$trans('Remarks')},
        {key: 'amount', label: this.$trans('Amount')},
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
    // delete
    showDeleteModal(id) {
      this.supplierReservationPk = id
      this.$refs['delete-supplier-reservation-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.supplierReservationPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Entry Reservation been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting reservation', error)
        this.errorToast(this.$trans('Error deleting reservation'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.reservations = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching reservations', error)
        this.errorToast(this.$trans('Error loading reservations'))
        this.isLoading = false
      }
    }
  }
}
</script>
