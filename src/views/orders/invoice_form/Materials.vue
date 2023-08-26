<template>
  <Collapse
    :title="$trans('Used materials')"
  >
    <b-container fluid>
      <b-row>
        <b-col cols="2" class="header">
          {{ $trans("Engineer") }}
        </b-col>
        <b-col cols="2" class="header">
          {{ $trans("Material") }}
        </b-col>
        <b-col cols="1" class="header">
          {{ $trans("Amount") }}
        </b-col>
        <b-col cols="3" class="header">
          {{ $trans("Use price") }}
        </b-col>
        <b-col cols="1" class="header">
          {{ $trans("Margin") }}
        </b-col>
        <b-col cols="1" class="header">
          {{ $trans("VAT type") }}
        </b-col>
        <b-col cols="2" />
      </b-row>
      <b-row v-for="material in usedMaterials" :key="material.id" class="material_row">
        <b-col cols="2">
          {{ material.full_name }}
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
            v-model="material.usePrice"
          >
            <b-form-radio :value="usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE">
              {{ $trans('Pur.') }} {{ getMaterialPriceFor(material, usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING">
              {{ $trans('Sel.') }} {{ getMaterialPriceFor(material, usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING).toFormat('$0.00') }}
            </b-form-radio>

            <b-form-radio :value="usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_OTHER">
              <p class="flex">
                {{ $trans("Other") }}:&nbsp;&nbsp;
                <PriceInput
                  v-model="material.price_purchase_ex_other"
                  :currency="material.price_purchase_ex_other_currency"
                  @priceChanged="(val) => setPurchasePriceOther(val, material.material_id) && updateTotals()"
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
            :total="material.total"
            :margin="material.margin"
            :vat="material.vat"
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
import {
  OPTION_NONE, OPTION_USED_MATERIALS_TOTALS,
  OPTION_USER_TOTALS
} from "./constants";
import {toDinero} from "../../../utils";
import HeaderCell from "./Header";
import VAT from "./VAT";
import EngineerPriceRadio from "./EngineerPriceRadio";
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
    EngineerPriceRadio,
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
        USED_MATERIALS_USE_PRICE_PURCHASE: 'purchase',
        USED_MATERIALS_USE_PRICE_SELLING: 'selling',
        USED_MATERIALS_USE_PRICE_OTHER: 'other',
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
    this.totalAmount = this.used_materials.reduce(
      (total, m) => (total + m.amount),
      0
    )

    this.usedMaterials = this.used_materials.map((m) => ({
      ...m,
      vat_type: this.invoice_default_vat,
      margin_perc:  this.invoice_default_margin,
      price_purchase_ex_other: "0.00",
      price_purchase_ex_other_currency: this.default_currency,
      price_purchase_ex_other_dinero: toDinero("0.00", this.default_currency),
      usePrice: this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE,
    }))

    this.materialModels = this.material_models.map((m) => new MaterialModel({
      ...m,
      margin_perc: this.invoice_default_margin
    }))
    this.updateTotals()
  },
  methods: {
    getMaterialPrice(used_material) {
      let model
      switch (used_material.usePrice) {
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex_dinero
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex_dinero
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_OTHER:
          return used_material.price_purchase_ex_other_dinero
        default:
          throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialCurrency(used_material) {
      let model
      switch (used_material.usePrice) {
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_purchase_ex_currency
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING:
          model = this.materialModels.find((m) => m.id === used_material.material_id)
          return model.price_selling_ex_currency
        case this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_OTHER:
          return used_material.price_purchase_ex_other_currency
        default:
          throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialPriceFor(used_material, usePrice) {
      const model = this.materialModels.find((m) => m.id === used_material.material_id)
      if (model) {
        return usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    setPurchasePriceOther(priceDinero, material_id) {
      let model = this.usedMaterials.find((m) => m.material_id === material_id)
      model.price_purchase_ex_other_dinero = priceDinero
      model.price_purchase_ex_other = model.price_purchase_ex_other_dinero.toFormat('0.00')
      model.price_purchase_ex_other_currency = model.price_purchase_ex_other_dinero.getCurrency()
      return true
    },
    updateTotals() {
      this.usedMaterials = this.usedMaterials.map((m) => this.updateUsedMaterialTotals(m))
      this.total = this.getItemsTotal(this.usedMaterials)
      this.totalVAT = this.getItemsTotalVAT(this.usedMaterials)
    },
    updateUsedMaterialTotals(material) {
      const price = this.getMaterialPrice(material)
      const currency = this.getMaterialCurrency(material)
      const total = price.multiply(material.amount)
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (material.margin_perc > 0) {
        margin = total.multiply(material.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(material.vat_type)/100)
      material.currency = currency
      material.total = total_with_margin
      material.vat = vat
      material.margin = margin

      return material
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
