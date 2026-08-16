<template>
  <b-modal
    id="new-equipment-modal"
    ref="newEquipmentModal"
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
    ref="newLocationModal"
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

  <div class="app-page" v-if="order">
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
          <router-link :to="{name: 'order-view', params: {pk}}">#<strong>{{ pk }}</strong></router-link>
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
              <template #noResult>{{ $trans('Nothing found.') }}</template>
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
              <template #noResult>{{ $trans('Nothing found.') }}</template>
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

                :state="stateOf('customer_relation')"
              ></BFormInput>
              <BFormInput
                v-else
                v-model="order.order_name"
                id="order_name"

                :state="stateOf('branch')"
              ></BFormInput>
              <template #append v-if="!hasBranches">
                <BFormInput
                  v-model="order.customer_id"
                  :readonly="true"
                  :title="$trans('Customer ID')"
                  id="customer_id"
                  style="max-width: 9ch"
                  :state="stateOf('customer_id')">
                </BFormInput>
              </template>
            </b-input-group>

            <b-form-invalid-feedback
              v-if="!hasBranches"
              :state="stateOf('customer_relation')">
              {{ errorFor('customer_relation') || $trans('Please select a customer') }}
            </b-form-invalid-feedback>

            <b-form-invalid-feedback
              v-else
              :state="stateOf('branch')">
              {{ errorFor('branch') || $trans('Please select a branch') }}
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
                :state="stateOf('order_address')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_address')">
                {{ errorFor('order_address') || $trans('Please enter the address') }}
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
                :state="stateOf('order_postal')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_postal')">
                {{ errorFor('order_postal') || $trans('Please enter the postal') }}
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
                :state="stateOf('order_city')"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="stateOf('order_city')">
                {{ errorFor('order_city') || $trans('Please enter the city') }}
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
              v-model="order.order_type"
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
                :state="stateOf('start_date')"
              >
                <VueDatePicker
                  id="start_date"
                  v-model="order.start_date"
                  :placeholder="$trans('Select date')"
                  :locale="nl"
                  auto-apply
                  arrow-navigation
                  :state="stateOf('start_date')"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="stateOf('start_date')">
                  {{ errorFor('start_date') || $trans('Please enter a start date') }}
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
                  :state="stateOf('start_time')">
                  {{ errorFor('start_time') || $trans('Please enter a valid start time HH:mm') }}
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
                  :state="stateOf('end_date')"
                  :formats="{ input: 'dd/MM/yyyy' }"
                ></VueDatePicker>
                <b-form-invalid-feedback
                  :state="stateOf('end_date')">
                  {{ errorFor('end_date') || $trans('Please enter an end date') }}
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
                  :state="stateOf('end_time')">
                  {{ errorFor('end_time') || $trans('Please enter a valid end time HH:mm') }}
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
                <template #noResult>{{ $trans('Nothing found.') }}</template>
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
            :label="$trans('Assignee(s)')"
            label-for="order-assigned-to"
            label-cols="3">
            <div v-if="!order.assigned_user_info || order.assigned_user_info.length===0">
              <label  class="col-form-label order-assignee dimmed">{{ $trans('Nobody assigned') }}</label>
            </div>
            <div v-if="order.assigned_user_info && order.assigned_user_info.length>0">
              <div class="col-form-label order-assignee" v-for="(engineer, index) in order.assigned_user_info" :key="index">
                <span>{{ engineer.full_name }}</span>
                <BButton
                  v-if="engineer.booked===0"
                  @click="unassignEngineer(engineer, $event)"
                  class="float-right h5 mx-2"
                  variant="light"
                >
                  <IBiTrashFill></IBiTrashFill>
                </BButton>
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
              <template #noResult>
                {{ $trans('Oops! No elements found. Consider changing the search query.') }}
              </template>
            </VueMultiselect>
          </BFormGroup>
        </div>

        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              :order="order"
              :is-view="false"
              ref="documentsComponent"
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
                    <BLink class="h5 mx-2" @click.prevent="editOrderLine(orderline, index)">
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
                    ref="multiselectEquipment"
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
                    <template #noResult>
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
                    </template>
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
                    ref="multiselectLocation"
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
                    <template #noResult>
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
                    </template>
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
                    <BLink class="h5 mx-2" @click.prevent="editInfoLine(infoline, index)">
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

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import moment from 'moment'
import { nl } from 'date-fns/locale'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import VueMultiselect from 'vue-multiselect'
import { useToast } from 'bootstrap-vue-next'

