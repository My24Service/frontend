<template>
  <b-overlay :show="isLoading" rounded="sm">
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
            :text='$trans("Material")'
          />
        </b-col>
        <b-col cols="1">
          <HeaderCell
            :text='$trans("Amount")'
          />
        </b-col>
        <b-col cols="4">
          <HeaderCell
            :text='$trans("Use price")'
          />
        </b-col>
        <b-col cols="2">
          <HeaderCell
            :text='$trans("VAT type")'
          />
        </b-col>
        <b-col cols="3" />
      </b-row>
      <b-row v-for="material in this.costService.collection" :key="material.id" class="material_row">
        <b-col cols="2">
          {{ material.name }}
        </b-col>
        <b-col cols="1">
          <input type="number" class="form-control form-control-sm" v-model.number="material.amount" style="width:4em;text-align:right" v-on:change="materialAmountChange(material,$event)" />
        </b-col>
        <b-col cols="4">
          <BFormRadioGroup
            @change="updateTotals"
            v-model="material.use_price"
          >
            <BFormRadio :value="usePriceOptions.USE_PRICE_PURCHASE">
              {{ $trans('Pur.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_PURCHASE).toFormat('$0.00') }}
            </BFormRadio>

            <BFormRadio :value="usePriceOptions.USE_PRICE_SELLING">
              {{ $trans('Sel.') }} {{ getMaterialPriceFor(material, usePriceOptions.USE_PRICE_SELLING).toFormat('$0.00') }}
            </BFormRadio>

            <BFormRadio :value="usePriceOptions.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="material.price_other"
                  :currency="material.price_other_currency"
                  @priceChanged="(val) => otherPriceChanged(val, material)"
                />
              </p>
            </BFormRadio>
          </BFormRadioGroup>
        </b-col>
        <b-col cols="2">
          <VAT @vatChanged="(val) => changeVatType(material, val)" />
        </b-col>
        <b-col cols="3">
          <TotalsInputs
            :total="material.total_dinero"
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
  </b-overlay>
</template>

<script>
import {toDinero} from "@/utils";
import PriceInput from "@/components/PriceInput";
import TotalsInputs from "@/components/TotalsInputs";

import {InvoiceLineService} from "@/models/invoices/InvoiceLine";
import {CostService, COST_TYPE_USED_MATERIALS} from "@/models/orders/Cost";
import {MaterialModel} from "@/models/inventory/Material";

import {
  INVOICE_LINE_TYPE_USED_MATERIALS,
  USE_PRICE_OTHER,
  USE_PRICE_PURCHASE,
  USE_PRICE_SELLING
} from "./constants";
import invoiceMixin from "./mixin.js";
import HeaderCell from "./Header";
import VAT from "./VAT";
import TotalRow from "./TotalRow";
import CollectionSaveContainer from "./CollectionSaveContainer";
import CollectionEmptyContainer from "./CollectionEmptyContainer";
import CostsTable from "./CostsTable";
import AddToInvoiceLinesDiv from "./AddToInvoiceLinesDiv";
import {useToast} from "bootstrap-vue-next";
import {useMainStore} from "@/stores/main";

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()

    // expose to template and other options API hooks
    return {
      create,
      mainStore
    }
  },
  name: "MaterialsComponent",
  emits: ['invoiceLinesCreated', 'emptyCollectionClicked'],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    TotalsInputs,
    HeaderCell,
    VAT,
    TotalRow,
    CollectionSaveContainer,
    CollectionEmptyContainer,
    CostsTable,
    AddToInvoiceLinesDiv,
  },
  watch: {
    material_models: {
      handler(_newValue) {
        console.log(_newValue)
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
      invoiceLineService: new InvoiceLineService(),

      usePriceOptions: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },

      default_currency: this.mainStore.getDefaultCurrency,
      invoice_default_vat: this.mainStore.getInvoiceDefaultVat,

      hasStoredData: false,
      costType: COST_TYPE_USED_MATERIALS,
      parentHasInvoiceLines: false,
      invoiceLineType: INVOICE_LINE_TYPE_USED_MATERIALS,
    }
  },
  async created() {
    this.isLoading = true

    // set vars in service
    this.costService.invoice_default_vat = this.invoice_default_vat
    this.costService.default_currency = this.default_currency

    // calc total amount
    this.totalAmount = this.used_materials.reduce(
      (total, m) => (total + parseInt(m.amount)),
      0
    )

    this.costService.addListArg(`order=${this.order_pk}`)
    this.costService.addListArg(`cost_type=${COST_TYPE_USED_MATERIALS}`)

    await this.loadData()

    this.checkParentHasInvoiceLines(this.invoiceLinesParent)

    this.isLoading = false
  },
  methods: {
    // Triggered when the 'amount' field changes value.
    materialAmountChange(material, event) {
      // console.log( material )

      // Update all the values.
      material.amount_decimal = material.amount
      material.total = material.amount * material.price;
      material.vat = material.vat_type > 0 ? (material.total * (material.vat_type / 100)) : 0;
      material.total_dinero = toDinero( material.total, material.total_currency )
      material.vat_dinero = toDinero( material.vat, material.vat_currency )

      // Recalculate the total amount, for if the total is added as a single invoice-line,
      // the 'previous' totalAmount would be applied.
      for(const m of this.used_materials) {
        if (m.identifier === material.identifier) {
          m.amount = material.amount
        }
      }

      this.totalAmount = this.used_materials.reduce(
        (total, m) => (total + parseInt(m.amount)),
        0
      )
    },
    emptyCollectionClicked() {
      this.emptyCollection()
      this.$emit('emptyCollectionClicked', this.invoiceLineType)
    },
    getMaterialName(material_id) {
      const material = this.materialModels.find((m) => m.id === material_id)
      return material ? material.name : $trans("unknown")
    },
    async loadData() {
      // create material models
      this.materialModels = this.material_models.map((m) => new MaterialModel(m))

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
            this.getPriceForUsedMaterial(
              {...material, use_price: this.usePriceOptions.USE_PRICE_PURCHASE}),
            this.default_currency,
            this.getDefaultProps()
          )
        ))

        // update totals
        this.updateTotals()
      }
    },
    getDefaultProps() {
      return {
        use_price: this.usePriceOptions.USE_PRICE_SELLING,
        order: this.order_pk,
      }
    },
    otherPriceChanged(priceDinero, material) {
      material.setPriceField('price_other', priceDinero)
      this.updateTotals()
    },
    getPriceForUsedMaterial(material) {
      return this.getPrice(material.id, material.name, material.use_price, material.price_other)
    },
    getPriceForMaterialCost(cost) {
      return this.getPrice(cost.material, cost.name, cost.use_price, cost.price_other)
    },
    getPrice(material_id, material_name, use_price, price_other) {
      let model
      switch (use_price) {
        case this.usePriceOptions.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === material_id)
          if (!model) {
            console.error(`used material not found (deleted?): ${material_name}, ${material_id}`)
            return
          }
          return model.price_purchase_ex
        case this.usePriceOptions.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === material_id)
          if (!model) {
            console.error(`used material not found (deleted?): ${material_name}, ${material_id}`)
            return
          }
          return model.price_selling_ex
        case this.usePriceOptions.USE_PRICE_OTHER:
          return price_other
        default:
          throw `unknown use price: ${use_price}`
      }
    },
    getCurrency(_used_material) {
      return this.default_currency
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material)
      if (model) {
        return use_price === this.usePriceOptions.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error(`getMaterialPriceFor: model not found for: ${used_material.name}, ${used_material.id}`)
        return toDinero('0.00', this.default_currency)
      }
    },
    updateTotals() {
      // provide methods to get price and currency
      this.costService.updateTotals(
        this.getPriceForMaterialCost,
        this.getCurrency
      )

      this.total_dinero = this.costService.getItemsTotal()
      this.totalVAT_dinero = this.costService.getItemsTotalVAT()
    },
    getDescriptionUserTotalsInvoiceLine(cost) {
      return `${$trans("material")}: ${this.getMaterialName(cost.material)}`
    },
    getDescriptionOnlyTotalInvoiceLine() {
      return `${$trans("Used materials")}`
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
