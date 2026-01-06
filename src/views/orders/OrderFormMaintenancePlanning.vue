<template>
  <div class="app-page" v-if="order">
    <b-modal
      id="new-equipment-modal"
      ref="new-equipment-modal"
      v-bind:title="$trans('New equipment')"
      @ok="submitCreateEquipment"
      @cancel="cancelCreateEquipment"
    >
      <form ref="maintenance_equipment_new_equipment-form" @submit.stop.prevent="submitCreateEquipment">
        <b-container fluid="md">
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Equipment name')"
                label-for="maintenance_equipment_new_equipment"
              >
                <BFormInput
                  id="maintenance_equipment_new_equipment"

                  v-model="newEquipmentName"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <b-modal
      id="new-location-modal"
      ref="new-location-modal"
      v-bind:title="$trans('New location')"
      @ok="submitCreateLocation"
      @cancel="cancelCreateLocation"
    >
      <form ref="new_location-form" @submit.stop.prevent="submitCreateLocation">
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <BFormGroup
                v-bind:label="$trans('Location name')"
                label-for="new_location"
              >
                <BFormInput
                  id="new_location"

                  v-model="newLocationName"
                ></BFormInput>
              </BFormGroup>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <header>
      <div class="page-title">
        <h3 v-if="!pk">
          <IBiFileEarmarkPlus></IBiFileEarmarkPlus>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-if="pk">
          <IBiFileEarmarkTextFill></IBiFileEarmarkTextFill>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', pk:pk}">#<strong>{{ pk }}</strong></router-link>
        / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
            <BButton
              v-if="!isCreate && !hasBranches && (unaccepted || !order.customer_order_accepted)"
              @click="reject"
              class="btn btn-danger"
              type="button"
              variant="danger">{{ $trans('Reject') }}</BButton>
            <BButton
              v-if="!isCreate && !hasBranches && (unaccepted || !order.customer_order_accepted)"
              @click="editAndAccept"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              name="order-done-next"
              value="dispatch"
              variant="primary">{{ $trans('Save &amp; accept') }}
            </BButton>

            <BButton
              v-if="!unaccepted || hasBranches"
              @click="cancelForm"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
              >
              {{ $trans('Cancel') }}
            </BButton>

            <b-dropdown
              v-if="!unaccepted || hasBranches"
              split
              type="submit"
              :text="$trans('Submit')"
              @click="submitForm"
              variant="primary">
              <b-dropdown-item-button
                @click="(e) => { submitForm(e)  }"
                type="button"
                name="nextPage"
                value="dispatch"
              >{{ $trans('Submit') }} {{ $trans('and open dispatch') }}
              </b-dropdown-item-button>
            </b-dropdown>

        </div>
      </div>
    </header>

    <div class="page-detail">
      <ApiResult
        class="app-detail"
        v-if="order.hasOwnProperty('apiOk')"
        :error="order.error"
        :success-message='$trans("Order created")'
      />
      <div class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('Contact') }}</h6>

          <BFormGroup
            v-if="!hasBranches"
            label-cols="3"
            v-bind:label="$trans('Customer')"
            label-for="order-customer-search"
          >
            <VueMultiselect
              id="order-customer-search"
              track-by="id"
              :placeholder="$trans('Type to search name, address..')"
              open-direction="bottom"
              :options="customers"
              :multiple="false"
              :loading="isLoading"
              :internal-search="false"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :hide-selected="true"
              @search-change="getCustomersDebounced"
              @select="selectCustomer"
              :custom-label="customerLabel"
            >
              <span slot="noResult">{{ $trans('Nothing found.') }}</span>
            </VueMultiselect>
          </BFormGroup>


          <BFormGroup
            v-if="hasBranches && !from_quotation"
            label-cols="3"
            v-bind:label="$trans('Branch')"
            label-for="order-branch-search"
          >
            <VueMultiselect
              id="order-branch-search"
              track-by="id"
              :placeholder="$trans('Type to search name, address..')"
              open-direction="bottom"
              :options="branches"
              :multiple="false"
              :loading="isLoading"
              :internal-search="false"
              :options-limit="30"
              :limit="10"
              :max-height="600"
              :hide-selected="true"
              @search-change="getBranchesDebounced"
              @select="selectBranch"
              :custom-label="branchLabel"
            >
              <span slot="noResult">{{ $trans('Nothing found.') }}</span>
            </VueMultiselect>
          </BFormGroup>

          <BFormGroup :label="!hasBranches ? $trans('Customer') : $trans('Branch')"
            label-for="order_name"
            label-cols="3"
            >
            <b-input-group>
              <BFormInput
                v-if="!hasBranches"
                v-model="order.order_name"
                id="order_name"

                :state="isSubmitClicked ? !v$.order.customer_relation.$error : null"
              ></BFormInput>
              <BFormInput
                v-else
                v-model="order.order_name"
                id="order_name"

                :state="isSubmitClicked ? !v$.order.branch.$error : null"
              ></BFormInput>
              <template #append v-if="!hasBranches">
                <BFormInput
                  v-model="order.customer_id"
                  :readonly="true"
                  :title="$trans('Customer ID')"
                  id="customer_id"
                  style="max-width: 9ch"
                  :state="isSubmitClicked ? !v$.order.customer_id.$error : null">
                </BFormInput>
              </template>
            </b-input-group>

            <b-form-invalid-feedback
              v-if="!hasBranches"
              :state="isSubmitClicked ? !v$.order.customer_relation.$error : null">
              {{ $trans('Please select a customer') }}
            </b-form-invalid-feedback>

            <b-form-invalid-feedback
              v-else
              :state="isSubmitClicked ? !v$.order.branch.$error : null">
              {{ $trans('Please select a branch') }}
            </b-form-invalid-feedback>
          </BFormGroup>

          <details v-if="order.customer_id" open>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Customer details') }}</h6>
              <IBiChevron-down></IBiChevron-down>
            </summary>
            <BFormGroup
              v-bind:label="$trans('Address')"
              label-for="order_address"
              label-cols="3"
            >
              <BFormInput
                id="order_address"
                v-model="order.order_address"
                :state="isSubmitClicked ? !v$.order.order_address.$error: null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
              label-cols="3"
            >
              <BFormInput
                id="order_postal"
                v-model="order.order_postal"
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
              label-cols="3"
            >
              <BFormSelect v-model="order.order_country_code" :options="countries" ></BFormSelect>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('City')"
              label-for="order_city"
              label-cols="3"
            >
              <BFormInput
                id="order_city"
                v-model="order.order_city"
                :state="isSubmitClicked ? !v$.order.order_city.$error : null"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
              label-cols="3">
              <BFormInput
                id="order_contact"
                v-model="order.order_contact">
              </BFormInput>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Email')"
              label-for="order_email"
              label-cols="3"
              >
              <BFormInput
                id="order_email"

                v-model="order.order_email"
                placeholder="email address">
              </BFormInput>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
              label-cols="3"
            >
              <BFormInput
                id="order_mobile"

                v-model="order.order_mobile"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Phone')"
              label-for="order_tel"
              label-cols="3"
            >
              <BFormInput
                id="order_tel"

                v-model="order.order_tel"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              v-bind:label="$trans('Customer remarks')"
              label-for="customer_remarks"
              label-cols="3"
            >
              <BFormTextarea
                id="customer_remarks"
                v-model="order.customer_remarks"
                rows="3"
              ></BFormTextarea>
            </BFormGroup>
          </details>
        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans("Order details") }}</h6>
          <BFormGroup
            v-bind:label="$trans('Order type')"
            label-for="order_type"
            label-cols="3"
          >
            <OrderTypesSelect
              v-if="(!isCreate && !isLoading) || isCreate"
              :orderTypeIn="order.order_type"
              :order-type="order.order_type"
              :include-all="false"
            />
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Reference')"
            label-for="order_reference"
            label-cols="3">
              <BFormInput
              id="order_reference"

              v-model="order.order_reference"
              >
              </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Customer reference')"
            label-for="customer_reference"
            label-cols="3">
            <BFormInput
              id="customer_reference"

              v-model="order.customer_reference"
            >
            </BFormInput>
          </BFormGroup>

          <BFormGroup
            v-bind:label="$trans('Remarks')"
            label-for="remarks"
            label-cols="3"
            >
            <BFormTextarea
            id="remarks"
              v-model="order.remarks"
              rows="3"
            ></BFormTextarea>
          </BFormGroup>

          <!-- order start/end times -->
          <h6>{{ $trans('Planning') }}</h6>
          <b-container>
            <b-row>
              <BFormGroup
                :label="$trans('Start date')"
                label-for="start_date"
                label-cols="3"
                :state="isSubmitClicked ? !v$.order.start_date.$error : null"
              >
                <VueDatePicker
                  id="start_date"
                  v-model="order.start_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null">
                  {{ $trans('Please enter a start date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('Start time')"
                label-for="start_time"
                label-cols="3"
              >
                <BFormInput
                  id="start_time"
                  v-model="order.start_time"
                  type="text"
                  placeholder="HH:mm"
                  class="time-input"
                ></BFormInput>
                <VueDatePicker
                  v-model="start_time_date"
                  id="start_time"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.start_time.$error : null">
                  {{ $trans('Please enter a valid start time HH:mm') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <BFormGroup
                label-class=""
                v-bind:label="$trans('End date')"
                label-for="end_date"
                label-cols="3"
              >
                <VueDatePicker
                  id="end_date"
                  v-model="order.end_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null">
                  {{ $trans('Please enter an end date') }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <b-col cols="2"></b-col>

              <BFormGroup
                :label="$trans('End time')"
                label-class=""
                label-for="end_time"
                label-cols="3"
              >
                <BFormInput
                  id="end_time"
                  v-model="order.end_time"
                  type="text"
                  class="time-input"
                  placeholder="HH:mm"
                ></BFormInput>
                <VueDatePicker
                  v-model="end_time_date"
                  id="end_time"
                  class="mb-2"
                  :placeholder="$trans('Set time')"
                  time-picker
                  arrow-navigation
                  :formats="{ input: 'HH:mm' }"
                >
                  <template #trigger>
                    <p class="clock-icon">
                      <IBiClock></IBiClock>
                    </p>
                  </template>
                </VueDatePicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.end_time.$error : null">
                  {{ $trans('Please enter a valid end time HH:mm') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-row>
          </b-container>

            <div
              class="assign-engineer section"
              v-if="!hasBranches"
            >

            <div v-if="recommendedUsers.length > 0">
              <h6>{{ $trans('Recommended engineers') }}</h6>
              <span v-for="(userData, index) in recommendedUsers" :key="index">
                <strong>{{ index + 1 }}</strong> {{ userData.full_name }}
              </span>
            </div>
            <BFormGroup
              v-bind:label="$trans('Assign to')"
              label-for="order-assign"
              label-cols="3"
              v-if="assignResult.length === 0"
            >
              <VueMultiselect
                v-model="selectedEngineers"
                id="order-assign"
                track-by="id"
                :max-height="600"
                :placeholder="$trans('Type to search engineer(s)')"
                open-direction="bottom"
                :options="engineers"
                :loading="isLookupLoading.engineers"
                :multiple="true"
                :custom-label="engineerLabel"
                @search-change="getEngineersDebounced"
                >
                <span slot="noResult">{{ $trans('Nothing found.') }}</span>
              </VueMultiselect>
            </BFormGroup>
            <div v-if="assignResult.length > 0">
              <h4>{{ $trans("Assign result") }}</h4>
              <ul>

                <li
                  v-for="(engineer, index) of assignResult"
                  :key="index"
                  :class="engineer.hasOwnProperty('apiOk') && engineer.apiOk ? 'text-success' : 'text-danger'"
                >
                  {{ engineer.full_name }}
                  <span v-if="engineer.hasOwnProperty('apiOk') && engineer.apiOk">
                    <IBiCheckCircle></IBiCheckCircle>
                  </span>
                  <span v-else>
                    <IBiExclamationCircle></IBiExclamationCircle>
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <BFormGroup
            v-bind:label="$trans('Assignee(s)')"
            label-for="order-assigned-to"
            label-cols="3">
            <div v-if="!order.assigned_user_info || order.assigned_user_info.length===0">
              <label  class="col-form-label order-assignee dimmed">{{ $trans('Nobody assigned') }}</label>
            </div>
            <div v-if="order.assigned_user_info && order.assigned_user_info.length>0">
              <div class="col-form-label order-assignee" v-for="(engineer, index) in order.assigned_user_info" :key="index">
                <span>{{ engineer.full_name }}</span>
                <BLink v-if="engineer.booked===0" @click="unassignEngineer(engineer, $event)" class="float-right h5 mx-2">
                  <IBiTrashFill></IBiTrashFill>
                </BLink>
              </div>
            </div>
          </BFormGroup>

          <BFormGroup
            label-for="order-orderline-remarks"
            v-bind:label="$trans('Planning remarks')"
          >
            <BFormTextarea
              id="order-orderline-remarks"
              v-model="order.planning_remarks"
              rows="1"
            ></BFormTextarea>
          </BFormGroup>
          <BFormGroup
            v-bind:label="$trans('Order email extra')"
            label-for="order-assign"
          >
            <VueMultiselect
              v-model="selectedSalesUsers"
              id="order-assign"
              track-by="id"
              :max-height="600"
              :placeholder="$trans('Type to search sales user(s)')"
              open-direction="bottom"
              :options="salesUsers"
              :multiple="true"
              :taggable="true"
              :custom-label="salesLabel"
              :loading="searchingSalesUsers"
              @search-change="getSalesUserDebounced"
            >
              <span slot="noResult">
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </span>
            </VueMultiselect>
          </BFormGroup>
        </div>

        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              :order="order"
              :is-view="false"
              ref="documents-component"
            />
          </div>

          <div class="order-lines section">
            <h6>{{$trans('Order lines')}}</h6>
            <b-container fluid="sm">
              <b-row
                v-for="(orderline, index) of order.orderlines"
                :key="orderline.id"
                no-gutters
                style="padding-bottom: 10px"
              >
                <b-col cols="9">
                  <b-container>
                    <b-row>
                      <b-col cols="12">{{ $trans("Product") }}: <b>{{ orderline.product }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Location") }}: <b>{{ orderline.location }}</b></b-col>
                    </b-row>
                    <b-row>
                      <b-col cols="12">{{ $trans("Remarks") }}: <b>{{ orderline.remarks }}</b></b-col>
                    </b-row>
                  </b-container>
                </b-col>
                <b-col cols="3">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click="editOrderLine(orderline, index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteOrderLine(index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </b-col>
                <b-col v-if="orderline.hasOwnProperty('apiOk')" cols="12">
                  <ApiResult
                    :error="orderline.error"
                    :success-message='$trans("Orderline created")'
                  />
                </b-col>
              </b-row>
            </b-container>

            <hr v-if="order.orderlines.length > 0"/>

            <div v-if="usesEquipment" v-show="(hasBranches && order.branch) || (!hasBranches && order.customer_relation)">
              <!-- equipment -->
              <h5 v-if="isEditOrderLine">{{ $trans("Edit") }}</h5>
              <h5 v-else>{{ $trans("New") }}</h5>
              <BFormGroup
                v-bind:label="$trans('Equipment')"
                cols="12">
                  <VueMultiselect
                    id="maintenance-contract-equipment-name"
                    ref="multiselect_equipment"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('(type to search)')"
                    open-direction="bottom"
                    :options="equipmentSearch"
                    :multiple="false"
                    :loading="isLoading"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    @search-change="getEquipmentDebounced"
                    @select="selectEquipment"
                    :disabled="!equipmentFormSearchOk"
                  >
                    <span slot="noResult">
                      <h5>{{ $trans('No equipment found') }}</h5>
                      <p v-if="canQuickCreateEquipment">
                        <BButton
                          @click="showAddEquipmentModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new equipment") }}
                        </BButton>
                      </p>
                    </span>
                  </VueMultiselect>

                  <span>
                    <strong>{{ product }}</strong>
                    <IBiCheck v-if="equipment"></IBiCheck>
                  </span>

              </BFormGroup>

              <!-- equipment locations -->
              <BFormGroup
                v-bind:label="$trans('Location')"
                cols="12"
                >
                  <VueMultiselect
                    id="location-name"
                    ref="multiselect_location"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('(type to search)')"
                    open-direction="bottom"
                    :options="locationSearch"
                    :multiple="false"
                    :loading="isLoading"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    @search-change="getLocationDebounced"
                    @select="selectLocation"
                    :disabled="!equipmentFormSearchOk || locationSearchDisabled"
                  >
                    <span slot="noResult">
                      <h5>{{ $trans('No locations found') }}</h5>
                      <p v-if="canQuickCreateEquipmentLocation">
                        <BButton
                          @click="showAddLocationModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new location") }}
                        </BButton>
                      </p>
                    </span>
                  </VueMultiselect>

                  <span>
                    <strong>{{ location }}</strong>
                    <IBiCheck v-if="equipment_location"></IBiCheck>
                  </span>
              </BFormGroup>

              <!-- if maintenance: equipment amount -->
              <BFormGroup
                v-if="maintenance"
                v-bind:label="$trans('Amount')"
                label-for="order-orderline-amount"
                label-cols="3"
              >
                <BFormInput
                  id="order-orderline-remarks"
                  type="number"
                  v-model="remarks"
                ></BFormInput>
              </BFormGroup>

              <!-- else: equipment remarks -->
              <BFormGroup v-else
              label-for="order-orderline-remarks"
              v-bind:label="$trans('Remarks')"
              >
                <BFormTextarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></BFormTextarea>
              </BFormGroup>

            </div>

            <!-- normal product -->
            <div v-if="!usesEquipment">

              <BFormGroup
                v-bind:label="$trans('Equipment')"
                label-for="order-orderline-product"
                label-cols="3"
              >
                <BFormInput
                  id="order-orderline-product"
                  v-model="product"
                  placeholder="(item name)"
                ></BFormInput>
              </BFormGroup>

              <!-- normal location -->
              <BFormGroup
                v-bind:label="$trans('Location')"
                label-for="order-orderline-location"
                label-cols="3"
              >
                <BFormInput
                  id="order-orderline-location"
                  placeholder="(location name)"
                  v-model="location"
                ></BFormInput>
              </BFormGroup>

              <!-- normal remarks -->
              <BFormGroup
                v-bind:label="$trans('Remarks')"
                label-for="order-orderline-remarks"
                label-cols="3"
                >
                <BFormInput
                  id="order-orderline-remarks"
                  placeholder="(notes)"
                  v-model="remarks"
                ></BFormInput>
              </BFormGroup>
            </div>

            <BFormGroup class="text-right">
              <BButton
                v-if="isEditOrderLine"
                @click="doEditOrderLine"
                class="btn btn-primary"
                 type="button"
                variant="warning"
                :disabled="!isOrderLineValid"
              >
                {{ $trans('Edit orderline') }}
              </BButton>
              <BButton
                v-if="!isEditOrderLine"
                @click="addOrderLine"
                class="btn btn-primary"

                type="button"
                variant="primary"
                :disabled="!isOrderLineValid"
              >
                {{ $trans('Add orderline') }}
              </BButton>
            </BFormGroup>
          </div>

          <hr/>

          <div class="info-lines section" v-if="!hasBranches">
            <h6>{{ $trans('Info lines') }}</h6>
            <b-container fluid="sm">
              <b-row
                v-for="(infoline, index) of order.infolines"
                :key="infoline.id"
                no-gutters
                style="padding-bottom: 10px"
              >
                <b-col cols="9">
                  <b>{{ infoline.info }}</b>
                </b-col>
                <b-col cols="3">
                  <div class="float-right">
                    <BLink class="h5 mx-2" @click="editInfoLine(infoline, index)">
                      <IBiPencil></IBiPencil>
                    </BLink>
                    <BLink class="h5 mx-2" @click.prevent="deleteInfoLine(index)">
                      <IBiTrash></IBiTrash>
                    </BLink>
                  </div>
                </b-col>
                <b-col v-if="infoline.hasOwnProperty('apiOk')" cols="12">
                  <ApiResult
                    :error="infoline.error"
                    :success-message='$trans("Infoline created")'
                  />
                </b-col>
              </b-row>
            </b-container>

            <hr v-if="order.infolines.length > 0"/>

            <div>
              <h5 v-if="isEditInfoLine">{{ $trans("Edit") }}</h5>
              <h5 v-else>{{ $trans("New") }}</h5>

              <BFormGroup
                v-bind:label="$trans('Info')"
                label-for="order-infoline-info"
              >
                <BFormTextarea
                  id="order-infoline-info"
                  v-model="info"
                ></BFormTextarea>
              </BFormGroup>

              <BFormGroup class="text-right">
                <BButton v-if="isEditInfoLine" @click="doEditInfoLine" class="btn btn-primary"  type="button" variant="warning">
                  {{ $trans('edit') }}
                </BButton>
                <BButton v-if="!isEditInfoLine" @click="addInfoLine" class="btn btn-primary"  type="button" variant="primary">
                  {{ $trans('add') }}
                </BButton>
              </BFormGroup>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import moment from 'moment'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import VueMultiselect from 'vue-multiselect'

import {OrderService, OrderModel} from '@/models/orders/Order'
import {CustomerService} from '@/models/customer/Customer'
import {AssignService} from '@/models/mobile/Assign'
import OrderTypesSelect from '@/components/OrderTypesSelect'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import { nl } from "date-fns/locale"

import {BranchService} from "@/models/company/Branch";
import {EquipmentService} from "@/models/equipment/equipment";
import {QuotationService} from '@/models/quotations/Quotation'
import {LocationService} from "@/models/equipment/location";
import {OrderlineService} from "@/models/orders/Orderline";
import {InfolineService} from "@/models/orders/Infoline";
import CustomerCard from '@/components/CustomerCard'
import {EngineerService} from "@/models/company/UserEngineer";
import DocumentsComponent from "./order_form/DocumentsComponent.vue";
import ApiResult from "@/components/ApiResult";
import { UserListService } from "@/models/company/UserList.js";
import componentMixin from "@/mixins/common";
import {useMainStore} from "@/stores/main";

const isCorrectTime = (value) => {
  if (!value || value === "") {
    return true
  }

  return !helpers.req(value) || /^\d+:\d+$/.test(value)  || /^\d+:\d+:\d+$/.test(value)
}

export default {
  setup() {
    const {create} = useToast()
    const mainStore = useMainStore()
    return {
      v$: useVuelidate(),
      create,
      mainStore
    }
  },
  mixins: [componentMixin],
  components: {
    DocumentsComponent,
    VueMultiselect,
    OrderTypesSelect,
    ApiResult,
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    unaccepted: {
      type: [Boolean],
      default: false
    },
    maintenance: {
      type: [Boolean],
      default: false
    },
    from_quotation: {
      type: [Boolean],
      default: false
    },
    quotation_id: {
      type: [String, Number],
      default: null
    },
  },
  watch: {
    start_time_date(val) {
      this.order.start_time = this.formatTime(val.hours, val.minutes)
    },
    end_time_date(val) {
      this.order.end_time = this.formatTime(val.hours, val.minutes)
    },
    startDate(val) {
      if (this.endDate && new Date(this.endDate) < new Date(val)) {
        this.order.end_date = val
      }
    },
    endDate(val) {
      if (this.startDate && new Date(val) < new Date(this.startDate)) {
        this.order.start_date = val
      }
    }
  },
  data() {
    return {
      isLoading: false,

      // FIXME HVG20250320 The state for all the search tables (branches, customers) should ideally be kept separate from `isLoading` to avoid unnecessary flickering of irrelevant UI elements.
      isLookupLoading: {
        engineers: false,
      },
      buttonDisabled: false,
      editIndex: null,
      acceptOrder: false,

      orderline_pk: null,
      product: '',
      equipment: null,
      location: '',
      equipment_location: null,
      remarks: '',
      planning_remarks: '',

      isEditOrderLine: false,
      userListService: new UserListService(),

      infoline_pk: null,
      info: '',
      isEditInfoLine: false,

      orderLineFields: [
        { key: 'info', label: $trans('Orderline') },
      ],
      infoLineFields: [
        { key: 'info', label: $trans('Info') },
        { key: 'icons', label: '' }
      ],
      recommendedUsers: [],
      recommendedUsersFields: [
        { key: 'full_name', label: $trans('Name') },
      ],
      submitClicked: false,
      countries: [],
      order: null,
      errorMessage: null,
      customers: [],
      salesUsers: [],
      selectedSalesUsers: [],
      customerSearch: '',
      getCustomersDebounced: null,
      branches: [],
      branchSearch: '',
      getBranchesDebounced: null,
      engineers: [],
      selectedEngineers: [],
      removedEngineers: [],
      getEngineersDebounced: null,
      assignResult: [],
      files: [],
      orderPk: null,
      nextField: 'orders',
      nextFieldOptions: [
        { item: 'orders', name: $trans('Orders') },
        { item: 'dispatch', name: $trans('Dispatch') },
      ],

      getEquipmentDebounced: null,
      equipmentSearch: [],
      newEquipmentName: null,

      getLocationDebounced: null,
      locationSearch: [],
      newLocationName: null,
      locationSearchDisabled: false,

      isEditEquipment: false,

      deletedOrderlines: [],
      deletedInfolines: [],

      equipmentService: new EquipmentService(),
      quotationService: new QuotationService(),
      customerService: new CustomerService(),
      orderService: new OrderService(),
      engineerService: new EngineerService(),
      branchService: new BranchService(),
      locationService: new LocationService(),
      orderlineService: new OrderlineService(),
      infolineService: new InfolineService(),
      assignService: new AssignService(),
      getSalesUserDebounced: null,
      searchingSalesUsers: false,
      nl,
      start_time_date: null,
      end_time_date: null,
    }
  },
  validations() {
    if (!this.hasBranches) {
      return {
        order: {
          customer_relation: {
            required,
          },
          customer_id: {
            required,
          },
          order_name: {
            required,
          },
          order_address: {
            required,
          },
          order_postal: {
            required,
          },
          order_city: {
            required,
          },
          start_date: {
            required,
          },
          end_date: {
            required,
          },
          start_time: {
            isCorrectTime,
          },
          end_time: {
            isCorrectTime,
          }
        },
      }
    }

    return {
      order: {
        branch: {
          required,
        },
        order_name: {
          required,
        },
        order_address: {
          required,
        },
        order_postal: {
          required,
        },
        order_city: {
          required,
        },
        start_date: {
          required,
        },
        end_date: {
          required,
        },
        start_time: {
          isCorrectTime,
        },
        end_time: {
          isCorrectTime,
        }
      },
    }
  },
  computed: {
    canQuickCreateEquipment() {
      return this.mainStore.getSettingEquipmentPlanningQuickCreate
    },
    canQuickCreateEquipmentLocation() {
      return this.mainStore.getSettingEquipmentLocationPlanningQuickCreate
    },
    equipmentFormSearchOk() {
      if (!this.hasBranches) {
        return this.order.customer_relation !== null
      } else {
        return this.order.branch !== null
      }
    },
    usesEquipment() {
      return this.mainStore.getMemberUsesEquipment
    },
    startDate() {
      if (!this.order) {
        return
      }

      return this.order.start_date
    },
    endDate() {
      if (!this.order) {
        return
      }

      return this.order.end_date
    },
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    isOrderLineValid() {
      return this.location !== null && this.location !== "" && this.product !== null && this.product !== ""
    }
  },
  async created () {
    const lang = this.mainStore.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.getSalesUserDebounced = AwesomeDebouncePromise(this.getSalesUsers, 500)
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.getBranchesDebounced = AwesomeDebouncePromise(this.getBranches, 500)
    this.getEquipmentDebounced = AwesomeDebouncePromise(this.getEquipment, 500)
    this.getLocationDebounced = AwesomeDebouncePromise(this.getLocation, 500)
    this.getEngineersDebounced = AwesomeDebouncePromise(this.getEngineers, 500)

    this.countries = this.mainStore.getCountries

    if (this.isCreate) {
      this.order = new OrderModel()

      // create order from quotation
      if (this.from_quotation) {
        this.isLoading = true
        const quotation = await this.quotationService.detail(this.quotation_id)
        const customer = await this.customerService.detail(quotation.customer_relation)
        this.fillCustomer(customer)
        this.order = {
          ...this.order,
          customer_relation: customer.id,
          quotation: this.quotation_id,
          order_reference: quotation.quotation_reference
        }
        this.isLoading = false
      }

      if (this.maintenance) {
        this.isLoading = true
        const data = this.mainStore.getMaintenanceEquipment

        if (data) {
          const {maintenanceEquipment, customer_pk, contract_pk} = data

          const customer = await this.customerService.detail(customer_pk)
          this.fillCustomer(customer)

          for (const equipmentData of maintenanceEquipment) {
            const equipment = await this.equipmentService.detail(equipmentData.equipment_pk)

            this.order.orderlines.push({
              product: equipment.name,
              location: equipment.location_name,
              remarks: equipmentData.remarks,
              equipment_location: equipment.location,
              equipment: equipment.id,
              amount: equipmentData.amount,
              maintenance_contract: contract_pk
            })
          }
        }
        this.isLoading = false
      }

    } else {
      await this.loadOrder()
    }
  },
  methods: {
    formatTime(hours, minutes) {
      const hoursOut = hours < 10 ? `0${hours}` : `${hours}`
      const minutesOut = minutes < 10 ? `0${minutes}` : `${minutes}`
      return `${hoursOut}:${minutesOut}`
    },
    // Search engineers
    async getEngineers(query) {
      this.isLookupLoading.engineers = true
      try {
        this.engineers = await this.userListService.search(query, 'engineer' )
        // this.engineers = await this.engineerService.search(query)
      } catch(error) {
        console.log('Error searching engineers', error)
        errorToast(this.create, $trans('Error searching engineers'))
      }
      this.isLookupLoading.engineers = false
    },
    // remove engineers
    unassignEngineer( engineer, event ) {
      // console.log( 'unassignEngineer('+engineer.user_id+')' )
      this.removedEngineers.push( engineer )
      event.target.closest('.order-assignee').style.textDecoration = 'line-through';
      event.target.style.display = 'none';
    },
    // equipment
    showAddEquipmentModal() {
      this.$refs.multiselect_equipment.deactivate()
      this.newEquipmentName =this.$refs.multiselect_equipment.$refs.search.value
      this.$refs['new-equipment-modal'].show()
    },
    cancelCreateEquipment() {
      this.$refs['new-equipment-modal'].hide()
    },
    async submitCreateEquipment() {
      this.$refs.multiselect_equipment.deactivate()

      try {
        if (!this.hasBranches) {
          const response = this.isPlanning || this.isAdmin ?
            await this.equipmentService.quickAddCustomerPlanning(this.newEquipmentName, this.order.customer_relation) :
            await this.equipmentService.quickAddCustomerNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        } else {
          const response = await this.equipmentService.quickAddBranchPlanning(this.newEquipmentName, this.order.branch);

          this.equipment = response.id
          this.product = response.name
        }
      }  catch(error) {
        console.log('Error adding equipment', error)
        errorToast(this.create, $trans('Error adding equipment'))
      }
    },
    async getEquipment(query) {
      try {
        if (this.hasBranches) {
          this.equipmentSearch = await this.equipmentService.searchBranch(query, this.order.branch)
        } else {
          this.equipmentSearch = await this.equipmentService.searchCustomer(query, this.order.customer_relation)
        }

      } catch(error) {
        console.log('Error searching equipment', error)
        errorToast(this.create, $trans('Error searching equipment'))
      }
    },
    equipmentLabel({ name }) {
      return name
    },
    selectEquipment(option) {
      this.equipment = option.id
      this.product = option.name

      if (option.location) {
        this.equipment_location = option.location.id
        this.location = option.location.name
        this.locationSearchDisabled = true
      } else {
        this.locationSearchDisabled = false
      }
    },
    // equipment locations
    showAddLocationModal() {
      this.$refs.multiselect_location.deactivate()
      this.newLocationName =this.$refs.multiselect_location.$refs.search.value
      this.$refs['new-location-modal'].show()
    },
    cancelCreateLocation() {
      this.$refs['new-location-modal'].hide()
    },
    async submitCreateLocation() {
      this.$refs.multiselect_location.deactivate()

      try {
        if (!this.hasBranches) {
          const response = this.isPlanning || this.isAdmin ?
            await this.locationService.quickAddCustomerPlanning(this.newLocationName, this.order.customer_relation) :
            await this.locationService.quickAddCustomerNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        } else {
          const response = await this.locationService.quickAddBranchPlanning(this.newLocationName, this.order.branch);

          this.equipment_location = response.id
          this.location = response.name
        }
      }  catch(error) {
        console.log('Error adding location', error)
        errorToast(this.create, $trans('Error adding location'))
      }
    },
    async getSalesUsers(query) {
      if (query === '') return
      this.salesUsers = []
      this.searchingSalesUsers = true

      try {
        this.salesUsers = await this.userListService.search(query, 'sales_user')
        this.searchingSalesUsers = false
      } catch(error) {
        console.log('Error fetching sales users', error)
        errorToast(this.create, $trans('Error fetching sales users'))
        this.searchingSalesUsers = false
      }
    },
    async getLocation(query) {
      try {
        if (this.hasBranches) {
          this.locationSearch = await this.locationService.searchBranch(query, this.order.branch)
        } else {
          this.locationSearch = await this.locationService.searchCustomer(query, this.order.customer_relation)
        }
      } catch(error) {
        console.log('Error searching location', error)
        errorToast(this.create, $trans('Error searching location'))
      }
    },
    locationLabel({ name }) {
      return name
    },
    selectLocation(option) {
      this.equipment_location = option.id
      this.location = option.name
    },
    // order lines
    deleteOrderLine(index) {
      this.deletedOrderlines.push(this.order.orderlines[index])
      this.order.orderlines.splice(index, 1)
    },
    editOrderLine(item, index) {
      this.editIndex = index
      this.isEditOrderLine = true

      this.orderline_pk = item.id
      this.product = item.product
      this.location = item.location
      this.remarks = item.remarks

      if (item.equipment && item.equipment_location) {
        this.equipment_location = item.equipment_location
        this.equipment = item.equipment
        this.isEditEquipment = true
      }
    },
    emptyOrderLine() {
      this.orderline_pk = null
      this.product = ''
      this.location = ''
      this.remarks = ''
      this.equipment_location = null
      this.equipment = null
    },
    doEditOrderLine() {
      const orderLine = {
        id: this.orderline_pk,
        product: this.product,
        location: this.location,
        remarks: this.remarks,
        equipment_location: this.equipment_location,
        equipment: this.equipment,
      }
      this.order.orderlines.splice(this.editIndex, 1, orderLine)
      this.editIndex = null
      this.isEditOrderLine = false
      this.isEditEquipment = false
      this.emptyOrderLine()
    },
    addOrderLine() {
      this.order.orderlines.push({
        product: this.product,
        location: this.location,
        remarks: this.remarks,
        equipment_location: this.equipment_location,
        equipment: this.equipment,
      })
      this.emptyOrderLine()
    },

    // info lines
    deleteInfoLine(index) {
      this.deletedInfolines.push(this.order.infolines[index])
      this.order.infolines.splice(index, 1)
    },
    editInfoLine(item, index) {
      this.infoline_pk = item.id
      this.editIndex = index
      this.isEditInfoLine = true

      this.info = item.info
    },
    emptyInfoLine() {
      this.infoline_pk = null
      this.info = ''
    },
    doEditInfoLine() {
      const infoLine = {
        id: this.infoline_pk,
        info: this.info,
      }
      this.order.infolines.splice(this.editIndex, 1, infoLine)
      this.editIndex = null
      this.isEditInfoLine = false
      this.emptyInfoLine()
    },
    addInfoLine() {
      this.order.infolines.push({
        info: this.info,
      })
      this.emptyInfoLine()
    },

    engineerLabel({ name }) {
      return name
    },

    salesLabel({ email }) {
      return email
    },

    customerLabel({ name, address, city}) {
      return `${name} - ${address} - ${city}`
    },
    async selectCustomer(option) {
      // const topUsers = await timeRegistrationModel.getTopUsersForCustomerView(option.id)
      // let users = []
      // for (let i=0; i<topUsers.data.length; i++) {
      //   const bla = users.find((user) => user.full_name === topUsers.data[i].full_name)
      //   console.log(topUsers.data[i].full_name, bla)
      //   if (!bla) {
      //     users.push(topUsers.data[i])
      //   }
      // }
      // this.recommendedUsers = users
      this.fillCustomer(option)
      if (this.usesEquipment) {
        await this.getEquipment('')
        await this.getLocation('')
      }
    },
    fillCustomer(customer) {
      this.order.customer_relation = customer.id
      this.order.customer_id = customer.customer_id
      this.order.order_name = customer.name
      this.order.order_address = customer.address
      this.order.order_city = customer.city
      this.order.order_postal = customer.postal
      this.order.order_country_code = customer.country_code
      this.order.order_tel = customer.tel
      this.order.order_mobile = customer.mobile
      this.order.order_email = customer.email
      this.order.order_contact = customer.contact
      this.order.customer_remarks = customer.remarks
    },

    branchLabel({ name, address, city}) {
      return `${name} - ${address} - ${city}`
    },
    selectBranch(option) {
      this.fillBranch(option)
    },
    fillBranch(branch) {
      this.order.branch = branch.id
      this.order.order_name = branch.name
      this.order.order_address = branch.address
      this.order.order_city = branch.city
      this.order.order_postal = branch.postal
      this.order.order_country_code = branch.country_code
      this.order.order_tel = branch.tel
      this.order.order_mobile = branch.mobile
      this.order.order_email = branch.email
      this.order.order_contact = branch.contact
      this.order.customer_remarks = branch.remarks
    },

    async editAndAccept() {
      this.buttonDisabled = true
      this.acceptOrder = true
      await this.submitForm()
    },
    async reject() {
      await this.orderService.setRejected(this.pk)
      this.cancelForm()
    },
    async submitForm(e) {
      if(e && e.target.value === 'dispatch') this.nextField = 'dispatch';

      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['start_time', 'end_time']
      for (let i=0; i<null_fields.length; i++) {
        if (this.order[null_fields[i]] === null || this.order[null_fields[i]] === "") {
          delete this.order[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      const orderlines = this.order.orderlines
      this.order.orderlines = []

      this.order.order_email_extra = []
      this.selectedSalesUsers.forEach((user) => {
        this.order.order_email_extra.push(user.email)
      })

      // filter out empty infolines
      const infolines = this.order.infolines.filter(
        (i) => i.info && i.info.replace(' ', '') !== '')
      this.order.infolines = []

      let errors = []

      // don't handle again when there's no error
      if (!this.order.hasOwnProperty('apiOk') || !this.order.apiOk) {
        try {
          const newOrder = this.isCreate ? await this.orderService.insert(this.order) :
            await this.orderService.update(this.pk, this.order)
          this.order = {
            ...this.order,
            ...newOrder,
            apiOk: true
          }
        } catch(error) {
          errors.push(error)
          this.order.apiOk = false
          this.order.error = error
          this.buttonDisabled = false
          this.isLoading = false
          console.log('Error creating order', error)
          // errorToast(this.create, $trans('Error creating order'))
          return
        }
      } else {
        console.log("not resubmitting order")
      }

      const [processedOrderlines, orderlineErrors] = await this.handleOrderlines(orderlines)
      this.order.orderlines = processedOrderlines
      errors = [...errors, ...orderlineErrors]

      const [processedInfolines, infolineErrors] = await this.handleInfolines(infolines)
      this.order.infolines = processedInfolines
      errors = [...errors, ...infolineErrors]

      // this document handling here is only needed when creating an order
      if (this.isCreate) {
        // TODO why is this if here? shouldn't be needed
        // if (this.order.id) {
          const documentErrors = await this.$refs['documents-component'].orderCreated(this.order.id)
          errors = [...errors, ...documentErrors]
        // }
      }

      // TODO why is this if here? shouldn't be needed
      // if (this.order.id) {
      const assignErrors = await this.assignEngineers(this.order.order_id)
      const removeErrors = await this.unassignEngineers(this.order.id)
      errors = [...errors, ...assignErrors, ...removeErrors]
      // }

      if (!this.isCreate && this.acceptOrder) {
        try {
          await this.orderService.setAccepted(this.pk)
          infoToast(this.create, $trans('Accepted'), $trans('Order has been accepted'))
        } catch(error) {
          errors.push(error)
          console.log('Error accepting order', error)
          errorToast(this.create, $trans('Error accepting order'))
        }
      }

      if (errors.length > 0) {
        // TODO do we want this message? the errors in the form are obvious
        errorToast(this.create, $trans('There were errors'))
        console.log('There were errors', errors)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      if (this.isCreate) {
        infoToast(this.create, $trans('Created'), $trans('Order has been created'))
      } else {
        infoToast(this.create, $trans('Updated'), $trans('Order has been updated'))
      }

      if (this.nextField === 'dispatch') {
        await this.$router.push({name: 'mobile-dispatch'})
        return
      }

      this.$router.go(-1)
    },
    async handleOrderlines(orderlines) {
      let processedOrderlines = []
      let errors = []

      for (const orderline of orderlines) {
        // don't insert again
        if (!orderline.hasOwnProperty('apiOk') || !orderline.apiOk) {
          try {
            orderline.order = this.order.id

            if (orderline.id) {
              let newOrderline = await this.orderlineService.update(orderline.id, orderline)
              newOrderline.apiOk = true
              processedOrderlines.push(newOrderline)
            } else {
              let newOrderline = await this.orderlineService.insert(orderline)
              newOrderline.apiOk = true
              processedOrderlines.push(newOrderline)
            }
          } catch (error) {
            errors.push(error)
            console.log('Error handling orderline', error)
            processedOrderlines.push({
              ...orderline,
              error: error,
              apiOk: false
            })
          }
        } else {
          console.log("not resubmitting orderline")
        }
      }

      if (!this.isCreate) {
        for (const orderline of this.deletedOrderlines) {
          if (orderline.id) {
            try {
              await this.orderlineService.delete(orderline.id)
            } catch (error) {
              errors.push(error)
              console.log('Error handling orderline', error)
              processedOrderlines.push({
                ...orderline,
                error: error,
                apiOk: false
              })
            }
          }
        }
      }

      return [processedOrderlines, errors]
    },
    async handleInfolines(infolines) {
      let errors = []
      let processedInfolines = []

      for (const infoline of infolines) {
        // don't insert again when there's no error
        if (!infoline.hasOwnProperty('apiOk') || !infoline.apiOk) {
          try {
            infoline.order = this.order.id

            if (infoline.id) {
              let newInfoline = await this.infolineService.update(infoline.id, infoline)
              newInfoline.apiOk = true
              processedInfolines.push(newInfoline)
            } else {
              let newInfoline = await this.infolineService.insert(infoline)
              newInfoline.apiOk = true
              processedInfolines.push(newInfoline)
            }
          } catch (error) {
            errors.push(error)
            console.log('Error handling infoline', error)
            processedInfolines.push({
              ...infoline,
              error: error,
              apiOk: false
            })
          }
        } else {
          console.log("not resubmitting infoline")
        }
      }

      if (!this.isCreate) {
        for (const infoline of this.deletedInfolines) {
          if (infoline.id) {
            try {
              await this.infolineService.delete(infoline.id)
            } catch (error) {
              errors.push(error)
              console.log('Error deleting infoline', error)
              processedInfolines.push({
                ...infoline,
                error: error,
                apiOk: false
              })
            }
          }
        }
      }

      return [processedInfolines, errors]
    },
    async unassignEngineers(order_pk) {
      if (this.removedEngineers.length === 0) {
        return []
      }

      let errors = []
      let unassigned_total = 0

      for (const engineer of this.removedEngineers) {
        try {
          let result = await this.assignService.unAssign(engineer.user_id, order_pk)
          // If `result.result == 0`, the removal was not allowed; which, at this
          // time, only happens when there are booked hours or materials. In the
          // future, perhaps a 'reason' for failure could be included, but for
          // now, a zero value indicates failure.
          if (!result.result) {
            errors.push( `${engineer.full_name} ${$trans('has booked hours or materials')}` )
          } else {
            unassigned_total++
          }
        } catch (error) {
          errors.push(error)
          console.log('error un-assigning engineers', error)
        }
      }

      if (errors.length === 0) {
        infoToast(this.create, $trans('Engineers unassigned'), `${unassigned_total} ${$trans('engineer(s) have been unassigned')}`)
      } else {
        console.log('errors un-assigning engineers', errors)
        errorToast(this.create, errors.join(', '), $trans('There were errors unassigning engineers'))
      }

      // unsure what assignResult does elsewhere?
      // this.assignResult = newSelectedEngineers
      this.removedEngineers = []
      return errors
    },
    async assignEngineers(order_id) {
      if (this.selectedEngineers.length === 0) {
        return []
      }

      let errors = []
      let newSelectedEngineers = []

      for (const user of this.selectedEngineers) {
        try {
          await this.assignService.assignToUser(user.id, [order_id], true)
          newSelectedEngineers.push({
            ...user,
            apiOk: true
          })
        } catch (error) {
          newSelectedEngineers.push({
            ...user,
            apiOk: false,
            error
          })
          errors.push(error)
          console.log('error assigning to users', error)
        }
      }

      if (errors.length === 0) {
        infoToast(this.create, $trans('Assigned'), $trans('Order assigned'))
      } else {
        console.log('errors assigning to users', errors)
        errorToast(this.create, $trans('There were errors assigning to users'))
      }

      this.assignResult = newSelectedEngineers
      this.selectedEngineers = []

      return errors
    },
    async getCustomers(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.customers = await this.customerService.search(query)
        this.isLoading = false
      } catch(error) {
        console.warn('Error fetching customers', error)
        errorToast(this.create, $trans('Error fetching customers'))
        this.isLoading = false
      }
    },
    async getBranches(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.branches = await this.branchService.search(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching branches', error)
        errorToast(this.create, $trans('Error fetching branches'))
        this.isLoading = false
      }
    },
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = await this.orderService.detail(this.pk)
        this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.order.end_date = this.$moment(this.order.end_date, 'DD/MM/YYYY').toDate()
        this.order.order_type = this.order.order_type.trim()

        for (const email of this.order.order_email_extra) {
          this.selectedSalesUsers.push({
            'email': email
          })
        }

        this.isLoading = false
      } catch(error) {
        console.warn('error fetching order', error)
        errorToast(this.create, $trans('Error fetching order'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    },
  }
}
</script>
<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.multiselect {
  width: auto;
  flex-grow: 1;
}
.time-input {
  width: 100px !important;
  float:left !important;
}
.clock-icon {
  margin: .5em auto auto;
}
</style>
