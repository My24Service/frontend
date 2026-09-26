<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">

      <InvoicePDFViewer
        :key="invoice.id"
        :invoice="invoice"
        :is-view="true"
        v-if="invoice && invoice.id"
        ref="invoice-viewer"
      />

      <header v-if="invoice">
        <div class="page-title">
          <h3>
            <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
            <router-link
              :to="{name: 'invoice-list' }"
            >{{ $trans('Invoices') }}</router-link>
            /
            <strong>{{ invoice.invoice_id }}</strong>
            <span>
              <BLink
                class="btn btn-sm btn-primary"
                @click.prevent="showInvoiceDialog"
                target="_blank"
              >
                <IBiFileEarmark></IBiFileEarmark>
                {{ $trans('View PDF') }}
              </BLink>
            </span>
            <span>
              <router-link
                class="btn btn-sm btn-primary"
                :to="{name:'order-view', params: {pk: invoice.order}}">
                <IBiArrowUpRightCircle
                ></IBiArrowUpRightCircle>
                {{ $trans('Order') }}
              </router-link>
            </span>
            <BButton
              @click="sendInvoice"
              type="button"
              variant="primary"
              class="send-quotation-button"
            >
              {{ $trans('Send invoice') }}
            </BButton>
          </h3>
        </div>
      </header>

      <div class="page-detail" v-if="invoice">
        <div class="flex-columns">
          <div class="panel col-2-3">
            <div class="container pdf-container">
              <div class="row">
                <div class="col-sm-2 logo">
                    <img class="thumbnail" :src="companyLogo" style="border:0; max-height: 120px; max-width: 120px" :alt="invoice.member.name" />
                </div>
                <div class="col-sm-4 info">
                    <b>{{ invoice.member.name }}</b><br/>
                    {{ invoice.member.address }}<br/>
                    {{ invoice.member.postal }} {{ invoice.member.city }}<br/>
                    {{ invoice.member.tel }} - {{ invoice.member.email}}<br/>
                  <b>{{ $trans('VAT number') }}</b> {{ invoice.member.vat_number }}<br/>
                  <b>{{ $trans('Chamber of commerce') }}</b> {{ invoice.member.chamber_of_commerce }}<br/>
                </div>
                <div class="col-sm-6 panel panel-default">
                  <div class="panel-body">
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Invoice number') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.invoice_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.reference }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Description') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.description }}&nbsp;</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order ID') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.order_id }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-4"><b>{{ $trans('Order reference') }}</b></span>
                      <span class="col-sm-6 underline">
                        <span class="pull-right">{{ invoice.order_reference }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="row">
                  <div class="col-sm-6">
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.name }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.address }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.customer.country_code }}-{{ invoice.customer.postal }} {{ invoice.customer.city }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Term of payment') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ invoice.term_of_payment_days }} {{ $trans('days') }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="row"></div>
                  </div>
              </div>
              <div class="row" v-if="invoice.invoicelines.length">
                  <p><b>{{ $trans('Invoice lines') }}</b></p>
                  <table class="table table-bordered">
                      <thead>
                          <tr>
                            <th>{{ $trans('Description') }}</th>
                            <th>{{ $trans('Amount') }}</th>
                            <th>{{ $trans('Price') }}</th>
                            <th>{{ $trans('Total') }}</th>
                            <th>{{ $trans('VAT') }}</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr v-for="invoiceline in invoice.invoicelines" :key="invoiceline.id">
                              <td>{{ invoiceline.description }}</td>
                              <td>{{ invoiceline.amount }}</td>
                              <td>{{ formatMoney(invoiceline.price_dinero) }}</td>
                              <td>{{ formatMoney(invoiceline.total_dinero) }}</td>
                              <td>{{ formatMoney(invoiceline.vat_dinero) }}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              <div class='flex-columns space-between'>
                <span class="total-text">{{ $trans('Invoice total') }}</span>

                <TotalsInputs
                  :total="invoice.total_dinero"
                  :is-final-total="true"
                  :vat="invoice.vat_dinero"
                />
              </div>
              <br/>
              <br/>
              <br/>
              <br/>
            </div>
            <hr>
            <div class="container">
              <div class="row">
                <div class="col-6">
                  <StatusesComponent
                    :statuses="invoice.statuses"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>
<script setup lang="ts">
import { invoiceInvoiceDetailRetrieveOptions } from '@/api/@tanstack/vue-query.gen'
import { useQueryErrorToast } from '@/features/forms'
import { formatMoney, toDinero } from '@/services/money'
import { StatusesComponent } from '@/features/shared'
import { InvoicePDFViewer } from '@/features/invoice/pdf'

const props = defineProps<{ uuid: string }>()
const route = useRoute()
const router = useRouter()
const mainStore = useMainStore()
const viewer = useTemplateRef<{ show: () => void }>('invoice-viewer')
const detailQuery = useQuery(() => ({
  ...invoiceInvoiceDetailRetrieveOptions({
    path: { id: props.uuid },
    headers: route.query.create_pdf ? { 'x-create-pdf': route.query.create_pdf } : undefined,
  }),
  enabled: Boolean(props.uuid),
}))
useQueryErrorToast(detailQuery.error, $trans('Error loading invoice'))
const isLoading = detailQuery.isLoading
const companyLogo = computed(() => mainStore.getMemberLogo ?? undefined)
const invoice = computed(() => {
  const record = detailQuery.data.value
  if (!record) return undefined
  return {
    ...record,
    total_dinero: toDinero(record.total, record.total_currency),
    vat_dinero: toDinero(record.vat, record.vat_currency),
    invoicelines: record.invoicelines.map(line => ({
      ...line,
      price_dinero: toDinero(line.price, line.price_currency),
      total_dinero: toDinero(line.total, line.total_currency),
      vat_dinero: toDinero(line.vat, line.vat_currency),
    })),
  }
})
function showInvoiceDialog() {
  viewer.value?.show()
}
function sendInvoice() {
  if (invoice.value) void router.push({ name: 'invoice-send', query: { invoiceId: invoice.value.id } })
}
</script>