import { OrderService, OrderModel } from '@/models/orders/Order'
import { SchemaValidationError, type FieldErrors } from '@/models/schema'
import { CustomerService } from '@/models/customer/Customer'
import { AssignService } from '@/models/mobile/Assign'
import { BranchService } from '@/models/company/Branch'
import { EquipmentService } from '@/models/equipment/equipment'
import { QuotationService } from '@/models/quotations/Quotation'
import { LocationService } from '@/models/equipment/location'
import { OrderlineService } from '@/models/orders/Orderline'
import { InfolineService } from '@/models/orders/Infoline'
import { UserListService } from '@/models/company/UserList.js'

import OrderTypesSelect from '@/components/OrderTypesSelect.vue'
import DocumentsComponent from './order_form/DocumentsComponent.vue'
import ApiResult from '@/components/ApiResult.vue'

import { errorToast, infoToast, $trans } from '@/utils'
import { useCommon } from '@/mixins/common'
import { useMainStore } from '@/stores/main'

const props = withDefaults(
  defineProps<{
    pk?: string | number | null
    unaccepted?: boolean
    maintenance?: boolean
    from_quotation?: boolean
    quotation_id?: string | number | null
  }>(),
  {
    pk: null,
    unaccepted: false,
    maintenance: false,
    from_quotation: false,
    quotation_id: null,
  },
)

const { create } = useToast()
const router = useRouter()
const mainStore = useMainStore()
// The options-API mixin's computeds, as refs. Same getters, same stores.
const { hasBranches, isPlanning, isAdmin } = useCommon()

const equipmentService = new EquipmentService()
const quotationService = new QuotationService()
const customerService = new CustomerService()
const orderService = new OrderService()
const branchService = new BranchService()
const locationService = new LocationService()
const orderlineService = new OrderlineService()
const infolineService = new InfolineService()
const assignService = new AssignService()
const userListService = new UserListService()

/**
 * The order the form binds to.
 *
 * `any` rather than `unknown` deliberately: every field is read and written by
 * name straight from the template, the form grafts the API response onto it
 * (`apiOk`, `error`), and the model it comes from is only partly typed.
 * Narrowing happens on the way out, where `orderService.insert`/`update` parse
 * it against the generated write schema.
 */
const order = ref<any>(null)

const isLoading = ref(false)
// FIXME HVG20250320 The state for all the search tables (branches, customers)
// should ideally be kept separate from `isLoading` to avoid unnecessary
// flickering of irrelevant UI elements.
const isLookupLoading = ref({ engineers: false })
const buttonDisabled = ref(false)
const acceptOrder = ref(false)
const countries = ref<unknown[]>([])
const nextField = ref('orders')

/** A row of the order-lines table, posted to its own endpoint after the order. */
interface Orderline {
  id?: number | null
  order?: number | string | null
  product?: string
  location?: string
  remarks?: string
  equipment?: number | null
  equipment_location?: number | null
  amount?: number
  maintenance_contract?: number
  apiOk?: boolean
  error?: unknown
}

/** A row of the info-lines table, likewise posted separately. */
interface Infoline {
  id?: number | null
  order?: number | string | null
  info?: string
  apiOk?: boolean
  error?: unknown
}

// orderline entry fields
const editIndex = ref<number | null>(null)
const isEditOrderLine = ref(false)
const orderline_pk = ref<number | null>(null)
const product = ref('')
const equipment = ref<number | null>(null)
const location = ref('')
const equipment_location = ref<number | null>(null)
const remarks = ref('')
const isEditEquipment = ref(false)
const deletedOrderlines = ref<Orderline[]>([])

// infoline entry fields
const infoline_pk = ref<number | null>(null)
const info = ref('')
const isEditInfoLine = ref(false)
const deletedInfolines = ref<Infoline[]>([])

