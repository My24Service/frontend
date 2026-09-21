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

          <ManagePricesPanel
            :materials="materials"
            :currency="currency"
            :teamleader-products="tlProducts"
            :linking-product="linkingProduct"
            @link-material="openProductChooser"
          />

          <details v-if="usedMaterials.length > 0">
            <summary class="flex-columns space-between">
              <h6>{{ $trans("Used materials") }}</h6>
              <IBiChevronDown></IBiChevronDown>
            </summary>
            <MaterialsPanel
              v-if="materials"
              :material_models="materials"
              :used_materials="usedMaterials"
              :teamleader-products="tlProducts"
            />
          </details>

          <div v-if="bootstrap?.order_pk">
            <HoursPanel
              v-if="totals?.work_total !== '00:00' && !isLoading"
              type="work_hours"
              :hours_total="totals?.work_total"
              :teamleader-hours="teamleaderHours.work"
              :user_totals="totals?.user_totals"
            />
            <HoursPanel
              v-if="totals?.travel_total !== '00:00' && !isLoading"
              type="travel_hours"
              :hours_total="totals?.travel_total"
              :teamleader-hours="teamleaderHours.travel"
              :user_totals="totals?.user_totals"
            />
            <DistancePanel
              v-if="(totals?.distance_total ?? 0) > 0 && !isLoading"
              :user_totals="totals?.user_totals"
              :distance_total="totals?.distance_total"
              :invoice_default_price_per_km="bootstrap?.invoice_default_price_per_km"
            />
            <HoursPanel
              v-if="totals?.extra_work_total !== '00:00' && !isLoading"
              type="extra_work"
              :hours_total="totals?.extra_work_total"
              :user_totals="totals?.user_totals"
            />
            <HoursPanel
              v-if="totals?.actual_work_total !== '00:00' && !isLoading"
              type="actual_work"
              :hours_total="totals?.actual_work_total"
              :user_totals="totals?.user_totals"
            />
          </div>

          <details v-if="bootstrap?.order_pk">
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Call out costs') }}</h6>
              <IBiChevronDown></IBiChevronDown>
            </summary>
            <CallOutCostsPanel
              v-if="!isLoading"
              :invoice_default_call_out_costs="bootstrap?.invoice_default_call_out_costs"
            />
            <br />
          </details>
        </div>
      </b-form>
      <TeamleaderProductChooser
        v-if="hasTeamleader && chosenMaterial"
        ref="product-chooser"
        :key="chosenMaterial.id"
        :material="chosenMaterial"
        @product-chosen="productChosen"
        @product-created-linked="productCreatedLinked"
      />
    </div>
  </b-overlay>
</template>

