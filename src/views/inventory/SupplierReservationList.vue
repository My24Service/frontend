<template>
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

    <b-pagination
      v-if="this.supplierReservationModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.supplierReservationModel.count"
      :per-page="this.supplierReservationModel.perPage"
      aria-controls="supplier-reservation-table"
    ></b-pagination>

    <b-table
      id="supplier-reservation-table"
      small
      sort-by="supplier"
      :busy='isLoading'
      :fields="fields"
      :items="reservations"
      responsive="md"
      class="data-table"
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
      <template #cell(supplier)="data">
        {{ data.item.supplier_view.name }}, {{ data.item.supplier_view.city }}
      </template>
      <template #cell(material)="data">
        {{ data.item.material_view.name }}
      </template>
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkPlus
            type="tr"
            v-bind:title="$trans('Create purhase order')"
            router_name="purchaseorder-add-from-reservation"
            :router_params="{reservation_pk: data.item.id}"
          />
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

export default {
  components: {
    IconLinkPlus,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      supplierReservationModel,
      supplierReservationPk: null,
      isLoading: false,
      reservations: [],
      fields: [
        {key: 'supplier', label: this.$trans('Supplier'), sortable: true},
        {key: 'material', label: this.$trans('Material'), sortable: true},
        {key: 'remarks', label: this.$trans('Remarks'), sortable: true},
        {key: 'amount', label: this.$trans('Amount'), sortable: true},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.supplierReservationModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.supplierReservationModel.currentPage
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      supplierReservationModel.setSearchQuery(val)
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
        await supplierReservationModel.delete(this.supplierReservationPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Entry Reservation been deleted'))
        this.loadData()
      } catch(error) {
        console.log('Error deleting reservation', error)
        this.errorToast(this.$trans('Error deleting reservation'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await supplierReservationModel.list()
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
