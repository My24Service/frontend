<template>
  <div class="app-page">
    <b-modal
      id="delete-contract-modal"
      ref="delete-contract-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this contract?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class="page-title">
        <h3>
          {{ $trans("Contracts") }}
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
          <router-link :to="{name: 'contract-add'}" class="btn">
            {{$trans('Add contract')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">

      <div class="overflow-auto">
        <b-table
          id="contract-table"
          small
          :busy='isLoading'
          :fields="fields"
          :items="contracts"
          responsive="md"
          class="data-table"
          sort-icon-left
        >
          <template #cell(icons)="data">
            <div class="h2 float-right">
              <IconLinkEdit
                router_name="contract-edit"
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
    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Contract')"
    />
  </div>
</template>

<script>
import contractModel from '@/models/member/Contract.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import SearchModal from '@/components/SearchModal.vue'
import Pagination from "@/components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import componentMixin from "@/mixins/common";
import {errorToast, infoToast} from "@/utils";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create,
    }
  },
  mixins: [componentMixin],
  components: {
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      searchQuery: null,
      model: contractModel,
      contractPk: null,
      isLoading: false,
      contracts: [],
      fields: [
        {key: 'name', label: this.$trans('Name'), thAttr: {width: '20%'}, sortable: true},
        {key: 'modules_text', label: this.$trans('Modules'), thAttr: {width: '50%'}, sortable: true},
        {key: 'created', label: this.$trans('Created'), thAttr: {width: '10%'}, sortable: true},
        {key: 'modified', label: this.$trans('Modified'), thAttr: {width: '10%'}, sortable: true},
        {key: 'icons', thAttr: {width: '10%'}}
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
      this.contractPk = id
      this.$refs['delete-contract-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.contractPk)
        infoToast(this.create, this.$trans('Deleted'), this.$trans('Contract has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting contract', error)
        errorToast(this.create, this.$trans('Error deleting contract'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.contracts = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching contracts', error)
        errorToast(this.create, this.$trans('Error loading contracts'))
        this.isLoading = false
      }
    }
  }
}
</script>
