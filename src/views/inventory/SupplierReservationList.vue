<template>

  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="file-earmark-lock"></b-icon>{{ $trans("Reservations") }}</h3>
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
          <router-link :to="{name: 'supplier-reservation-add'}" class="btn primary">
            {{ $trans("Add reservation") }}
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
      id="delete-supplier-reservation-modal"
      ref="delete-supplier-reservation-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this reservation?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

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

        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading reservations...') }}</strong>
          </div>
        </template>

        <template #cell(id)="data">

          <router-link :to="{name: 'supplier-reservation-view', params: {pk: data.item.id}}">
            {{ data.item.id }}. {{ data.item.supplier_view.name }}, {{ data.item.supplier_view.city }}
          </router-link>

          <!-- TODO: delete this table probably
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
          -->
        </template>

        <template #cell(materials)="data">

          <span v-if="data.item.materials.length" :title="`${data.item.materials.length} materials`">
              {{data.item.materials.length}} material{{  data.item.materials.length > 1 ? 's' : ''}}
              &nbsp;&nbsp;&mdash;&nbsp;&nbsp;
              <span class="dimmed">
                {{ data.item.materials[0].amount }} {{ data.item.materials[0].material_view.name }}
                <small v-if="data.item.materials.length > 1" class="dimmed">
                  {{ $trans("and") }} {{data.item.materials.length - 1 }} {{ $trans("more") }}
                </small>
              </span>
            </span>
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
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Reservation')"
    />
  </div>
</template>

<script>
import supplierReservationModel from '@/models/inventory/SupplierReservation.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"

export default {
  components: {
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
        {key: 'id', label: this.$trans('Reservation'), sortable: true},
        {key: 'materials', label: this.$trans('Materials')},
        {key: 'created', label: this.$trans('Created'), sortable: true},
        {key: 'icons', label: ''},
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
        infoToast(create, this.$trans('Deleted'), this.$trans('Entry Reservation been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting reservation', error)
        errorToast(create, this.$trans('Error deleting reservation'))
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
        errorToast(create, this.$trans('Error loading reservations'))
        this.isLoading = false
      }
    }
  }
}
</script>