const orderLineFields = [{ key: 'info', label: $trans('Orderline') }]
const infoLineFields = [
  { key: 'info', label: $trans('Info') },
  { key: 'icons', label: '' },
]
const recommendedUsers = ref<any[]>([])
const recommendedUsersFields = [{ key: 'full_name', label: $trans('Name') }]
const nextFieldOptions = [
  { item: 'orders', name: $trans('Orders') },
  { item: 'dispatch', name: $trans('Dispatch') },
]

// lookups
const customers = ref<any[]>([])
const customerSearch = ref('')
const branches = ref<any[]>([])
const branchSearch = ref('')
const engineers = ref<any[]>([])
const selectedEngineers = ref<any[]>([])
const removedEngineers = ref<any[]>([])
const assignResult = ref<any[]>([])
const salesUsers = ref<any[]>([])
const selectedSalesUsers = ref<any[]>([])
const searchingSalesUsers = ref(false)
const equipmentSearch = ref<any[]>([])
const newEquipmentName = ref<string | null>(null)
const locationSearch = ref<any[]>([])
const newLocationName = ref<string | null>(null)
const locationSearchDisabled = ref(false)
const files = ref<unknown[]>([])

const start_time_date = ref<any>(null)
const end_time_date = ref<any>(null)

const newEquipmentModal = useTemplateRef<any>('newEquipmentModal')
const newLocationModal = useTemplateRef<any>('newLocationModal')
const multiselectEquipment = useTemplateRef<any>('multiselectEquipment')
const multiselectLocation = useTemplateRef<any>('multiselectLocation')
const documentsComponent = useTemplateRef<any>('documentsComponent')

/**
 * Validation state, produced by the generated Order write schema rather than by
 * a hand-maintained rule set.
 *
 * The two vuelidate rule sets this form used to carry - one per tenant, plus a
 * hand-written `isCorrectTime` - were a copy of what the serializers already
 * declare. `orderService.insert`/`update` check the payload against the
 * serializer the backend will read it with and refuse to send one that fails,
 * so the tenant split lives in `orderCreateSchemaFor` now and arrives with the
 * next codegen run rather than being maintained here. This form has no rules of
 * its own; it renders what the model refused.
 */
const errors = ref<FieldErrors>({})
const submitClicked = ref(false)

/**
 * Who the backend will read this write as.
 *
 * This form is the planning/staff one, which is the only role where the tenant
 * matters: `OrderCreateSerializer` makes `branch` required for a member with
 * branches and `customer_relation` required for one without.
 */
const writeContext = computed(() => ({ role: 'planning' as const, hasBranches: hasBranches.value }))

const isSubmitClicked = computed(() => submitClicked.value)
const isCreate = computed(() => !props.pk)
const usesEquipment = computed(() => mainStore.getMemberUsesEquipment)
const canQuickCreateEquipment = computed(() => mainStore.getSettingEquipmentPlanningQuickCreate)
const canQuickCreateEquipmentLocation = computed(
  () => mainStore.getSettingEquipmentLocationPlanningQuickCreate,
)

const equipmentFormSearchOk = computed(() =>
  hasBranches.value ? order.value?.branch !== null : order.value?.customer_relation !== null,
)

const isOrderLineValid = computed(
  () => location.value !== null && location.value !== '' && product.value !== null && product.value !== '',
)

/** The message to show under a field, or `''` while the form is still clean. */
function errorFor(field: string): string {
  return submitClicked.value ? (errors.value[field] ?? '') : ''
}

/**
 * A b-form `:state` for a field: `null` (neutral) until submit, then
 * false/true. Matches what the vuelidate-driven `:state` bindings did.
 */
function stateOf(field: string): boolean | null {
  return submitClicked.value ? !errors.value[field] : null
}

function formatTime(hours: number, minutes: number) {
  const hoursOut = hours < 10 ? `0${hours}` : `${hours}`
  const minutesOut = minutes < 10 ? `0${minutes}` : `${minutes}`
  return `${hoursOut}:${minutesOut}`
}

watch(start_time_date, (val) => {
  if (val) {
    order.value.start_time = formatTime(val.hours, val.minutes)
  }
})

watch(end_time_date, (val) => {
  if (val) {
    order.value.end_time = formatTime(val.hours, val.minutes)
  }
})

// Keep the range consistent: moving one end past the other drags the other with
// it, rather than letting the user submit an end date before its start.
watch(
  () => order.value?.start_date,
  (start) => {
    if (start && order.value.end_date && new Date(order.value.end_date) < new Date(start)) {
      order.value.end_date = start
    }
  },
)

