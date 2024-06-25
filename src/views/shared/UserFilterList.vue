<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-filter-modal"
      ref="delete-filter-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this filter?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          <b-icon icon="building"></b-icon> {{ $trans("Filters") }}
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
          <router-link :to="{name: `${route_name_part}-filter-add`}" class="btn">
            {{$trans('Add filter')}}
          </router-link>
        </b-button-toolbar>
      </div>
    </header>

    <div class="panel overflow-auto">
      <b-table
        small
        id="statuscode-table"
        :busy='isLoading'
        :fields="fields"
        :items="filters"
        responsive="md"
        class="data-table"
      >
        <template #cell(name)="data">
          <router-link :to="{name: `${route_name_part}-filter-edit`, params: {pk: data.item.id}}">
            {{ data.item.name }}
          </router-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
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
      :model="service"
      :model_name="$trans('Filter')"
    />
  </div>
</template>

<script>
import {USER_FILTER_TYPE_ORDER} from "../../models/base_user_filter";
import {OrderFilterModel, OrderFilterService} from "../../models/orders/OrderFilter";
import IconLinkDelete from "../../components/IconLinkDelete";
import ButtonLinkRefresh from "../../components/ButtonLinkRefresh";
import ButtonLinkSearch from "../../components/ButtonLinkSearch";
import ButtonLinkDownload from "../../components/ButtonLinkDownload";
import SearchModal from "../../components/SearchModal";
import Pagination from "../../components/Pagination";

export default {
  name: "UserFilterList",
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkDownload,
    SearchModal,
    Pagination,
  },
  props: {
    type: {
      type: [String],
      default: null
    },
    route_name_part: {
      type: [String],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,
      service: null,
      model: null,
      filters: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), thAttr: {width: '20%'}},
        {key: 'conditions', label: this.$trans('Conditions'), thAttr: {width: '65%'}},
        {key: 'icons', thAttr: {width: '15%'}},
      ]
    }
  },
  created() {
    this.service.currentPage = this.$route.query.page || 1
    if (this.type === USER_FILTER_TYPE_ORDER) {
      this.service = new OrderFilterService()
      this.model = OrderFilterModel
    }
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
      this.pk = id
      this.$refs['delete-filter-modal'].show()
    },
    async doDelete() {
      try {
        await this.service.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Filter has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting filter', error)
        this.errorToast(this.$trans('Error deleting filter'))
      }
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.service.list()
        this.filters = data.results.map((filter) => new this.model(filter))
        this.isLoading = false
      } catch(error) {
        console.log('error fetching filters', error)
        this.errorToast(this.$trans('Error loading filters'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>

</style>
