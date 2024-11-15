<template>
  <b-overlay :show="isLoading" rounded="sm">
    <b-button
      style="width: 100%"
      :variant="quotationLineService.collectionHasChanges ? 'danger' : 'success'"
      :disabled="quotationLineService.collectionHasChanges"
      @click="backToChapters"
    >
      <b-icon-arrow-left-circle-fill></b-icon-arrow-left-circle-fill>
      {{ $trans("Back to quotation and chapters") }}
    </b-button>
    <details open class="overflow">
      <summary class="flex-columns space-between">
        <h6>{{ $trans('Quotation lines chapter') }} <i>{{ chapter.name }}</i></h6>
        <b-icon-chevron-down></b-icon-chevron-down>
      </summary>

      <p v-if="!quotationLineService.collection.length && !showForm">
        <i>{{ $trans("No quotation lines") }}</i>
      </p>
      <b-table
        small
        :busy='isLoading'
        :fields="isView ? fieldsView : fields"
        :items="quotationLineService.collection"
        responsive="md"
        class="line-table"
        v-if="!showForm && quotationLineService.collection.length"
      >
        <template #cell(info)="data">
          <b>{{ data.item.info }}</b><br/>
          {{ $trans("Amount") }}: <b>{{ data.item.amount }}</b>
        </template>
        <template #cell(total)="data">
          {{ data.item.total_dinero.toFormat('$0.00') }}<br/>
          {{ $trans("VAT") }} {{ data.item.vat_dinero.toFormat('$0.00') }} ({{ Math.round(data.item.vat_type) }}%)
        </template>
        <template #cell(icons)="data">
          <div
            class="h2 float-right"
            v-if="data.item.id && !isView"
          >
            <IconLinkEdit
              :method="function() { editQuotationLine(data.item, data.index) }"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { deleteItem(data.item.id) }"
            />
          </div>
        </template>
      </b-table>

      <div v-if="showForm">
        <b-form-group
          label-cols="0"
          label-for="new-invoice-line-amount"
        >
          <b-container>
            <b-row>
              <b-col cols="3">
                <b-form-group
                  v-bind:label="$trans('Amount')"
                  label-for="new-invoice-line-price"
                >
                  <b-form-input
                    autofocus
                    @blur="quotationLineAmountChanged"
                    id="new-invoice-line-amount"
                    size="sm"
                    v-model="quotationLineService.editItem.amount"
                  ></b-form-input>
                </b-form-group>
              </b-col>
              <b-col cols="5">
                <b-form-group
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
              <b-col cols="4">
                <b-form-group
                  v-bind:label="$trans('VAT type')"
                  label-for="new-invoice-line-total"
                >
                  <VAT @vatChanged="changeVatTypeQuotationLine" />
                </b-form-group>
              </b-col>
            </b-row>
          </b-container>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Info')"
          label-for="new-invoice-line-description"
        >
          <b-form-input
            id="new-invoice-line-description"
            size="sm"
            v-model="quotationLineService.editItem.info"
          ></b-form-input>
        </b-form-group>

        <b-form-group
          label-cols="3"
          v-bind:label="$trans('Extra description')"
          label-for="new-invoice-line-description"
        >
          <b-form-textarea
            id="new-invoice-line-description"
            v-model="quotationLineService.editItem.extra_description"
          ></b-form-textarea>
        </b-form-group>

        <hr/>

        <b-container>
          <b-row>
            <b-col cols="12">
              <TotalsInputs
                :total="quotationLineService.editItem.total_dinero"
                :vat="quotationLineService.editItem.vat_dinero"
              />
            </b-col>
          </b-row>
        </b-container>

        <footer class="modal-footer">
          <b-button
            :disabled="isLoading"
            @click="cancelEditQuotationLine"
            class="btn btn-secondary update-button"
            type="button"
            size="sm"
            variant="secondary"
          >
            {{ $trans('Cancel') }}
          </b-button>
          <b-button
            v-if="quotationLineService.isEdit"
            @click="doEditCollectionItem"
            class="btn btn-primary"
            size="sm"
            type="button"
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

      <footer
        class="modal-footer"
        v-if="!showForm && !isView && quotation.preliminary"
      >
        <b-button
          @click="newQuotationLine"
          class="btn btn-primary update-button"
          type="button"
          variant="primary"
        >
          {{ $trans('New quotation line') }}
        </b-button>
      </footer>

      <b-container
        v-if="showChangesBlock"
      >
        <b-row class="quotation-total">
          <b-col cols="7">
            <span class="total-text">{{ $trans('Chapter total') }}</span>
          </b-col>
          <b-col cols="5">
            <TotalsInputs
              v-if="total"
              :total="total"
              :is-final-total="true"
              :vat="vat"
            />
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2"></b-col>
          <b-col cols="10">
            <b-button
              @click="loadData"
              class="btn btn-secondary"
              type="button"

              :disabled="!quotationLineService.collectionHasChanges"
            >
              {{ $trans('Discard changes') }}
            </b-button>
            &nbsp;
            <b-button
              @click="submitQuotationLines"
              class="btn btn-danger"
              type="button"
              variant="danger"
              :disabled="!quotationLineService.collectionHasChanges"
            >
              {{ $trans('Save changes') }}
            </b-button>
          </b-col>
        </b-row>
        <b-row v-if="quotationLineService.deletedItems.length">
          <b-col cols="12">
            <hr/>
            <p><strong>{{ $trans("To be deleted") }}</strong></p>
            <b-table
              small
              :fields="fieldsView"
              :items="quotationLineService.deletedItems"
              responsive="md"
              class="line-table"
            ></b-table>
          </b-col>
        </b-row>
      </b-container>
    </details>
  </b-overlay>
