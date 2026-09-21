<template>
  <div class='panel col-1-3'>
    <h6>{{ $trans('Orders') }}</h6>
    <div class="branch-section section" v-if="!isCreate && hasBranchPartners">
      <div class='flex-columns space-between'>
        <p>
          {{ $trans('Customer has ') }} {{ values.num_orders }} {{ $trans('orders') }},
          {{ $trans('branch has') }} {{ selectedBranch ? selectedBranch.num_orders : '0' }} {{ $trans('orders') }}.
        </p>
        <BButton
          @click="syncOrders"
          type="button"
          variant="secondary"
          :disabled="syncingOrders"
          >
          <b-spinner v-if="syncingOrders" small></b-spinner>
          <IBiArrowRepeat v-else></IBiArrowRepeat>
          &nbsp; {{ $trans('Synchronize orders') }}
        </BButton>

      </div>
      <hr/>
      <details open>
        <summary class="flex-columns space-between">
          <h6>{{ $trans('branch') }} </h6><IBiChevronDown></IBiChevronDown>
        </summary>
        <BFormGroup
          label-size="sm"
          v-bind:label="$trans('Partner')"
          label-for="customer_branch_partners"
        >
          <BFormSelect
            id="customer_branch_partners"
            v-model="values.branch_partner"
            :options="branchPartners"
            size="sm"
          ></BFormSelect>
        </BFormGroup>

        <BFormGroup label="Branches" v-if="values.branch_partner !== null && branches.length > 0">
          <BFormRadio
            :key="branch.id"
            v-for="branch in branches"
            v-model="values.branch_id"
            name="branch"
            :value="branch.id"
          >
            {{ branch.name }} - {{ branch.city }} ({{ branch.country_code }})
          </BFormRadio>
        </BFormGroup>
        <hr>
        <BFormGroup v-if="values.branch_partner !== null" >
          <p class="flex-columns space-between align-items-center">
          {{ $trans("Branch not listed? Create from customer data.") }}
          <BButton @click="createBranchFromCustomer" type="button" variant="secondary">
            {{ $trans('Create') }}</BButton>
          </p>
        </BFormGroup>
        <hr>
        <BFormGroup
          label-size="sm"
          label-cols="4"
          v-bind:label="$trans('Use address from branch')"
          label-for="customer_use_branch_address"
        >
          <BFormCheckbox
            id="customer_use_branch_address"
            :value="true"
            v-model="values.use_branch_address"
          >
          </BFormCheckbox>
        </BFormGroup>
      </details>
    </div>

  </div>
</template>

<script lang="ts" setup>
import {
  companyPartnerBranchCreateFromCustomerCreateMutation,
  companyPartnerBranchesRetrieveOptions,
  companyPartnerBranchesRetrieveQueryKey,
  companyPartnerCopyCustomerOrdersCreateMutation,
  companyPartnerListOptions,
} from '@/api/@tanstack/vue-query.gen'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import type { CustomerFormValues } from './schemas'
import { WHOLE_COLLECTION_PAGE_SIZE } from '@/features/table'

const values = defineModel<CustomerFormValues>('values', { required: true })

const useBranchAddress = defineModel<boolean>('useBranchAddress', { required: true })

const props = defineProps<{
  isCreate: boolean
  customerId: number
}>()

const queryClient = useQueryClient()
const {create} = useToast()

// The partner dropdown must offer every partner, not the first page of them.
// 1000 is the API's own ceiling: `My24Pagination.max_page_size` (my24service
// `source/apps/core/rest.py:236`), which DRF clamps a larger value down to
// rather than rejecting it, so this is the most one response can carry.

const partnersQuery = useQuery(
  companyPartnerListOptions({query: {page: 1, page_size: WHOLE_COLLECTION_PAGE_SIZE}}),
)

const branchPartners = computed(() => {
  const partners = partnersQuery.data.value?.results ?? []
  return [
    {value: null as number | null, text: '-'},
    ...partners
      .filter((partner) => partner.partner_view.has_branches)
      .map((partner) => ({
        value: partner.id as number,
        text: `${partner.partner_view.companycode} - ${partner.partner_view.city}`,
      })),
  ]
})

const hasBranchPartners = computed(() => branchPartners.value.length > 1)

const branchesQuery = useQuery(() => ({
  ...companyPartnerBranchesRetrieveOptions({path: {id: values.value.branch_partner as number}}),

  enabled: values.value.branch_partner != null,
}))

const branches = computed(() => branchesQuery.data.value?.branches ?? [])

const selectedBranch = computed(() =>
  branches.value.find((branch) => branch.id === values.value.branch_id))

const addressFromBranch = computed(() => Boolean(
  hasBranchPartners.value &&
  values.value.branch_id !== null &&
  values.value.use_branch_address,
))

watch(
  addressFromBranch,
  (value) => {
    useBranchAddress.value = value
  },
  {immediate: true},
)

function invalidateBranches() {
  return queryClient.invalidateQueries({
    queryKey: companyPartnerBranchesRetrieveQueryKey(
      {path: {id: values.value.branch_partner as number}},
    ),
  })
}

const copyOrdersMutation = useMutation({
  ...companyPartnerCopyCustomerOrdersCreateMutation(),
  onSuccess: async () => {
    infoToast(create, $trans('Synced'), $trans('Orders synced'))
    await invalidateBranches()
  },
  onError: () => {
    errorToast(create, $trans('Error syncing orders'))
  },
})

const syncingOrders = ref(false)

async function syncOrders() {
  if (values.value.branch_partner == null) return
  syncingOrders.value = true
  try {
    await copyOrdersMutation.mutateAsync({
      path: {id: values.value.branch_partner},
      body: {customer_id: props.customerId},
    })
  } catch {

  }
  syncingOrders.value = false
}

const createBranchMutation = useMutation({
  ...companyPartnerBranchCreateFromCustomerCreateMutation(),
  onSuccess: async (result) => {

    values.value.branch_id = result.branch.id
    await invalidateBranches()
  },
})

async function createBranchFromCustomer() {
  if (values.value.branch_partner == null) return
  if (confirm($trans('Create branch from customer?'))) {
    await createBranchMutation.mutateAsync({
      path: {id: values.value.branch_partner},
      body: {customer_id: props.customerId},
    })
  }
}
</script>
