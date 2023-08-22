<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="container app-form">
      <b-form v-if="!isLoading">
        <div v-if="isCreate">
          <h2>{{ $trans('New invoice') }}</h2>
        </div>

        <Collapse
          :title="$trans('Manage prices')"
        >
          <b-container fluid>
            <h3>{{ $trans("Materials") }}</h3>
            <b-row>
              <b-col cols="2" class="header">
                {{ $trans("Name") }}
              </b-col>
              <b-col cols="2" class="header">
                {{ $trans("Identifier") }}
              </b-col>
              <b-col cols="3" class="header ml-3">
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
              <b-col cols="2">
                {{ material.name }}
              </b-col>
              <b-col cols="2">
                {{ material.identifier }}
              </b-col>
              <b-col cols="3">
                <b-container>
                  <b-row>
                    <b-col cols="10">
                      <PriceInput
                        v-model="material.price_purchase_ex"
                        :currency="material.price_purchase_ex_currency"
                        @priceChanged="(val) => material.setPurchasePrice(val) && updateMaterialTotals()"
                      />
                    </b-col>
                    <b-col cols="2">
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
                    <b-col cols="10">
                      <PriceInput
                        :ref="`selling_price_${material.id}`"
                        v-model="material.price_selling_ex"
                        :currency="material.price_selling_ex_currency"
                        @priceChanged="(val) => material.setSellingPrice(val) && updateMaterialTotals()"
                      />
                    </b-col>
                    <b-col cols="2">
                      <p class="flex">
                        <span class="value-container">
                          <b-link
                            @click="() => { material.recalcSelling() && updateMaterialTotals() }"
                            :title="`${$trans('Recalculate selling price with margin')}`"
                          >
                            <b-icon-arrow-repeat aria-hidden="true"></b-icon-arrow-repeat>
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

          <hr/>

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
                <PriceInput
                  v-model="user.engineer.hourly_rate"
                  :currency="user.engineer.hourly_rate_currency"
                  @priceChanged="(val) => user.engineer.setHourlyRate(val) && updateHoursTotals()"
                />
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
            <h3>{{ $trans("Prices for customer") }}</h3>
            <b-row>
              <b-col cols="9" class="header">
                {{ $trans("Name") }}
              </b-col>
              <b-col cols="2" class="header ml-3">
                {{ $trans("Price") }}
              </b-col>
              <b-col cols="1" />
            </b-row>
            <b-row>
              <b-col cols="9">
                {{ $trans("Hourly rate engineer") }}
              </b-col>
              <b-col cols="2">
                <PriceInput
                  v-model="customer.hourly_rate_engineer"
                  :currency="customer.hourly_rate_engineer_currency"
                  @priceChanged="(val) => customer.setHourlyRateEngineer(val) && updateHoursTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
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
            <b-row>
              <b-col cols="9">
                {{ $trans("Call out costs") }}
              </b-col>
              <b-col cols="2">
                <PriceInput
                  v-model="customer.call_out_costs"
                  :currency="customer.call_out_costs_currency"
                  @priceChanged="(val) => customer.setCallOutCosts(val) && updateHoursTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
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
            <b-row>
              <b-col cols="9">
                {{ $trans("Price/KM") }}
              </b-col>
              <b-col cols="2">
                <PriceInput
                  v-model="customer.price_per_km"
                  :currency="customer.price_per_km_currency"
                  @priceChanged="(val) => customer.setPricePerKm(val) && updateDistanceTotals()"
                />
              </b-col>
              <b-col cols="1">
                <p class="flex">
                  <b-button
                    @click="() => { updateCustomer() }"
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
        </Collapse>

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
                      @priceChanged="(val) => setPurchasePriceOther(val, material.material_id) && updateMaterialTotals()"
                    />
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
              <InvoiceFormTotals
                :total="material.total"
                :margin="material.margin"
                :vat="material.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="materialsTotal"
                :is-final-total="true"
                :vat="materialsTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <ActivityComponent
          :activity-totals="activityTotals"
          :default-vat="invoice_default_vat"
          :vat-types="vat_types"
          :engineer_models="engineer_models"
          :user-totals="activity_user_totals"
          :invoice_default_hourly_rate_dinero="invoice_default_hourly_rate_dinero"
          :customer="customer"
          :default_currency="default_currency"
          @invoiceLinesCreated="activityInvoiceLinesCreated"
        />

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Distance") }}</h3>
          <b-row>
            <b-col cols="2" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("To") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Back") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Total") }}
            </b-col>
            <b-col cols="3" class="header">
              {{ $trans("Rate") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("Margin") }}
            </b-col>
            <b-col cols="1" class="header">
              {{ $trans("VAT type") }}
            </b-col>
            <b-col cols="2" />
          </b-row>
          <b-row v-for="distance in distanceUserTotals" :key="distance.user_id" class="material_row">
            <b-col cols="2">
              {{ getFullname(distance.user_id) }}
            </b-col>
            <b-col cols="1">
              {{ distance.distance_to_total }}
            </b-col>
            <b-col cols="1">
              {{ distance.distance_back_total }}
            </b-col>
            <b-col cols="1">
              {{ distance.distance_total }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateDistanceTotals"
                v-model="distance.usePrice"
              >
                <b-form-radio :value="usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS">
                  {{ $trans('Settings') }}
                  {{ getDistancePriceFor(usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsDistance.DISTANCE_USE_PRICE_CUSTOMER">
                  {{ $trans('Customer') }}
                  {{ getDistancePriceFor(usePriceOptionsDistance.DISTANCE_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsDistance.DISTANCE_USE_PRICE_OTHER">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="distance.price_per_km_other"
                      :currency="distance.price_per_km_other_currency"
                      @priceChanged="(val) => setDistancePriceOther(val, distance.user_id) && updateDistanceTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateDistanceTotals"
                  v-model="distance.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateDistanceTotals"
                :value="invoice_default_vat"
                v-model="distance.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="distance.total"
                :margin="distance.margin"
                :vat="distance.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="distanceTotal"
                :is-final-total="true"
                :vat="distanceTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Extra work") }}</h3>
          <b-row>
            <b-col cols="3" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Hours") }}
            </b-col>
            <b-col cols="3" class="header">
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
          <b-row v-for="extra_work in extraWorkUserTotals" :key="extra_work.user_id" class="material_row">
            <b-col cols="3">
              {{ getFullname(extra_work.user_id) }}
            </b-col>
            <b-col cols="2">
              {{ extra_work.work_total }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateExtraWorkTotals()"
                v-model="extra_work.usePrice"
              >
                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER">
                  {{ $trans('Engineer') }}
                  {{ getEngineerRateFor(extra_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS">
                  {{ $trans('Settings') }}
                  {{ getEngineerRateFor(extra_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER">
                  {{ $trans('Customer') }}
                  {{ getEngineerRateFor(extra_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="extra_work.engineer_rate_other"
                      :currency="extra_work.engineer_rate_other_currency"
                      @priceChanged="(val) => setEngineerPriceOtherExtraWork(val, extra_work.user_id) && updateExtraWorkTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateExtraWorkTotals()"
                  v-model="extra_work.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateExtraWorkTotals"
                :value="invoice_default_vat"
                v-model="extra_work.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="extra_work.total"
                :margin="extra_work.margin"
                :vat="extra_work.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="extraWorkTotal"
                :is-final-total="true"
                :vat="extraWorkTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <b-container fluid>
          <h3>{{ $trans("Actual work") }}</h3>
          <b-row>
            <b-col cols="3" class="header">
              {{ $trans("Engineer") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Hours") }}
            </b-col>
            <b-col cols="3" class="header">
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
          <b-row v-for="actual_work in actualWorkUserTotals" :key="actual_work.user_id" class="material_row">
            <b-col cols="3">
              {{ getFullname(actual_work.user_id) }}
            </b-col>
            <b-col cols="2">
              {{ actual_work.work_total }}
            </b-col>
            <b-col cols="3">
              <b-form-radio-group
                @change="updateActualWorkTotals()"
                v-model="actual_work.usePrice"
              >
                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER">
                  {{ $trans('Engineer') }}
                  {{ getEngineerRateFor(actual_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS">
                  {{ $trans('Settings') }}
                  {{ getEngineerRateFor(actual_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_SETTINGS).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER">
                  {{ $trans('Customer') }}
                  {{ getEngineerRateFor(actual_work, usePriceOptionsActivity.ACTIVITY_USE_PRICE_CUSTOMER).toFormat("$0.00") }}
                </b-form-radio>

                <b-form-radio :value="usePriceOptionsActivity.ACTIVITY_USE_PRICE_OTHER">
                  <p class="flex">
                    {{ $trans("Other") }}:&nbsp;&nbsp;
                    <PriceInput
                      v-model="actual_work.engineer_rate_other"
                      :currency="actual_work.engineer_rate_other_currency"
                      @priceChanged="(val) => setEngineerPriceOtherActualWork(val, actual_work.user_id) && updateActualWorkTotals()"
                    />
                  </p>
                </b-form-radio>
              </b-form-radio-group>
            </b-col>
            <b-col cols="1">
              <p class="flex">
                <b-form-input
                  @blur="updateActualWorkTotals"
                  v-model="actual_work.margin_perc"
                  size="sm"
                  class="input-margin"
                ></b-form-input>
                <span class="percentage-container">%</span>
              </p>
            </b-col>
            <b-col cols="1">
              <b-form-select
                @change="updateActualWorkTotals"
                :value="invoice_default_vat"
                v-model="actual_work.vat_type"
                :options="vat_types" size="sm"
              ></b-form-select>
            </b-col>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="actual_work.total"
                :margin="actual_work.margin"
                :vat="actual_work.vat"
              />
            </b-col>
          </b-row>
          <b-row>
            <b-col cols="10"/>
            <b-col cols="2">
              <InvoiceFormTotals
                :total="actualWorkTotal"
                :is-final-total="true"
                :vat="actualWorkTotalVAT"
              />
            </b-col>
          </b-row>
        </b-container>

        <hr/>

        <div class="use-on-invoice-container">
          <h3>{{ $trans("What to use as invoice lines") }}</h3>
          <b-form-group :label="$trans('Activity')">
            <b-form-radio-group
              v-model="useOnInvoiceActivitySelected"
              :options="useOnInvoiceActivityOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Extra work')">
            <b-form-radio-group
              v-model="useOnInvoiceExtraWorkSelected"
              :options="useOnInvoiceExtraWorkOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Actual work')">
            <b-form-radio-group
              v-model="useOnInvoiceActualWorkSelected"
              :options="useOnInvoiceActualWorkOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Distance')">
            <b-form-radio-group
              v-model="useOnInvoiceDistanceSelected"
              :options="useOnInvoiceDistanceOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Used materials')">
            <b-form-radio-group
              v-model="useOnInvoiceUsedMaterialsSelected"
              :options="useOnInvoiceUsedMaterialsOptions"
            ></b-form-radio-group>
          </b-form-group>

          <b-form-group :label="$trans('Call out costs')">
            <b-form-radio-group
              v-model="useOnInvoiceCallOutCostsSelected"
              :options="useOnInvoiceCallOutCostsOptions"
            ></b-form-radio-group>
          </b-form-group>

          <div class="mx-auto">
            <footer class="modal-footer">
              <b-button @click="resetInvoiceLines" type="button" variant="secondary">
                {{ $trans('Reset') }}</b-button>
              <b-button @click="createInvoiceLinesFromConfig" type="button" variant="primary">
                {{ $trans('Create invoice lines') }}</b-button>
            </footer>
          </div>

        </div>

        <div class="invoice-lines">
          <h3>{{ $trans("Invoice lines") }}</h3>
          <b-row>
            <b-col cols="6" class="header">
              {{ $trans("Description") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Amount") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("VAT") }}
            </b-col>
            <b-col cols="2" class="header">
              {{ $trans("Price") }}
            </b-col>
          </b-row>
          <b-row v-for="invoiceLine in invoiceLines" :key="invoiceLine.id">
            <b-col cols="6">
              <b-form-textarea
                v-model="invoiceLine.description"
                rows="2"
              ></b-form-textarea>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.amount"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.vat"
                size="sm"
              ></b-form-input>
            </b-col>
            <b-col cols="2">
              <b-form-input
                v-model="invoiceLine.price"
                size="sm"
              ></b-form-input>
            </b-col>
          </b-row>
        </div>

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
import invoiceService from '../../models/orders/Invoice.js'
import invoiceLineService from '../../models/orders/InvoiceLine.js'
import { InvoiceLineModel } from '../../models/orders/InvoiceLine.js'
import memberModel from "../../models/member/Member";
import {toDinero} from "../../utils";
import PriceInput from "../../components/PriceInput";
import { MaterialModel } from "../../models/inventory/Material";
import materialService from "../../models/inventory/Material";
import { RateEngineerUserModel } from "../../models/company/UserEngineer";
import engineerService from "../../models/company/UserEngineer";
import customerService from "../../models/customer/Customer";
import { CustomerModel, CustomerPriceModel } from "../../models/customer/Customer";
import InvoiceFormTotals from './invoice_form/Totals';
import Collapse from "../../components/Collapse";
import invoiceMixin from "./invoice_form/mixin";
import ActivityComponent from "./invoice_form/Activity";

const OPTION_USER_TOTALS = 'user_totals'
const OPTION_ACTIVITY_ACTIVITY_TOTALS = 'activity_totals'
const OPTION_ACTIVITY_ACTUAL_WORK = 'actual_work'
const OPTION_EXTRA_WORK_TOTALS = 'extra_work_totals'
const OPTION_USED_MATERIALS_TOTALS = 'used_materials_totals'
const OPTION_ACTUAL_WORK_TOTALS = 'actual_work_totals'
const OPTION_DISTANCE_TOTALS = 'distance_totals'
const OPTION_CALL_OUT_COSTS_CUSTOMER = 'customer'
const OPTION_CALL_OUT_COSTS_SETTINGS = 'settings'

const OPTION_NONE = 'none'

const INVOICE_LINE_TYPE_ACTIVITY = 'activity'
const INVOICE_LINE_TYPE_EXTRA_WORK = 'extra-work'
const INVOICE_LINE_TYPE_USED_MATERIALS = 'used-materials'
const INVOICE_LINE_TYPE_CALL_OUT_COSTS = 'call-out-costs'

export default {
  name: 'InvoiceForm',
  mixins: [invoiceMixin],
  components: {
    PriceInput,
    InvoiceFormTotals,
    Collapse,
    ActivityComponent
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
      submitClicked: false,
      invoice: invoiceService.getFields(),
      errorMessage: null,

      order: null,
      member: null,
      invoice_id: null,
      vat_types: [],
      default_currency: null,
      invoice_default_margin: null,
      invoice_default_vat: null,

      invoice_default_hourly_rate: null,
      invoice_default_hourly_rate_dinero: null,
      invoice_default_partner_hourly_rate: null,
      invoice_default_partner_hourly_rate_dinero: null,

      invoice_default_call_out_costs: null,
      invoice_default_call_out_costs_dinero: null,

      invoice_default_price_per_km: null,
      invoice_default_price_per_km_dinero: null,

      used_materials: [],
      material_models: [],
      materialsTotal: null,
      materialsTotalVAT: null,
      usePriceOptionsMaterial: {
        USED_MATERIALS_USE_PRICE_PURCHASE: 'purchase',
        USED_MATERIALS_USE_PRICE_SELLING: 'selling',
        USED_MATERIALS_USE_PRICE_OTHER: 'other',
      },

      engineer_models: [],

      activity: [],
      activity_user_totals: [],
      activityTotal: null,
      activityTotalVAT: null,
      activityTotals: null,
      usePriceOptionsActivity: {
        ACTIVITY_USE_PRICE_ENGINEER: 'engineer',
        ACTIVITY_USE_PRICE_SETTINGS: 'settings',
        ACTIVITY_USE_PRICE_CUSTOMER: 'customer',
        ACTIVITY_USE_PRICE_OTHER: 'other',
      },

      distanceUserTotals: [],
      distanceTotal: null,
      distanceTotalVAT: null,
      distanceTotals: null,
      usePriceOptionsDistance: {
        DISTANCE_USE_PRICE_SETTINGS: 'settings',
        DISTANCE_USE_PRICE_CUSTOMER: 'customer',
        DISTANCE_USE_PRICE_OTHER: 'other',
      },

      extraWork: [],
      extraWorkUserTotals: [],
      extraWorkTotal: null,
      extraWorkTotalVAT: null,
      extraWorkTotals: null,

      actualWork: [],
      actualWorkUserTotals: [],
      actualWorkTotals: null,
      actualWorkTotal: null,
      actualWorkTotalVAT: null,

      customerPk: null,
      customer: null,

      invoiceLines: [],
      deletedInvoiceLines: [],

      useOnInvoiceActivityOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Activity totals'), value: OPTION_ACTIVITY_ACTIVITY_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceActivitySelected: null,

      useOnInvoiceExtraWorkOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Extra work totals'), value: OPTION_EXTRA_WORK_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceExtraWorkSelected: null,

      useOnInvoiceUsedMaterialsOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Used materials totals'), value: OPTION_USED_MATERIALS_TOTALS },
        { text: this.$trans('None'), value: OPTION_NONE },
      ],
      useOnInvoiceUsedMaterialsSelected: null,

      useOnInvoiceCallOutCostsOptions: [
        { text: this.$trans('Customer'), value: OPTION_CALL_OUT_COSTS_CUSTOMER },
        { text: this.$trans('Settings'), value: OPTION_CALL_OUT_COSTS_SETTINGS },
        { text: this.$trans('None'), value: 'none' },
      ],
      useOnInvoiceCallOutCostsSelected: null,

      useOnInvoiceActualWorkOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Actual work totals'), value: OPTION_ACTUAL_WORK_TOTALS },
        { text: this.$trans('None'), value: 'none' },
      ],
      useOnInvoiceActualWorkSelected: null,

      useOnInvoiceDistanceOptions: [
        { text: this.$trans('User totals'), value: OPTION_USER_TOTALS },
        { text: this.$trans('Distance totals'), value: OPTION_DISTANCE_TOTALS },
        { text: this.$trans('None'), value: 'none' },
      ],
      useOnInvoiceDistanceSelected: null,
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
      this.invoice = invoiceService.getFields()
      const invoiceData = await invoiceService.getData(this.uuid)

      this.customerPk = invoiceData.customer_pk
      await this.getCustomer()

      this.order = invoiceData.order
      this.member = invoiceData.member
      this.invoice_id = invoiceData.invoice_id
      this.default_currency = invoiceData.default_currency
      this.invoice_default_margin = invoiceData.invoice_default_margin
      this.invoice_default_vat = invoiceData.invoice_default_vat

      this.invoice_default_price_per_km = invoiceData.invoice_default_price_per_km
      this.invoice_default_price_per_km_dinero = toDinero(
        this.invoice_default_price_per_km,
        this.default_currency
      )

      this.invoice_default_call_out_costs = invoiceData.invoice_default_call_out_costs
      this.invoice_default_call_out_costs_dinero = toDinero(
        this.invoice_default_call_out_costs,
        this.default_currency
      )

      this.invoice_default_hourly_rate = invoiceData.invoice_default_hourly_rate
      this.invoice_default_hourly_rate_dinero = toDinero(
        this.invoice_default_hourly_rate,
        this.default_currency
      )

      this.invoice_default_partner_hourly_rate = invoiceData.invoice_default_partner_hourly_rate
      this.invoice_default_partner_hourly_rate_dinero = toDinero(
        this.invoice_default_partner_hourly_rate,
        this.default_currency
      )

      // materials
      this.used_materials = invoiceData.used_materials.map((m) => ({
        ...m,
        vat_type: this.invoice_default_vat,
        margin_perc:  this.invoice_default_margin,
        price_purchase_ex_other: "0.00",
        price_purchase_ex_other_currency: this.default_currency,
        price_purchase_ex_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE,
      }))

      this.material_models = invoiceData.material_models.map((m) => new MaterialModel({
          ...m,
        margin_perc: this.invoice_default_margin
      }))
      this.updateMaterialTotals()

      // activity
      this.activity = invoiceData.activity
      this.activityTotals = invoiceData.activity_totals
      this.engineer_models = invoiceData.engineer_models.map((m) => new RateEngineerUserModel({
        ...m,
        margin_perc: this.invoice_default_margin
      }))

      this.activity_user_totals = this.activityTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER,
      }))

      // distance
      this.distanceUserTotals = this.activityTotals.user_totals.map((a) => ({
        user_id: a.user_id,
        distance_to_total: a.distance_to_total,
        distance_back_total: a.distance_back_total,
        distance_total: a.distance_total,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        price_per_km_other: "0.00",
        price_per_km_other_currency: this.default_currency,
        price_per_km_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS,
      }))
      this.updateDistanceTotals()

      // extra work
      this.extraWorkTotals = invoiceData.extra_work_totals
      this.extraWorkUserTotals = this.extraWorkTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER,
      }))

      // actual work
      this.actualWorkTotals = invoiceData.actual_work_totals
      this.actualWorkUserTotals = this.actualWorkTotals.user_totals.map((a) => ({
        ...a,
        vat_type: this.invoice_default_vat,
        margin_perc: this.invoice_default_margin,
        engineer_rate: this.getEngineerRate(a.user_id),
        engineer_rate_currency: this.getEngineerRateCurrency(a.user_id),
        engineer_rate_dinero: this.getEngineerRateDinero(a.user_id),
        engineer_rate_other: "0.00",
        engineer_rate_other_currency: this.default_currency,
        engineer_rate_other_dinero: toDinero("0.00", this.default_currency),
        usePrice: this.usePriceOptionsActivity.ACTIVITY_USE_PRICE_ENGINEER,
      }))

      this.updateHoursTotals()

      this.isLoading = false
    } else {
      await this.loadInvoice()
    }
  },
  methods: {
    // invoice lines
    activityInvoiceLinesCreated(invoiceLines) {

    },
    resetInvoiceLines() {

    },
    createInvoiceLinesFromConfig() {
      // activity
      switch (this.useOnInvoiceActivitySelected) {
        case OPTION_USER_TOTALS:
          for (const activity of this.activity_user_totals) {
            this.createInvoiceLine(
              INVOICE_LINE_TYPE_ACTIVITY,
              `${this.$trans("Work hours")} ${this.getFullname(activity.user_id)}`,
              activity.total_hours,
              activity.vat,
              activity.total
            )
          }
          break
        case OPTION_ACTIVITY_ACTIVITY_TOTALS:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activityTotals.hours_total,
            this.activityTotalVAT,
            this.activityTotal
          )
          break
        case OPTION_ACTIVITY_ACTUAL_WORK:
          this.createInvoiceLine(
            INVOICE_LINE_TYPE_ACTIVITY,
            `${this.$trans("Work hours")}`,
            this.activityTotals.actual_work_totals.actual_work,
            this.actualWorkTotalVAT,
            this.actualWorkTotal
          )
          break
        case OPTION_NONE:
          console.debug("not adding any activity")
      }

      // extra work

      // used materials

      // call out costs

    },
    // customer
    async getCustomer() {
      const customerData = await customerService.detail(this.customerPk)
      this.customer = new CustomerModel(customerData)
    },
    async updateCustomer() {
      // use minimal model for patch
      const minimalModel = new CustomerPriceModel(this.customer)

      const customerData = await customerService.update(this.customerPk, minimalModel)
      this.customer = new CustomerModel(customerData)
      this.infoToast(this.$trans('Updated'), this.$trans('Customer data has been updated'))
    },
    // activity / extra work
    async updateEngineer(user_id) {
      let engineer_user = this.engineer_models.find((m) => m.id === user_id)
      const minimalModel = new RateEngineerUserModel(engineer_user)

      let updatedEngineerUserJson = await engineerService.update(user_id, minimalModel)
      engineer_user.engineer.setPriceFields(updatedEngineerUserJson.engineer)
      this.updateActivityTotals()

      this.infoToast(this.$trans('Updated'), this.$trans('Hourly rate engineer has been updated'))
    },
    updateHoursTotals() {
      this.updateActivityTotals()
      this.updateExtraWorkTotals()
      this.updateActualWorkTotals()
    },
    updateActivityTotals() {
      this.activity_user_totals = this.activity_user_totals.map((m) => this.updateUserActivityTotals(m))
      this.activityTotal = this.getItemsTotal(this.activity_user_totals)
      this.activityTotalVAT = this.getItemsTotalVAT(this.activity_user_totals)

      return true
    },
    updateUserActivityTotals(activity) {
      const price = this.getSelectedEngineerRate(activity)
      const currency = this.getSelectedEngineerRateCurrency(activity)
      const hours_parts = activity.hours_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
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
    updateExtraWorkTotals() {
      this.extraWorkUserTotals = this.extraWorkUserTotals.map((m) => this.updateUserExtraWorkTotals(m))
      this.extraWorkTotal = this.getItemsTotal(this.extraWorkUserTotals)
      this.extraWorkTotalVAT = this.getItemsTotalVAT(this.extraWorkUserTotals)

      return true
    },
    updateUserExtraWorkTotals(extraWork) {
      const price = this.getSelectedEngineerRate(extraWork)
      const currency = this.getSelectedEngineerRateCurrency(extraWork)
      const hours_parts = extraWork.work_total.split(':')
      let total = price.multiply(hours_parts[0])
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (extraWork.margin_perc > 0) {
        margin = total.multiply(extraWork.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(extraWork.vat_type)/100)
      extraWork.currency = currency
      extraWork.total = total_with_margin
      extraWork.vat = vat
      extraWork.margin = margin

      return extraWork

    },
    updateActualWorkTotals() {
      this.actualWorkUserTotals = this.actualWorkUserTotals.map((m) => this.updateUserActualWorkTotals(m))
      this.actualWorkTotal = this.getItemsTotal(this.actualWorkUserTotals)
      this.actualWorkTotalVAT = this.getItemsTotalVAT(this.actualWorkUserTotals)

      return true
    },
    updateUserActualWorkTotals(actualWork) {
      const price = this.getSelectedEngineerRate(actualWork)
      const currency = this.getSelectedEngineerRateCurrency(actualWork)
      const hours_parts = actualWork.work_total.split(':')
      let total = price.multiply(parseInt(hours_parts[0]))
      total = total.add(price.multiply(hours_parts[1]/60))
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (actualWork.margin_perc > 0) {
        margin = total.multiply(actualWork.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(actualWork.vat_type)/100)
      actualWork.currency = currency
      actualWork.total = total_with_margin
      actualWork.vat = vat
      actualWork.margin = margin

      return actualWork
    },

    setEngineerPriceOtherActivity(priceDinero, user_id) {
      let model = this.activity_user_totals.find((a) => a.user_id === user_id)
      model.engineer_rate_other_dinero = priceDinero
      model.engineer_rate_other = model.engineer_rate_other_dinero.toFormat('0.00')
      model.engineer_rate_other_currency = model.engineer_rate_other_dinero.getCurrency()
      return true
    },
    setEngineerPriceOtherExtraWork(priceDinero, user_id) {
      let model = this.extraWorkUserTotals.find((a) => a.user_id === user_id)
      model.engineer_rate_other_dinero = priceDinero
      model.engineer_rate_other = model.engineer_rate_other_dinero.toFormat('0.00')
      model.engineer_rate_other_currency = model.engineer_rate_other_dinero.getCurrency()
      return true
    },
    setEngineerPriceOtherActualWork(priceDinero, user_id) {
      let model = this.actualWorkUserTotals.find((a) => a.user_id === user_id)
      model.engineer_rate_other_dinero = priceDinero
      model.engineer_rate_other = model.engineer_rate_other_dinero.toFormat('0.00')
      model.engineer_rate_other_currency = model.engineer_rate_other_dinero.getCurrency()
      return true
    },
    // distance
    setDistancePriceOther(priceDinero, user_id) {
      let model = this.distanceUserTotals.find((a) => a.user_id === user_id)
      model.price_per_km_other_dinero = priceDinero
      model.price_per_km_other = model.price_per_km_other_dinero.toFormat('0.00')
      model.price_per_km_other_currency = model.price_per_km_other_dinero.getCurrency()
      return true
    },
    getDistancePriceFor(type) {
      switch (type) {
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km_dinero
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        default:
          throw `getDistancePrice: unknown usePrice: ${distance.usePrice}`
      }
    },
    getDistancePrice(distance) {
      switch (distance.usePrice) {
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS:
          return this.invoice_default_price_per_km_dinero
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_dinero
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_OTHER:
          return distance.price_per_km_other_dinero
        default:
          throw `getDistancePrice: unknown usePrice: ${distance.usePrice}`
      }
    },
    getDistanceCurrency(distance) {
      switch (distance.usePrice) {
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_SETTINGS:
          return this.default_currency
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_CUSTOMER:
          return this.customer.price_per_km_currency
        case this.usePriceOptionsDistance.DISTANCE_USE_PRICE_OTHER:
          return distance.price_per_km_other_currency
        default:
          throw `getDistanceCurrency: unknown usePrice: ${distance.usePrice}`
      }
    },
    updateDistanceTotals() {
      this.distanceUserTotals = this.distanceUserTotals.map((m) => this.updateDistanceObjTotals(m))
      this.distanceTotal = this.getItemsTotal(this.distanceUserTotals)
      this.distanceTotalVAT = this.getItemsTotalVAT(this.distanceUserTotals)
    },
    updateDistanceObjTotals(distance) {
      const price = this.getDistancePrice(distance)
      const currency = this.getDistanceCurrency(distance)
      const total = price.multiply(distance.distance_total)
      let total_with_margin = total
      let margin = toDinero("0.00", currency)
      if (distance.margin_perc > 0) {
        margin = total.multiply(distance.margin_perc/100)
        total_with_margin = total.add(margin)
      }
      const vat = total_with_margin.multiply(parseInt(distance.vat_type)/100)
      distance.currency = currency
      distance.total = total_with_margin
      distance.vat = vat
      distance.margin = margin

      return distance
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
      if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE) {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_dinero
      } else if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING) {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_dinero
      } else if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_OTHER) {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_dinero
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialCurrency(used_material) {
      if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE) {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_purchase_ex_currency
      } else if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_SELLING) {
        const model = this.material_models.find((m) => m.id === used_material.material_id)
        return model.price_selling_ex_currency
      } else if (used_material.usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_OTHER) {
        const model = this.used_materials.find((m) => m.material_id === used_material.material_id)
        return model.price_purchase_ex_other_currency
      } else {
        throw `unknown use price: ${used_material.usePrice}`
      }
    },
    getMaterialPriceFor(used_material, usePrice) {
      const model = this.material_models.find((m) => m.id === used_material.material_id)
      if (model) {
        return usePrice === this.usePriceOptionsMaterial.USED_MATERIALS_USE_PRICE_PURCHASE ? model.price_purchase_ex_dinero : model.price_selling_ex_dinero
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
        this.invoice = await invoiceService.detail(this.pk)
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
  width: 40px;
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
.total-text {
  font-size: 14px;
  font-weight: bold;
}
</style>
