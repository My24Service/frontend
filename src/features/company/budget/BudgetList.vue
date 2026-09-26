<template>
  <div class="app-page">
    <b-modal
      id="model-modal"
      ref="modelModal"
      :title="isCreate ? $trans('New budget') : $trans('Edit budget')"
      @ok.prevent="submitForm()"
    >
      <form ref="model-form">
        <b-container>
          <b-row>
            <b-col cols="4">
              <BFormGroup
                :label="$trans('Year')"
                label-for="model-year"
              >
                <BFormInput
                  id="model-year"
                  v-model="values.year"
                  size="sm"
                  :state="submitClicked ? !errors.year : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.year : null">
                  {{ errors.year }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
            <b-col cols="8">
              <BFormGroup :label="$trans('Amount')">
                <PriceInput
                  v-model="values.amount"
                  :currency="modalCurrency"
                  @priceChanged="priceChanged"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.amount : null">
                  {{ errors.amount }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <ServerTable
      ref="tableRef"
      v-model:search-draft="searchDraft"
      :table="table"
      :pagination="pagination"
      :count="count"
      :is-loading="isLoading"
      :is-fetching="isFetching"
      :title="$trans('Budgets')"
      :search-label="$trans('Search budgets')"
      :label="$trans('Budget')"
      :empty-text="$trans('No budgets found')"
      :refresh="refresh"
      :delete-modal="{
        modalId: 'delete-modal',
        confirmText: $trans('Are you sure you want to delete this budget?'),
        resource: Api.CompanyBudget,
        deletedDetail: $trans('Budget has been deleted'),
        deleteError: $trans('Error deleting budget'),
      }"
    >
      <template #icon><IBiCreditCard2Front /></template>
      <template #add>
        <button
          class="btn btn-primary"
          @click="showAddModal"
        >
          <IBiPlus />{{ $trans('New budget') }}
        </button>
      </template>
    </ServerTable>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'

import RowAction from '@/components/RowAction.vue'
import { ServerTable, createAppColumnHelper, useServerTable, type ListRow } from '@/features/table'
import { formatMoney, formatMoneyPlain, toDinero } from '@/services/money'
import { useResourceForm } from '@/features/forms'
import { budgetModalFromRecord, budgetWrite, emptyBudget } from './schemas'

/**
 * The budget list with its create/edit modal. The table is the shared
 * server-paged kit; the modal is the resource form kit with the row's id as
 * its `pk`: it stays open when the save fails, and only a successful write
 * hides it and refetches the list.
 */
type BudgetRow = ListRow<Api.PaginatedBudgetList>

const mainStore = useMainStore()

const tableRef = useTemplateRef<{showDeleteModal: (id: number) => void}>('tableRef')
const modelModal = useTemplateRef<{show: () => void, hide: () => void}>('modelModal')

const helper = createAppColumnHelper<BudgetRow>()

const columns = helper.columns([
  helper.accessor('year', {
    header: $trans('Year'),
    cell: ({ row }) => h(RouterLink, {
      to: { name: 'company-budget-view', params: { pk: row.original.id } },
    }, () => String(row.original.year)),
  }),
  helper.accessor('amount', {
    header: $trans('Budget size'),
    cell: ({ row }) => formatMoney(toDinero(row.original.amount ?? '0', row.original.amount_currency)),
  }),
  helper.display({
    id: 'icons',
    header: '',
    cell: ({ row }) => h('div', { class: 'h2 float-right' }, [
      h(RowAction, {icon: 'edit',
        method: () => showEditModal(row.original.id),
        title: $trans('Edit'),
      }),
      h(RowAction, {icon: 'delete',
        title: $trans('Delete'),
        method: () => tableRef.value?.showDeleteModal(row.original.id),
      }),
    ]),
  }),
])

const { table, searchDraft, pagination, count, isLoading, isFetching, refresh } = useServerTable<BudgetRow>({
  key: 'budget-table',
  columns,
  // The legacy table offered no sorting, and the endpoint declares no
  // `ordering` - the headers stay non-sortable rather than rendering controls
  // nothing honours.
  enableSorting: false,
  resource: Api.CompanyBudget,
  urlSync: true,
  loadError: $trans('Error loading budgets'),
})

// The modal ---------------------------------------------------------------

/** null while the modal is creating; the row's id while it is editing. */
const editingId = ref<number | null>(null)

const {values, errors, submitClicked, isCreate, record, submitForm, reset} = useResourceForm({
  pk: () => editingId.value,
  resource: Api.CompanyBudget,
  empty: emptyBudget,
  fromRecord: budgetModalFromRecord,
  contract: budgetWrite,
  afterSave: () => modelModal.value?.hide(),
  copy: {
    fetchError: $trans('Error fetching budget'),
    created: $trans('Created'),
    createdDetail: $trans('Budget added'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Budget modified'),
    createError: $trans('Error handling budget'),
    updateError: $trans('Error handling budget'),
  },
})

const modalCurrency = computed(() => record.value?.amount_currency ?? mainStore.getDefaultCurrency)

function open(id: number | null) {
  editingId.value = id
  reset()
  modelModal.value?.show()
}

const showAddModal = () => open(null)
const showEditModal = (id: number) => open(id)

function priceChanged(dinero: ReturnType<typeof toDinero>) {
  values.value.amount = formatMoneyPlain(dinero)
}
</script>
