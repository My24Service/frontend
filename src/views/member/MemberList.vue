<template>
  <div class="mt-4">

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="deleted ? $trans('Deleted member') : $trans('Member')"
      />

      <b-table
        id="member-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="members"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <b-button-toolbar>
              <b-button-group class="mr-1">
                <ButtonLinkAdd
                  v-if="isSuperuser"
                  router_name="member-add"
                  v-bind:title="$trans('New member')"
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
        <template #cell(member_logo)="data">
          <img :src="data.item.companylogo" width="100" alt=""/>
        </template>
        <template #cell(member_info)="data">
          {{ $trans('Companycode') }}: {{ data.item.companycode }} <span v-if="!data.item.is_public">({{ $trans('private') }})</span> <br/>
          {{ $trans('Name') }}: {{ data.item.name }}<br/>
          {{ data.item.country_code }}-{{ data.item.postal }} {{ data.item.city }}<br/>
          {{ data.item.email }}<br/>
          <p v-if="data.item.has_api_users">
            <strong>{{ $trans('Has API users') }}</strong>
          </p>
          <p v-if="data.item.has_branches">
            <strong>{{ $trans('Has branches') }}</strong>
          </p>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="member-edit"
              v-bind:router_params="{pk: data.item.id}"
              v-bind:title="$trans('Edit')"
            />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import memberModel from '../../models/member/Member.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '../../utils.js'

export default {
  mixins: [componentMixin],
  components: {
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  props: {
    deleted: {
      type: [String, Boolean],
      default: false
    },
  },
  data() {
    return {
      searchQuery: null,
      model: memberModel,
      memberPk: null,
      isLoading: false,
      members: [],
      fields: [
        {key: 'member_logo', label: '', thAttr: {width: '20%'}},
        {key: 'member_info', label: this.$trans('Member'), thAttr: {width: '20%'}},
        {key: 'contract_text', label: this.$trans('Contract'), thAttr: {width: '30%'}},
        {key: 'member_type', label: this.$trans('Type'), thAttr: {width: '10%'}},
        {key: 'created', label: this.$trans('Created'), thAttr: {width: '10%'}},
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
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = this.deleted ? await this.model.getDeleted() : await this.model.list()
        this.members = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching members', error)
        this.errorToast(this.$trans('Error loading members'))
        this.isLoading = false
      }
    }
  }
}
</script>
