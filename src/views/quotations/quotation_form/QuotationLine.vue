<template>
  <b-overlay :show="isLoading" rounded="sm">
    <BButton
      style="width: 100%"
      :variant="quotationLineService.collectionHasChanges ? 'danger' : 'success'"
      :disabled="quotationLineService.collectionHasChanges"
      @click="backToChapters"
    >
      <b-icon-arrow-left-circle-fill></b-icon-arrow-left-circle-fill>
      {{ $trans("Back to quotation and chapters") }}
    </BButton>

    <h5 class="pt-2">{{ $trans('Quotation lines chapter') }} <i>{{ chapter.name }}</i></h5>

    <div>
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
        :tbody-tr-class="rowClass"
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
              class="pr-2"
              :method="function() { editQuotationLine(data.item, data.index) }"
              v-bind:title="$trans('Edit')"
            />
            <IconLinkDelete
              v-bind:title="$trans('Delete')"
              v-bind:method="function() { deleteItem(data.item.id) }"
            />
          </div>
          <div
            class="float-right"
            v-if="!data.item.id && !isView"
          >
            <i>{{ $trans("not saved") }}</i>
          </div>
        </template>
      </b-table>

      <div v-if="showForm">
        <BFormGroup
          label-cols="0"
          label-for="new-invoice-line-amount"
        >
          <b-container>
            <b-row>
              <b-col cols="3">
                <BFormGroup
                  v-bind:label="$trans('Amount')"
                  label-for="new-invoice-line-price"
                >
                  <BFormInput
                    autofocus
                    @blur="quotationLineAmountChanged"
                    id="new-invoice-line-amount"
                    size="sm"
                    v-model="quotationLineService.editItem.amount"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="5">
                <BFormGroup
                  v-bind:label="$trans('Price')"
                  label-for="new-invoice-line-price"
                >
                  <PriceInput
                    id="new-invoice-line-price"
                    v-model="quotationLineService.editItem.price"
                    :currency="quotationLineService.editItem.price_currency"
                    @priceChanged="quotationLinePriceChanged"
                  />
                </BFormGroup>
              </b-col>
              <b-col cols="4">
                <BFormGroup
                  v-bind:label="$trans('VAT type')"
                  label-for="new-invoice-line-total"
                >
                  <VAT @vatChanged="changeVatTypeQuotationLine" />
                </BFormGroup>
              </b-col>
            </b-row>
          </b-container>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Info')"
          label-for="new-invoice-line-description"
        >
          <BFormInput
            id="new-invoice-line-description"
            size="sm"
            v-model="quotationLineService.editItem.info"
          ></BFormInput>
        </BFormGroup>

        <BFormGroup
          label-cols="3"
          v-bind:label="$trans('Extra description')"
          label-for="new-invoice-line-description"
        >
          <BFormTextarea
            id="new-invoice-line-description"
            v-model="quotationLineService.editItem.extra_description"
          ></BFormTextarea>
        </BFormGroup>

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
          <BButton
            :disabled="isLoading"
            @click="cancelEditQuotationLine"
            class="btn btn-secondary update-button"
            type="button"
            size="sm"
            variant="secondary"
          >
            {{ $trans('Cancel') }}
          </BButton>
          <BButton
            v-if="quotationLineService.isEdit"
            @click="doEditCollectionItem"
            class="btn btn-primary"
            size="sm"
            type="button"
            variant="warning"
            :disabled="!isQuotationLineValid"
          >
            {{ $trans('Edit quotation line') }}
          </BButton>
          <BButton
            v-if="!quotationLineService.isEdit"
            @click="addQuotationLine"
            class="btn btn-primary"
            size="sm"
            type="button"
            variant="primary"
            :disabled="!isQuotationLineValid"
          >
            {{ $trans('Add quotation line') }}
          </BButton>
        </footer>
      </div>

      <hr/>
      <b-container>
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
      </b-container>

      <b-container
        v-if="showChangesBlock"
        class="pb-3 has-changes rounded"
      >
        <hr/>
        <b-row v-if="quotationLineService.deletedItems.length">
          <b-col cols="12">
            <h4>{{ $trans("To be deleted") }}</h4>
            <b-table
              small
              :fields="fieldsView"
              :items="quotationLineService.deletedItems"
              responsive="md"
              class="line-table"
            ></b-table>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="2"></b-col>
          <b-col cols="10">
            <BButton
              @click="loadData"
              class="btn btn-secondary"
              type="button"

              :disabled="!quotationLineService.collectionHasChanges"
            >
              {{ $trans('Discard changes') }}
            </BButton>
            &nbsp;
            <BButton
              @click="submitQuotationLines"
              class="btn btn-danger"
              type="button"
              variant="danger"
              :disabled="!quotationLineService.collectionHasChanges"
            >
              {{ $trans('Save changes') }}
            </BButton>
          </b-col>
        </b-row>
      </b-container>

      <footer
        class="modal-footer"
        v-if="!showForm && !isView && quotation.preliminary"
      >
        <BButton
          @click="newQuotationLine"
          class="btn btn-primary update-button"
          type="button"
          variant="primary"
        >
          {{ $trans('New quotation line') }}
        </BButton>
      </footer>

    </div>
  </b-overlay>
