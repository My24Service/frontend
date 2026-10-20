<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <QuotationPDFViewer
        :quotation="quotation"
        :is-view="true"
        v-if="quotation"
        ref="quotation-viewer"
      />

      <header v-if="quotation">
        <div class="page-title">
          <h3>
            <IBiFileEarmarkCheckFill></IBiFileEarmarkCheckFill>
            <router-link
              :to="{name: 'quotations-sent' }"
            >{{ $trans('Quotation') }}</router-link>
            /
            <strong>{{ quotation.quotation_id }} {{ quotation.quotation_name }}</strong>
            <span>
              <BLink
                class="btn btn-sm btn-primary"
                @click.prevent="showQuotationDialog"
                target="_blank"
              >
                <IBiFileEarmarkPdf></IBiFileEarmarkPdf>
                {{ $trans('View PDF') }}
              </BLink>
            </span>
            <BButton
              @click="sendQuotation"
              type="button"
              variant="primary"
              class="send-quotation-button"
            >
              {{ $trans('Send quotation') }}
            </BButton>
          </h3>
          <div
            class="flex-columns"
          >
          </div>
        </div>
      </header>

      <div class="page-detail" v-if="quotation">
        <div class="flex-columns">
          <div class="panel col-2-3">
            <div class="container pdf-container">
              <div class="row">
                  <div class="col-sm-2 logo">
                      <img class="thumbnail" :src="companyLogo" style="border:0; max-height: 120px; max-width: 120px" :alt="member?.name" />
                  </div>

                  <div class="col-sm-4 info">
                      <b>{{ member?.name }}</b><br/>
                      {{ member?.address }}<br/>
                      {{ member?.postal }} {{ member?.city }}<br/>
                      {{ member?.tel }} - {{ member?.email}}
                  </div>
                  <div class="col-sm-6 panel panel-default">
                    <div class="panel-body">
                        <div class="row">
                          <span class="pull-left col-sm-4"><b>{{ $trans('Quotation number') }}</b></span>
                          <span class="col-sm-6 underline">
                              <span class="pull-right">{{ quotation.quotation_id }}</span>
                          </span>
                        </div>
                        <div class="row">
                          <span class="pull-left col-sm-4"><b>{{ $trans('Quotation reference') }}</b></span>
                          <span class="col-sm-6 underline">
                              <span class="pull-right">{{ quotation.quotation_reference }}&nbsp;</span>
                          </span>
                        </div>
                    </div>
                  </div>
                </div>

                <div class="row">
                  <div class="col-sm-6">
                    <div class="row">
                      <div class="pull-left col-sm-6"><b>{{ $trans('Customer ID') }}</b></div>
                      <div class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.customer_id }}</span>
                      </div>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Customer') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.quotation_name }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Address') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.quotation_address }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Postal') }}/{{ $trans('city') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.quotation_country_code }}-{{ quotation.quotation_postal }} {{ quotation.quotation_city }}</span>
                      </span>
                    </div>
                  </div>
                  <div class="col-sm-6">
                    <div class="row">
                      <div class="pull-left col-sm-6"><b>{{ $trans('Expire days') }}</b></div>
                      <div class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.quotation_expire_days }}</span>
                      </div>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Created on') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.created }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Modified on') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.modified }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Made definitive on') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.definitive_date }}</span>
                      </span>
                    </div>
                    <div class="row">
                      <span class="pull-left col-sm-6"><b>{{ $trans('Contact') }}</b></span>
                      <span class="col-sm-6 underline">
                          <span class="pull-right">{{ quotation.quotation_contact }}</span>
                      </span>
                    </div>
                  </div>
                </div>

              <hr/>

              <div v-for="chapter in quotation.chapters" :key="chapter.id">
                <h4>{{ chapter.name }}</h4>
                <div class="row" v-if="chapter.quotationLines.length">
                  <table class="table table-bordered">
                    <thead>
                    <tr>
                      <th width="45%">{{ $trans('Info') }}</th>
                      <th width="10%">{{ $trans('Amount') }}</th>
                      <th width="15%">{{ $trans('Price') }}</th>
                      <th width="15%">{{ $trans('Total') }}</th>
                      <th width="15%">{{ $trans('VAT') }}</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="quotationLine in chapter.quotationLines" :key="quotationLine.id">
                      <td>{{ quotationLine.info }}</td>
                      <td>{{ quotationLine.amount }}</td>
                      <td>{{ formatMoney(quotationLine.price_dinero) }}</td>
                      <td>{{ formatMoney(quotationLine.total_dinero) }}</td>
                      <td>{{ formatMoney(quotationLine.vat_dinero) }}</td>
                    </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class='flex-columns space-between'>
                <span class="total-text">{{ $trans('Quotation total') }}</span>

                <TotalsInputs
                  :total="quotation.total_dinero"
                  :is-final-total="true"
                  :vat="quotation.vat_dinero"
                />
              </div>
            </div>
            <hr>
            <div class="container">
              <div class="row">
                <div class="col-6">
                  <QuotationDocuments
                    :quotation-id="quotation.id"
                    :is-view="true"
                  />
                </div>
                <div class="col-6">
                  <StatusesComponent />
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
import { formatMoney } from '@/services/money'
import { StatusesComponent } from '@/features/shared'
import { QuotationPDFViewer } from '@/features/quotation/pdf'
import QuotationDocuments from '../QuotationDocuments.vue'
import { useQuotationDetail } from './use-quotation-detail'

/**
 * The read-only, PDF-shaped quotation: the member's letterhead, the customer
 * block, each chapter's lines, the totals, the documents and the timeline.
 *
 * The timeline has no rows to show: the quotation record the API answers
 * carries no statuses (the legacy view read `quotation.statuses`, always
 * undefined). It is kept for layout parity; see the slice's decisions doc.
 */
const props = defineProps<{ pk: string | number }>()
const { mainStore, router } = useCommon()

const {quotation, isLoading} = useQuotationDetail(() => Number(props.pk))

const member = computed(() => mainStore.getMemberInfo)
const companyLogo = computed(() => mainStore.getMemberLogo ?? undefined)
const viewer = useTemplateRef<{ show: () => void }>('quotation-viewer')

function showQuotationDialog() {
  viewer.value?.show()
}
function sendQuotation() {
  if (quotation.value) void router.push({name: 'quotation-send', query: {quotationId: quotation.value.id}})
}
</script>
