<template>
  <b-overlay :show="isLoading" rounded="sm">
    <Collapse
      :title="$trans('Used materials')"
    >
      <div
        class="costs-table"
        v-if="!isLoading && hasStoredData"
      >
        <CostsTable
          :collection="costService.collection"
          :type="costType"
        />

        <CollectionEmptyContainer
          @buttonClicked="() => { emptyCollectionClicked() }"
        />

        <AddToInvoiceLinesDiv
          v-if="!parentHasInvoiceLines"
          :useOnInvoiceOptions="useOnInvoiceOptions"
          @buttonClicked="createInvoiceLinesClicked"
        />

      </div>

      <b-container fluid v-if="!isLoading && !hasStoredData">
        <b-row>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Engineer")'
            />
          </b-col>
          <b-col cols="2">
            <HeaderCell
              :text='$trans("Material")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Amount")'
            />
          </b-col>
          <b-col cols="3">
            <HeaderCell
              :text='$trans("Use price")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("Margin")'
            />
          </b-col>
          <b-col cols="1">
            <HeaderCell
              :text='$trans("VAT type")'
            />
          </b-col>
          <b-col cols="2" />
        </b-row>
        <b-row v-for="material in this.costService.collection" :key="material.id" class="material_row">
          <b-col cols="2">
            {{ getFullname(material.user_id) }}
          </b-col>
          <b-col cols="2">
            {{ material.name }}
          </b-col>
          <b-col cols="1">
            {{ material.amount }}
          </b-col>
          <b-col cols="3">
            <b-form-radio-group
              @change="updateTotals"
              v-model="material.use_price"
            >
              <b-form-radio :value="usePriceOptions.USE_PRICE_PURCHASE">
                {{ $trans('Pur.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_SELLING">
                {{ $trans('Sel.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
              </b-form-radio>

              <b-form-radio :value="usePriceOptions.USE_PRICE_OTHER">
                <p class="flex">
                  {{ $trans("Other") }}:&nbsp;&nbsp;
                  <PriceInput
                    v-model="material.price_other"
                    :currency="material.price_other_currency"
                    @priceChanged="(val) => otherPriceChanged(val, material)"
                  />
                </p>
              </b-form-radio>
            </b-form-radio-group>
          </b-col>
          <b-col cols="1">
            <MarginInput
              :margin="material.margin_perc"
              @inputChanged="(val) => marginChanged(material, val)"
            />
          </b-col>
          <b-col cols="1">
            <VAT @vatChanged="(val) => changeVatType(material, val)" />
          </b-col>
          <b-col cols="2">
            <Totals
              :total="material.total_dinero"
              :margin="material.margin_dinero"
              :vat="material.vat_dinero"
            />
          </b-col>
        </b-row>
        <TotalRow
          :items_total="totalAmount"
          :total="total_dinero"
          :total_vat="totalVAT_dinero"
        />

        <CollectionSaveContainer
          @buttonClicked="() => { saveCollection() }"
        />

      </b-container>
    </Collapse>
  </b-overlay>
</template>

<script>
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import invoiceLineService from "../../../models/orders/InvoiceLine";
import CostService, {COST_TYPE_USED_MATERIALS} from "../../../models/orders/Cost";
import {
  INVOICE_LINE_TYPE_USED_MATERIALS,
  OPTION_NONE,
  OPTION_ONLY_TOTAL,
  OPTION_USER_TOTALS,
  USE_PRICE_OTHER,
  USE_PRICE_PURCHASE,
  USE_PRICE_SELLING
} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import materialService, {MaterialModel} from "../../../models/inventory/Material";
import PriceInput from "../../../components/PriceInput";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";
import CollectionSaveContainer from "./CollectionSaveContainer";
import CollectionEmptyContainer from "./CollectionEmptyContainer";
import CostsTable from "./CostsTable";
import AddToInvoiceLinesDiv from "./AddToInvoiceLinesDiv";

export default {
  name: "MaterialsComponent",
  emits: ['invoiceLinesCreated', 'emptyCollectionClicked'],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
    CollectionSaveContainer,
    CollectionEmptyContainer,
    CostsTable,
    AddToInvoiceLinesDiv,
  },
  watch: {
    material_models: {
      handler(newValue) {
        console.log('material_models changed', newValue)
        this.loadData()
      },
      deep: true
    },
  },
  props: {
    order_pk: {
      type: [Number],
      default: null
    },
    material_models: {
      type: [Array],
      default: null
    },
    used_materials: {
      type: [Array],
      default: null
    },
    engineer_models: {
      type: [Array],
      default: null
    },
    customer: {
      type: [Object],
      default: null
    },
    invoiceLinesParent: {
      type: [Array],
      default: null
    },
  },
  data() {
    return {
      isLoading: false,

      materialModels: null,

      total_dinero: null,
      totalVAT_dinero: null,
      totalAmount: null,

      costService: new CostService(),

      usePriceOptions: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      hasStoredData: false,
      costType: COST_TYPE_USED_MATERIALS,
      parentHasInvoiceLines: false,
      invoiceLineType: INVOICE_LINE_TYPE_USED_MATERIALS,
      invoiceLineService
    }
  },
  async created() {
    this.isLoading = true

    // set vars in service
    this.costService.invoice_default_margin = this.invoice_default_margin
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    // calc total amount
    this.totalAmount = this.used_materials.reduce(
      (total, m) => (total + m.amount),
      0
    )

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_USED_MATERIALS}`)

    await this.loadData()

    this.checkParentHasInvoiceLines(this.invoiceLinesParent)

    this.isLoading = false
  },
  methods: {
    emptyCollectionClicked() {
      this.emptyCollection()
      this.$emit('emptyCollectionClicked', this.invoiceLineType)
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : this.$trans("unknown")
    },
    async loadData() {
      // set material models with margin perc
      this.materialModels = this.material_models.map((m) => new MaterialModel({
        ...m,
        margin_perc: this.invoice_default_margin
      }))

      this.costService.collection = []
      this.hasStoredData = false
      // check if we already stored costs
      const response = await this.costService.list()
      if (response.results.length > 0) {
        this.costService.collection = response.results.map((cost) => (
          new this.costService.model(cost)
        ))

        this.total_dinero = this.costService.getItemsTotal()
        this.totalVAT_dinero = this.costService.getItemsTotalVAT()

        this.hasStoredData = true
      } else {
        // map input to Cost model collection
        this.costService.collection = this.used_materials.map((material) => (
          this.costService.newModelFromMaterial(
            material,
            this.getPrice(
              {...material, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
            this.getCurrency(
              {...material, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
            this.getDefaultProps()
          )
        ))

        // update totals
        this.updateTotals()
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_PURCHASE,
        order: this.order_pk,
      }
    },
    otherPriceChanged(priceDinero, material) {
      material.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    getPrice(used_material) {
      let model
      switch (used_material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return used_material.price_other
        default:
          throw `unknown use price: ${used_material.use_price}`
      }
    },
    getCurrency(used_material) {
      let model
      switch (used_material.use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex_currency
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex_currency
        case this.usePriceOptions.USE_PRICE_OTHER:
          return used_material.price_other_currency
        default:
          throw `unknown use price: ${used_material.use_price}`
      }
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material_id)
      if (model) {
        return use_price === this.usePriceOptions.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPrice,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
    },
    getDescriptionUserTotalsInvoiceLine(cost) {
      return `${this.$trans("material")}: ${cost.user_full_name}, ${this.getMaterialName(cost.material)}`
    },
    getDescriptionOnlyTotalInvoiceLine() {
      return `${this.$trans("Call out costs")}`
    },
    getTotalAmountInvoiceLine() {
      return this.totalAmount
    },
  }
}
</script>

<style scoped>
.flex {
  display : flex;
  margin-top: auto;
}
</style>