watch(
  () => order.value?.end_date,
  (end) => {
    if (end && order.value.start_date && new Date(end) < new Date(order.value.start_date)) {
      order.value.start_date = end
    }
  },
)

// Search engineers
async function getEngineers(query: string) {
  isLookupLoading.value.engineers = true

  try {
    engineers.value = await userListService.search(query, 'engineer')
  } catch (error) {
    console.log('Error searching engineers', error)
    errorToast(create, $trans('Error searching engineers'))
  }

  isLookupLoading.value.engineers = false
}

// remove engineers
function unassignEngineer(engineer: any, event: any) {
  removedEngineers.value.push(engineer)
  event.target.closest('.order-assignee').style.textDecoration = 'line-through'
  event.target.style.display = 'none'
}

// equipment
function showAddEquipmentModal() {
  multiselectEquipment.value.deactivate()
  newEquipmentName.value = multiselectEquipment.value.$refs.search.value
  newEquipmentModal.value.show()
}

function cancelCreateEquipment() {
  newEquipmentModal.value.hide()
}

async function submitCreateEquipment() {
  multiselectEquipment.value.deactivate()

  try {
    if (!hasBranches.value) {
      const response = isPlanning.value || isAdmin.value
        ? await equipmentService.quickAddCustomerPlanning(newEquipmentName.value, order.value.customer_relation)
        : await equipmentService.quickAddCustomerNonPlanning(newEquipmentName.value)

      equipment.value = response.id
      product.value = response.name
    } else {
      const response = await equipmentService.quickAddBranchPlanning(newEquipmentName.value, order.value.branch)

      equipment.value = response.id
      product.value = response.name
    }
  } catch (error) {
    console.log('Error adding equipment', error)
    errorToast(create, $trans('Error adding equipment'))
  }
}

async function getEquipment(query: string) {
  try {
    equipmentSearch.value = hasBranches.value
      ? await equipmentService.searchBranch(query, order.value.branch)
      : await equipmentService.searchCustomer(query, order.value.customer_relation)
  } catch (error) {
    console.log('Error searching equipment', error)
    errorToast(create, $trans('Error searching equipment'))
  }
}

function selectEquipment(option: any) {
  equipment.value = option.id
  product.value = option.name

  if (option.location) {
    equipment_location.value = option.location.id
    location.value = option.location.name
    locationSearchDisabled.value = true
  } else {
    locationSearchDisabled.value = false
  }
}

// equipment locations
function showAddLocationModal() {
  multiselectLocation.value.deactivate()
  newLocationName.value = multiselectLocation.value.$refs.search.value
  newLocationModal.value.show()
}

function cancelCreateLocation() {
  newLocationModal.value.hide()
}

async function submitCreateLocation() {
  multiselectLocation.value.deactivate()

  try {
    if (!hasBranches.value) {
      const response = isPlanning.value || isAdmin.value
        ? await locationService.quickAddCustomerPlanning(newLocationName.value, order.value.customer_relation)
        : await locationService.quickAddCustomerNonPlanning(newLocationName.value)

      equipment_location.value = response.id
      location.value = response.name
    } else {
      const response = await locationService.quickAddBranchPlanning(newLocationName.value, order.value.branch)

      equipment_location.value = response.id
      location.value = response.name
    }
  } catch (error) {
    console.log('Error adding location', error)
    errorToast(create, $trans('Error adding location'))
  }
}

async function getLocation(query: string) {
  try {
    locationSearch.value = hasBranches.value
      ? await locationService.searchBranch(query, order.value.branch)
      : await locationService.searchCustomer(query, order.value.customer_relation)
  } catch (error) {
    console.log('Error searching location', error)
    errorToast(create, $trans('Error searching location'))
  }
}

function selectLocation(option: any) {
  equipment_location.value = option.id
  location.value = option.name
}

async function getSalesUsers(query: string) {
  if (query === '') return

  salesUsers.value = []
  searchingSalesUsers.value = true

  try {
    salesUsers.value = await userListService.search(query, 'sales_user')
  } catch (error) {
    console.log('Error fetching sales users', error)
    errorToast(create, $trans('Error fetching sales users'))
  }

  searchingSalesUsers.value = false
}

