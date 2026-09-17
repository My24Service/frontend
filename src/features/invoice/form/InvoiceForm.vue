<template>
  <b-overlay :show="isLoading || saving" rounded="sm">
    <div class="app-page">

      <InvoicePDFViewer
        v-if="invoice"
        :invoice="invoice"
        :is-view="false"
        ref="invoice-viewer"
      />

      <header>
        <div class="page-title">
          <h3>
            <IBiReceiptCutoff></IBiReceiptCutoff>
            <router-link :to="{name: 'invoice-list'}">{{ $trans('Invoices') }}</router-link>
            /
            <span v-if="!isEdit">{{ $trans('New invoice') }} / {{ $trans('order') }} {{ bootstrap?.order_id }}</span>
            <span v-if="isEdit">{{ $trans('Update invoice') }} / {{ $trans('order') }} {{ bootstrap?.order_id }}</span>
            <span v-if="isEdit">
              <BLink class="btn btn-sm btn-primary" @click.prevent="showViewer" target="_blank">
                <IBiFileEarmark></IBiFileEarmark>
                {{ $trans('View Invoice') }}
              </BLink>
            </span>
            <span>
              <router-link v-if="bootstrap?.order_pk" class="btn btn-sm btn-primary"
                :to="{name: 'order-view', params: {pk: bootstrap.order_pk}}">
                <IBiArrowUpRightCircle></IBiArrowUpRightCircle>
                {{ $trans('Order') }}
              </router-link>
            </span>
          </h3>
          <BButton-toolbar>
            <BButton @click="cancelForm" type="button" variant="secondary">{{ $trans('Cancel') }}</BButton>
            <BButton id="save-invoice" :disabled="isLoading || saving || !bootstrap" @click="submitForm" type="button" variant="primary">{{ $trans('Save') }}</BButton>
          </BButton-toolbar>
        </div>
      </header>

      <b-form v-if="bootstrap && !isLoading" class="page-detail flex-columns" @submit.prevent>
        <div class="panel col-1-3">
          <div class="invoice-form-main">
            <h6>{{ $trans('Invoice recipient') }}</h6>
            <CustomerCard v-if="customer" :customer="customer" />
            <hr />
            <h6>{{ $trans('Invoice data') }}</h6>
            <BFormGroup :label="$trans('ID')" label-for="invoice_id" label-cols="5">
              <BFormInput disabled id="invoice_id" size="sm" v-model="draft.invoice_id" />
            </BFormGroup>
            <BFormGroup label-cols="5" :label="$trans('Reference')" label-for="invoice_reference">
              <BFormInput id="invoice_reference" size="sm" v-model="draft.reference" />
            </BFormGroup>
            <BFormGroup label-cols="5" :label="$trans('Term of payment')" label-for="invoice_term_of_payment_days">
              <b-input-group>
                <BFormInput id="invoice_term_of_payment_days" type="number" size="sm" v-model="draft.term_of_payment_days" />
                <template #append>
                  <b-input-group-text>{{ $trans('days') }}</b-input-group-text>
                </template>
              </b-input-group>
            </BFormGroup>
            <BFormGroup label-cols="5" :label="$trans('Description')" label-for="invoice_description">
              <BFormTextarea id="invoice_description" rows="1" v-model="draft.description" />
            </BFormGroup>
            <hr />
            <h6 class="total-text">{{ $trans('Invoice total') }}</h6>
            <TotalsInputs :total="totalDinero" :is-final-total="true" :vat="vatDinero" />
          </div>
        </div>

        <div class="panel col-2-3">
          <InvoiceLine
            ref="invoice-lines"
            :invoice-pk="pk"
            @invoice-lines-loaded="invoiceLinesLoaded"
            @update-invoice-totals="updateInvoiceTotals"
          />

          <details>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Manage prices') }}</h6>
              <IBiChevronDown></IBiChevronDown>
            </summary>
            <b-container fluid>
              <h5>{{ $trans("Materials") }}</h5>
              <b-row>
                <b-col cols="3" class="header">{{ $trans("Name") }}</b-col>
                <b-col cols="2" class="header">{{ $trans("Identifier") }}</b-col>
                <b-col cols="3" class="header ml-3">{{ $trans("Purchase price ex.") }}</b-col>
                <b-col cols="3" class="header">{{ $trans("Selling price ex.") }}</b-col>
                <b-col cols="1" />
              </b-row>
              <b-row v-for="material in materials" :key="material.id">
                <b-col cols="3">{{ material.name }}</b-col>
                <b-col cols="2">{{ material.identifier }}</b-col>
                <b-col cols="3">
                  <PriceInput v-model="material.price_purchase" :currency="currency" @price-changed="price => queueMaterialPrice(material, 'purchase', price)" />
                </b-col>
                <b-col cols="3">
                  <PriceInput v-model="material.price_selling" :currency="currency" @price-changed="price => queueMaterialPrice(material, 'selling', price)" />
                </b-col>
                <b-col cols="1">
                  <BButton v-if="!hasTeamleader" :disabled="materialUpdating" @click="updateMaterial(material.id)" class="btn" size="sm" variant="primary" :title="$trans('This will update the API')">
                    <b-spinner small v-if="materialUpdating" /> {{ $trans("Update") }}
                  </BButton>
                  <BButton v-else :disabled="linkingProduct" :variant="linkedProduct(material.id) ? 'success' : 'danger'" :title="$trans('Link material to product')" @click="openProductChooser(material)">
                    {{ $trans(linkedProduct(material.id) ? 'View' : 'Not yet linked') }}
                  </BButton>
                </b-col>
              </b-row>
            </b-container>

            <hr />
            <b-container fluid v-if="!hasTeamleader">
              <h5>{{ $trans("Engineers") }}</h5>
              <b-row>
                <b-col cols="7" class="header">{{ $trans("Name") }}</b-col>
                <b-col cols="4" class="header ml-3">{{ $trans("Hourly price") }}</b-col>
                <b-col cols="1" />
              </b-row>
              <b-row v-for="engineer in engineers" :key="engineer.id">
                <b-col cols="7">{{ engineer.full_name }}</b-col>
                <b-col cols="4">
                  <PriceInput v-model="engineer.engineer.hourly_rate" :currency="currency" @price-changed="price => queueEngineerPrice(engineer, price)" />
                </b-col>
                <b-col cols="1">
                  <BButton @click="updateEngineer(engineer.id)" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
                </b-col>
              </b-row>
            </b-container>

            <hr />
            <b-container fluid v-if="customer && !hasTeamleader">
              <h5>{{ $trans("Prices for customer") }}</h5>
              <b-row>
                <b-col cols="7" class="header">{{ $trans("Name") }}</b-col>
                <b-col cols="4" class="header ml-3">{{ $trans("Price") }}</b-col>
                <b-col cols="1" />
              </b-row>
              <b-row>
                <b-col cols="7">{{ $trans("Hourly rate engineer") }}</b-col>
                <b-col cols="4">
                  <PriceInput v-model="customer.hourly_rate_engineer" :currency="currency" @price-changed="price => queueCustomerPrice('hourly_rate_engineer', price)" />
                </b-col>
                <b-col cols="1">
                  <BButton @click="updateCustomer" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="7">{{ $trans("Call out costs") }}</b-col>
                <b-col cols="4">
                  <PriceInput v-model="customer.call_out_costs" :currency="currency" @price-changed="price => queueCustomerPrice('call_out_costs', price)" />
                </b-col>
                <b-col cols="1">
                  <BButton @click="updateCustomer" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
                </b-col>
              </b-row>
              <b-row>
                <b-col cols="7">{{ $trans("Price/KM") }}</b-col>
                <b-col cols="4">
                  <PriceInput v-model="customer.price_per_km" :currency="currency" @price-changed="price => queueCustomerPrice('price_per_km', price)" />
                </b-col>
                <b-col cols="1">
                  <BButton @click="updateCustomer" size="sm" variant="primary" :title="$trans('This will update the API')">{{ $trans("Update") }}</BButton>
                </b-col>
              </b-row>
            </b-container>
          </details>

          <details v-if="usedMaterials.length > 0">
            <summary class="flex-columns space-between">
              <h6>{{ $trans("Used materials") }}</h6>
              <IBiChevronDown></IBiChevronDown>
            </summary>
            <MaterialsPanel
              v-if="materials"
              :order_pk="bootstrap?.order_pk"
              :customer="customer"
              :material_models="materials"
              :engineer_models="engineers"
              :used_materials="usedMaterials"
              :teamleader-products="tlProducts"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
          </details>

          <div v-if="bootstrap?.order_pk">
            <HoursPanel
              v-if="totals?.work_total !== '00:00' && !isLoading"
              :order_pk="bootstrap.order_pk" type="work_hours"
              :hours_total="totals?.work_total"
              :teamleader-hours="teamleaderHours.work"
              :user_totals="totals?.user_totals"
              :engineer_models="engineers" :customer="customer"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
            <HoursPanel
              v-if="totals?.travel_total !== '00:00' && !isLoading"
              :order_pk="bootstrap.order_pk" type="travel_hours"
              :hours_total="totals?.travel_total"
              :teamleader-hours="teamleaderHours.travel"
              :user_totals="totals?.user_totals"
              :engineer_models="engineers" :customer="customer"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
            <DistancePanel
              v-if="(totals?.distance_total ?? 0) > 0 && !isLoading"
              :order_pk="bootstrap.order_pk" :customer="customer"
              :user_totals="totals?.user_totals"
              :engineer_models="engineers"
              :distance_total="totals?.distance_total"
              :invoice_default_price_per_km="bootstrap?.invoice_default_price_per_km"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
            <HoursPanel
              v-if="totals?.extra_work_total !== '00:00' && !isLoading"
              :order_pk="bootstrap.order_pk" type="extra_work"
              :hours_total="totals?.extra_work_total"
              :user_totals="totals?.user_totals"
              :engineer_models="engineers" :customer="customer"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
            <HoursPanel
              v-if="totals?.actual_work_total !== '00:00' && !isLoading"
              :order_pk="bootstrap.order_pk" type="actual_work"
              :hours_total="totals?.actual_work_total"
              :user_totals="totals?.user_totals"
              :engineer_models="engineers" :customer="customer"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
          </div>

          <details v-if="bootstrap?.order_pk">
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Call out costs') }}</h6>
              <IBiChevronDown></IBiChevronDown>
            </summary>
            <CallOutCostsPanel
              v-if="!isLoading"
              :order_pk="bootstrap.order_pk" :customer="customer"
              :invoice_default_call_out_costs="bootstrap?.invoice_default_call_out_costs"
              :invoice-lines-parent="invoiceLines"
              @invoice-lines-created="invoiceLinesCreated"
              @empty-collection-clicked="emptyCollectionClicked"
            />
            <br />
          </details>
        </div>
      </b-form>
      <TeamleaderProductChooser v-if="hasTeamleader && chosenMaterial" ref="product-chooser" :key="chosenMaterial.id" :material="chosenMaterial" @product-chosen="productChosen" @product-created-linked="productCreatedLinked" />
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { parse } from 'valibot'
import {
  customerCustomerRetrieveOptions,
  teamleaderConfigRetrieveOptions,
  teamleaderProductDetailRetrieveOptions,
  teamleaderTaxRateListOptions,
  teamleaderTlProductCreateCreateMutation,
  teamleaderTlProductListListOptions,
  invoiceInvoiceCreateMutation,
  invoiceInvoiceDataRetrieveOptions,
  invoiceInvoicePartialUpdateMutation,
  invoiceInvoiceRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Customer, Invoice, InvoiceDataResponse, InvoiceRequest } from '@/api/types.gen'
