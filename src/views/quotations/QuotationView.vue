<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <QuotationPDFViewer
        :quotation-in="quotation"
        :is-view="true"
        v-if="quotation"
        ref="quotation-viewer"
      />

      <header v-if="quotation">
        <div class="page-title">
          <h3>
            <b-icon icon="file-earmark-check-fill"></b-icon>
            <router-link
              :to="{name: 'quotation-list' }"
            >{{ $trans('Quotations') }}</router-link>
            /
            <strong>{{ quotation.quotation_name }}</strong>
            <span>
              <b-link
                class="btn btn-sm btn-primary"
                @click.prevent="showQuotationDialog"
                target="_blank"
              >
                <b-icon icon="file-earmark"></b-icon>
                {{ $trans('View PDF') }}
              </b-link>
            </span>
            <b-button
              @click="sendQuotation"
              type="button"
              variant="primary"
              class="send-quotation-button"
            >
              {{ $trans('Send quotation') }}
            </b-button>
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
                      <img class="thumbnail" :src="member.companylogo" style="border:0; max-height: 120px; max-width: 120px" :alt="member.name" />
                  </div>

                  <div class="col-sm-4 info">
                      <b>{{ member.name }}</b><br/>
                      {{ member.address }}<br/>
                      {{ member.postal }} {{ member.city }}<br/>
                      {{ member.tel }} - {{ member.email}}
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
                    <th width="45%">{{ $trans('Info') }}</th>
                    <th width="10%">{{ $trans('Amount') }}</th>
                    <th width="15%">{{ $trans('Price') }}</th>
                    <th width="15%">{{ $trans('Total') }}</th>
                    <th width="15%">{{ $trans('VAT') }}</th>
                    </thead>
                    <tbody>
                    <tr v-for="quotationLine in chapter.quotationLines" :key="quotationLine.id">
                      <td>{{ quotationLine.info }}</td>
                      <td>{{ quotationLine.amount }}</td>
                      <td>{{ quotationLine.price_dinero.toFormat('$0.00') }}</td>
                      <td>{{ quotationLine.total_dinero.toFormat('$0.00') }}</td>
                      <td>{{ quotationLine.vat_dinero.toFormat('$0.00') }}</td>
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
                  <DocumentsComponent
                    v-if="quotation && quotation.id"
                    :quotation="quotation"
                    :is-view="isView"
                  />
                </div>
                <div class="col-6">
                  <StatusesComponent
                    :statuses="quotation.statuses"
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
<script>
import {QuotationLineModel, QuotationLineService} from '@/models/quotations/QuotationLine.js'
import {QuotationModel, QuotationService} from '@/models/quotations/Quotation'
import {ChapterModel, ChapterService} from "@/models/quotations/Chapter"
import {CostService} from "@/models/orders/Cost"
import {MemberModel} from "@/models/member/Member"
import TotalsInputs from "@/components/TotalsInputs.vue";
import DocumentsComponent from "@/views/quotations/quotation_form/DocumentsComponent.vue";
import StatusesComponent from "@/components/StatusesComponent.vue";
import QuotationPDFViewer from "@/views/quotations/QuotationPDFViewer.vue";

export default {
  name: "QuotationView",
  components: {
    QuotationPDFViewer,
    TotalsInputs,
    DocumentsComponent,
    StatusesComponent
  },
  data() {
    return {
      isLoading: false,
      quotation: null,
      member: new MemberModel(this.$store.getters.getMemberInfo),
      quotationURL: '',
      quotationService: new QuotationService(),
      chapterService: new ChapterService(),
      costService: new CostService(),
      quotationLineService: new QuotationLineService(),
    }
  },
  props: {
    pk: {
      type: String
    }
  },
  async created() {
    this.isLoading = true
    await this.loadQuotation()
  },
  methods: {
    sendQuotation() {
      this.$router.push({name: 'quotation-send',
        query: {
          quotationId: this.quotation.id,
        }}
      );
    },
    showQuotationDialog() {
      this.$refs['quotation-viewer'].show();
    },
    async loadQuotation() {
      try {
        let quotation = new QuotationModel(await this.quotationService.detail(this.pk))
        this.chapterService.addListArg(`quotation=${quotation.id}`)
        const chaptersResponse = await this.chapterService.list()
        quotation.chapters = chaptersResponse.results.map((chapter) => new ChapterModel(chapter))
        for (let chapter of quotation.chapters) {
          this.quotationLineService.listArgs = [
            `chapter=${chapter.id}`
          ]
          const quotationLinesResponse = await this.quotationLineService.list()
          chapter.quotationLines = quotationLinesResponse.results.map((line) => new QuotationLineModel(line))
        }
        this.quotation = quotation
        this.isLoading = false
      } catch(error) {
        console.log('error fetching quotation', error)
        this.errorToast(this.$trans('Error fetching quotation'))
        this.isLoading = false
      }
    }
  }
}
</script>
<style lang="less" scoped>
.pdf-container {
  font-size: 12px !important;
  margin-top: 4px;
  font-size: 85%;

  .log, .info {
    padding-top: 12px;
  }

  .underline {
    border-bottom: 1px dotted;
  }

  div.row {
    padding-top: 6px;
    padding-bottom: 6px;
  }

  .panel-body {
    padding: 10px;
  }

  .signature {
    height: 150px;
  }
}
</style>