async function getCustomers(query: string) {
  if (query === '') return

  isLoading.value = true

  try {
    customers.value = await customerService.search(query)
  } catch (error) {
    console.warn('Error fetching customers', error)
    errorToast(create, $trans('Error fetching customers'))
  }

  isLoading.value = false
}

async function getBranches(query: string) {
  if (query === '') return

  isLoading.value = true

  try {
    branches.value = await branchService.search(query)
  } catch (error) {
    console.log('Error fetching branches', error)
    errorToast(create, $trans('Error fetching branches'))
  }

  isLoading.value = false
}

const getSalesUserDebounced = AwesomeDebouncePromise(getSalesUsers, 500)
const getCustomersDebounced = AwesomeDebouncePromise(getCustomers, 500)
const getBranchesDebounced = AwesomeDebouncePromise(getBranches, 500)
const getEquipmentDebounced = AwesomeDebouncePromise(getEquipment, 500)
const getLocationDebounced = AwesomeDebouncePromise(getLocation, 500)
const getEngineersDebounced = AwesomeDebouncePromise(getEngineers, 500)

// order lines
function deleteOrderLine(index: number | string) {
  deletedOrderlines.value.push(order.value.orderlines[index])
  order.value.orderlines.splice(Number(index), 1)
}

function editOrderLine(item: Orderline, index: number | string) {
  editIndex.value = Number(index)
  isEditOrderLine.value = true

  orderline_pk.value = item.id ?? null
  product.value = item.product ?? ''
  location.value = item.location ?? ''
  remarks.value = item.remarks ?? ''

  if (item.equipment && item.equipment_location) {
    equipment_location.value = item.equipment_location
    equipment.value = item.equipment
    isEditEquipment.value = true
  }
}

function emptyOrderLine() {
  orderline_pk.value = null
  product.value = ''
  location.value = ''
  remarks.value = ''
  equipment_location.value = null
  equipment.value = null
}

function doEditOrderLine() {
  order.value.orderlines.splice(editIndex.value, 1, {
    id: orderline_pk.value,
    product: product.value,
    location: location.value,
    remarks: remarks.value,
    equipment_location: equipment_location.value,
    equipment: equipment.value,
  })

  editIndex.value = null
  isEditOrderLine.value = false
  isEditEquipment.value = false
  emptyOrderLine()
}

function addOrderLine() {
  order.value.orderlines.push({
    product: product.value,
    location: location.value,
    remarks: remarks.value,
    equipment_location: equipment_location.value,
    equipment: equipment.value,
  })

  emptyOrderLine()
}

// info lines
function deleteInfoLine(index: number | string) {
  deletedInfolines.value.push(order.value.infolines[index])
  order.value.infolines.splice(Number(index), 1)
}

function editInfoLine(item: Infoline, index: number | string) {
  infoline_pk.value = item.id ?? null
  editIndex.value = Number(index)
  isEditInfoLine.value = true

  info.value = item.info ?? ''
}

function emptyInfoLine() {
  infoline_pk.value = null
  info.value = ''
}

function doEditInfoLine() {
  order.value.infolines.splice(editIndex.value, 1, {
    id: infoline_pk.value,
    info: info.value,
  })

  editIndex.value = null
  isEditInfoLine.value = false
  emptyInfoLine()
}

function addInfoLine() {
  order.value.infolines.push({ info: info.value })
  emptyInfoLine()
}

function engineerLabel({ name }: { name: string }) {
  return name
}

function salesLabel({ email }: { email: string }) {
  return email
}

function customerLabel({ name, address, city }: { name: string; address: string; city: string }) {
  return `${name} - ${address} - ${city}`
}

function branchLabel({ name, address, city }: { name: string; address: string; city: string }) {
  return `${name} - ${address} - ${city}`
}

function equipmentLabel({ name }: { name: string }) {
  return name
}

function locationLabel({ name }: { name: string }) {
  return name
}

function fillCustomer(customer: any) {
  order.value.customer_relation = customer.id
  order.value.customer_id = customer.customer_id
  order.value.order_name = customer.name
  order.value.order_address = customer.address
  order.value.order_city = customer.city
  order.value.order_postal = customer.postal
  order.value.order_country_code = customer.country_code
  order.value.order_tel = customer.tel
  order.value.order_mobile = customer.mobile
  order.value.order_email = customer.email
  order.value.order_contact = customer.contact
  order.value.customer_remarks = customer.remarks
}