import { vInvoiceRequest, vProductRequest } from '@/api/valibot.gen'
import { useToast } from 'bootstrap-vue-next'
import TeamleaderProductChooser from '@/components/TeamleaderProductChooser.vue'
import CustomerCard from '@/components/CustomerCard.vue'
import PriceInput from '@/components/PriceInput.vue'
import TotalsInputs from '@/components/TotalsInputs.vue'
import InvoicePDFViewer from '@/features/invoice/pdf/InvoicePDFViewer.vue'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { toDinero } from '@/services/money'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { hasAccessToModule } from '@/utils'
import { useMainStore } from '@/stores/main'
import { usePricingUpdates } from './use-customer-prices'
import type { InvoiceLineDraft } from './calculations'
import InvoiceLine from './panels/InvoiceLinePanel.vue'
import HoursPanel from './panels/HoursPanel.vue'
import DistancePanel from './panels/DistancePanel.vue'
import MaterialsPanel from './panels/MaterialsPanel.vue'
import CallOutCostsPanel from './panels/CallOutCostsPanel.vue'

const props = defineProps<{ uuid?: string | null; pk?: string | number | null }>()
const isEdit = computed(() => Boolean(props.pk))
const { create } = useToast()
const router = useRouter()
const queryClient = useQueryClient()
const mainStore = useMainStore()
const currency = mainStore.getDefaultCurrency
type Money = ReturnType<typeof toDinero>
const viewer = useTemplateRef<{ show: () => void }>('invoice-viewer')
const invoiceLinesPanel = useTemplateRef<InstanceType<typeof InvoiceLine>>('invoice-lines')
const saving = ref(false)
const materialUpdating = ref(false)
const invoice = ref<Invoice | null>(null)
const invoiceLines = ref<{ type?: string }[]>([])
const materials = ref<InvoiceDataResponse['material_models']>([])
const engineers = ref<InvoiceDataResponse['engineer_models']>([])
const customer = ref<Customer | null>(null)
const totalDinero = ref(toDinero(0, currency))
const vatDinero = ref(toDinero(0, currency))
const draft = ref({ invoice_id: '', reference: null as string | null, description: null as string | null, term_of_payment_days: mainStore.getInvoiceDefaultTermOfPaymentDays })
const invoiceQuery = useQuery(() => ({ ...invoiceInvoiceRetrieveOptions({ path: { id: Number(props.pk) } }), enabled: isEdit.value, refetchOnWindowFocus: false }))
const bootstrapQuery = useQuery(() => ({ ...invoiceInvoiceDataRetrieveOptions({ path: { id: props.uuid || invoice.value?.order_uuid || '' } }), enabled: Boolean(props.uuid || invoice.value?.order_uuid), refetchOnWindowFocus: false }))
const bootstrap = computed(() => bootstrapQuery.data.value)
const customerQuery = useQuery(() => ({ ...customerCustomerRetrieveOptions({ path: { id: bootstrap.value?.customer_pk ?? 0 } }), enabled: Boolean(bootstrap.value?.customer_pk), refetchOnWindowFocus: false }))
const isLoading = computed(() => bootstrapQuery.isLoading.value || invoiceQuery.isLoading.value || customerQuery.isLoading.value || teamleaderConfigQuery.isLoading.value || tlProductsQuery.isLoading.value)
useQueryErrorToast(bootstrapQuery.error, $trans('Error loading invoice data'))
useQueryErrorToast(invoiceQuery.error, $trans('Error loading invoice'))
useQueryErrorToast(customerQuery.error, $trans('Error loading customer'))
watch(invoiceQuery.data, record => {
  if (!record) return
  invoice.value = record
  draft.value = { invoice_id: record.invoice_id ?? '', reference: record.reference ?? null, description: record.description ?? null, term_of_payment_days: record.term_of_payment_days ?? mainStore.getInvoiceDefaultTermOfPaymentDays }
}, { immediate: true })
watch(bootstrap, data => {
  if (!data) return
  materials.value = data.material_models.map(record => ({ ...record }))
  engineers.value = data.engineer_models.map(record => ({ ...record, engineer: { ...record.engineer } }))
  if (!isEdit.value && !invoice.value) {
    draft.value.invoice_id = String(data.invoice_id)
    draft.value.reference = data.order_reference
  }
}, { immediate: true })
watch(customerQuery.data, data => { customer.value = data ? { ...data } : null }, { immediate: true })
const usedMaterials = ref<InvoiceDataResponse['used_materials']>([])
watch(bootstrap, data => { usedMaterials.value = (data?.used_materials ?? []).map(row => ({ ...row })) }, { immediate: true })
const totals = computed(() => bootstrap.value?.activity_totals)
const hasTeamleader = computed(() => hasAccessToModule('company', 'teamleader'))
const teamleaderConfigQuery = useQuery(() => ({
  ...teamleaderConfigRetrieveOptions(),
  enabled: hasTeamleader.value,
  refetchOnWindowFocus: false,
}))
const tlProductsQuery = useQuery(() => ({
  ...teamleaderTlProductListListOptions({ query: { ids: materials.value.map(material => material.id).join(',') } }),
  enabled: hasTeamleader.value && materials.value.length > 0,
  refetchOnWindowFocus: false,
}))
// Null keeps ordinary material pricing controls available outside Teamleader tenants.
const tlProducts = computed(() => hasTeamleader.value ? tlProductsQuery.data.value ?? [] : null)
const teamleaderHours = computed(() => {
  const config = hasTeamleader.value ? teamleaderConfigQuery.data.value?.json_data : undefined
  const rate = (key: string) => {
    const value = config?.[key]
    return (typeof value === 'string' || typeof value === 'number') && String(value).trim() !== '' && Number.isFinite(Number(value))
      ? { selling_price: String(value) }
      : null
  }
  return { work: rate('workhours_product_selling_price'), travel: rate('travel_hours_product_selling_price') }
})
useQueryErrorToast(teamleaderConfigQuery.error, $trans('Error loading Teamleader settings'))
useQueryErrorToast(tlProductsQuery.error, $trans('Error loading Teamleader products'))
const chosenMaterial = ref<InvoiceDataResponse['material_models'][number] | null>(null)
const chooser = useTemplateRef<{ show: () => Promise<void>; hide: () => void; showSearchMode: () => void }>('product-chooser')
const linkingProduct = ref(false)
const linkMutation = useMutation(teamleaderTlProductCreateCreateMutation())
function linkedProduct(materialId: number) {
  return tlProducts.value?.find(product => product.material.id === materialId)
}
async function openProductChooser(material: InvoiceDataResponse['material_models'][number]) {
  chosenMaterial.value = material
  await nextTick()
  chooser.value?.showSearchMode()
  await chooser.value?.show()
}
async function refreshLinkedProducts() {
  await tlProductsQuery.refetch({ throwOnError: true })
  chooser.value?.hide()
}
async function productChosen(product: { id: string }) {
  const material = chosenMaterial.value
  if (!material || linkingProduct.value) return
  linkingProduct.value = true
  try {
    const [detail, taxes] = await Promise.all([
      queryClient.fetchQuery(teamleaderProductDetailRetrieveOptions({ query: { id: product.id } })),
      queryClient.fetchQuery(teamleaderTaxRateListOptions()),
    ])
    const tax = detail.tax
    if (!tax || typeof tax !== 'object' || !('id' in tax)) throw new Error('Missing product tax')
    const taxRate = taxes.results?.find(rate => rate.uuid === tax.id)
    if (!taxRate) throw new Error('Unknown product tax')
    const price = (key: string) => {
      const money = detail[key]
      if (!money || typeof money !== 'object' || !('amount' in money) || !('currency' in money)) throw new Error('Missing product price')
      if (money.currency !== currency) throw new Error('Product currency does not match invoice currency')
      if ((typeof money.amount !== 'string' && typeof money.amount !== 'number') || !Number.isFinite(Number(money.amount))) throw new Error('Invalid product price')
      return String(money.amount)
    }
    const body = parse(vProductRequest, { material: material.id, uuid: product.id,
      purchase_price: price('purchase_price'), selling_price: price('selling_price'), tax_percentage: taxRate.rate })
    await linkMutation.mutateAsync({ body })
    await refreshLinkedProducts()
  } catch {
    errorToast(create, $trans('Error linking Teamleader product'))
  } finally { linkingProduct.value = false }
}
async function productCreatedLinked() {
  // The shared chooser already persisted this product and material link.
  try { await refreshLinkedProducts() }
  catch { errorToast(create, $trans('Error loading Teamleader products')) }
}
const createInvoice = useMutation(invoiceInvoiceCreateMutation())
const patchInvoice = useMutation(invoiceInvoicePartialUpdateMutation())
const { updateCustomerPrices, updateEngineerRate, updateMaterialPrices } = usePricingUpdates()
const materialPrices = ref<Record<number, { price_purchase?: string; price_selling?: string }>>({})
const engineerPrices = ref<Record<number, string>>({})
const customerPrices = ref<{ hourly_rate_engineer?: string; call_out_costs?: string; price_per_km?: string }>({})
function queueMaterialPrice(material: { id: number }, kind: 'purchase' | 'selling', price: Money) {
  const key = kind === 'purchase' ? 'price_purchase' : 'price_selling'
  materialPrices.value[material.id] = { ...materialPrices.value[material.id], [key]: price.toFormat('0.00') }
}
function queueEngineerPrice(engineer: { id: number }, price: Money) { engineerPrices.value[engineer.id] = price.toFormat('0.00') }
function queueCustomerPrice(field: keyof typeof customerPrices.value, price: Money) { customerPrices.value[field] = price.toFormat('0.00') }
async function updateMaterial(id: number) {
  materialUpdating.value = true
  try { if (await updateMaterialPrices(id, materialPrices.value[id] ?? {})) delete materialPrices.value[id] }
  finally { materialUpdating.value = false }
}
async function updateEngineer(id: number) { if (await updateEngineerRate(id, engineerPrices.value[id])) delete engineerPrices.value[id] }
async function updateCustomer() { if (await updateCustomerPrices(customer.value?.id, customerPrices.value)) customerPrices.value = {} }
function showViewer() { viewer.value?.show() }
function cancelForm() { router.go(-1) }
function invoiceLinesLoaded(lines: { type?: string }[]) { invoiceLines.value = lines }
function updateInvoiceTotals([total, vat]: [string, string]) {
  totalDinero.value = toDinero(total, currency)
  vatDinero.value = toDinero(vat, currency)
}
function invoiceLinesCreated(lines: InvoiceLineDraft[]) { invoiceLinesPanel.value?.addInvoiceLines(lines) }
function emptyCollectionClicked(type: string) { invoiceLinesPanel.value?.removeInvoiceLines(type) }
function invoiceRequestBody(): InvoiceRequest {
  return parse(vInvoiceRequest, {
    order: bootstrap.value?.order_pk,
    ...draft.value,
    term_of_payment_days: Number(draft.value.term_of_payment_days),
    vat_type: invoice.value?.vat_type ?? String(mainStore.getInvoiceDefaultVat),
    total: totalDinero.value.toFormat('0.00'),
    vat: vatDinero.value.toFormat('0.00'),
  })
}
async function submitForm() {
  if (saving.value || isLoading.value || !bootstrap.value || !invoiceLinesPanel.value || invoiceQuery.isError.value || customerQuery.isError.value) return
  saving.value = true
  try {
    const body = invoiceRequestBody()
    // Retain a successfully created invoice when line persistence fails; retry
    // updates that invoice instead of issuing another invoice POST.
    if (invoice.value) invoice.value = await patchInvoice.mutateAsync({ path: { id: invoice.value.id }, body })
    else invoice.value = await createInvoice.mutateAsync({ body })
    await invoiceLinesPanel.value.saveCollection(invoice.value.id)
    await queryClient.invalidateQueries({ queryKey: [{ _id: 'invoiceInvoiceList' }], refetchType: 'none' })
    infoToast(create, $trans(isEdit.value ? 'Updated' : 'Created'), $trans(isEdit.value ? 'Invoice has been updated' : 'Invoice has been created'))
    if (!isEdit.value) await router.push({ name: 'invoice-edit', params: { pk: invoice.value.id, uuid: props.uuid || invoice.value.order_uuid } })
  } catch {
    errorToast(create, $trans(isEdit.value ? 'Error updating invoice' : 'Error creating invoice'))
  } finally { saving.value = false }
}
</script>
