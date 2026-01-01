<template>
  <b-overlay :show="isLoading" rounded="sm">
     <details open>
      <summary class="flex-columns space-between">
        <h6>{{ $trans('Invoice lines')}} </h6>
        <b-icon-chevron-down></b-icon-chevron-down>
      </summary>
      <ul class="listing invoice-lines full-size" v-if="invoiceLineService.collection.length">
        <li class="headings">
            <span>
              {{ $trans("Description") }}
            </span>
            <span style="text-align: right">
              {{ $trans("Amount") }}
            </span>
            <span style="text-align: right">
              {{ $trans("Price") }}
            </span>

            <span style="text-align: right">
              {{ $trans("Total") }}
            </span>
            <span style="text-align: right">
              {{ $trans("VAT") }}
            </span>
            <span></span>
        </li>
        <li v-for="invoiceLine in invoiceLineService.collection" :key="invoiceLine.id" class="listing-item">
          <span style="vertical-align:middle">
            {{ invoiceLine.description }}
          </span>
          <span style="width:120px">
            <!-- <input type="number" class="form-control form-control-sm" v-model.number="invoiceLine.amount" v-on:change="invoiceLineAmountEdited(invoiceLine.id,$event)" style="text-align:right;font-size:1em;margin-top:3px;max-width:120px" />-->
            {{ invoiceLine.amount }}
          </span>
          <span style="text-align: right;vertical-align:middle">
            {{ invoiceLine.price_dinero.toFormat('$0.00') }}
          </span>
          <span style="text-align: right;vertical-align:middle">
            {{ invoiceLine.total_dinero.toFormat('$0.00') }}
          </span>
          <span style="text-align: right;vertical-align:middle">
            {{ invoiceLine.vat_dinero.toFormat('$0.00') }}
          </span>
          <span v-if="invoiceLine.type === INVOICE_LINE_TYPE_MANUAL" style="text-align: right;vertical-align:middle">
            <b-link class="h5 mx-2" @click.prevent="deleteInvoiceLine(invoiceLine.id)">
              <b-icon-trash></b-icon-trash>
            </b-link>
          </span>
          <span v-else>&nbsp;</span>
        </li>

        <li v-if="invoiceLinesHaveTotals" >
          <i>
            <b-icon-info-square-fill variant="primary"></b-icon-info-square-fill>
            * <span class="dimmed">{{ $trans("Prices are combined in totals") }}</span>
          </i>
        </li>

      </ul>
      <hr>
      <div class="new-invoice-line" v-if="invoiceLineService.editItem">
        <b-container>
          <b-row>
            <b-col cols="6" role="group">
              <b-form-group
                label-size="sm"
                label-for="new-invoice-line-description"
              >
                <b-form-input
                  id="new-invoice-line-description"
                  size="sm"
                  v-model="invoiceLineService.editItem.description"
                  :placeholder="$trans('Item description')"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                label-for="new-invoice-line-amount"
              >
                <b-form-input
                  @input="invoiceLineAmountChanged"
                  id="new-invoice-line-amount"
                  size="sm"
                  type="number"
                  v-model="invoiceLineService.editItem.amount"
                  :placeholder="$trans('Amount')"

                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                label-for="new-invoice-line-price"
              >
                <PriceInput
                  id="new-invoice-line-price"
                  v-model="invoiceLineService.editItem.price"
                  :currency="invoiceLineService.editItem.price_currency"
                  @priceChanged="(val) => invoiceLineService.editItem.setPriceField('price', val) && invoiceLineService.editItem.calcTotal()"
                />
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="2" role="group">
              <b-form-group
                label-size="sm"
                label-for="new-invoice-line-total"
              >
                <b-form-input
                  :placeholder="$trans('Total')"
                  id="new-invoice-line-total"
                  readonly
                  disabled
                  :value="invoiceLineService.editItem.total_dinero.toFormat('$0.00')"
                  size="sm"
                ></b-form-input>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                class="flex-columns vat"
                label-size="sm"
                v-bind:label="$trans('VAT %')"
                label-for="new-invoice-line-total"
              >
              <span class="flex-columns space-between align-items-center">
                <VAT @vatChanged="changeVatTypeInvoiceLine" />

                {{ invoiceLineService.editItem.vat_dinero.toFormat('$0.00') }}
              </span>
              </b-form-group>
            </b-col>
            <b-col cols="4" role="group">
              <b-form-group
                label-size="sm"
                label-for="invoice-submit-button"
              >
                <b-button
                  v-if="invoiceLineService.isEdit"
                  @click="invoiceService.doEditCollectionItem"
                  class="btn "
                  size="sm"
                  type="submit"
                  :disabled="!isInvoiceLineValid"
                  id="invoice-submit-button"
                >
                  {{ $trans('Edit') }}
                </b-button>
                <b-button
                  v-else
                  @click="addInvoiceLine"
                  class="btn"
                  size="sm"
                  type="submit"

                  :disabled="!isInvoiceLineValid"
                  id="invoice-submit-button"
                >
                  {{ $trans('Add') }}
                </b-button>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
        <b-container v-if="invoiceLineService.deletedItems.length">
          <b-row>
            <b-col cols="12">
              <hr/>
              <p><strong>{{ $trans("To be deleted") }}</strong></p>
              <b-table
                small
                :fields="fieldsView"
                :items="invoiceLineService.deletedItems"
                responsive="md"
                class="line-table"
              ></b-table>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="12" class="text-center">
              <b-button
                @click="loadData"
                class="btn btn-secondary"
                type="button"

                :disabled="!invoiceLineService.collectionHasChanges"
              >
                {{ $trans('Discard changes') }}
              </b-button>
            </b-col>
          </b-row>
        </b-container>
      </div>
    </details>
  </b-overlay>