async function selectCustomer(option: any) {
  fillCustomer(option)

  if (usesEquipment.value) {
    await getEquipment('')
    await getLocation('')
  }
}

function fillBranch(branch: any) {
  order.value.branch = branch.id
  order.value.order_name = branch.name
  order.value.order_address = branch.address
  order.value.order_city = branch.city
  order.value.order_postal = branch.postal
  order.value.order_country_code = branch.country_code
  order.value.order_tel = branch.tel
  order.value.order_mobile = branch.mobile
  order.value.order_email = branch.email
  order.value.order_contact = branch.contact
  order.value.customer_remarks = branch.remarks
}

function selectBranch(option: any) {
  fillBranch(option)
}

async function handleOrderlines(orderlines: Orderline[]): Promise<[Orderline[], unknown[]]> {
  const processedOrderlines: Orderline[] = []
  const errorList: unknown[] = []

  for (const orderline of orderlines) {
    // don't insert again
    if (orderline.apiOk) {
      console.log('not resubmitting orderline')
      continue
    }

    try {
      orderline.order = order.value.id

      const newOrderline = orderline.id
        ? await orderlineService.update(orderline.id, orderline)
        : await orderlineService.insert(orderline)

      newOrderline.apiOk = true
      processedOrderlines.push(newOrderline)
    } catch (error) {
      errorList.push(error)
      console.log('Error handling orderline', error)
      processedOrderlines.push({ ...orderline, error, apiOk: false })
    }
  }

  if (!isCreate.value) {
    for (const orderline of deletedOrderlines.value) {
      if (!orderline.id) {
        continue
      }

      try {
        await orderlineService.delete(orderline.id)
      } catch (error) {
        errorList.push(error)
        console.log('Error handling orderline', error)
        processedOrderlines.push({ ...orderline, error, apiOk: false })
      }
    }
  }

  return [processedOrderlines, errorList]
}

async function handleInfolines(infolines: Infoline[]): Promise<[Infoline[], unknown[]]> {
  const processedInfolines: Infoline[] = []
  const errorList: unknown[] = []

  for (const infoline of infolines) {
    // don't insert again when there's no error
    if (infoline.apiOk) {
      console.log('not resubmitting infoline')
      continue
    }

    try {
      infoline.order = order.value.id

      const newInfoline = infoline.id
        ? await infolineService.update(infoline.id, infoline)
        : await infolineService.insert(infoline)

      newInfoline.apiOk = true
      processedInfolines.push(newInfoline)
    } catch (error) {
      errorList.push(error)
      console.log('Error handling infoline', error)
      processedInfolines.push({ ...infoline, error, apiOk: false })
    }
  }

  if (!isCreate.value) {
    for (const infoline of deletedInfolines.value) {
      if (!infoline.id) {
        continue
      }

      try {
        await infolineService.delete(infoline.id)
      } catch (error) {
        errorList.push(error)
        console.log('Error deleting infoline', error)
        processedInfolines.push({ ...infoline, error, apiOk: false })
      }
    }
  }

  return [processedInfolines, errorList]
}

async function unassignEngineers(order_pk: number | string) {
  if (removedEngineers.value.length === 0) {
    return []
  }

  const errorList: unknown[] = []
  let unassigned_total = 0

  for (const engineer of removedEngineers.value) {
    try {
      const result = await assignService.unAssign(engineer.user_id, order_pk)
      // If `result.result == 0`, the removal was not allowed; which, at this
      // time, only happens when there are booked hours or materials. In the
      // future, perhaps a 'reason' for failure could be included, but for
      // now, a zero value indicates failure.
      if (!result.result) {
        errorList.push(`${engineer.full_name} ${$trans('has booked hours or materials')}`)
      } else {
        unassigned_total++
      }
    } catch (error) {
      errorList.push(error)
      console.log('error un-assigning engineers', error)
    }
  }

  if (errorList.length === 0) {
    infoToast(
      create,
      $trans('Engineers unassigned'),
      `${unassigned_total} ${$trans('engineer(s) have been unassigned')}`,
    )
  } else {
    console.log('errors un-assigning engineers', errorList)
    errorToast(create, errorList.join(', '), $trans('There were errors unassigning engineers'))
  }

  removedEngineers.value = []
  return errorList
}