</template>
<script>
import{ QuotationLineService } from '@/models/quotations/QuotationLine.js';
import PriceInput from "@/components/PriceInput";
import VAT from "../quotation_form/VAT";
import {INVOICE_LINE_TYPE_MANUAL} from "./constants";
import {useVuelidate} from "@vuelidate/core";
import TotalsInputs from "@/components/TotalsInputs";
import {QuotationModel} from '@/models/quotations/Quotation.js';
import {ChapterModel} from '@/models/quotations/Chapter'
import IconLinkDelete from "@/components/IconLinkDelete.vue";
import ButtonLinkSearch from "@/components/ButtonLinkSearch.vue";
import ButtonLinkRefresh from "@/components/ButtonLinkRefresh.vue";
import ButtonLinkAdd from "@/components/ButtonLinkAdd.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";

export default {
  name: 'QuotationLineForm',
  components: {
    IconLinkEdit,
    ButtonLinkAdd,
    ButtonLinkRefresh,
    ButtonLinkSearch,
    IconLinkDelete,
    PriceInput,
    VAT,
    TotalsInputs,
  },
  emits: [
    'quotationLineDeleted',
    'backToChapters',
    'quotationLineAdded',
    'quotationLineSubmitted',
    'quotationLinesLoaded'
  ],
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
    },
    isView: {
      type: [Boolean],
      default: false
    }
  },
  data () {
    return {
      submitClicked: false,
      quotationLineService: new QuotationLineService(),
      INVOICE_LINE_TYPE_MANUAL,
      total: 0,
      vat: 0,
      isLoading: false,
      newItem: false,
      fields: [
        {key: 'info', label: this.$trans('Info'), thAttr: {width: '40%'}},
        {key: 'total', label: this.$trans('Total'), thAttr: {width: '40%'}},
        {key: 'icons', label: '', thAttr: {width: '20%'}},
      ],
      fieldsView: [
        {key: 'info', label: this.$trans('Info'), thAttr: {width: '60%'}},
        {key: 'total', label: this.$trans('Total'), thAttr: {width: '40%'}},
      ],
    }
  },
  computed: {
    showChangesBlock() {
      return !this.showForm && (this.quotationLineService.collection.length || this.quotationLineService.deletedItems.length) && this.quotationLineService.collectionHasChanges
    },
    showForm() {
      return !this.isView && (this.quotationLineService.isEdit || this.newItem)
    },
    isQuotationLineValid() {
      return this.quotationLineService.editItem.description !== null
        && this.quotationLineService.editItem.description !== ""
        && this.quotationLineService.editItem.amount !== null
        && this.quotationLineService.editItem.amount !== "0"
    }
  },
  async created() {
    this.isLoading = true

    this.quotationLineService.modelDefaults = {
      amount: '0',
      price: '0.00',
      price_currency: this.$store.getters.getDefaultCurrency,
      total: '0.00',
      total_currency: this.$store.getters.getDefaultCurrency,
      vat: '0.00',
      vat_currency: this.$store.getters.getDefaultCurrency,
      vat_type: this.$store.getters.getInvoiceDefaultVat,
    }

    await this.loadData()
    this.isLoading = false
  },
  methods: {
    // delete
    deleteItem(id) {
      this.quotationLineService.deleteCollectionItemByid(id)
    },
    // edit
    emptyQuotationLinesForType(type) {
      while(this.quotationLineService.collection.find((cost) => cost.cost_type === type)) {
        for(let i=0; i<this.quotationLineService.collection.length; i++) {
          if (this.quotationLineService.collection[i].cost_type === type)
            this.quotationLineService.deleteCollectionItem(i)
        }
      }
      this.updateChapterTotals()
    },
    doEditCollectionItem() {
      this.quotationLineService.doEditCollectionItem()
    },
    editQuotationLine(item, index) {
      this.quotationLineService.editCollectionItem(item, index)
    },
    cancelEditQuotationLine() {
      this.quotationLineService.cancelEdit()
      this.newItem = false
    },
    newQuotationLine() {
      this.quotationLineService.newEditItem()
      this.newItem = true
    },
    // etc
    backToChapters() {
      this.$emit('backToChapters')
    },
    getQuotationLines() {
      return this.quotationLineService.collection
    },
    quotationLinesCreated(quotationLines) {
      if (quotationLines.length > 0) {
        this.quotationLineService.collection = [
          ...this.quotationLineService.collection,
          ...quotationLines
        ]
        this.updateChapterTotals()
        const txt = quotationLines.length === 1 ? this.$trans('invoice line') : this.$trans('invoice lines')
        this.infoToast(this.$trans('Added'), this.$trans(`${quotationLines.length} ${txt} added`))
        this.quotationLineService.collectionHasChanges = true
      }
    },
    updateChapterTotals() {
      this.total = this.quotationLineService.getItemsTotal()
      this.vat = this.quotationLineService.getItemsTotalVAT()
    },
    addQuotationLine() {
      this.quotationLineService.editItem.cost_type = this.INVOICE_LINE_TYPE_MANUAL
      this.quotationLineService.editItem.price_text = this.quotationLineService.editItem.price_dinero.toFormat('$0.00')
      this.quotationLineService.addCollectionItem()
      this.updateChapterTotals()
      this.newItem = false
      this.quotationLineService.newEditItem()
      this.$emit('quotationLineAdded')
    },
    quotationLineAmountChanged() {
      this.quotationLineService.editItem.amount = this.quotationLineService.editItem.amount.replace(',', '.')
      this.quotationLineService.editItem.calcTotal()
      this.updateChapterTotals()
    },
    quotationLinePriceChanged(val) {
      this.quotationLineService.editItem.setPriceField('price', val)
      this.quotationLineService.editItem.calcTotal()
      this.updateChapterTotals()
    },
    changeVatTypeQuotationLine(vat_type) {
      this.quotationLineService.editItem.vat_type = vat_type
      this.quotationLineService.editItem.calcTotal()
      this.updateChapterTotals()
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
          await this.quotationLineService.loadCollection()
          this.isLoading = false
          this.updateChapterTotals()
          this.$emit('quotationLinesLoaded', this.quotationLineService.collection)
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
.quotation-line-header {
  margin-bottom: 20px;
}
.quotation-total {
  margin-bottom: 20px;
}
.total-text {
  font-weight: bold;
}
.overflow {
  overflow: auto;
  max-height: 650px;
  position: relative;
}
</style>
