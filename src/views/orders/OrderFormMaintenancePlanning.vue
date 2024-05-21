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
        <b-container fluid>
          <b-row role="group">
            <b-col size="12">
              <b-form-group
                v-bind:label="$trans('Equipment name')"
                label-for="maintenance_equipment_new_equipment"
              >
                <b-form-input
                  id="maintenance_equipment_new_equipment"

                  v-model="newEquipmentName"
                ></b-form-input>
              </b-form-group>
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
              <b-form-group
                v-bind:label="$trans('Location name')"
                label-for="new_location"
              >
                <b-form-input
                  id="new_location"

                  v-model="newLocationName"
                ></b-form-input>
              </b-form-group>
            </b-col>
          </b-row>
        </b-container>
      </form>
    </b-modal>

    <header>
      <div class="page-title">
        <h3 v-if="!pk">
          <b-icon icon="file-earmark-plus"></b-icon>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-if="pk">
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <router-link :to="{name:'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', pk:pk}">#<strong>{{ pk }}</strong></router-link>
        / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
            <b-button
              v-if="!isCreate && !hasBranches && (unaccepted || !order.customer_order_accepted)"
              @click="reject"
              class="btn btn-danger"
              type="button"
              variant="danger">{{ $trans('Reject') }}</b-button>
            <b-button
              v-if="!isCreate && !hasBranches && (unaccepted || !order.customer_order_accepted)"
              @click="editAndAccept"
              :disabled="buttonDisabled"
              class="btn btn-primary"
              type="button"
              name="order-done-next"
              value="dispatch"
              variant="primary">{{ $trans('Save &amp; accept') }}
            </b-button>

            <b-button
              v-if="!unaccepted || hasBranches"
              @click="cancelForm"
              class="btn btn-secondary"
              type="button"
              variant="secondary"
              >
              {{ $trans('Cancel') }}
            </b-button>

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

          <b-form-group
            v-if="!hasBranches"
            label-cols="3"
            v-bind:label="$trans('Customer')"
            label-for="order-customer-search"
          >
            <multiselect
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
            </multiselect>
          </b-form-group>


          <b-form-group
            v-if="hasBranches && !from_quotation"
            label-cols="3"
            v-bind:label="$trans('Branch')"
            label-for="order-branch-search"
          >
            <multiselect
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
            </multiselect>
          </b-form-group>

          <b-form-group :label="!hasBranches ? $trans('Customer') : $trans('Branch')"
            label-for="order_name"
            label-cols="3"
            >
            <b-input-group>
              <b-form-input
                v-if="!hasBranches"
                v-model="order.order_name"
                id="order_name"

                :state="isSubmitClicked ? !v$.order.customer_relation.$error : null"
              ></b-form-input>
              <b-form-input
                v-else
                v-model="order.order_name"
                id="order_name"

                :state="isSubmitClicked ? !v$.order.branch.$error : null"
              ></b-form-input>
              <b-input-group-append v-if="!hasBranches">
                <b-form-input
                  v-model="order.customer_id"
                  readonly
                  :title="$trans('Customer ID')"
                  id="customer_id"
                  style="max-width: 9ch"
                  :state="isSubmitClicked ? !v$.order.customer_id.$error : null">
                </b-form-input>
              </b-input-group-append>
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
          </b-form-group>

          <details v-if="order.customer_id" open>
            <summary class="flex-columns space-between">
              <h6>{{ $trans('Customer details') }}</h6>
              <b-icon-chevron-down></b-icon-chevron-down>
            </summary>
            <b-form-group
              v-bind:label="$trans('Address')"
              label-for="order_address"
              label-cols="3"
            >
              <b-form-input
                id="order_address"
                v-model="order.order_address"
                :state="isSubmitClicked ? !v$.order.order_address.$error: null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_address.$error : null">
                {{ $trans('Please enter the address') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Postal')"
              label-for="order_postal"
              label-cols="3"
            >
              <b-form-input
                id="order_postal"
                v-model="order.order_postal"
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_postal.$error : null">
                {{ $trans('Please enter the postal') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Country')"
              label-for="order_country_code"
              label-cols="3"
            >
              <b-form-select v-model="order.order_country_code" :options="countries" ></b-form-select>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('City')"
              label-for="order_city"
              label-cols="3"
            >
              <b-form-input
                id="order_city"

                v-model="order.order_city"
                :state="isSubmitClicked ? !v$.order.order_city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.order.order_city.$error : null">
                {{ $trans('Please enter the city') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Contacts')"
              label-for="order_contact"
              label-cols="3">
              <b-form-input
                id="order_contact"
                v-model="order.order_contact">
              </b-form-input>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Email')"
              label-for="order_email"
              label-cols="3"
              >
              <b-form-input
                id="order_email"

                v-model="order.order_email"
                placeholder="email address">
              </b-form-input>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Mobile')"
              label-for="order_mobile"
              label-cols="3"
            >
              <b-form-input
                id="order_mobile"

                v-model="order.order_mobile"
              ></b-form-input>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Phone')"
              label-for="order_tel"
              label-cols="3"
            >
              <b-form-input
                id="order_tel"

                v-model="order.order_tel"
              ></b-form-input>
            </b-form-group>

            <b-form-group
              v-bind:label="$trans('Customer remarks')"
              label-for="customer_remarks"
              label-cols="3"
            >
              <b-form-textarea
                id="customer_remarks"
                v-model="order.customer_remarks"
                rows="3"
              ></b-form-textarea>
            </b-form-group>
          </details>
        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans("Order details") }}</h6>
          <b-form-group
            v-bind:label="$trans('Order type')"
            label-for="order_type"
            label-cols="3"
          >
            <OrderTypesSelect
              v-if="(!isCreate && !isLoading) || isCreate"
              :orderTypeIn="order.order_type"
              :order-type.sync="order.order_type"
              :include-all="false"
            />
          </b-form-group>
          <b-row>

            <b-col cols="12" role="group">
              <b-form-group
                v-bind:label="$trans('Reference')"
                label-for="order_reference"
                label-cols="3">
                  <b-form-input
                  id="order_reference"

                  v-model="order.order_reference"
                  >
                  </b-form-input>
              </b-form-group>
            </b-col>
          </b-row>

          <b-form-group
            v-bind:label="$trans('Remarks')"
            label-for="remarks"
            label-cols="3"
            >
            <b-form-textarea
            id="remarks"
              v-model="order.remarks"
              rows="3"
            ></b-form-textarea>
          </b-form-group>

          <!-- order start/end times -->
          <h6>{{ $trans('Planning') }}</h6>
          <b-container>
            <b-row>
              <b-form-group
                :label="$trans('Start date')"
                label-for="start_date"
                cols="2"
              >
                <b-form-datepicker
                  id="start_date"
                  v-model="order.start_date"
                  :placeholder="$trans('Select date')"
                  value="order.start_date"
                  locale="nl"
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                ></b-form-datepicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.start_date.$error : null">
                  {{ $trans('Please enter a start date') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-col cols="2"></b-col>

              <b-form-group
                :label="$trans('Start time')"
                label-for="start_time"
                cols="2"
              >
                <b-form-input
                  id="start_time"
                  v-model="order.start_time"
                  type="text"
                  placeholder="HH:mm"
                  class="time-input"
                ></b-form-input>
                <span style="float:left !important;"></span>
                <b-form-timepicker
                  v-model="order.start_time"
                  button-only
                  right
                  locale="en"
                  id="start_time"
                  :placeholder="$trans('Set time')"
                  :hour12=false
                ></b-form-timepicker>

                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.start_time.$error : null">
                  {{ $trans('Please enter a valid start time HH:mm') }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-row>
          </b-container>

          <b-container>
            <b-row>
              <b-form-group
                label-class=""
                v-bind:label="$trans('End date')"
                label-for="end_date"
                cols="2"
              >
                <b-form-datepicker
                  id="end_date"

                  v-model="order.end_date"
                  class="mb-2"
                  :placeholder="$trans('Select date')"
                  locale="nl"
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
                ></b-form-datepicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.end_date.$error : null">
                  {{ $trans('Please enter an end date') }}
                </b-form-invalid-feedback>
              </b-form-group>

              <b-col cols="2"></b-col>

              <b-form-group
                :label="$trans('End time')"
                label-class=""
                label-for="end_time"
                cols="2"
              >
                <b-form-input
                  id="end_time"
                  v-model="order.end_time"
                  type="text"
                  class="time-input"
                  placeholder="HH:mm"
                ></b-form-input>
                <span style="float:left !important;"></span>
                <b-form-timepicker
                  v-model="order.end_time"
                  button-only
                  right
                  locale="en"
                  id="end_time"
                  class="mb-2"
                  :placeholder="$trans('Set time')"
                  :hour12=false
                ></b-form-timepicker>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.order.end_time.$error : null">
                  {{ $trans('Please enter a valid end time HH:mm') }}
                </b-form-invalid-feedback>
              </b-form-group>
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

            <b-form-group
              v-bind:label="$trans('Assign to')"
              label-for="order-assign"
              label-cols="3"
            >
              <multiselect
                v-model="selectedEngineers"
                id="order-assign"
                track-by="id"
                :max-height="600"
                :placeholder="$trans('Type to search engineer(s)')"
                open-direction="bottom"
                :options="engineers"
                :multiple="true"
                :taggable="true"
                @tag="addEngineer"
                :custom-label="engineerLabel"
                >
              </multiselect>
            </b-form-group>
            <ul v-if="assignedEngineers.length > 0">
              <li v-for="(engineer, index) of assignedEngineers" :key="index">

              </li>
            </ul>
          </div>

          <b-form-group
            v-bind:label="$trans('Assignee(s)')"
            label-for="order-assigned-to"
            label-cols="3"
            label-class="dimmed">

            <label class="col-form-label order-assignee" v-for="(person, index) in order.assigned_user_info" :key="index">
              <span v-if="index > 0">,</span>
              {{ person.full_name }}
            </label>
          </b-form-group>

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
                    <b-link class="h5 mx-2" @click="editOrderLine(orderline, index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteOrderLine(index)">
                      <b-icon-trash></b-icon-trash>
                    </b-link>
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
              <b-form-group
                v-bind:label="$trans('Equipment')"
                cols="12">
                  <multiselect
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
                        <b-button
                          @click="showAddEquipmentModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new equipment") }}
                        </b-button>
                      </p>
                    </span>
                  </multiselect>

                  <span>
                    <strong>{{ product }}</strong>
                    <b-icon-check v-if="equipment"></b-icon-check>
                  </span>

              </b-form-group>

              <!-- equipment locations -->
              <b-form-group
                v-bind:label="$trans('Location')"
                cols="12"
                >
                  <multiselect
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
                        <b-button
                          @click="showAddLocationModal"
                          class="btn btn-primary"

                          type="button"
                          variant="primary"
                        >
                          {{ $trans("Add new location") }}
                        </b-button>
                      </p>
                    </span>
                  </multiselect>

                  <span>
                    <strong>{{ location }}</strong>
                    <b-icon-check v-if="equipment_location"></b-icon-check>
                  </span>
              </b-form-group>

              <!-- if maintenance: equipment amount -->
              <b-form-group
                v-if="maintenance"
                v-bind:label="$trans('Amount')"
                label-for="order-orderline-amount"
                label-cols="3"
              >
                <b-form-input
                  id="order-orderline-remarks"
                  type="number"
                  v-model="remarks"
                ></b-form-input>
              </b-form-group>

              <!-- else: equipment remarks -->
              <b-form-group v-else
              label-for="order-orderline-remarks"
              v-bind:label="$trans('Remarks')"
              >
                <b-form-textarea
                  id="order-orderline-remarks"
                  v-model="remarks"
                  rows="1"
                ></b-form-textarea>
              </b-form-group>

            </div>

            <!-- normal product -->
            <div v-if="!usesEquipment">

              <b-form-group
                v-bind:label="$trans('Equipment')"
                label-for="order-orderline-product"
                label-cols="3"
              >
                <b-form-input
                  id="order-orderline-product"
                  v-model="product"
                  placeholder="(item name)"
                ></b-form-input>
              </b-form-group>

              <!-- normal location -->
              <b-form-group
                v-bind:label="$trans('Location')"
                label-for="order-orderline-location"
                label-cols="3"
              >
                <b-form-input
                  id="order-orderline-location"
                  placeholder="(location name)"
                  v-model="location"
                ></b-form-input>
              </b-form-group>

              <!-- normal remarks -->
              <b-form-group
                v-bind:label="$trans('Remarks')"
                label-for="order-orderline-remarks"
                label-cols="3"
                >
                <b-form-input
                  id="order-orderline-remarks"
                  placeholder="(notes)"
                  v-model="remarks"
                ></b-form-input>
              </b-form-group>
            </div>

            <b-form-group class="text-right">
              <b-button
                v-if="isEditOrderLine"
                @click="doEditOrderLine"
                class="btn btn-primary"
                 type="button"
                variant="warning"
                :disabled="!isOrderLineValid"
              >
                {{ $trans('Edit orderline') }}
              </b-button>
              <b-button
                v-if="!isEditOrderLine"
                @click="addOrderLine"
                class="btn btn-primary"

                type="button"
                variant="primary"
                :disabled="!isOrderLineValid"
              >
                {{ $trans('Add orderline') }}
              </b-button>
            </b-form-group>
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
                    <b-link class="h5 mx-2" @click="editInfoLine(infoline, index)">
                      <b-icon-pencil></b-icon-pencil>
                    </b-link>
                    <b-link class="h5 mx-2" @click.prevent="deleteInfoLine(index)">
                      <b-icon-trash></b-icon-trash>
                    </b-link>
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

              <b-form-group
                v-bind:label="$trans('Info')"
                label-for="order-infoline-info"
              >
                <b-form-textarea
                  id="order-infoline-info"
                  v-model="info"
                ></b-form-textarea>
              </b-form-group>

              <b-form-group class="text-right">
                <b-button v-if="isEditInfoLine" @click="doEditInfoLine" class="btn btn-primary"  type="button" variant="warning">
                  {{ $trans('edit') }}
                </b-button>
                <b-button v-if="!isEditInfoLine" @click="addInfoLine" class="btn btn-primary"  type="button" variant="primary">
                  {{ $trans('add') }}
                </b-button>
              </b-form-group>
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
import Multiselect from 'vue-multiselect'

import {OrderNotAcceptedService} from '@/models/orders/OrderNotAccepted'
import {OrderService, OrderModel} from '@/models/orders/Order'
import {CustomerService} from '@/models/customer/Customer'
import {AssignService} from '@/models/mobile/Assign'
import OrderTypesSelect from '@/components/OrderTypesSelect'
import Collapse from '@/components/Collapse'
import {componentMixin} from "@/utils";
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

const isCorrectTime = (value) => {
  return !helpers.req(value) || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export default {
  mixins: [componentMixin],
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    DocumentsComponent,
    Multiselect,
    OrderTypesSelect,
    Collapse,
    CustomerCard,
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
      buttonDisabled: false,
      editIndex: null,
      acceptOrder: false,

      orderline_pk: null,
      product: '',
      equipment: null,
      location: '',
      equipment_location: null,
      remarks: '',

      isEditOrderLine: false,

      infoline_pk: null,
      info: '',
      isEditInfoLine: false,

      orderLineFields: [
        { key: 'info', label: this.$trans('Orderline') },
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Info') },
        { key: 'icons', label: '' }
      ],
      recommendedUsers: [],
      recommendedUsersFields: [
        { key: 'full_name', label: this.$trans('Name') },
      ],
      submitClicked: false,
      countries: [],
      order: null,
      errorMessage: null,
      customers: [],
      customerSearch: '',
      getCustomersDebounced: null,
      branches: [],
      branchSearch: '',
      getBranchesDebounced: null,
      engineers: [],
      selectedEngineers: [],
      assignedEngineers: [],
      files: [],
      orderPk: null,
      nextField: 'orders',
      nextFieldOptions: [
        { item: 'orders', name: this.$trans('Orders') },
        { item: 'dispatch', name: this.$trans('Dispatch') },
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
      orderNotAcceptedService: new OrderNotAcceptedService(),
      engineerService: new EngineerService(),
      branchService: new BranchService(),
      locationService: new LocationService(),
      orderlineService: new OrderlineService(),
      infolineService: new InfolineService(),
      assignService: new AssignService(),
      testErrors: []
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
      return this.$store.getters.getSettingEquipmentPlanningQuickCreate
    },
    canQuickCreateEquipmentLocation() {
      return this.$store.getters.getSettingEquipmentLocationPlanningQuickCreate
    },
    equipmentFormSearchOk() {
      if (!this.hasBranches) {
        return this.order.customer_relation !== null
      } else {
        return this.order.branch !== null
      }
    },
    usesEquipment() {
      const companyCodesUseEquipments = [
        'demo',
        'stormy',
        'shltr-installation',
        'wmses'
      ]
      return this.hasBranches || this.isEditEquipment ||
        companyCodesUseEquipments.indexOf(this.$store.getters.getMemberCompanycode) !== -1
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
    const lang = this.$store.getters.getCurrentLanguage
    this.$moment = moment
    this.$moment.locale(lang)

    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.getBranchesDebounced = AwesomeDebouncePromise(this.getBranches, 500)
    this.getEquipmentDebounced = AwesomeDebouncePromise(this.getEquipment, 500)
    this.getLocationDebounced = AwesomeDebouncePromise(this.getLocation, 500)
    this.countries = await this.$store.dispatch('getCountries')
    const { results } = await this.engineerService.list()
    this.engineers = results

    if (this.isCreate) {
      this.order = new OrderModel()

      // create order from quotation
      if (this.from_quotation) {
        const quotation = await this.quotationService.detail(this.quotation_id)
        const customer = await this.customerService.detail(quotation.customer_relation)
        this.fillCustomer(customer)
        this.order = {
          ...this.order,
          customer_relation: customer.id,
          quotation: this.quotation_id
        }
      }

      if (this.maintenance) {
        this.isLoading = true
        const data = this.$store.getters.getMaintenanceEquipment

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
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
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
        this.errorToast(this.$trans('Error adding equipment'))
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
        this.errorToast(this.$trans('Error searching equipment'))
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
          const response = this.isPlanning || this.isStaff || this.isSuperuser ?
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
        this.errorToast(this.$trans('Error adding location'))
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
        this.errorToast(this.$trans('Error searching location'))
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
      console.log(this.orderline_pk)

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

    engineerLabel({ full_name }) {
      return full_name
    },
    addEngineer(value) {
      console.log(value)
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
      await this.orderNotAcceptedService.setRejected(this.pk)
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
        if (this.order[null_fields[i]] === null) {
          delete this.order[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      const orderlines = this.order.orderlines
      this.order.orderlines = []

      const infolines = this.order.infolines.filter((i) => i.info && i.info.replace(' ', '') !== '')
      this.order.infolines = []

      let errors = this.isCreate ? await this.handleCreate(orderlines, infolines) :
        await this.handleUpdate(orderlines, infolines)

      // TODO why is this if here? shouldn't be needed
      if (this.order.id) {
        const assignErrors = await this.assignEngineers(this.order.id)
        errors = [...errors, ...assignErrors]
      }

      if (errors.length > 0) {
        // TODO do we want this message? the errors in the form are obvious
        this.infoToast(this.$trans('Created'), this.$trans('Order has been created'))
        this.errorToast(this.$trans('There were errors'))
        console.log('There were errors', errors)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      // TODO do we want a message here?
      this.infoToast(this.$trans('Created'), this.$trans('Order has been created'))

      this.buttonDisabled = false
      this.isLoading = false

      if (this.nextField === 'dispatch') {
        await this.$router.push({name: 'mobile-dispatch'})
        return
      }

      this.$router.go(-1)
    },
    async handleCreate(orderlines, infolines) {
      let errors = []

      // don't insert again when there's no error
      if (!this.order.hasOwnProperty('apiOk') || !this.order.apiOk) {
        try {
          const newOrder = await this.orderService.insert(this.order)
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
          this.errorToast(this.$trans('Error creating order'))
          return
        }
      } else {
        console.log("not resubmitting order")
      }

      const [processedOrderlines, orderlineErrors] = this.handleOrderlines(orderlines)
      this.order.orderlines = processedOrderlines
      errors = [...errors, ...orderlineErrors]

      const [processedInfolines, infolineErrors] = this.handleInfolines(infolines)
      this.order.infolines = processedInfolines
      errors = [...errors, ...infolineErrors]

      // TODO do we want this message?
      this.infoToast(this.$trans('Created'), this.$trans('Order has been created'))

      // TODO why is this if here? shouldn't be needed
      // this document handling is only needed when creating an order
      if (this.order.id) {
        const documentErrors = await this.$refs['documents-component'].orderCreated(this.order.id)
        errors = [...errors, ...documentErrors]
      }

      return errors
    },
    async handleUpdate(orderlines, infolines) {
      let errors = []
      delete this.order.customer_order_accepted

      // don't update again when there's no error
      if (!this.order.hasOwnProperty('apiOk') || !this.order.apiOk) {
        try {
          const updatedOrder = await this.orderService.update(this.pk, this.order)
          this.order = {
            ...this.order,
            ...updatedOrder,
            apiOk: true
          }
        } catch (error) {
          errors.push(error)
          this.order.apiOk = false
          this.order.error = error
          this.buttonDisabled = false
          this.isLoading = false
          console.log('Error updating order', error)
          this.errorToast(this.$trans('Error updating order'))
          return
        }
      }

      // TODO do we want this message?
      this.infoToast(this.$trans('Updated'), this.$trans('Order has been updated'))

      const [processedOrderlines, orderlineErrors] = this.handleOrderlines(orderlines)
      this.order.orderlines = processedOrderlines
      errors = [...errors, ...orderlineErrors]

      const [processedInfolines, infolineErrors] = this.handleInfolines(infolines)
      this.order.infolines = processedInfolines
      errors = [...errors, ...infolineErrors]

      if (this.acceptOrder) {
        try {
          await this.orderNotAcceptedService.setAccepted(this.pk)
          this.infoToast(this.$trans('Accepted'), this.$trans('Order has been accepted'))
        } catch(error) {
          console.log('Error accepting order', error)
          this.errorToast(this.$trans('Error accepting order'))
        }
      }

      return errors
    },
    async handleOrderlines(orderlines) {
      let processedOrderlines = []
      let errors = []

      for (const orderline of orderlines) {
        // don't insert again
        if (!orderline.hasOwnProperty('apiOk') || !orderline.apiOk) {
          try {
            if (this.testErrors.indexOf('orderlines') === -1) {
              this.testErrors.push('orderlines')
            } else {
              orderline.order = this.order.id
            }

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
            if (this.testErrors.indexOf('infolines') === -1) {
              this.testErrors.push('infolines')
            } else {
              infoline.order = this.order.id
            }

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
    async assignEngineers(order_id) {
      let errors = []
      let newSelectedEngineers = []

      for (const engineer of this.selectedEngineers) {
        try {
          if (this.testErrors.indexOf('assign') === -1) {
            this.testErrors.push('assign')
            delete engineer.id
          }

          await this.assignService.assignToUser(engineer.id, [order_id], true)
          newSelectedEngineers.push({
            ...engineer,
            apiOk: true
          })
        } catch (error) {
          newSelectedEngineers.push({
            ...engineer,
            apiOk: false,
            error
          })
          errors.push(error)
          console.log('error assigning to users', error)
        }
      }

      if (errors.length === 0) {
        this.infoToast(this.$trans('Assigned'), this.$trans('Order assigned'))
      } else {
        console.log('errors assigning to users', errors)
        this.errorToast(this.$trans('There were errors assigning to users'))
      }

      this.selectedEngineers = newSelectedEngineers.filter((e) => !e.apiOk)
      this.assignedEngineers = newSelectedEngineers.filter((e) => e.apiOk)
      if (!this.selectedEngineers) {
        this.selectedEngineers = []
      }

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
        this.errorToast(this.$trans('Error fetching customers'))
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
        this.errorToast(this.$trans('Error fetching branches'))
        this.isLoading = false
      }
    },
    async loadOrder() {
      this.isLoading = true

      try {
        this.order = await this.orderService.detail(this.pk)
        this.order.start_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.order.end_date = this.$moment(this.order.start_date, 'DD/MM/YYYY').toDate()
        this.isLoading = false
      } catch(error) {
        console.warn('error fetching order', error)
        this.errorToast(this.$trans('Error fetching order'))
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
</style>
