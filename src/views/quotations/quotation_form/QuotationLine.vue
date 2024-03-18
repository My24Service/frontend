<template>
  <b-overlay :show="isLoading" rounded="sm">
    <b-button style="width: 100%" @click="backToChapters">
      <b-icon-arrow-left-circle-fill></b-icon-arrow-left-circle-fill>
        {{ $trans("Back to quotation and chapters") }}
    </b-button>
    <h3 class="quotation-line-header">{{ $trans('Quotation lines for chapter:')}} <i>{{ chapter.name }}</i></h3>
    <div class="invoice-lines" v-if="quotationLineService.collection.length">
      <div
        class="quotation-lines"
        v-for="quotationLine in quotationLineService.collection"
        :key="quotationLine.id">

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Info')"
        >
          <b-form-textarea
            v-model="quotationLine.info"
            rows="2"
          ></b-form-textarea>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Amount')"
        >
          <b-form-input
            readonly="readonly"
            :value="quotationLine.amount"
            size="sm"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Price')"
        >
          <b-form-input
            readonly="readonly"
            :value="quotationLine.price_dinero.toFormat('$0.00')"
            size="sm"
            v-if="quotationLine.price_text !== '*'"
          ></b-form-input>
          <b-form-input
            readonly="readonly"
            :value="$trans('*Price in totals')"
            size="sm"
            v-else
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Total')"
        >
          <b-form-input
            readonly="readonly"
            :value="quotationLine.total_dinero.toFormat('$0.00')"
            size="sm"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          :label="$trans('VAT')"
        >
          <b-form-input
            readonly="readonly"
            :value="quotationLine.vat_dinero.toFormat('$0.00')"
            size="sm"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          :label="$trans('Extra description')"
        >
          <b-form-textarea
            v-model="quotationLine.extra_description"
            rows="2"
          ></b-form-textarea>
        </b-form-group>

        <b-container>
          <b-row>
            <b-col cols="6"></b-col>
            <b-col cols="6">
              <b-button
                @click="() => deleteQuotationLine(quotationLine.id)"
                class="btn btn-danger"
                type="button"
                variant="danger"
              >
                {{ $trans("Delete quotation line") }}
              </b-button>
            </b-col>
          </b-row>
          <hr/>
        </b-container>

      </div>
    </div>
    <div class="new-invoice-line" v-if="quotationLineService.editItem">
      <b-container>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Info')"
              label-for="new-invoice-line-description"
            >
              <b-form-input
                id="new-invoice-line-description"
                size="sm"
                v-model="quotationLineService.editItem.info"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Amount')"
              label-for="new-invoice-line-amount"
            >
              <b-form-input
                @blur="quotationLineAmountChanged"
                id="new-invoice-line-amount"
                size="sm"
                v-model="quotationLineService.editItem.amount"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Price')"
              label-for="new-invoice-line-price"
            >
              <PriceInput
                id="new-invoice-line-price"
                v-model="quotationLineService.editItem.price"
                :currency="quotationLineService.editItem.price_currency"
                @priceChanged="quotationLinePriceChanged"
              />
            </b-form-group>
          </b-col>
          <b-col cols="1" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('VAT type')"
              label-for="new-invoice-line-total"
            >
              <VAT @vatChanged="changeVatTypeQuotationLine" />
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Total')"
              label-for="new-invoice-line-total"
            >
              <b-form-input
                id="new-invoice-line-total"
                readonly
                :value="quotationLineService.editItem.total_dinero.toFormat('$0.00')"
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('VAT')"
              label-for="new-invoice-line-vat"
            >
              <b-form-input
                id="new-invoice-line-vat"
                readonly
                :value="quotationLineService.editItem.vat_dinero.toFormat('$0.00')"
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Extra description')"
              label-for="new-invoice-line-description"
            >
              <b-form-textarea
                id="new-invoice-line-description"
                v-model="quotationLineService.editItem.extra_description"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>
      </b-container>
      <footer class="modal-footer">
        <b-button
          v-if="quotationLineService.isEdit"
          @click="quotationService.doEditCollectionItem"
          class="btn btn-primary"
          size="sm" type="button"
          variant="warning"
          :disabled="!isQuotationLineValid"
        >
          {{ $trans('Edit quotation line') }}
        </b-button>
        <b-button
          v-if="!quotationLineService.isEdit"
          @click="addQuotationLine"
          class="btn btn-primary"
          size="sm"
          type="button"
          variant="primary"
          :disabled="!isQuotationLineValid"
        >
          {{ $trans('Add quotation line') }}
        </b-button>
      </footer>
      <footer
        class="modal-footer"
      >
        <b-button
          :disabled="isLoading"
          @click="cancelSaveQuotationLine"
          class="btn btn-secondary update-button"
          type="button"
          variant="secondary"
        >
          {{ $trans('Cancel') }}
        </b-button>
        <b-button
          :disabled="isLoading || !quotationLineService.collection.length"
          @click="submitQuotationLines"
          class="btn btn-primary update-button"
          type="button"
          variant="primary"
        >
          {{ $trans('Save quotation line') }}
        </b-button>
      </footer>
    </div>
    <footer class="modal-footer">
      <b-button
        @click="editQuotationLine"
        class="btn btn-primary update-button"
        type="button"
        variant="primary"
      >
        {{ $trans('Edit quotation line') }}
      </b-button>
    </footer>
    <hr>

    <footer
      class="modal-footer"
      v-if="false"
    >
      <b-button
        @click="saveQuotationLines"
        class="btn btn-primary update-button"
        type="button"
        variant="primary"
      >
        {{ $trans('Save quotation line') }}
      </b-button>
    </footer>

    <b-row class="quotation-total">
      <b-col cols="10">
        <span class="total-text">{{ $trans('Chapter total') }}</span>
      </b-col>
      <b-col cols="2">
        <TotalsInputs
          v-if="total"
          :total="total"
          :is-final-total="true"
          :vat="vat"
        />
      </b-col>
    </b-row>
  </b-overlay>