<script setup lang="ts">
import { parse } from 'valibot'
import {
  customerCustomerRetrieveOptions,
  invoiceInvoiceCreateMutation,
  invoiceInvoiceDataRetrieveOptions,
  invoiceInvoicePartialUpdateMutation,
  invoiceInvoiceRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { Customer, Invoice, InvoiceDataResponse, InvoiceRequest } from '@/api/types.gen'
import { vInvoiceRequest } from '@/api/valibot.gen'
import { CustomerCard } from '@/features/customer'
import { useQueryErrorToast } from '@/features/forms'
import { InvoicePDFViewer } from '@/features/invoice/pdf'
import { errorToast, infoToast, $trans } from '@/services/i18n'
import { formatMoneyPlain, toDinero } from '@/services/money'
import { useMainStore } from '@/stores/main'
import type { InvoiceLineDraft, InvoiceLineType } from './calculations'
import { provideCostPanelContext } from './cost-panel-context'
import { useTeamleaderProducts, type ProductChooserHandle } from './use-teamleader-products'
import { CallOutCostsPanel } from '@/features/invoice/form/panels'
import { DistancePanel } from '@/features/invoice/form/panels'
import { HoursPanel } from '@/features/invoice/form/panels'
import { InvoiceLinePanel as InvoiceLine } from '@/features/invoice/form/panels'
import { ManagePricesPanel } from '@/features/invoice/form/panels'
import { MaterialsPanel } from '@/features/invoice/form/panels'

/**
 * The invoice create/edit form.
 *
 * What is its own: the invoice header fields (`draft`), the invoice record and
 * its totals, and the save. What it delegates:
 *
 * - the invoice lines and their persistence to `InvoiceLinePanel`, which the
 *   form drives through its exposed handle (add lines from a cost panel, drop
 *   the lines of a cost type, save them once the invoice has an id);
 * - the order's costs to the cost panels (hours, distance, call-out costs, used
 *   materials), each owning one `useCostCollection`; what they all read from
 *   the form and the two callbacks they hand lines back through are provided
 *   once as the `CostPanelContext`;
 * - the tenant's material prices to `ManagePricesPanel`;
 * - the Teamleader integration to `useTeamleaderProducts`, which also drives
 *   the product chooser mounted at the bottom of this template.
 *
 * It does not use `useResourceForm`, deliberately. The create is two-phase -
 * POST the invoice, then save the lines against its new id, then navigate to
 * the edit route - and a failure between the phases has to keep the created
 * invoice so the retry PATCHes instead of POSTing again. The bootstrap read is
 * also keyed on the *order* uuid rather than the invoice pk, on a create as well
 * as on an edit (where the uuid comes off the loaded invoice). Neither fits the
 * one-record read/write shape that composable provides.
 */
const props = defineProps<{
  /** The order uuid the invoice is for; a create has this and no pk. */
  uuid?: string | null
  /** The invoice pk on an edit. */
  pk?: string | number | null
}>()

const isEdit = computed(() => Boolean(props.pk))
const { create } = useToast()
const router = useRouter()
const queryClient = useQueryClient()
const mainStore = useMainStore()
const currency = mainStore.getDefaultCurrency

const viewer = useTemplateRef<{ show: () => void }>('invoice-viewer')
const invoiceLinesPanel = useTemplateRef<InstanceType<typeof InvoiceLine>>('invoice-lines')
const chooser = useTemplateRef<ProductChooserHandle>('product-chooser')

const saving = ref(false)
/** The saved invoice: loaded on an edit, or the POST result once a create has one. */
const invoice = ref<Invoice | null>(null)
/** The lines the line panel currently holds; the cost panels use it to hide "create lines" for a type already added. */
const invoiceLines = ref<{ type?: string }[]>([])
// Own copies of the bootstrap rows: the Manage-prices panel edits the materials in place.
const materials = ref<InvoiceDataResponse['material_models']>([])
const engineers = ref<InvoiceDataResponse['engineer_models']>([])
const usedMaterials = ref<InvoiceDataResponse['used_materials']>([])
const customer = ref<Customer | null>(null)
const totalDinero = ref(toDinero(0, currency))
const vatDinero = ref(toDinero(0, currency))

const draft = ref({
  invoice_id: '',
  reference: null as string | null,
  description: null as string | null,
  term_of_payment_days: mainStore.getInvoiceDefaultTermOfPaymentDays,
})

const invoiceQuery = useQuery(() => ({
  ...invoiceInvoiceRetrieveOptions({ path: { id: Number(props.pk) } }),
  enabled: isEdit.value,
  refetchOnWindowFocus: false,
}))
// Keyed on the order uuid: the route carries it on a create, the loaded
// invoice on an edit.
const bootstrapQuery = useQuery(() => ({
  ...invoiceInvoiceDataRetrieveOptions({ path: { id: props.uuid || invoice.value?.order_uuid || '' } }),
  enabled: Boolean(props.uuid || invoice.value?.order_uuid),
  refetchOnWindowFocus: false,
}))
const bootstrap = computed(() => bootstrapQuery.data.value)
const customerQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({ path: { id: bootstrap.value?.customer_pk ?? 0 } }),
  enabled: Boolean(bootstrap.value?.customer_pk),
  refetchOnWindowFocus: false,
}))
useQueryErrorToast(bootstrapQuery.error, $trans('Error loading invoice data'))
useQueryErrorToast(invoiceQuery.error, $trans('Error loading invoice'))
useQueryErrorToast(customerQuery.error, $trans('Error loading customer'))

const teamleader = useTeamleaderProducts({
  materials: () => materials.value,
  currency,
  chooser: () => chooser.value,
})
const {
  hasTeamleader, tlProducts, teamleaderHours, chosenMaterial, linkingProduct,
  openProductChooser, productChosen, productCreatedLinked,
} = teamleader

