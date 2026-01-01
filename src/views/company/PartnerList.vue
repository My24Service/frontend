<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><IBiPersonSquare></IBiPersonSquare>{{ $trans('Partners') }}</h3>
        <BButton-toolbar>
          <BButton-group>
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </BButton-group>
          <router-link :to="{name: 'partner-request-add'}" class="btn">{{$trans('New partner request')}}</router-link>
        </BButton-toolbar>
      </div>
    </header>


    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-partner-modal"
      ref="delete-partner-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this partner relation?') }}</p>
    </b-modal>

    <div class="panel overflow-auto">

      <PillsCompanyPartners />
      <br />
      <b-table
        id="partner-table"
        small
        :busy='isLoading'
        :fields="partnerFields"
        :items="partners"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">

          </div>
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkDelete
            v-bind:title="$trans('Delete')"
            v-bind:method="function() { showDeleteModal(data.item.id) }"
          />
          </div>
        </template>
        <template #cell(has_branches)="data">
          <IBiCheckSquareFill
            v-if="data.item.partner_view.has_branches"
          ></IBiCheckSquareFill>
        </template>
      </b-table>
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Partner')"
      />
    </div>
  </div>
</template>

<script>
import PillsCompanyPartners from '../../components/PillsCompanyPartners.vue'
import partnerModel from '../../models/company/Partner.js'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
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
  name: 'PartnerList',
  components: {
    PillsCompanyPartners,
    IconLinkDelete,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      model: partnerModel,
      isLoading: false,
      partners: [],
      partnerFields: [
        {key: 'partner_view.name', label: $trans('Name'), sortable: true},
        {key: 'partner_view.companycode', label: $trans('Company code'), sortable: true},
        {key: 'partner_view.city', label: $trans('City'), sortable: true},
        {key: 'partner_view.email', label: $trans('Email'), sortable: true},
        {key: 'has_branches', label: $trans('Branches?'), sortable: true},
        {key: 'created', label: $trans('Created'), sortable: true},
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
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-partner-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        infoToast(create, $trans('Deleted'), $trans('partner has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting partner', error)
        errorToast(create, $trans('Error deleting partner'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.partners = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching partners', error);
        errorToast(create, $trans('Error loading partners'))
        this.isLoading = false
      }
    }
  }
}
</script>
