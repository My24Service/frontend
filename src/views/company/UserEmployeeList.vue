<template>
  <div class="app-page">
    <header>
      <div class="page-title">
        <h3><IBiPeople></IBiPeople>{{ $trans("People") }}</h3>
        <div>
          <BButton-toolbar class="flex-columns">
            <BButton-group>
              <ButtonLinkRefresh
                v-bind:method="function() { loadData() }"
                v-bind:title="$trans('Refresh')"
              />
              <ButtonLinkSearch
                v-bind:method="function() { showSearchModal() }"
              />
            </BButton-group>
            <BLink
              :to="{name: 'employee-add'}"
              class="btn btn-primary"
            >
              <IBiPersonPlus></IBiPersonPlus>{{ $trans("Add employee") }}
            </BLink>
          </BButton-toolbar>
        </div>
      </div>

    </header>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <b-modal
      id="delete-employee-modal"
      ref="delete-employee-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this employee?') }}</p>
    </b-modal>


    <div class="page-details panel">
      <PillsCompanyUsers
        v-if="!isBranchEmployee"
      />
      <br>
      <b-table
        id="employee-table"
        small
        :busy='isLoading'
        :fields="employeeFields"
        :items="employees"
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
          <router-link :to="{name: 'employee-edit', params : {pk: data.item.id}}">
          {{  data.item.full_name }}
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
    <Pagination
        v-if="!isLoading"
        :model="employeeService"
        :model_name="$trans('Employee')"
      />
  </div>
</template>

<script>
import PillsCompanyUsers from '../../components/PillsCompanyUsers.vue'
import {EmployeeService} from '@/models/company/UserEmployee'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import componentMixin from "@/mixins/common";

export default {
  setup() {
    const {create} = useToast()

    // expose to template and other options API hooks
    return {
      create
    }
  },
  mixins: [componentMixin],
  name: 'UserEmployeeList',
  components: {
    PillsCompanyUsers,
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
      model: null,
      isLoading: false,
      employees: [],
      employeeFields: [
        {key: 'full_name', label: $trans('Name'), sortable: true},
        {key: 'username', label: $trans('Username'), sortable: true},
        {key: 'email', label: $trans('Email'), sortable: true},
        {key: 'last_login', label: $trans('Last login'), sortable: true},
        {key: 'date_joined', label: $trans('Date joined'), sortable: true},
        {key: 'icons', label: ''}
      ],
      employeeService: new EmployeeService()
    }
  },
  created() {
    this.employeeService.currentPage = this.$route.query.page || 1
    this.loadData()
  },
  methods: {
    // search
    handleSearchOk(val) {
      this.$refs['search-modal'].hide()
      this.employeeService.setSearchQuery(val)
      this.loadData()
    },
    showSearchModal() {
      this.$refs['search-modal'].show()
    },
    // delete
    showDeleteModal(id) {
      this.pk = id
      this.$refs['delete-employee-modal'].show()
    },
    async doDelete() {
      try {
        await this.employeeService.delete(this.pk)
        infoToast(this.create, $trans('Deleted'), $trans('Employee has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting employee', error)
        errorToast(this.create, $trans('Error deleting employee'))
      }
    },
    // rest
    async loadData() {
      this.isLoading = true;
``
      try {
        const data = await this.employeeService.list()
        this.employees = data.results
        this.isLoading = false
      } catch(error) {
        console.log('error fetching employees', error)
        errorToast(this.create, $trans('Error loading employees'))
        this.isLoading = false
      }
    }
  }
}
</script>