async function assignEngineers(order_id: number | string) {
  if (selectedEngineers.value.length === 0) {
    return []
  }

  const errorList: unknown[] = []
  const newSelectedEngineers: any[] = []

  for (const user of selectedEngineers.value) {
    try {
      await assignService.assignToUser(user.id, [order_id], true)
      newSelectedEngineers.push({ ...user, apiOk: true })
    } catch (error) {
      newSelectedEngineers.push({ ...user, apiOk: false, error })
      errorList.push(error)
      console.log('error assigning to users', error)
    }
  }

  if (errorList.length === 0) {
    infoToast(create, $trans('Assigned'), $trans('Order assigned'))
  } else {
    console.log('errors assigning to users', errorList)
    errorToast(create, $trans('There were errors assigning to users'))
  }

  assignResult.value = newSelectedEngineers
  selectedEngineers.value = []

  return errorList
}

/**
 * Set the form's field errors from a failed save, and say whether the failure
 * was one.
 *
 * A `SchemaValidationError` carries one message per field and means nothing was
 * sent - so, unlike an API failure, it must not be recorded on the order as
 * `apiOk: false` with an `error` for `<ApiResult>` to render. It belongs next
 * to the offending inputs.
 */
function reportSchemaErrors(error: unknown): boolean {
  if (!(error instanceof SchemaValidationError)) {
    return false
  }

  errors.value = error.errors
  console.log('invalid order', error.errors)
  return true
}

async function submitForm(e?: any) {
  if (e && e.target && e.target.value === 'dispatch') {
    nextField.value = 'dispatch'
  }

  submitClicked.value = true
  errors.value = {}

  buttonDisabled.value = true
  isLoading.value = true

  const orderlines: Orderline[] = order.value.orderlines
  order.value.orderlines = []

  order.value.order_email_extra = selectedSalesUsers.value.map((user) => user.email)

  // filter out empty infolines. `trim()`, not the `replace(' ', '')` this used
  // to do: that removes only the *first* space, so a line of two spaces counted
  // as content and was posted as an empty infoline.
  const infolines: Infoline[] = order.value.infolines.filter(
    (i: Infoline) => i.info && i.info.trim() !== '',
  )
  order.value.infolines = []

  let errorList: unknown[] = []

  // don't handle again when there's no error
  if (!order.value.apiOk) {
    try {
      const newOrder = isCreate.value
        ? await orderService.insert(order.value, writeContext.value)
        : await orderService.update(props.pk!, order.value, writeContext.value)

      order.value = { ...order.value, ...newOrder, apiOk: true }
    } catch (error) {
      buttonDisabled.value = false
      isLoading.value = false

      // Put the orderlines and infolines back: nothing was sent, and the user
      // is about to fix a field and press submit again.
      order.value.orderlines = orderlines
      order.value.infolines = infolines

      if (reportSchemaErrors(error)) {
        return
      }

      errorList.push(error)
      order.value.apiOk = false
      order.value.error = error
      console.log('Error creating order', error)
      return
    }
  } else {
    console.log('not resubmitting order')
  }

  const [processedOrderlines, orderlineErrors] = await handleOrderlines(orderlines)
  order.value.orderlines = processedOrderlines
  errorList = [...errorList, ...orderlineErrors]

  const [processedInfolines, infolineErrors] = await handleInfolines(infolines)
  order.value.infolines = processedInfolines
  errorList = [...errorList, ...infolineErrors]

  // document handling here is only needed when creating an order
  if (isCreate.value) {
    const documentErrors = await documentsComponent.value.orderCreated(order.value.id)
    errorList = [...errorList, ...documentErrors]
  }

  const assignErrors = await assignEngineers(order.value.order_id)
  const removeErrors = await unassignEngineers(order.value.id)
  errorList = [...errorList, ...assignErrors, ...removeErrors]

  if (!isCreate.value && acceptOrder.value) {
    try {
      await orderService.setAccepted(props.pk!)
      infoToast(create, $trans('Accepted'), $trans('Order has been accepted'))
    } catch (error) {
      errorList.push(error)
      console.log('Error accepting order', error)
      errorToast(create, $trans('Error accepting order'))
    }
  }

  if (errorList.length > 0) {
    errorToast(create, $trans('There were errors'))
    console.error('There were errors', errorList)
    buttonDisabled.value = false
    isLoading.value = false
    return
  }

  if (isCreate.value) {
    infoToast(create, $trans('Created'), $trans('Order has been created'))
  } else {
    infoToast(create, $trans('Updated'), $trans('Order has been updated'))
  }

  if (nextField.value === 'dispatch') {
    await router.push({ name: 'mobile-dispatch' })
    return
  }

  router.go(-1)
}

