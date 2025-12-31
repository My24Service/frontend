<template>
  <div class="app-page">

    <b-modal id="model-modal"
      ref="model-modal"
      :title="isEdit ? $trans('Edit budget') : $trans('New budget')"
      @ok="submitModel"
    >
      <form ref="model-form">
        <b-container
          v-if="budget"
        >
          <b-row>
            <b-col cols="4">
              <b-form-group
                v-bind:label="$trans('Year')"
                label-for="model-year"
              >
                <b-form-input
                  size="sm"
                  id="model-year"
                  v-model="budget.year"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="8">
              <b-form-group
                v-bind:label="$trans('Amount')"
              >
                <PriceInput
                  v-model="budget.amount"
                  :currency="budget.amount_currency"
                  @priceChanged="(val) => budget.setAmount(val)"
                />
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-modal id="delete-modal"
      ref="delete-modal"
      v-bind:title="$trans('Delete?')"
      @ok="doDelete"
    >
      <p class="my-4">{{ $trans('Are you sure you want to delete this budget?') }}</p>
    </b-modal>

    <SearchModal
      id="search-modal"
      ref="search-modal"
      @do-search="handleSearchOk"
    />

    <header>
      <div class='page-title'>
        <h3><b-icon icon="credit-card2-front"></b-icon>{{ $trans("Budgets") }}</h3>
        <b-button-toolbar>
          <b-button-group class="mr-1">
            <ButtonLinkRefresh
            :method="function() { loadData() }"
            :title="$trans('Refresh')"
            />
            <ButtonLinkSearch
            :method="function() { showSearchModal() }"
            />
          </b-button-group>
          <button
            class="btn primary"
            @click="showAddModal"
            >
            <b-icon icon="plus"></b-icon>{{ $trans('New budget') }}
          </button>
        </b-button-toolbar>
      </div>
    </header>

    <div class="page-detail panel">

      <b-table
        id="equipment-table"
        small
        :busy='isLoading'
        :fields="fields"
        :items="budgets"
        responsive="md"
        class="data-table"
        sort-icon-left
      >
        <template #head(icons)="">
          <div class="float-right">

          </div>
        </template>
        <template #cell(year)="data">
          <router-link :to="{name: 'company-budget-view', params: {pk: data.item.id}}">
            {{ data.item.year }}
          </router-link><br/>
        </template>
        <template #cell(amount)="data">
          {{ data.item.amount_dinero.toFormat('$0.00') }}
        </template>
        <template #cell(icons)="data">
          <div class="h2 float-right">
            <IconLinkEdit
              :method="() => showEditModal(data.item.id)"
              :title="$trans('Edit')"
            />
            <IconLinkDelete
              :title="$trans('Delete')"
              :method="function() { showDeleteModal(data.item.id) }"
            />
          </div>
        </template>
      </b-table>
    </div>
    <Pagination
        v-if="!isLoading"
        :model="this.service"
        :model_name="$trans('Budget')"
      />
  </div>
</template>

<script>
import { BudgetService } from '../../models/company/Budget.js'

import IconLinkEdit from '../../components/IconLinkEdit.vue'
import IconLinkDelete from '../../components/IconLinkDelete.vue'
import ButtonLinkRefresh from '../../components/ButtonLinkRefresh.vue'
import ButtonLinkSearch from '../../components/ButtonLinkSearch.vue'
import ButtonLinkAdd from '../../components/ButtonLinkAdd.vue'
import SearchModal from '../../components/SearchModal.vue'
import Pagination from "../../components/Pagination.vue"

import PriceInput from "../../components/PriceInput";

export default {

  name: 'BudgetList',
  components: {
    IconLinkDelete,
    IconLinkEdit,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    ButtonLinkAdd,
    SearchModal,
    Pagination,
    PriceInput,
  },
  data() {
    return {
      searchQuery: null,
      service: new BudgetService(),
      budgets: [],
      budget: null,
      isLoading: false,
      isEdit: false,
      fields: [
        {key: 'year', label: this.$trans('Year')},
        {key: 'amount', label: this.$trans('Budget size')},
        {key: 'icons'}
      ],
    }
  },
  async created() {
    this.isLoading = true
    this.service.currentPage = this.$route.query.page || 1

    await this.loadData()
    this.isLoading = false
  },
  methods: {
    async showEditModal(id) {
      const budgetData = await this.service.detail(id)
      this.budget = new this.service.model(budgetData)
      this.isEdit = true
      this.$refs['model-modal'].show()
    },
    showAddModal() {
      const d = new Date()
      this.budget = new this.service.model({
        year: d.getFullYear(),
        amount: '0.00',
        amount_currency: this.$store.getters.getDefaultCurrency,
        default_currency: this.$store.getters.getDefaultCurrency
      })
      this.isEdit = false
      this.$refs['model-modal'].show()
    },
    async submitModel() {
      try {
        if (this.isEdit) {
          await this.service.update(this.budget.id, this.budget)
          this.infoToast(this.$trans('Updated'), this.$trans('Budget modified'))
        } else {
          await this.service.insert(this.budget)
          this.infoToast(this.$trans('Created'), this.$trans('Budget added'))
        }
        await this.loadData()
      } catch(error) {
        console.log('Error handling budget', error)
        this.errorToast(this.$trans('Error handling budget'))
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
      this.$refs['delete-modal'].show()
    },
    async doDelete() {
      try {
        await this.service.delete(this.pk)
        this.infoToast(this.$trans('Deleted'), this.$trans('Budget has been deleted'))
        await this.loadData()
      } catch(error) {
        console.log('Error deleting budget', error)
        this.errorToast(this.$trans('Error deleting budget'))
      }
    },
    // rest
    async loadData() {
      try {
        const data = await this.service.list()
        this.budgets = data.results.map((m) => new this.service.model(m))
      } catch(error) {
        console.log('error fetching budgets', error)
        this.errorToast(this.$trans('Error loading budgets'))
      }
    }
  }
}
</script>
