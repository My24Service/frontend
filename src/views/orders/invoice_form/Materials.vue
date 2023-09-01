<template>
  <Collapse
    :title="$trans('Used materials')"
  >
    <b-container fluid>
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
      <b-row v-for="material in usedMaterials" :key="material.id" class="material_row">
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
            <b-form-radio :value="usePriceOptionsMaterial.USE_PRICE_PURCHASE">
              {{ $trans('Pur.') }} {{ getMaterialPriceFor(material, usePriceOptionsMaterial.USE_PRICE_PURCHASE).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsMaterial.USE_PRICE_SELLING">
              {{ $trans('Sel.') }} {{ getMaterialPriceFor(material, usePriceOptionsMaterial.USE_PRICE_SELLING).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsMaterial.USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="material.price_other"
                  :currency="material.price_other_currency"
                  @priceChanged="(val) => material.setPriceField('price_other', val) && updateTotals()"
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
        :total="total"
        :total_vat="totalVAT"
      />

      <div class="use-on-invoice-container">
        <h3>{{ $trans("What to add as invoice lines")}}</h3>
        <b-form-group>
          <b-form-radio-group
            v-model="useOnInvoiceSelected"
            :options="useOnInvoiceOptions"
          ></b-form-radio-group>
        </b-form-group>
      </div>
    </b-container>
  </Collapse>
</template>

<script>
import Totals from "./Totals";
import Collapse from "../../../components/Collapse";
import invoiceMixin from "./mixin.js";
import {InvoiceLineModel} from "../../../models/orders/InvoiceLine";
import {COST_TYPE_USED_MATERIALS, CostModel} from "../../../models/orders/Cost";
import {
  OPTION_NONE, OPTION_USED_MATERIALS_TOTALS,
  OPTION_USER_TOTALS, USE_PRICE_OTHER, USE_PRICE_PURCHASE, USE_PRICE_SELLING
} from "./constants";
import HeaderCell from "./Header";
import VAT from "./VAT";
import materialService, {MaterialModel} from "../../../models/inventory/Material";
import PriceInput from "../../../components/PriceInput";
import MarginInput from "./MarginInput";
import TotalRow from "./TotalRow";

export default {
  name: "MaterialsComponent",
  emits: ['invoiceLinesCreated'],
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    Totals,
    Collapse,
    HeaderCell,
    VAT,
    MarginInput,
    TotalRow,
  },
  props: {
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
  },
  data() {
    return {
      usedMaterials: null,
      materialModels: null,

      total: null,
      totalVAT: null,
      totalAmount: null,

      usePriceOptionsMaterial: {
        USE_PRICE_PURCHASE,
        USE_PRICE_SELLING,
        USE_PRICE_OTHER,
      },

      default_currency: this.$store.getters.getDefaultCurrency,
      invoice_default_vat: this.$store.getters.getInvoiceDefaultVat,
      invoice_default_margin: this.$store.getters.getInvoiceDefaultMargin,

      useOnInvoiceOptions: [
        { text: this.$trans('Total'), value: OPTION_USED_MATERIALS_TOTALS },
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceSelected: null,
    }
  },
  created() {
    // calc total amount
    this.totalAmount = this.used_materials.reduce(
      (total, m) => (total + m.amount),
      0
    )

    // set material models with margin perc
    this.materialModels = this.material_models.map((m) => new MaterialModel({
      ...m,
      margin_perc: this.invoice_default_margin
    }))

    // create cost models
    let count = 0
    this.usedMaterials = this.used_materials.map((m) => (
      new CostModel({
        ...m,
        ...this.getDefaultCostProps(),
        material: m.material_id,
        amount_decimal: m.amount,
        user: m.user_id,
        price: this.getMaterialPrice(
          {...m, use_price: this.usePriceOptionsMaterial.USE_PRICE_PURCHASE}).toFormat('0.00'),
        price_currency: this.getMaterialCurrency(
          {...m, use_price: this.usePriceOptionsMaterial.USE_PRICE_PURCHASE}),
        data_index: count++,
      })
    ))

    // update totals
    this.updateTotals()
  },
  methods: {
    getDefaultCostProps() {
      // default props for cost model
      return {
        margin_perc:  this.invoice_default_margin,
        vat_type: this.invoice_default_vat,
        vat_currency: this.default_currency,
        margin_currency: this.default_currency,
        price_currency: this.default_currency,
        total_currency: this.default_currency,
        price_other: "0.00",
        price_other_currency: this.default_currency,
        use_price: this.usePriceOptionsMaterial.USE_PRICE_PURCHASE,
        cost_type: COST_TYPE_USED_MATERIALS
      }
    },
    getMaterialPrice(used_material) {
      let model
      switch (used_material.use_price) {
        case this.usePriceOptionsMaterial.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex_dinero
        case this.usePriceOptionsMaterial.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex_dinero
        case this.usePriceOptionsMaterial.USE_PRICE_OTHER:
          return used_material.price_other_dinero
        default:
          throw `unknown use price: ${used_material.use_price}`
      }
    },
    getMaterialCurrency(used_material) {
      let model
      switch (used_material.use_price) {
        case this.usePriceOptionsMaterial.USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex_currency
        case this.usePriceOptionsMaterial.USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex_currency
        case this.usePriceOptionsMaterial.USE_PRICE_OTHER:
          return used_material.price_other_currency
        default:
          throw `unknown use price: ${used_material.use_price}`
      }
    },
    getMaterialPriceFor(used_material, use_price) {
      const model = this.materialModels.find((m) => m.id === used_material.material_id)
      if (model) {
        return use_price === this.usePriceOptionsMaterial.USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    updateTotals() {
      for (const material of this.usedMaterials) {
        material.updateTotals(this.getMaterialPrice(material), this.getMaterialCurrency(material))
      }

      this.total = this.getItemsTotalv2(this.usedMaterials)
      this.totalVAT = this.getItemsTotalVATv2(this.usedMaterials)
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
