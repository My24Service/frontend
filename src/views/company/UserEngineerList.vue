<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <PillsCompanyUsers />
    </div>

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
      id="delete-engineer-modal"
      ref="delete-engineer-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this engineer?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.engineerModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.engineerModel.count"
      :per-page="this.engineerModel.perPage"
      aria-controls="engineer-table"
    ></b-pagination>

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
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="engineer-add"
                v-bind:title="$trans('New engineer')"
              />
              <ButtonLinkRefresh
                v-bind:method="function() { loadData() }"
                v-bind:title="$trans('Refresh')"
              />
              <ButtonLinkSearch
                v-bind:method="function() { showSearchModal() }"
              />
              <ButtonLinkDownload
                v-bind:method="function() { downloadList() }"
                v-bind:title="$trans('Download')"
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
            v-bind:method="function() { showDeleteModal(data.item.id) }"
          />
        </div>
      </template>
    </b-table>

  </div>
</template>

<script>
import my24 from '@/services/my24.js'
import PillsCompanyUsers from '@/components/PillsCompanyUsers.vue'
import engineerModel from '@/models/company/UserEngineer.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import IconLinkDelete from '@/components/IconLinkDelete.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkDownload from '@/components/ButtonLinkDownload.vue'

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
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      engineerModel,
      isLoading: false,
      engineers: [],
      engineerFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'engineer.mobile', label: this.$trans('Mobile'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'last_login', label: this.$trans('Last login'), sortable: true},
        {key: 'date_joined', label: this.$trans('Date joined'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.engineerModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.engineerModel.currentPage
    this.loadData()
  },
  methods: {
    downloadList() {
      if (confirm(this.$trans('Are you sure you want to export all engineers?'))) {
        my24.downloadItem('/company/engineer-export-xls/', 'engineers.xlsx')
      }
    },
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      engineerModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-engineer-modal'].show()
    },
    doDelete(id) {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        engineerModel.delete(token, this.pk).then(() => {
          this.infoToast(this.$trans('Deleted'), this.$trans('Engineer has been deleted'))
          this.loadData()
        }).catch(() => {
          this.errorToast(this.$trans('Error deleting engineer'))
        })
      })
    },
    loadData() {
      this.isLoading = true;

      engineerModel.list().then((data) => {
        this.engineers = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching engineers', error)
        this.errorToast(this.$trans('Error loading engineers'))
        this.isLoading = false
      })
    }
  }
}
</script>
