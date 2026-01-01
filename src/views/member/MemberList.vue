<template>
  <div class="app-page">
    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-member-modal"
      ref="delete-member-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this member?') }}</p>
    </b-modal>

    <header>
      <div class="page-title">
        <h3>
          {{ $trans("Members") }}
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
          <router-link
            v-if="isSuperuser && !requested && !deleted"
            :to="{name: 'member-add'}"
            class="btn"
          >
            {{$trans('Add member')}}
          </router-link>
          <router-link
            v-if="requested && !deleted"
            :to="{name: 'member-request'}"
            class="btn"
          >
            {{$trans('Request new member')}}
          </router-link>
        </BButton-toolbar>
      </div>
    </header>

    <div class="app-detail panel overflow-auto">

      <div class="overflow-auto">
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
          <template #cell(member_logo)="data">
            <img :src="data.item.companylogo_url" width="100" alt=""/>
          </template>
          <template #cell(member_info)="data">
            <router-link :to="{name: 'member-edit', params: {pk: data.item.id}}">
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
            </router-link>
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
    </div>
    <Pagination
      v-if="!isLoading"
      :model="service"
      :model_name="modelName"
    />
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

import IconLinkDelete from "@/components/IconLinkDelete.vue";

export default {

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
        {key: 'member_info', label: $trans('Member'), thAttr: {width: '20%'}},
        {key: 'contract_text', label: $trans('Contract'), thAttr: {width: '30%'}},
        {key: 'member_type', label: $trans('Type'), thAttr: {width: '10%'}},
        {key: 'created', label: $trans('Created'), thAttr: {width: '10%'}},
        {key: 'icons', thAttr: {width: '10%'}}
      ],
    }
  },
  computed: {
    showDelete() {
      if ((this.$store.getters.getIsStaff || this.$store.getters.getIsSuperuser) && this.requested) {
        return true
      }

      return !!(this.$store.getters.getIsSuperuser && !this.requested && !this.deleted);
    },
    modelName() {
      if (this.requested) {
        return $trans('Requested member')
      }

      if (this.deleted) {
        return $trans('Deleted member')
      }

      return $trans('Member')
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
        infoToast(create, $trans('Deleted'), $trans('Member has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting member', error)
        errorToast(create, $trans('Error deleting member'))
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

        if (this.$store.getters.getIsSuperuser && !this.requested && !this.deleted) {
          this.service.setListArgs('is_requested=False&is_deleted=False')
        }

        const data = await this.service.list()
        this.members = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching members', error)
        errorToast(create, $trans('Error loading members'))
        this.isLoading = false
      }
    }
  }
}
</script>
