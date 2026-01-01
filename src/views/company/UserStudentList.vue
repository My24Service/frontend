<template>
  <div class="app-grid">

    <div class="subnav-pills">
      <PillsCompanyUsers />
    </div>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-studentuser-modal"
      ref="delete-studentuser-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this student user?') }}</p>
    </b-modal>

    <div class="overflow-auto">
      <Pagination
        v-if="!isLoading"
        :model="this.model"
        :model_name="$trans('Student user')"
      />

      <b-table
        id="studentuser-table"
        small
        :busy='isLoading'
        :fields="studentuserFields"
        :items="studentusers"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">
            <BButton-toolbar>
              <BButton-group class="mr-1">
                <ButtonLinkAdd
                  router_name="studentuser-add"
                  v-bind:title="$trans('New student user')"
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
              </BButton-group>
            </BButton-toolbar>
          </div>
        </template>
        <template #table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>&nbsp;&nbsp;
            <strong>{{ $trans('Loading...') }}</strong>
          </div>
        </template>
        <template #cell(full_name)="data">
          <BLink :to="{name: 'studentuser-detail', params: {pk: data.item.id}}">{{ data.item.full_name }}</BLink>
        </template>
        <template #cell(active)="data">
          <BLink
            v-if="!data.item.is_active"
            @click="function() { setActive(data.item.id, data.item.email) }"
          >
            <b-icon-check-square></b-icon-check-square>
          </BLink>
          <BLink
            v-if="data.item.is_active"
            @click="function() { setInActive(data.item.id, data.item.email) }"
          >
            <b-icon-check-square-fill></b-icon-check-square-fill>
          </BLink>
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              router_name="studentuser-edit"
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
</template>

<script>
import my24 from '../../services/my24.js'
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import studentUserModel from '../../models/company/UserStudent.js'
import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkDownload from '../../components/ButtonLinkDownload.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  name: 'UserstudentuserList',
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
  },
  data() {
    return {
      pk: null,
      searchQuery: null,
      model: studentUserModel,
      isLoading: false,
      studentusers: [],
      studentuserFields: [
        {key: 'full_name', label: $trans('Name'), sortable: true},
        {key: 'username', label: $trans('Username'), sortable: true},
        {key: 'student_user.mobile', label: $trans('Mobile'), sortable: true},
        {key: 'email', label: $trans('Email'), sortable: true},
        {key: 'last_login', label: $trans('Last login'), sortable: true},
        {key: 'date_joined', label: $trans('Date joined'), sortable: true},
        {key: 'active', label: $trans('Active?')},
        {key: 'icons'}
      ],
    }
  },
  created() {
    this.model.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // download
    downloadList() {
      if (confirm($trans('Are you sure you want to export all students?'))) {
        my24.downloadItem('/company/student-export-xls/', 'students.xlsx')
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
    // active/inactive
    async setActive(pk, email) {
      try {
        await this.model.setActive(pk, email)
        await this.loadData()
      } catch(error) {
        console.log('Error setting student user active', error)
        errorToast(create, $trans('Error setting student user active'))
      }
    },
    async setInActive(pk, email) {
      try {
        await this.model.setInActive(pk, email)
        await this.loadData()
      } catch(error) {
        console.log('Error setting student user inactive', error)
        errorToast(create, $trans('Error setting student user inactive'))
      }
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-studentuser-modal'].show()
    },
    async doDelete() {
      try {
        await this.model.delete(this.pk)
        infoToast(create, $trans('Deleted'), $trans('studentuser has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting studentuser', error)
        errorToast(create, $trans('Error deleting studentuser'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;

      try {
        const data = await this.model.list()
        this.studentusers = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching studentusers', error)
        errorToast(create, $trans('Error loading student users'))
        this.isLoading = false
      }
    }
  }
}
</script>