async function editAndAccept() {
  buttonDisabled.value = true
  acceptOrder.value = true
  await submitForm()
}

async function reject() {
  await orderService.setRejected(props.pk!)
  cancelForm()
}

async function loadOrder() {
  isLoading.value = true

  try {
    const loaded = await orderService.detail(props.pk!)
    loaded.start_date = moment(loaded.start_date, 'DD/MM/YYYY').toDate()
    loaded.end_date = moment(loaded.end_date, 'DD/MM/YYYY').toDate()
    loaded.order_type = loaded.order_type.trim()

    for (const email of loaded.order_email_extra) {
      selectedSalesUsers.value.push({ email })
    }

    order.value = loaded
  } catch (error) {
    console.warn('error fetching order', error)
    errorToast(create, $trans('Error fetching order'))
  }

  isLoading.value = false
}

function cancelForm() {
  router.go(-1)
}

async function load() {
  moment.locale(mainStore.getCurrentLanguage ?? undefined)

  countries.value = mainStore.getCountries

  if (!isCreate.value) {
    await loadOrder()
    return
  }

  order.value = new OrderModel()

  // create order from quotation
  if (props.from_quotation) {
    isLoading.value = true

    const quotation = await quotationService.detail(props.quotation_id!)
    const customer = await customerService.detail(quotation.customer_relation)
    fillCustomer(customer)

    order.value = {
      ...order.value,
      customer_relation: customer.id,
      quotation: props.quotation_id,
      order_reference: quotation.quotation_reference,
    }

    isLoading.value = false
  }

  if (props.maintenance) {
    isLoading.value = true

    // What MaintenanceContractView stashes in the store before routing here;
    // the store types it only as the empty array it starts as.
    const data = mainStore.getMaintenanceEquipment as unknown as {
      maintenanceEquipment: { equipment_pk: number; remarks?: string; amount?: number }[]
      customer_pk: number
      contract_pk: number
    } | null

    if (data) {
      const { maintenanceEquipment, customer_pk, contract_pk } = data

      const customer = await customerService.detail(customer_pk)
      fillCustomer(customer)

      for (const equipmentData of maintenanceEquipment) {
        const item = await equipmentService.detail(equipmentData.equipment_pk)

        order.value.orderlines.push({
          product: item.name,
          location: item.location_name,
          remarks: equipmentData.remarks,
          equipment_location: item.location,
          equipment: item.id,
          amount: equipmentData.amount,
          maintenance_contract: contract_pk,
        })
      }
    }

    isLoading.value = false
  }
}

load()

// `<script setup>` closes the instance, so what the specs drive has to be said
// out loud. This is the component's test surface, nothing more.
defineExpose({
  order,
  errors,
  errorFor,
  stateOf,
  isLoading,
  buttonDisabled,
  submitClicked,
  submitForm,
  editAndAccept,
  reject,
  cancelForm,
  fillCustomer,
  fillBranch,
  selectCustomer,
  selectBranch,
  selectEquipment,
  selectLocation,
  addOrderLine,
  doEditOrderLine,
  editOrderLine,
  emptyOrderLine,
  deleteOrderLine,
  deletedOrderlines,
  addInfoLine,
  doEditInfoLine,
  editInfoLine,
  deleteInfoLine,
  deletedInfolines,
  product,
  location,
  remarks,
  info,
  equipment,
  equipment_location,
  isEditOrderLine,
  isEditInfoLine,
  editIndex,
  selectedEngineers,
  removedEngineers,
  assignResult,
  selectedSalesUsers,
  nextField,
})
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
