<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="people"></b-icon>People</h3>
        <b-button-toolbar class="flex-columns">
          <b-button-group class="mr-1">
            
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
            
          </b-button-group>
          <b-button @click="()=>{ downloadList()}" class="btn primary mr-1"><b-icon icon="save"></b-icon> {{$trans('Download')}}</b-button>
          <b-link :to="{name: 'engineer-add'}" class="btn primary"><b-icon icon="person-plus"></b-icon> Add engineer</b-link>
        </b-button-toolbar>
      </div>
    </header>
    

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-engineer-modal"
      ref="delete-engineer-modal"
      v-bind:title="`${$trans('Remove engineer')} (${selectedEngineer ? selectedEngineer.username :''})`"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to remove') }} <strong>{{ selectedEngineer ? selectedEngineer.full_name : ''}}</strong>?</p>
    </b-modal>

    <div class="panel overflow-auto">
      <div class="subnav-pills">
        <PillsCompanyUsers />
      </div>

      <PillsEngineer v-if="companycode === 'grm'" />
      <br>

      <b-table
        id="engineer-table"
        small
        :busy='isLoading'
        :fields="engineerFields"
        :items="engineers"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        
        <template #table-busy>
          <div class="text-center my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(full_name)="data">
          <b-link :to="{name: 'engineer-detail', params: {pk: data.item.id}}">{{ data.item.full_name }}</b-link>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="engineer-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id,  data.item.full_name) }"
            />
          </div>
        </template>
      </b-table>
    </div>

    <Pagination
      v-if="!isLoading"
      :model="this.model"
      :model_name="$trans('Engineer')"
    />
  </div>
</template>

<script>
import my24 from '../../services/my24.js'
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import engineerModel from '../../models/company/UserEngineer.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkDownload from '../../components/ButtonLinkDownload.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import PillsEngineer from "./PillsEngineer";

export default {
  name: 'UserEngineerList',
  components: {
    PillsCompanyUsers,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkDownload,
    SearchModal,
    Pagination,
    PillsEngineer,
  },
  data() {
    return {
      companycode: null,
      pk: null,
      searchQuery: null,
      model: engineerModel,
      isLoading: false,
      engineers: [],
      engineerFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'engineer.mobile', label: this.$trans('Mobile'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'last_login', label: this.$trans('Last login'), sortable: true},
        {key: 'date_joined', label: this.$trans('Date joined'), sortable: true},
        {key: 'icons', label: ''}
      ]
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  computed: {
    selectedEngineer () {
      return this.engineers.filter(engineer => engineer.id === this.pk)[0];
    }
  },
  methods: {
    // download
    downloadList() {
      if (confirm(this.$trans('Are you sure you want to export all engineers?'))) {
        my24.downloadItem('/company/engineer-export-xls/', 'engineers.xlsx')
      }
    },
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
      this.$refs['delete-engineer-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        this.infoToast(this.$trans('Removed engineer'), `${this.$trans('Engineer has been removed')}`)
        await this.loadData()
      } catch(error) {
        this.errorToast(`${this.$trans('Error deleting engineer:')} ${error}`);
      }
    },
    // rest
    async loadData() {
      // get companycode
      this.companycode = await this.$store.getters.getMemberCompanycode

      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.engineers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching engineers', error)
        this.errorToast(this.$trans('Error loading engineers'))
        this.isLoading = false
      }
    }
  }
}
</script>
