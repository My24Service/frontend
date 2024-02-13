<template>
  <b-overlay :show="isLoading" rounded="sm">
    <hr>
    <h5 class="quotation-line-header">{{ $trans('Quotation lines')}} </h5>
    <div class="invoice-lines" v-if="quotationLineService.collection.length">
      <b-row>
        <b-col cols="3" class="header">
          {{ $trans("Description") }}
        </b-col>
        <b-col cols="2" class="header">
          {{ $trans("Amount") }}
        </b-col>
        <b-col cols="2" class="header">
          {{ $trans("Price") }}
        </b-col>
        <b-col cols="2" class="header">
          {{ $trans("Total") }}
        </b-col>
        <b-col cols="2" class="header">
          {{ $trans("VAT") }}
        </b-col>
        <b-col cols="1">

        </b-col>
      </b-row>
      <b-row v-for="quotationLine in quotationLineService.collection" :key="quotationLine.id">
        <b-col cols="3" v-if="chapter.new">
          <b-form-textarea
            v-model="quotationLine.info"
            rows="2"
          ></b-form-textarea>
        </b-col>
        <b-col cols="3" v-if="!chapter.new">
          {{ quotationLine.info }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.amount }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.price_dinero.toFormat('$0.00') }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.total_dinero.toFormat('$0.00') }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.vat_dinero.toFormat('$0.00') }}
        </b-col>
        <b-col
          cols="1"
          v-if="quotationLine.type === INVOICE_LINE_TYPE_MANUAL && chapter.new">
          <b-link class="h5 mx-2" @click.prevent="deleteQuotationLine(quotationLine.id)">
            <b-icon-trash></b-icon-trash>
          </b-link>
        </b-col>
      </b-row>
      <b-row v-if="quotationLinesHaveTotals">
        <b-col>
          <div class="float-right">
            <i>* {{ $trans("Prices are combined in totals") }}</i>
          </div>
        </b-col>
      </b-row>
    </div>
    <div class="new-invoice-line" v-if="quotationLineService.editItem && chapter.new">
      <b-container>
        <b-row>
          <b-col cols="3" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Description')"
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
          :disabled="isLoading || !quotationLineService.collection.length"
          @click="submitQuotationLine"
          class="btn btn-danger update-button"
          type="button"
          variant="danger"
        >
          {{ $trans('Save chapter') }}
        </b-button>
      </footer>
    </div>
    <hr>
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
    <footer
      class="modal-footer"
      v-if="!chapter.new"
    >
      <b-button
        :disabled="isLoading"
        @click="showDeleteModal"
        class="btn btn-danger update-button"
        type="button"
        variant="danger"
      >
        {{ $trans('Delete chapter') }}
      </b-button>
    </footer>
    <b-modal
      id="delete-chapter-modal"
      ref="delete-chapter-modal"
      v-bind:title="$trans('Delete?')"
      @ok="deleteChapter"
    >
      <p class="my-4">
        {{ $trans('Are you sure you want to delete this chapter?') }}
      </p>
    </b-modal>
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
import { QuotationService } from '@/models/quotations/Quotation.js';
import chapterService from '../../../models/quotations/Chapter.js'
import eventBus from '../../../eventBus.js'


export default {
  name: 'QuotationLineForm',
  components: {
    PriceInput,
    Collapse,
    VAT,
    TotalsInputs,
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
    quotationData: {
      type: Object,
      default: null
    },
    chapter: {
      type: Object,
      default: null
    }
  },
  watch: {
    quotationData: {
      handler(newValue) {
        this.quotation = newValue
      },
      deep: true
    }
  },
  data () {
    return {
      submitClicked: false,
      quotation: this.quotationData,
      quotationService: new QuotationService(),
      quotationLineService: new QuotationLineService(),
      INVOICE_LINE_TYPE_MANUAL,
      total: 0,
      vat: 0,
      isLoading: false
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
    eventBus.$on('add-cost-quotationline', (quotationLines) => {
      if (this.chapter.new) {
        for (let quotationLine of quotationLines) {
          quotationLine.id = this.getQuotationLineId()
          this.quotationLineService.collection.push(quotationLine)
        }
        const txt = quotationLines.length === 1 ? this.$trans('quotation line') : this.$trans('quotation lines')
        this.infoToast(this.$trans('Added'), this.$trans(`${quotationLines.length} ${txt} added`))
      }
    })
  },
  beforeDestroy() {
    eventBus.$off('add-cost-quotationline')
  },
  async created() {
    this.isLoading = true

    if (this.chapter.new) {
      // init new model for manual entry
      this.quotationLineService.modelDefaults = {
        price: '0.00',
        price_currency: this.$store.getters.getDefaultCurrency,
        total: '0.00',
        total_currency: this.$store.getters.getDefaultCurrency,
        vat: '0.00',
        vat_currency: this.$store.getters.getDefaultCurrency,
        vat_type: this.$store.getters.getInvoiceDefaultVat,
      }
      this.quotationLineService.newEditItem()
    } else {
      this.loadData()
    }
    this.isLoading = false
  },
  methods: {
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
    },
    deleteQuotationLine(id) {
      this.quotationLineService.deleteCollectionItemByid(id)
      this.updateQuotationTotals()
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
    getQuotationLineId() {
      if (this.quotationLineService.collection.length === 0) {
        return 0
      }

      const maxQuotationLine = this.quotationLineService.collection.reduce(function(prev, current) {
        return (prev.id > current.id) ? prev : current
      })
      return maxQuotationLine.id + 1
    },
    async submitQuotationLine() {
      try {
          this.isLoading = true
          for (let quotationLine of this.quotationLineService.collection) {
            quotationLine.quotation = this.quotationData.id
            quotationLine.chapter = this.chapter.id
            await this.quotationLineService.insert(quotationLine)
          }
          this.infoToast(this.$trans('Updated'), this.$trans('chapter has been updated'))
          this.isLoading = false
          this.quotationLineService.collection = []
          this.$emit('quotationLineSubmitted')
          this.loadData()
        } catch(error) {
          this.errorToast(this.$trans('Error updating chapter'))
          this.isLoading = false
      }
    },
    async deleteChapter() {
      this.isLoading = true
      try {
        await chapterService.delete(this.chapter.id)
        this.infoToast(this.$trans('Deleted'), this.$trans('Chapter has been deleted'))
        this.isLoading = false
        this.$emit('quotationLineSubmitted')
        this.$emit('chapterDeleted')
      } catch(error) {
        console.log('Error deleting chapter', error)
        this.errorToast(this.$trans('Error deleting chapter'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true
      this.quotationLineService.listArgs = [
        `quotation=${this.quotationData.id}`,
        `chapter=${this.chapter.id}`
      ]

      try {
        const data = await this.quotationLineService.list()
        for (const quotationLine of data.results) {
          this.quotationLineService.collection.push(new QuotationLineModel(quotationLine))
        }
        this.isLoading = false
        this.updateQuotationTotals()
      } catch(error) {
        console.log('error fetching quotation lines', error)
        this.errorToast(this.$trans('Error loading quotation lines'))
        this.isLoading = false
      }
      this.quotationLineService.listArgs = []
    },
    showDeleteModal() {
      this.$refs['delete-chapter-modal'].show()
    },
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
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
</style>
