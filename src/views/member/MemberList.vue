<template>
  <div class="mt-4">

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

    <b-pagination
      v-if="this.memberModel.count > 20"
      class="pt-4"
      v-model="currentPage"
      :total-rows="this.memberModel.count"
      :per-page="this.memberModel.perPage"
      aria-controls="member-table"
    ></b-pagination>

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
        {{ data.item.name }}<br/>
        {{ data.item.country_code }}-{{ data.item.postal }} {{ data.item.city }}<br/>
        {{ data.item.email }}<br/>
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
</template>

<script>
import memberModel from '@/models/member/Member.js'
import IconLinkEdit from '@/components/IconLinkEdit.vue'
import ButtonLinkRefresh from '@/components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '@/components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '@/components/ButtonLinkAdd.vue'

export default {
  components: {
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
  },
  data() {
    return {
      currentPage: 1,
      searchQuery: null,
      memberModel,
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
  watch: {
    currentPage: function(val) {
      this.memberModel.currentPage = val
      this.loadData()
    }
  },
  created() {
    this.currentPage = this.memberModel.currentPage
    this.loadData()
  },
  methods: {
    handleSearchOk(bvModalEvt) {
      bvModalEvt.preventDefault()
      this.handleSearchSubmit()
    },
    handleSearchSubmit() {
      this.$refs['search-modal'].hide()

      memberModel.setSearchQuery(this.searchQuery)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async loadData() {
      this.isLoading = true;

      try {
        const data = await memberModel.list()
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
