<template>
  <b-overlay :show="isLoading" rounded="sm">
    <h4>{{ $trans('Quotation data')}} </h4>
    <b-row>
      <b-col cols="2" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Reference')"
          label-for="quotation_reference"
        >
          <b-form-input
            v-model="quotation.quotation_reference"
            id="quotation_reference"
            size="sm"
          ></b-form-input>
        </b-form-group>
      </b-col>
      <b-col cols="6" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Description')"
          label-for="quotation_description"
        >
          <b-form-textarea
            id="quotation_description"
            v-model="quotation.description"
            rows="1"
          ></b-form-textarea>
        </b-form-group>
      </b-col>
      <b-col cols="2" role="group">
        <b-form-group
          label-size="sm"
          v-bind:label="$trans('Accepted')"
          label-for="quotation_accepted"
        >
          <b-form-checkbox
            id="quotation_accepted"
            v-model="quotation.accepted"
            value="true"
            unchecked-value="false"
          >
          </b-form-checkbox>
        </b-form-group>
      </b-col>
    </b-row>
    <h4>{{ $trans('Quotation lines')}} </h4>
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
        <b-col cols="3">
          <b-form-textarea
            v-model="quotationLine.description"
            rows="2"
          ></b-form-textarea>
        </b-col>
        <b-col cols="2">
          {{ quotationLine.amount }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.price_text }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.total_dinero.toFormat('$0.00') }}
        </b-col>
        <b-col cols="2">
          {{ quotationLine.vat_dinero.toFormat('$0.00') }}
        </b-col>
        <b-col cols="1" v-if="quotationLine.type === INVOICE_LINE_TYPE_MANUAL">
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
    <div class="new-invoice-line" v-if="quotationLineService.editItem">
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
                v-model="quotationLineService.editItem.description"
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
                @priceChanged="(val) => quotationLineService.editItem.setPriceField('price', val) && quotationLineService.editItem.calcTotal()"
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

    </div>
    <hr/>
    <b-row class="quotation-total">
      <b-col cols="10">
        <span class="total-text">{{ $trans('Quotation total') }}</span>
      </b-col>
      <b-col cols="2">
        <TotalsInputs
          :total="quotation.total_dinero"
          :is-final-total="true"
          :vat="quotation.vat_dinero"
        />
      </b-col>
    </b-row>
  </b-overlay>
</template>

<script>
import quotationLineService, { QuotationLineModel } from '@/models/quotations/QuotationLine.js'
import {toDinero} from "@/utils";
import PriceInput from "@/components/PriceInput";
import Collapse from "@/components/Collapse";

import VAT from "../quotation_form/VAT";
import {
  COST_TYPE_ACTUAL_WORK,
  COST_TYPE_EXTRA_WORK,
  COST_TYPE_TRAVEL_HOURS,
  COST_TYPE_WORK_HOURS
} from "@/models/orders/Cost";
import {INVOICE_LINE_TYPE_MANUAL} from "../quotation_form/constants";
import {useVuelidate} from "@vuelidate/core";
import TotalsInputs from "@/components/TotalsInputs";
import quotationService, { QuotationService } from '@/models/quotations/Quotation.js';


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
    }
  },
  data () {
    return {
      COST_TYPE_WORK_HOURS,
      COST_TYPE_TRAVEL_HOURS,
      COST_TYPE_EXTRA_WORK,
      COST_TYPE_ACTUAL_WORK,

      isLoading: false,
      submitClicked: false,
      quotation: new QuotationLineModel({
        total: "0.00",
        total_currency: this.$store.getters.getDefaultCurrency,
        vat: "0.00",
        vat_currency: this.$store.getters.getDefaultCurrency,
        quotation_reference: '',
        description: '',
        accepted: false
      }),
      errorMessage: null,

      invoice_id: null,
      order_pk: null,

      default_currency: this.$store.getters.getDefaultCurrency,

      engineer_models: [],

      activity_totals: null,
      extra_work_totals: null,
      actual_work_totals: null,

      material_models: null,
      used_materials: null,

      customerPk: null,
      customer: null,

      quotationService,
      quotationLineService,
      deletedInvoiceLines: [],
      INVOICE_LINE_TYPE_MANUAL,
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
  async created() {
    this.isLoading = true

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

    this.isLoading = false
  },
  methods: {
    // invoice lines
    updateQuotationTotals() {
      const total = this.quotationLineService.getItemsTotal()
      const vat = this.quotationLineService.getItemsTotalVAT()

      this.quotation.setPriceField('total', total)
      this.quotation.setPriceField('vat', vat)
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
    },
    quotationLineAmountChanged() {
      this.quotationLineService.editItem.amount = this.quotationLineService.editItem.amount.replace(',', '.')
      this.quotationLineService.editItem.calcTotal()
    },
    changeVatTypeQuotationLine(vat_type) {
      this.quotationLineService.editItem.vat_type = vat_type
      this.quotationLineService.editItem.calcTotal()
    },
    quotationLinesCreated(invoiceLines) {
      if (invoiceLines.length > 0) {
        for (let invoiceLine of invoiceLines) {
          invoiceLine.id = this.getQuotationLineId()
          // console.log(`id: ${id}`)
          this.quotationLineService.collection.push(invoiceLine)
        }
        this.updateQuotationTotals()
        const txt = invoiceLines.length === 1 ? this.$trans('invoice line') : this.$trans('invoice lines')
        this.infoToast(this.$trans('Added'), this.$trans(`${invoiceLines.length} ${txt} added`))
      }
    },
    emptyCollectionClicked(type) {
      this.quotationLineService.collection = this.quotationLineService.collection.filter((m) => m.type !== type)
      this.updateQuotationTotals()
      this.infoToast(this.$trans('Removed'), this.$trans(`quotation lines removed`))
    },
    getQuotationLineId() {
      if (this.quotationLineService.collection.length === 0) {
        return 0
      }

      const maxQuotationLine = this.quotationLineService.collection.reduce(function(prev, current) {
        return (prev.id > current.id) ? prev : current
      })

      return maxQuotation.id + 1
    },
    cancelForm() {
      this.$router.go(-1)
    }
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
.total-text {
  font-weight: bold;
}
.quotation-total {
  margin-bottom: 20px;
}
</style>