</template>
<script>
import{QuotationLineService, QuotationLineModel } from '@/models/quotations/QuotationLine.js';
import PriceInput from "@/components/PriceInput";
import Collapse from "@/components/Collapse";
import VAT from "../quotation_form/VAT";
import {INVOICE_LINE_TYPE_MANUAL} from "./constants";
import {useVuelidate} from "@vuelidate/core";
import TotalsInputs from "@/components/TotalsInputs";
import {QuotationModel, QuotationService} from '@/models/quotations/Quotation.js';
import chapterService, {ChapterModel} from '../../../models/quotations/Chapter.js'
import eventBus from '../../../eventBus.js'
import ChapterModalVue from './ChapterModal.vue'


export default {
  name: 'QuotationLineForm',
  components: {
    PriceInput,
    Collapse,
    VAT,
    TotalsInputs,
    ChapterModalVue,
  },
  setup() {
    return { v$: useVuelidate() }
  },
  validations() {
    return {
      invoice: {}
    }
  },
  props: {
    uuid: {
      type: [String],
      default: null
    },
    quotation: {
      type: QuotationModel,
      default: null
    },
    chapter: {
      type: ChapterModel,
      default: null
    }
  },
  data () {
    return {
      submitClicked: false,
      quotationService: new QuotationService(),
      quotationLineService: new QuotationLineService(),
      INVOICE_LINE_TYPE_MANUAL,
      total: 0,
      vat: 0,
      isLoading: false,
    }
  },
  computed: {
    quotationLinesHaveTotals() {
      return this.quotationLineService.collection.find((line) => line.price_text === '*')
    },
    isQuotationLineValid() {
      return this.quotationLineService.editItem.description !== null
        && this.quotationLineService.editItem.description !== ""
        && this.quotationLineService.editItem.amount !== null
        && this.quotationLineService.editItem.amount !== ""
    }
  },
  mounted() {
    // eventBus.$on('add-cost-quotationline', (quotationLines) => {
    //   if (this.chapter.new) {
    //     for (let quotationLine of quotationLines) {
    //       quotationLine.key = this.getQuotationLineKey()
    //       this.quotationLineService.collection.push(quotationLine)
    //     }
    //     const txt = quotationLines.length === 1 ? this.$trans('quotation line') : this.$trans('quotation lines')
    //     this.infoToast(this.$trans('Added'), this.$trans(`${quotationLines.length} ${txt} added`))
    //   }
    // })
  },
  beforeDestroy() {
    // eventBus.$off('add-cost-quotationline')
  },
  async created() {
    this.isLoading = true

    // if (this.chapter.new) {
    //   // init new model for manual entry
    //   this.quotationLineService.modelDefaults = {
    //     amount: '0',
    //     price: '0.00',
    //     price_currency: this.$store.getters.getDefaultCurrency,
    //     total: '0.00',
    //     total_currency: this.$store.getters.getDefaultCurrency,
    //     vat: '0.00',
    //     vat_currency: this.$store.getters.getDefaultCurrency,
    //     vat_type: this.$store.getters.getInvoiceDefaultVat,
    //   }
    //   this.quotationLineService.newEditItem()
    // }

    await this.loadData()
    this.isLoading = false
  },
  methods: {
    backToChapters() {
      this.$emit('backToChapters')
    },
    getQuotationLines() {
      return this.quotationLineService.collection
    },
    getQuotationLineId() {
      if (this.quotationLineService.collection.length === 0) {
        return 0
      }

      const maxQuotationLine = this.quotationLineService.collection.reduce(function(prev, current) {
        return (prev.id > current.id) ? prev : current
      })
      return maxQuotationLine.id + 1
    },
    quotationLinesCreated(quotationLines) {
      if (quotationLines.length > 0) {
        for (let quotationLine of quotationLines) {
          quotationLine.id = this.getQuotationLineId()
          // console.log(`id: ${id}`)
          this.quotationLineService.collection.push(quotationLine)
        }
        this.updateQuotationTotals()
        const txt = quotationLines.length === 1 ? this.$trans('invoice line') : this.$trans('invoice lines')
        this.infoToast(this.$trans('Added'), this.$trans(`${quotationLines.length} ${txt} added`))
      }
    },
    updateQuotationTotals() {
      this.total = this.quotationLineService.getItemsTotal()
      this.vat = this.quotationLineService.getItemsTotalVAT()
    },
    addQuotationLine() {
      this.quotationLineService.editItem.id = this.getQuotationLineId()
      this.quotationLineService.editItem.type = this.INVOICE_LINE_TYPE_MANUAL
      this.quotationLineService.editItem.price_text = this.quotationLineService.editItem.price_dinero.toFormat('$0.00')
      this.quotationLineService.addCollectionItem()
      this.updateQuotationTotals()
      this.$emit('quotationLineAdded')
    },
    deleteQuotationLine(id) {
      this.quotationLineService.deleteCollectionItemByid(id)
      this.updateQuotationTotals()
      this.$emit('quotationLineDeleted')
    },
    quotationLineAmountChanged() {
      this.quotationLineService.editItem.amount = this.quotationLineService.editItem.amount.replace(',', '.')
      this.quotationLineService.editItem.calcTotal()
      this.updateQuotationTotals()
    },
    quotationLinePriceChanged(val) {
      this.quotationLineService.editItem.setPriceField('price', val)
      this.quotationLineService.editItem.calcTotal()
      this.updateQuotationTotals()
    },
    changeVatTypeQuotationLine(vat_type) {
      this.quotationLineService.editItem.vat_type = vat_type
      this.quotationLineService.editItem.calcTotal()
      this.updateQuotationTotals()
    },
    async submitQuotationLines() {
      try {
          this.isLoading = true
          for (let quotationLine of this.quotationLineService.collection) {
            quotationLine.quotation = this.chapter.quotation
            quotationLine.chapter = this.chapter.id
          }
          await this.quotationLineService.updateCollection()
          this.infoToast(this.$trans('Updated'), this.$trans('chapter has been updated'))
          this.isLoading = false
          this.quotationLineService.collection = []
          await this.loadData()
          this.$emit('quotationLineSubmitted')
        } catch(error) {
          this.errorToast(this.$trans('Error updating chapter'))
          this.isLoading = false
      }
    },
    async loadData() {
      if (this.chapter.id) {
        this.isLoading = true

        this.quotationLineService.listArgs = [
          `chapter=${this.chapter.id}`
        ]

        try {
          const data = await this.quotationLineService.list()
          this.quotationLineService.collection = data.results.map((line) => new QuotationLineModel(line))
          this.isLoading = false
          this.updateQuotationTotals()
        } catch(error) {
          console.log('error fetching quotation lines', error)
          this.errorToast(this.$trans('Error loading quotation lines'))
          this.isLoading = false
        }
        this.quotationLineService.listArgs = []
      }
    }
  }
}
</script>
<style scoped>
.update-button {
  margin-bottom: 8px;
}
.header {
  font-size: 14px;
  font-weight: bold;
}
.invoice-lines {
  margin-bottom: 20px;
}
.quotation-line-header {
  margin-bottom: 20px;
}
.quotation-total {
  margin-bottom: 20px;
}
.total-text {
  font-weight: bold;
}
.quotation-lines {
  margin-bottom: 20px;
}
</style>
