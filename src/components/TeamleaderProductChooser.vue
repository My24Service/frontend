<template>
  <BModal
    id="modal"
    ref="modal"
    :title="$trans('Link product')"
    ok-only
    @ok="hide"
    ok-title="Annuleer"
    ok-variant="secondary"
  >
    <div v-if="showDetails && product && 'product_category_detail' in product">
      <div>
        <h3>{{ product.name }} {{ $trans('details') }}</h3>
        <dl>
          <dt>{{ $trans('Name') }}</dt>
          <dd>{{ product.name }}</dd>
          <dt>{{ $trans('Code') }}</dt>
          <dd>{{ product.code }}</dd>
          <dt>{{ $trans('Description') }}</dt>
          <dd>{{ product.description }}</dd>
          <dt>{{ $trans('Account') }}</dt>
          <dd>{{ product.product_category_detail.name }}</dd>
          <dt>{{ $trans('Purchase price') }}</dt>
          <dd>{{ product.purchase_price ? product.purchase_price.currency : '-' }} {{ product.purchase_price? product.purchase_price.amount : '-' }}</dd>
          <dt>{{ $trans('Sales price') }}</dt>
          <dd>{{ product.selling_price? product.selling_price.currency : '-' }} {{ product.selling_price ? product.selling_price.amount : '-' }}</dd>
          <dt>{{ $trans('VAT rate') }}</dt>
          <dd>{{ product.tax_detail.rate }}</dd>
          <dt>{{ $trans('Created') }}</dt>
          <dd>{{ product.added_at }}</dd>
          <dt>{{ $trans('Modified') }}</dt>
          <dd>{{ product.updated_at }}</dd>
        </dl>
      </div>
    </div>
    <div v-else-if="showForm && product && 'tax_rate_id' in product">
      <h3>{{ $trans('New Teamleader product') }}</h3>
      <form v-if="product">
        <BFormGroup
          :label="$trans('Name')"
          label-for="name-input"
          :invalid-feedback="$trans('Name is required')"
          :state="isSubmitClicked ? !v$.product.name.$error : null"
        >
          <BFormInput
            id="name-input"
            :autofocus="true"
            v-model="product.name"
            :state="isSubmitClicked ? !v$.product.name.$error : null"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          :label="$trans('Code')"
          label-for="code-input"
        >
          <BFormInput
            id="code-input"
            v-model="product.code"
          ></BFormInput>
        </BFormGroup>
        <BFormGroup
          :label="$trans('Description')"
          label-for="description-input"
        >
          <BFormInput
            id="description-input"
            v-model="product.description"
          ></BFormInput>
        </BFormGroup>
        <BRow>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('Purchase price')"
              label-for="purchase_price-input"
            >
              <PriceInput
                id="purchase_price-input"
                v-model="product.purchase_price"
                currency="EUR"
              />
            </BFormGroup>
          </BCol>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('Sales price')"
              label-for="selling_price-input"
            >
              <PriceInput
                id="selling_price-input"
                v-model="product.selling_price"
                currency="EUR"
              ></PriceInput>
            </BFormGroup>
          </BCol>
          <BCol cols="4">
            <BFormGroup
              :label="$trans('VAT rate')"
              label-for="tax_rate_uuid-input"
            >
              <BFormSelect
                id="tax_rate_uuid-input"
                v-model="product.tax_rate_id"
                :options="taxRates"
                size="sm"
              ></BFormSelect>
            </BFormGroup>
          </BCol>
        </BRow>
        <div class='flex-columns align-items-center justify-content-center'>
          <BButton
            @click="createLinkProduct"
            variant="primary"
          >{{ $trans('Create') }}</BButton>
        </div>
      </form>
    </div>
    <div v-else>
      <BForm @submit.stop.prevent="doSearch">
        <BRow>
          <BCol cols="8">
            <BInput
              autofocus
              size="sm"
              v-model="query"
            />
          </BCol>
          <BCol cols="2">
            <BButton
              @click="doSearch"
              type="submit"
            >{{ $trans('Search') }}</BButton>
          </BCol>
        </BRow>
      </BForm>

      <BTable
        id="products-table"
        small
        :fields="fields"
        :items="products"
        :hover="true"
        responsive="md"
        tbody-tr-class="tr-pointer"
        @row-clicked="onRowClicked"
      >
        <template #cell(id)="data">
          <BButton
            @click="() => showDetail(data.item.id)"
          >
            {{ $trans('Details') }}
          </BButton>
        </template>
      </BTable>
      <div
        v-if="withCreateButton"
        class='flex-columns align-items-center justify-content-center'
      >
        <BButton
          @click="newTeamleaderProduct"
          variant="primary"
        >{{ $trans('Add new Teamleader product') }}</BButton>
      </div>
    </div>
  </BModal>
</template>
<script setup lang="ts">
import { BInput, BModal } from 'bootstrap-vue-next'
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import { useLoading } from 'vue-loading-overlay'

