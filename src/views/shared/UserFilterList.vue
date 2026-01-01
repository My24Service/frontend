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
          <IBiBuilding></IBiBuilding> {{ $trans("Filters") }}
        </h3>
        <BButton-toolbar>
          <BButton-group class="mr-1">

            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </BButton-group>
          <router-link :to="{name: `${route_name_part}-filter-add`}" class="btn">
            {{$trans('Add filter')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="panel overflow-auto">
      <b-table
        small
        id="filter-table"
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
        <template #cell(conditions)="data">
          <ul>
            <li v-for="(condition, index) in data.item.json_conditions" :key="index">
              {{ condition.field }} {{ condition.operator }}
              <span v-for="(value, value_index) in condition.values" :key="value_index">
                <strong>{{ value }}</strong>
                <span v-if="value_index < condition.values.length-1"> {{ condition.values_query_mode }} </span>
              </span>
            </li>
          </ul>
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
      v-if="!isLoading && service"
      :model="service"
      :model_name="$trans('Filter')"
    />
  </div>
</template>

<script>
import {USER_FILTER_TYPE_ORDER} from "@/models/base_user_filter";
import {OrderFilterModel, OrderFilterService} from "@/models/orders/OrderFilter";
import IconLinkDelete from "../../components/IconLinkDelete";
import ButtonLinkRefresh from "../../components/ButtonLinkRefresh";
import ButtonLinkSearch from "../../components/ButtonLinkSearch";
import SearchModal from "../../components/SearchModal";
import Pagination from "../../components/Pagination";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  name: "UserFilterList",
  components: {
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
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
        {key: 'name', label: $trans('Name'), thAttr: {width: '20%'}},
        {key: 'conditions', label: $trans('Conditions'), thAttr: {width: '65%'}},
        {key: 'icons', label: '', thAttr: {width: '15%'}},
      ]
    }
  },
  async created() {
    if (this.type === USER_FILTER_TYPE_ORDER) {
      this.service = new OrderFilterService()
      this.model = OrderFilterModel
    }
    this.service.currentPage = this.$route.query.page || 1
    await this.loadData()
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
        infoToast(create, $trans('Deleted'), $trans('Filter has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting filter', error)
        errorToast(create, $trans('Error deleting filter'))
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
        errorToast(create, $trans('Error loading filters'))
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>

</style>
