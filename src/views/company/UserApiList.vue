<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><b-icon icon="people"></b-icon>{{ $trans("People") }}</h3>
        <b-button-toolbar>
          <b-button-group>
            <ButtonLinkRefresh
              v-bind:method="function() { loadData() }"
              v-bind:title="$trans('Refresh')"
            />
            <ButtonLinkSearch
              v-bind:method="function() { showSearchModal() }"
            />
          </b-button-group>
          <b-link :to="{name: 'apiuser-add'}" class="btn primary" v-if="isStaff || isSuperuser">
            {{$trans('Add API user')}}
          </b-link>
        </b-button-toolbar>
      </div>
    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-apiuser-modal"
      ref="delete-apiuser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this API user?') }}</p>
    </b-modal>

    <b-modal
      id="revoke-apiuser-modal"
      ref="revoke-apiuser-modal"
      v-bind:title="$trans('Revoke?')"
      @ok="doRevoke"
    >
      <p class="my-4">{{ $trans('Are you sure you want to revoke this API key?') }}</p>
    </b-modal>

    <div class="page-details panel">

      <PillsCompanyUsers />
      <br>

      <b-table
        id="apiuser-table"
        small
        :busy='isLoading'
        :fields="apiuserFields"
        :items="apiusers"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  router_name="apiuser-add"
                  v-bind:title="$trans('New API user')"
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
        <template #cell(token)="data">
          <p>
            <input
              v-on:focus="$event.target.select()"
              ref="clone"
              readonly
              size="60"
              :value="data.item.api_user.token"
            />
            <b-link v-on:click.native="copyToken(data.item.token)">
              <b-icon-back class="icon-th"></b-icon-back>
            </b-link>
          </p>
          <br/>

          <p>
            <span
              v-if="data.item.api_user.token_is_revoked"
            >
              {{ $trans('Revoked') }}
            </span>
            <span v-else>
              {{ $trans('Active') }}&nbsp;-
              <b-link v-on:click.native="function(){ showRevokeModal(data.item.id) }">{{ $trans('Revoke') }}</b-link>
              <p>
                {{ $trans("Valid until") }}: {{ getValidUntil(data.item.api_user) }}
              </p>
            </span>
          </p>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="apiuser-edit"
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
      :model="apiUserService"
      :model_name="$trans('API user')"
    />
  </div>
</template>
<script>
import moment from "moment";

import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {ApiUserService} from '../../models/company/UserApi.js'

export default {
  name: 'UserApiList',
  components: {
    PillsCompanyUsers,
    IconLinkEdit,
    IconLinkDelete,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    SearchModal,
    Pagination,
  },
  data() {
    return {
      pk: null,
      revokeId: null,
      searchQuery: null,
      apiUserService: new ApiUserService(),
      isLoading: false,
      apiusers: [],
      apiuserFields: [
        {key: 'username', label: this.$trans('Username')},
        {key: 'api_user.name', label: this.$trans('Name')},
        {key: 'token', label: this.$trans('Token')},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.apiUserService.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.apiUserService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-apiuser-modal'].show()
    },
    async doDelete() {
      try {
        await this.apiUserService.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('API user has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting API user', error)
        this.errorToast(this.$trans('Error deleting API user'))
      }
    },
    // rest
    showRevokeModal(id) {
      this.revokeId = id
      this.$refs['revoke-apiuser-modal'].show()
    },
    async doRevoke() {
      try {
        await this.apiUserService.revoke(this.revokeId)
        this.infoToast(this.$trans('Revoked'), this.$trans('API key has been revoked'))
        await this.loadData()
      } catch(error) {
        console.log('Error revoking API key', error)
        this.errorToast(this.$trans('Error revoking API key'))
      }
    },
    getValidUntil(api_user) {
      return moment(api_user.expire_start_dt).add(api_user.expire_in_days, "days").format('DD/MM/YYYY')
    },
    copyToken() {
      this.$refs.clone.focus();
      document.execCommand('copy');
      // navigator.clipboard.writeText(token)
      this.infoToast(this.$trans('Copy'), this.$trans('Token copied to clipboard'))
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.apiUserService.list()
        this.apiusers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching api users', error)
        this.errorToast(this.$trans('Error loading API keys'))
        this.isLoading = false
      }
    }
  }
}
</script>