</template>
<script>
import { InvoiceLineService } from '@/models/invoices/InvoiceLine'
import PriceInput from "../../../components/PriceInput";
import VAT from "./VAT";
import invoiceMixin from "./mixin";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()


export default {
  components: {
    VAT,
    PriceInput,
  },
  mixins: [invoiceMixin],
  props: {
    invoice: {
      type: Object,
      default: null
    },
    invoicePk: {
      type: [String, Number],
      default: null
    }
  },
  computed: {
    invoiceLinesHaveTotals() {
      return this.invoiceLineService.collection.find((line) => line.price_text === '*')
    },
    isInvoiceLineValid() {
      return this.invoiceLineService.editItem.description !== null
        && this.invoiceLineService.editItem.description !== ""
        && this.invoiceLineService.editItem.amount !== null
        && this.invoiceLineService.editItem.amount !== ""
    }
  },
  data () {
    return {
      isLoading: false,
      invoiceLineService: new InvoiceLineService(),
      fieldsView: [
        {key: 'description', label: $trans('Description'), thAttr: {width: '60%'}},
        {key: 'total', label: $trans('Total'), thAttr: {width: '40%'}},
      ],
    }
  },
  async created() {
    this.isLoading = true

    // init new model for manual entry
    this.invoiceLineService.modelDefaults = {
      price: '0.00',
      price_currency: this.$store.getters.getDefaultCurrency,
      total: '0.00',
      total_currency: this.$store.getters.getDefaultCurrency,
      vat: '0.00',
      vat_currency: this.$store.getters.getDefaultCurrency,
      vat_type: this.$store.getters.getInvoiceDefaultVat,
    }
    this.invoiceLineService.newEditItem()

    if (this.invoicePk) {
      await this.loadData()
    }

    this.isLoading = false
  },
  methods: {
    /*
    invoiceLineAmountEdited(invoiceItemId, event) {
      const new_amount = event.target.value;
      for (const line of this.invoiceLineService.collection) {
        if (line.id === invoiceItemId) {

          // The `vat_type` might be '0.00' but that does not mean that no VAT has been
          // applied -- the `vat_total` might be non-zero. If so, is it safe to assume
          // that the 'standard' VAT has been applied, and we need to apply that here
          // as well?
          let vat_percentage = parseFloat(line.vat_type)
          if (vat_percentage === 0.0 && line.vat > 0.0) {
            vat_percentage = parseFloat(this.$store.getters.getInvoiceDefaultVat)
          }

          // Normalize to 1.0:
          if (vat_percentage > 0.0) {
            vat_percentage /= 100.0;
          }

          let new_total = new_amount * line.price;
          let new_vat = new_total * vat_percentage;

          // console.log( 'new total:'+new_total+', vat='+new_vat );

          line.amount = new_amount
          line.vat = new_vat;
          line.vat_dinero = toDinero(line.vat, line.vat_currency)

          line.total = new_total;
          line.total_dinero = toDinero( line.total, line.total_currency)

          this.updateInvoiceTotals()
          return;
        }
      }
    }, */
    getInvoiceLines() {
      return this.invoiceLineService.collection
    },
    addInvoiceLine() {
      this.invoiceLineService.editItem.id = this.getInvoiceLineId()
      this.invoiceLineService.editItem.new = true
      this.invoiceLineService.editItem.invoice = this.invoice.id
      this.invoiceLineService.editItem.type = this.INVOICE_LINE_TYPE_MANUAL
      this.invoiceLineService.editItem.price_text = this.invoiceLineService.editItem.price_dinero.toFormat('$0.00')
      this.invoiceLineService.addCollectionItem()
      this.updateInvoiceTotals()
    },
    invoiceLinesCreated(invoiceLines) {
      if (invoiceLines.length > 0) {
        for (let invoiceLine of invoiceLines) {
          invoiceLine.id = this.getInvoiceLineId()
          invoiceLine.new = true
          invoiceLine.invoice = this.invoice.id
          // console.log(`id: ${id}`)
          this.invoiceLineService.collection.push(invoiceLine)
        }
        this.updateInvoiceTotals()
        const txt = invoiceLines.length === 1 ? $trans('invoice line') : $trans('invoice lines')
        infoToast(create, $trans('Added'), $trans(`${invoiceLines.length} ${txt} added`))
      }
    },
    updateInvoiceTotals() {
      const total = this.invoiceLineService.getItemsTotal()
      const vat = this.invoiceLineService.getItemsTotalVAT()

      this.$emit('updateInvoiceTotals', [total, vat])
    },
    deleteInvoiceLine(id) {
      this.invoiceLineService.deleteCollectionItemByid(id)
    },
    invoiceLineAmountChanged() {
      this.invoiceLineService.editItem.amount = this.invoiceLineService.editItem.amount.replace(',', '.')
      this.invoiceLineService.editItem.calcTotal()
    },
    changeVatTypeInvoiceLine(vat_type) {
      this.invoiceLineService.editItem.vat_type = vat_type
      this.invoiceLineService.editItem.calcTotal()
    },
    emptyCollectionClicked(type) {
      this.invoiceLineService.collection = this.invoiceLineService.collection.filter((m) => m.type !== type)
      this.updateInvoiceTotals()
      infoToast(create, $trans('Removed'), $trans(`invoice lines removed`))
    },
    getInvoiceLineId() {
      if (this.invoiceLineService.collection.length === 0) {
        return 0
      }

      const maxInvoiceLine = this.invoiceLineService.collection.reduce(function(prev, current) {
        return (prev.id > current.id) ? prev : current
      })

      return maxInvoiceLine.id + 1
    },
    async loadData() {
      if (this.invoicePk) {
        this.isLoading = true

        this.invoiceLineService.listArgs = [
          `invoice=${this.invoicePk}`
        ]

        try {
          await this.invoiceLineService.loadCollection()
          this.isLoading = false
          this.$emit('invoiceLinesLoaded', this.invoiceLineService.collection)
          this.updateInvoiceTotals()
        } catch(error) {
          console.log('error fetching invoice lines', error)
          errorToast(create, $trans('Error loading invoice lines'))
          this.isLoading = false
        }
        this.invoiceLineService.listArgs = []
      }
    }
  }
}
</script>
<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
.vat {
  white-space: nowrap;
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

.listing { display: table; }
.listing li:not(.text-right) { display: table-row;}
.listing li:not(.text-right) span  {  display: table-cell;}

</style>
