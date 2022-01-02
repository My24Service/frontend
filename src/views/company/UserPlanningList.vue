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
      id="delete-planninguser-modal"
      ref="delete-planninguser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this planning user?') }}</p>
    </b-modal>

    <b-pagination
      v-if="this.planningUserModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.planningUserModel.count"
      :per-page="this.planningUserModel.perPage"
      aria-controls="planninguser-table"
    ></b-pagination>

    <b-table
      id="planninguser-table"
      small
      :busy='isLoading'
      :fields="planninguserFields"
      :items="planningusers"
      responsive="md"
      class="data-table"
      sort-icon-left
    >
      <template #head(icons)="">
        <div class="float-right">
          <b-button-toolbar>
            <b-button-group class="mr-1">
              <ButtonLinkAdd
                router_name="planninguser-add"
                v-bind:title="$trans('New planning user')"
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
      <template #cell(icons)="data">
        <div class="h2 float-right">
          <IconLinkEdit
            router_name="planninguser-edit"
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
import PillsCompanyUsers from '@/components/PillsCompanyUsers'
import planningUserModel from '@/models/company/UserPlanning'
import IconLinkEdit from '@/components/IconLinkEdit'
import IconLinkDelete from '@/components/IconLinkDelete'
import ButtonLinkAdd from '@/components/ButtonLinkAdd'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh'
import ButtonLinkSearch from '@/components/ButtonLinkSearch'

export default {
  name: 'UserPlanningList',
  components: {
    PillsCompanyUsers,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch,
  },
  data() {
    return {
      pk: null,
      currentPage: 1,
      searchQuery: null,
      planningUserModel,
      isLoading: false,
      planningusers: [],
      planninguserFields: [
        {key: 'full_name', label: this.$trans('Name'), sortable: true},
        {key: 'username', label: this.$trans('Username'), sortable: true},
        {key: 'email', label: this.$trans('Email'), sortable: true},
        {key: 'last_login', label: this.$trans('Last login'), sortable: true},
        {key: 'date_joined', label: this.$trans('Date joined'), sortable: true},
        {key: 'icons'}
      ],
    }
  },
  watch: {
    currentPage: function(val) {
      this.planningUserModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.planningUserModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      planningUserModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-planninguser-modal'].show()
    },
    doDelete(id) {
      return this.$store.dispatch('getCsrfToken').then((token) => {
        planningUserModel.delete(token, this.pk).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Deleted'),
            message: this.$trans('planning user has been deleted')
          })
          this.loadData()
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error deleting planning user')
          })
        })
      })
    },
    loadData() {
      this.isLoading = true;

      planningUserModel.list().then((data) => {
        this.planningusers = data.results
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching planningusers', error);
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error loading planning users')
        })

        this.isLoading = false
      })
    }
  }
}
</script>
