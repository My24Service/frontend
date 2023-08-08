<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>
        </div>

        <b-container fluid>
          <h3>{{ $trans("Materials") }}</h3>
          <b-row>
            <b-col cols="3" class="header">
              {{ $trans("Name") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Identifier") }}
            </b-col>
            <b-col cols="2" class="header ml-3">
              {{ $trans("Purchase price ex.") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="3" class="header">
              {{ $trans("Selling price ex.") }}
            </b-col>
            <b-col cols="1" />
          </b-row>
          <b-row v-for="material in material_models" :key="material.id">
            <b-col cols="3">
              {{ material.name }}
            </b-col>
            <b-col cols="2">
              {{ material.identifier }}
            </b-col>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="7">
                    <PriceInput
                      v-model="material.price_purchase_ex"
                      :currency="material.price_purchase_ex_currency"
                      @priceChanged="(val) => material.setPurchasePrice(val) && updateMaterialTotals()"
                    />
                  </b-col>
                  <b-col cols="5">
                    <p class="flex">
                      <span class="value-container">{{ material.price_purchase_ex_dinero.toFormat('$0.00') }}</span>
                    </p>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
            <b-col cols="1">
              <p class="flex pl-3">
                <b-form-input
                  v-model="material.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="3">
              <b-container>
                <b-row>
                  <b-col cols="3">
                    <p class="flex">
                      <span class="value-container">{{ material.price_selling_ex_dinero.toFormat('$0.00') }}</span>
                    </p>
                  </b-col>
                  <b-col cols="9">
                    <p class="flex">
                      <PriceInput
                        :ref="`selling_price_${material.id}`"
                        v-model="material.price_selling_ex"
                        :currency="material.price_selling_ex_currency"
                        @priceChanged="(val) => material.setSellingPrice(val) && updateMaterialTotals()"
                      />
                      <span class="value-container">
                        <b-link
                          @click="() => { material.recalcSelling() && updateMaterialTotals() }"
                          :title="`${$trans('Recalculate selling price with margin')}`"
                        >
                          {{ $trans("recalc")}}
                        </b-link>
                      </span>
                    </p>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-button
                  @click="() => { updateMaterial(material.id) }"
                  class="btn btn-primary update-button"
                  size="sm"
                  type="button"
                  variant="primary"
                >
                  {{ $trans("Update") }}
                </b-button>
              </p>
            </b-col>
          </b-row>
        </b-container>

        <b-container fluid>
          <h3>{{ $trans("Engineers") }}</h3>
          <b-row>
            <b-col cols="9" class="header">
              {{ $trans("Name") }}
            </b-col>
            <b-col cols="2" class="header ml-3">
              {{ $trans("Hourly price") }}
            </b-col>
            <b-col cols="1" />
          </b-row>
          <b-row v-for="user in engineer_models" :key="user.id">
            <b-col cols="9">
              {{ user.full_name }}
            </b-col>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="7">
                    <PriceInput
                      v-model="user.engineer.hourly_rate"
                      :currency="user.engineer.hourly_rate_currency"
                      @priceChanged="(val) => user.engineer.setHourlyRate(val) && updateActivityTotals()"
                    />
                  </b-col>
                  <b-col cols="5">
                    <p class="flex">
                      <span class="value-container">{{ user.engineer.hourly_rate_dinero.toFormat('$0.00') }}</span>
                    </p>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-button
                  @click="() => { updateEngineer(user.id) }"
                  class="btn btn-primary update-button"
                  size="sm"
                  type="button"
                  variant="primary"
                >
                  {{ $trans("Update") }}
                </b-button>
              </p>
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Used materials") }}</h3>
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
          <b-row v-for="material in used_materials" :key="material.id" class="material_row">
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
                @change="updateMaterialTotals()"
                v-model="material.usePrice"
              >
                <b-form-radio value="purchase">
                  Pur. {{ getMaterialPriceFor(material, "purchase").toFormat('$0.00') }}
                </b-form-radio>

                <b-form-radio value="selling">
                  Sel. {{ getMaterialPriceFor(material, "selling").toFormat('$0.00') }}
                </b-form-radio>

                <b-form-radio value="other">
                  <p class="flex">
                    {{ $trans("Other") }}:
                    <b-container>
                      <b-row>
                        <b-col cols="7">
                          <PriceInput
                            v-model="material.price_purchase_ex_other"
                            :currency="material.price_purchase_ex_other_currency"
                            @priceChanged="(val) => setPurchasePriceOther(val, material.material_id) && updateMaterialTotals()"
                          />
                        </b-col>
                        <b-col cols="5">
                          <p class="flex">
                            <span class="value-container">
                              {{ material.price_purchase_ex_other_dinero.toFormat('$0.00') }}
                            </span>
                          </p>
                        </b-col>
                      </b-row>
                    </b-container>
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateMaterialTotals()"
                  v-model="material.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateMaterialTotals"
                :value="invoice_default_vat"
                v-model="material.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Total") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="material.total.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Margin") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="material.margin.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("VAT") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="material.vat.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container header">{{ $trans("Total") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value='materialsTotal.toFormat("$0.00")'
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container header">{{ $trans("VAT") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value='materialsTotalVAT.toFormat("$0.00")'
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>
          </b-row>
        </b-container>

        <b-container fluid>
          <h3>{{ $trans("Activity") }}</h3>
          <b-row>
            <b-col cols="2" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Work hours") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Travel hours") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Engineer rate") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2" />
          </b-row>
          <b-row v-for="activity in activity_user_totals" :key="activity.user_id" class="material_row">
            <b-col cols="2">
              {{ getFullname(activity.user_id) }}
            </b-col>
            <b-col cols="2">
              {{ activity.work_total }}
            </b-col>
            <b-col cols="2">
              {{ activity.travel_total }}
            </b-col>
            <b-col cols="2">
              {{ activity.engineer_rate_dinero.toFormat("$0.00") }}
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateActivityTotals()"
                  v-model="activity.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateActivityTotals"
                :value="invoice_default_vat"
                v-model="activity.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <b-container>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Total") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="activity.total.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("Margin") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="activity.margin.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
                <b-row>
                  <b-col cols="4">
                    <span class="value-container">{{ $trans("VAT") }}</span>
                  </b-col>
                  <b-col cols="8">
                    <b-form-input
                      readonly
                      :value="activity.vat.toFormat('$0.00')"
                      size="sm"
                      class="input-total-used"
                    ></b-form-input>
                  </b-col>
                </b-row>
              </b-container>
            </b-col>

          </b-row>
        </b-container>

          <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="cancelForm" type="button" variant="secondary">
              {{ $trans('Cancel') }}</b-button>
            <b-button @click="submitForm" type="button" variant="primary">
              {{ $trans('Submit') }}</b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import invoiceModel from '../../models/orders/Invoice.js'