</template>
<script>
import {useVuelidate} from "@vuelidate/core";

import PriceInput from "@/components/PriceInput";
import TotalsInputs from "@/components/TotalsInputs";
import IconLinkDelete from "@/components/IconLinkDelete.vue";
import IconLinkEdit from "@/components/IconLinkEdit.vue";

import {QuotationModel} from '@/models/quotations/Quotation.js';
import {ChapterModel} from '@/models/quotations/Chapter'
import {QuotationLineModel, QuotationLineService} from '@/models/quotations/QuotationLine.js';

import VAT from "../quotation_form/VAT";
import {INVOICE_LINE_TYPE_MANUAL} from "./constants";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";

export default {
  name: 'QuotationLineForm',
  components: {
    IconLinkEdit,
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
    const {create} = useToast()
    return {
      v$: useVuelidate(),
      create
    }
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
        {key: 'info', label: $trans('Info'), thAttr: {width: '40%'}},
        {key: 'total', label: $trans('Total'), thAttr: {width: '40%'}},
        {key: 'icons', label: '', thAttr: {width: '20%'}},
      ],
      fieldsView: [
        {key: 'info', label: $trans('Info'), thAttr: {width: '60%'}},
        {key: 'total', label: $trans('Total'), thAttr: {width: '40%'}},
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
    rowClass(item, type) {
      if (item && type === 'row') {
        if (item.hasChanges) {
          return 'has-changes'
        }
      } else {
        return null
      }
    },
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
      if (quotationLines.length === 0) {
        return
      }

      const newQuotationLines = quotationLines.map(
        (line) => new QuotationLineModel({...line, hasChanges: true})
      )

      this.quotationLineService.collection = [
        ...this.quotationLineService.collection,
        ...newQuotationLines
      ]
      this.updateChapterTotals()
      const addedTxt = $trans('Added')
      const txt = newQuotationLines.length === 1 ? $trans('invoice line') : $trans('invoice lines')
      infoToast(create, addedTxt, `${newQuotationLines.length} ${txt} ${addedTxt.toLowerCase()}`)
      this.quotationLineService.collectionHasChanges = true
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
          infoToast(create, $trans('Updated'), $trans('chapter has been updated'))
          this.isLoading = false
          this.quotationLineService.collection = []
          await this.loadData()
          this.$emit('quotationLineSubmitted')
        } catch(error) {
          errorToast(create, $trans('Error updating chapter'))
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
          errorToast(create, $trans('Error loading quotation lines'))
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
.quotation-total {
  margin-bottom: 20px;
}
.total-text {
  font-weight: bold;
}
</style>
