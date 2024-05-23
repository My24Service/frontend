<template>
  <div class="mt-4">

    <b-modal
      id="delete-member-modal"
      ref="delete-member-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this member?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="service"
        :model_name="modelName"
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
                  v-if="isSuperuser && !requested && !deleted"
                  router_name="member-add"
                  v-bind:title="$trans('New member')"
                />
                <ButtonLinkAdd
                  v-if="requested && !deleted"
                  router_name="member-request"
                  v-bind:title="$trans('Request new member')"
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
          <img :src="data.item.companylogo_url" width="100" alt=""/>
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
            <IconLinkDelete
              v-if="showDelete"
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import {MemberService} from '@/models/member/Member'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import { componentMixin } from '@/utils'
import IconLinkDelete from "@/components/IconLinkDelete.vue";

export default {
  mixins: [componentMixin],
  components: {
    IconLinkDelete,
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
  },
  props: {
    deleted: {
      type: [Boolean],
      default: false
    },
    requested: {
      type: [Boolean],
      default: false
    },
  },
  data() {
    return {
      searchQuery: null,
      service: new MemberService(),
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
  computed: {
    showDelete() {
      if ((this.isStaff || this.isSuperuser) && this.requested) {
        return true
      }

      return !!(this.isSuperuser && !this.requested && !this.deleted);
    },
    modelName() {
      if (this.requested) {
        return this.$trans('Requested member')
      }

      if (this.deleted) {
        return this.$trans('Deleted member')
      }

      return this.$trans('Member')
    }
  },
  created() {
    this.service.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // delete
    showDeleteModal(id) {
      this.memberPk = id
      this.$refs['delete-member-modal'].show()
    },
    async doDelete() {
      try {
        await this.service.delete(this.memberPk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Member has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting member', error)
        this.errorToast(this.$trans('Error deleting member'))
      }
    },
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.service.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    async loadData() {
      this.isLoading = true;

      try {
        if (this.deleted) {
          this.service.setListArgs('is_deleted=True')
        }

        if (this.requested) {
          this.service.setListArgs('is_requested=True')
        }

        if (this.isSuperuser && !this.requested && !this.deleted) {
          this.service.setListArgs('is_requested=False&is_deleted=False')
        }

        const data = await this.service.list()
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