import invoiceLineModel from '../../models/orders/InvoiceLine.js'
import memberModel from "../../models/member/Member";
//
import {toDinero} from "../../utils";
import PriceInput from "../../components/PriceInput";

import { MaterialModel } from "../../models/inventory/Material";
import materialService from "../../models/inventory/Material";
import { EngineerUserModel } from "../../models/company/UserEngineer";
import engineerService from "../../models/company/UserEngineer";

export default {
  name: 'InvoiceForm',
  components: {
    PriceInput
  },
  props: {
    uuid: {
      type: [String],
      default: null
    },
    pk: {
      type: [String, Number],
      default: null
    }
  },
  data () {
    return {
      isLoading: false,
      invoiceLines: [],
      deletedInvoiceLines: [],
      submitClicked: false,
      invoice: invoiceModel.getFields(),
      errorMessage: null,

      order: null,
      member: null,
      invoice_id: null,
      vat_types: [],
      default_currency: null,
      invoice_default_margin: null,
      invoice_default_hourly_rate: null,
      invoice_default_vat: null,
      hourly_rate_engineer_customer: null,
      call_out_costs: null,
      call_out_costs_from_customer: null,

      used_materials: [],
      material_models: [],
      materialsTotal: null,
      materialsTotalVAT: null,
      usePriceOptionsMaterial: [
        { text: 'Purchase', value: 'purchase' },
        { text: 'Selling', value: 'selling' },
      ],

      activity: [],
      activity_user_totals: {},
      engineer_models: [],
      activityTotal: null,
      activityTotalVAT: null,
      usePriceOptionsActivity: [
        { text: 'Customer', value: 'customer' },
        { text: 'Engineer', value: 'engineer' },
      ],

      extra_work: [],
      extra_work_totals: {},


    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
  },
  async created() {
    if (this.isCreate) {
      this.isLoading = true
      this.vat_types = await memberModel.getVATTypes()
      this.invoice = invoiceModel.getFields()
      const invoiceData = await invoiceModel.getData(this.uuid)

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id
      this.default_currency = invoiceData.default_currency
      this.invoice_default_margin = invoiceData.invoice_default_margin
      this.invoice_default_hourly_rate = invoiceData.invoice_default_hourly_rate
      this.invoice_default_vat = invoiceData.invoice_default_vat
      this.call_out_costs = invoiceData.call_out_costs
      this.call_out_costs_from_customer = invoiceData.call_out_costs_from_customer

      this.used_materials = invoiceData.used_materials.map((m) => ({
        ...m,
        vat_type: this.invoice_default_vat,
        margin_perc:  this.invoice_default_margin,
        price_purchase_ex_other: "0.00",
        price_purchase_ex_other_currency: this.default_currency,
        price_purchase_ex_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: 'purchase',
      }))

      this.material_models = invoiceData.material_models.map((m) => new MaterialModel({
          ...m,
        margin_perc: this.invoice_default_margin
      }))
      this.updateMaterialTotals()

      this.activity = invoiceData.activity //
      this.engineer_models = invoiceData.engineer_models.map((m) => new EngineerUserModel({
        ...m,
        margin_perc: this.invoice_default_margin
      }))

      this.activity_user_totals = invoiceData.activity_totals['user_totals'].map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        margin_perc: this.invoice_default_margin
      }))
      this.updateActivityTotals()

      this.extra_work = invoiceData.extra_work
      this.extra_work_totals = invoiceData.extra_work_totals
      this.hourly_rate_engineer_customer = invoiceData.hourly_rate_engineer_customer
      this.isLoading = false
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    // activity
    async updateEngineer(user_id) {
      let engineer_user = this.engineer_models.find((m) => m.id === user_id)
      // removed unused fields, TODO make this smarter lol
      delete engineer_user.engineer.address
      delete engineer_user.engineer.postal
      delete engineer_user.engineer.city
      delete engineer_user.engineer.mobile
      delete engineer_user.engineer.email_tablet
      delete engineer_user.engineer.vca
      delete engineer_user.engineer.passport
      delete engineer_user.engineer.cost_price
      delete engineer_user.engineer.license_plate
      delete engineer_user.engineer.inspection_date_car
      delete engineer_user.engineer.cost_price_car
      delete engineer_user.engineer.inspection_date_tools
      delete engineer_user.engineer.cost_price_tools
      delete engineer_user.engineer.remarks
      delete engineer_user.engineer.contract_hours_week
      delete engineer_user.engineer.latest_event
      delete engineer_user.engineer.prefered_location

      delete engineer_user.username
      delete engineer_user.first_name
      delete engineer_user.last_name
      delete engineer_user.email
      delete engineer_user.password1
      delete engineer_user.password2
      delete engineer_user.password
      delete engineer_user.date_joined

      const updatedEngineerUserJson = await engineerService.update(user_id, engineer_user)
      engineer_user.engineer.setPriceFields(updatedEngineerUserJson.engineer)
      this.updateActivityTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Hourly rate engineer has been updated'))
    },
    getFullname(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.full_name
    },
    getEngineerRateDinero(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return toDinero(user.engineer.hourly_rate, user.engineer.hourly_rate_currency)
    },
    getEngineerRate(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate
    },
    getEngineerRateCurrency(user_id) {
      const user = this.engineer_models.find((m) => m.id === user_id)
      return user.engineer.hourly_rate_currency
    },
    updateActivityTotals() {
      this.activity_user_totals = this.activity_user_totals.map((m) => this.updateUserActivityTotals(m))
      this.materialsTotal = this.getItemsTotal(this.used_materials)
      this.materialsTotalVAT = this.getItemsTotalVAT(this.used_materials)
    },
    updateUserActivityTotals(activity) {
      const price = this.getEngineerRateDinero(activity.user_id)
      const currency = this.getEngineerRateCurrency(activity.user_id)
      // 16:15
      const hours_parts = activity.hours_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
      console.log(activity.hours_total, total.toFormat("$0.00"))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (activity.margin_perc > 0) {
        margin = total.multiply(activity.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(activity.vat_type)/100)
      activity.currency = currency
      activity.total = total_with_margin
      activity.vat = vat
      activity.margin = margin

      return activity

    },
    // materials
    async updateMaterial(material_id) {
      let material = this.material_models.find((m) => m.id === material_id)
      delete material.image
      const updatedMaterialJson = await materialService.update(material_id, material)
      material.setPriceFields(updatedMaterialJson)
      this.updateMaterialTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Material prices have been updated'))
    },
    getMaterialPrice(used_material) {
      if (used_material.usePrice === 'purchase') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_dinero
      } else if (used_material.usePrice === 'selling') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_dinero
      } else if (used_material.usePrice === 'other') {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_dinero
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialCurrency(used_material) {
      if (used_material.usePrice === 'purchase') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_currency
      } else if (used_material.usePrice === 'selling') {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_currency
      } else if (used_material.usePrice === 'other') {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_currency
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialPriceFor(used_material, usePrice) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        return usePrice === 'purchase' ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
      } else {
        console.error('MODEL NOT FOUND for ', used_material)
      }
    },
    setPurchasePriceOther(priceDinero, material_id) {
      let model = this.used_materials.find((m) => m.material_id === material_id)
      model.price_purchase_ex_other_dinero = priceDinero
      model.price_purchase_ex_other = model.price_purchase_ex_other_dinero.toFormat('0.00')
      model.price_purchase_ex_other_currency = model.price_purchase_ex_other_dinero.getCurrency()
      return true
    },
    updateMaterialTotals() {
      this.used_materials = this.used_materials.map((m) => this.updateUsedMaterialTotals(m))
      this.materialsTotal = this.getItemsTotal(this.used_materials)
      this.materialsTotalVAT = this.getItemsTotalVAT(this.used_materials)
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
    getItemsTotal(items) {
      return items.reduce(
        (total, m) => (total.add(m.total)),
        toDinero("0.00", items[0].currency)
      )
    },
    getItemsTotalVAT(items) {
      return items.reduce(
        (total, m) => (total.add(m.vat)),
        toDinero("0.00", items[0].currency)
      )
    },
    async submitForm() {
      this.isLoading = true

      if (this.isCreate) {
        try {
          const invoice = invoiceModel.insert(this.invoice)
          for (let invoiceLine of this.invoiceLines) {
            invoiceLine.invoice = invoice.id
            await invoiceLineModel.insert(invoiceLine)
          }
        } catch(error) {
          this.errorToast(this.$trans('Error creating invoice lines'))
          this.isLoading = false
        }

        this.infoToast(this.$trans('Created'), this.$trans('Invoice has been created'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})

        return
      }

      try {
        await invoiceModel.update(this.pk, this.invoice)

        // invoiceLine create/update
        for (let invoiceLine of this.invoiceLines) {
          invoiceLine.order = this.pk
          if (invoiceLine.id) {
            await invoiceLineModel.update(invoiceLine.id, invoiceLine)
          } else {
            await invoiceLineModel.insert(invoiceLine)
          }
        }

        // invoiceLine delete
        for (const invoiceLine of this.deletedInvoiceLines) {
          if (invoiceLine.id) {
            await invoiceLineModel.delete(invoiceLine.id)
          }
        }

        this.infoToast(this.$trans('Updated'), this.$trans('Invoice has been updated'))
        this.isLoading = false
        await this.$router.push({name: 'order-invoice-view', params: {pk: this.pk}})
      } catch(error) {
        console.log('Error updating invoice', error)
        this.errorToast(this.$trans('Error updating invoice'))
        this.isLoading = false
      }
    },
    async loadInvoice() {
      this.isLoading = true

      try {
        this.invoice = await invoiceModel.detail(this.pk)
        this.isLoading = false
      } catch(error) {
        console.log('error fetching invoice', error)
        this.errorToast(this.$trans('Error loading invoice'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
<style scoped>
.material_row {
  padding-bottom: 10px;
  padding-top: 5px;
  border-bottom: 1px silver solid;
}
.flex {
  display : flex;
  margin-top: auto;
}
.input-margin {
  width: 30px;
  padding: 1px;
  margin: 1px;
  text-align: center;
}
.value-container {
  padding-top: 4px;
  padding-right: 4px;
  padding-left: 4px;
}
.percentage-container {
  padding-top: 4px;
  padding-left: 4px;
}
.input-total-used {
  width: 90px;
  padding: 1px;
  margin: 1px;
  text-align: right;
}
.update-button {
  margin-bottom: 8px;
}
.header {
  font-size: 14px;
  font-weight: bold;
}
</style>