import PriceInput from '@/components/PriceInput.vue'
import { TeamleaderService } from '@/models/company/Teamleader'
import { $trans, errorToast } from '@/services/i18n'
import { useMainStore } from '@/stores/main'

interface ChooserMaterial {
  id: number
  name?: string | null
  identifier?: string | null
  description?: string | null
  price_purchase_ex: string
  price_selling_ex: string
}

interface TaxRateResponse {
  uuid: string
  rate: string
  description: string
}

interface TeamleaderProductSummary {
  id: string
  name: string
  code: string
  description: string
}

interface TeamleaderProductDetail {
  name: string
  code: string
  description: string
  product_category_detail: { name: string }
  purchase_price: { amount: string; currency: string } | null
  selling_price: { amount: string; currency: string } | null
  tax_detail: { rate: string }
  added_at: string
  updated_at: string
}

interface TeamleaderProductDraft {
  name: string
  code: string | null
  description: string | null
  tax_rate_id: string
  purchase_price: string
  selling_price: string
  material: number
}

type TeamleaderProduct = TeamleaderProductDetail | TeamleaderProductDraft

interface TaxRateOption {
  value: string
  text: string
}

const props = withDefaults(defineProps<{
  material?: ChooserMaterial
  withCreateButton?: boolean
}>(), {
  withCreateButton: true,
})

const emit = defineEmits<{
  (e: 'product-chosen', product: TeamleaderProductSummary): void
  (e: 'product-created-linked', materialId: number): void
}>()

const { create } = useToast()
const loading = useLoading()
const mainStore = useMainStore()
const service = new TeamleaderService()

const modal = ref<InstanceType<typeof BModal> | null>(null)
const products = ref<TeamleaderProductSummary[]>([])
const fields = [
  {key: 'name', label: $trans('Name')},
  {key: 'description', label: $trans('Description')},
  {key: 'code', label: $trans('Code')},
  {key: 'id', label: ''},
]
const query = ref<string | null>(null)
const showForm = ref(false)
const showDetails = ref(false)
const showSearch = ref(true)
const product = ref<TeamleaderProduct | null>(null)
const isSubmitClicked = ref(false)
const taxRates = ref<TaxRateOption[]>([])

const rules = {
  product: {
    name: {
      required,
    },
  },
}

const v$ = useVuelidate(rules, { product })

function showFormMode() {
  showForm.value = true
  showSearch.value = false
  showDetails.value = false
}

function showDetailMode() {
  showForm.value = false
  showSearch.value = false
  showDetails.value = true
}

function showSearchMode() {
  showForm.value = false
  showSearch.value = true
  showDetails.value = false
}

async function showDetail(id: string) {
  const loader = loading.show()
  try {
    product.value = await service.fetchProductDetail(id)
    showDetailMode()
    loader.hide()
  } catch (e) {
    console.error('error fetching product details', e)
    loader.hide()
  }
}

async function doSearch() {
  await loadData()
}

function onRowClicked(item: TeamleaderProductSummary) {
  emit('product-chosen', item)
}

async function newTeamleaderProduct() {
  await service.configDetail()
  const response = await service.fetchTaxRates()
  taxRates.value = response.results.map((rate: TaxRateResponse) => {
    return {
      value: rate.uuid,
      text: `${rate.description} (${rate.rate})`
    }
  })
  const defaultRate = response.results.find((rate: TaxRateResponse) => rate.rate === '0.21')
  product.value = {
    name: props.material?.name ?? '',
    code: props.material?.identifier ?? null,
    description: props.material?.description ?? null,
    tax_rate_id: defaultRate.uuid,
    purchase_price: props.material?.price_purchase_ex ?? '',
    selling_price: props.material?.price_selling_ex ?? '',
    material: props.material?.id ?? 0,
  }
  showFormMode()
}

async function createLinkProduct() {
  // New products are priced in the tenant default, like every other price
  // the client sends without an explicit currency choice.
  const currency = mainStore.getDefaultCurrency
  const createData = {
    ...product.value,
    purchase_price_currency: currency,
    selling_price_currency: currency,
  }

  try {
    const response = await service.createLinkProduct(createData)
    if (!response['is_ok']) {
      errorToast(create, 'Fout aanmaken van het product in Teamleader')
      return
    }

    const materialId = response['material']
    emit('product-created-linked', materialId)
  } catch (error) {
    console.error('error in create/link', error)
  }
}

async function loadData() {
  const loader = loading.show()
  try {
    products.value = await service.fetchProducts(query.value)
    loader.hide()
  } catch (error) {
    console.error('error fetching products', error)
    errorToast(create, 'Fout bij het ophalen van de producten')
    loader.hide()
  }
}

async function show() {
  await modal.value?.show()
  if (props.material && props.material.name) {
    query.value = props.material.name.trim()
  }
  showForm.value = false
}

function hide() {
  modal.value?.hide()
}

defineExpose({
  show,
  hide,
  showSearchMode,
})
</script>
<style scoped>

</style>