const isLoading = computed(() =>
  bootstrapQuery.isLoading.value
  || invoiceQuery.isLoading.value
  || customerQuery.isLoading.value
  || teamleader.isLoading.value,
)

watch(invoiceQuery.data, record => {
  if (!record) return
  invoice.value = record
  draft.value = {
    invoice_id: record.invoice_id ?? '',
    reference: record.reference ?? null,
    description: record.description ?? null,
    term_of_payment_days: record.term_of_payment_days ?? mainStore.getInvoiceDefaultTermOfPaymentDays,
  }
}, { immediate: true })

watch(bootstrap, data => {
  if (!data) return
  materials.value = data.material_models.map(record => ({ ...record }))
  engineers.value = data.engineer_models.map(record => ({ ...record, engineer: { ...record.engineer } }))
  usedMaterials.value = data.used_materials.map(row => ({ ...row }))
  // A create takes its id and reference from the order; an edit keeps the invoice's.
  if (!isEdit.value && !invoice.value) {
    draft.value.invoice_id = String(data.invoice_id)
    draft.value.reference = data.order_reference
  }
}, { immediate: true })

watch(customerQuery.data, data => {
  customer.value = data ? { ...data } : null
}, { immediate: true })

const totals = computed(() => bootstrap.value?.activity_totals)

const createInvoice = useMutation(invoiceInvoiceCreateMutation())
const patchInvoice = useMutation(invoiceInvoicePartialUpdateMutation())

function showViewer() {
  viewer.value?.show()
}

function cancelForm() {
  router.go(-1)
}

function invoiceLinesLoaded(lines: { type?: string }[]) {
  invoiceLines.value = lines
}

function updateInvoiceTotals([total, vat]: [string, string]) {
  totalDinero.value = toDinero(total, currency)
  vatDinero.value = toDinero(vat, currency)
}

function invoiceLinesCreated(lines: InvoiceLineDraft[]) {
  invoiceLinesPanel.value?.addInvoiceLines(lines)
}

function emptyCollectionClicked(type: Exclude<InvoiceLineType, 'manual'>) {
  invoiceLinesPanel.value?.removeInvoiceLines(type)
}

provideCostPanelContext({
  orderPk: computed(() => bootstrap.value?.order_pk),
  engineers,
  invoiceLines,
  invoiceLinesCreated,
  emptyCollectionClicked,
})

function invoiceRequestBody(): InvoiceRequest {
  return parse(vInvoiceRequest, {
    order: bootstrap.value?.order_pk,
    ...draft.value,
    term_of_payment_days: Number(draft.value.term_of_payment_days),
    vat_type: invoice.value?.vat_type ?? String(mainStore.getInvoiceDefaultVat),
    total: formatMoneyPlain(totalDinero.value),
    vat: formatMoneyPlain(vatDinero.value),
  })
}

async function submitForm() {
  const blocked = saving.value
    || isLoading.value
    || !bootstrap.value
    || !invoiceLinesPanel.value
    || invoiceQuery.isError.value
    || customerQuery.isError.value
  if (blocked) return
  saving.value = true
  try {
    const body = invoiceRequestBody()
    // Retain a successfully created invoice when line persistence fails; retry
    // updates that invoice instead of issuing another invoice POST.
    if (invoice.value) {
      invoice.value = await patchInvoice.mutateAsync({ path: { id: invoice.value.id }, body })
    } else {
      invoice.value = await createInvoice.mutateAsync({ body })
    }
    await invoiceLinesPanel.value.saveCollection(invoice.value.id)
    await queryClient.invalidateQueries({ queryKey: [{ _id: 'invoiceInvoiceList' }], refetchType: 'none' })
    infoToast(
      create,
      $trans(isEdit.value ? 'Updated' : 'Created'),
      $trans(isEdit.value ? 'Invoice has been updated' : 'Invoice has been created'),
    )
    if (!isEdit.value) {
      await router.push({ name: 'invoice-edit', params: { pk: invoice.value.id, uuid: props.uuid || invoice.value.order_uuid } })
    }
  } catch {
    errorToast(create, $trans(isEdit.value ? 'Error updating invoice' : 'Error creating invoice'))
  } finally {
    saving.value = false
  }
}
</script>
