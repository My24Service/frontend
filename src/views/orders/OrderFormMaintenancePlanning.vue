<template>
  <div class="app-page">
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
          <router-link :to="{name:'order-list'}">Orders</router-link> /
          <strong>new</strong>
        </h3>
        <h3 v-if="pk">
          <b-icon icon="file-earmark-text-fill"></b-icon>
          <router-link :to="{name:'order-list'}">Orders</router-link> /
          <router-link :to="{name: 'order-view', pk:pk}">#<strong>{{ pk }}</strong></router-link>
        / edit
        </h3>

        <div class="flex-columns" v-if="!unaccepted || hasBranches">
          <b-button
            @click="cancelForm"
            class="btn btn-secondary"
            type="button"
            variant="secondary"
            >
            {{ $trans('Cancel') }}
          </b-button>
          <b-dropdown split type="submit" :text="$trans('Submit')" @click="submitForm" variant="primary">
            <b-dropdown-item-button 
              @click="(e) => { submitForm(e)  }" 
              type="button" 
              name="nextPage" 
              value="dispatch"
            >{{ $trans('Submit') }} {{ $trans('and open dispatch') }}
            </b-dropdown-item-button>
          </b-dropdown>
        </div>
        <div class="flex-columns" v-if="!isCreate && !hasBranches && (unaccepted || !order.customer_order_accepted)">
          <b-button
            @click="reject"
            class="btn btn-danger"
            type="button"
            variant="danger">{{ $trans('Reject') }}</b-button>
          <b-button
            @click="editAndAccept"
            :disabled="buttonDisabled"
            class="btn btn-primary"
            type="button"
            name="order-done-next"
            value="dispatch"
            variant="primary">{{ $trans('Save &amp; accept') }}
          </b-button>
        </div>
      </div>
    </header>

    <div class="page-detail">
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
                v-if="hasBranches"
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
            
          
          
              <b-form-group
                :label="!hasBranches ? $trans('Customer') : $trans('Branch')"
                label-for="order_name"
                label-cols="3"
              >
              <b-input-group>
                <b-form-input
                  v-model="order.order_name"
                  id="order_name"
                  
                  :state="isSubmitClicked ? !v$.order.order_name.$error : null"
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
                  :state="isSubmitClicked ? !v$.order.order_name.$error : null">
                  {{ hasBranches ? $trans('Please enter the customer') : $trans('Please enter the branch') }}
                </b-form-invalid-feedback>
              </b-form-group>

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
        </div>
        <div class="panel col-1-3">
          <h6>Order details</h6>
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
          <div class="assign-engineer section" v-if="!hasBranches && (isCreate || (!isCreate && (unaccepted || !order.customer_order_accepted)))">
            
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
              
            <b-form-group
              v-bind:label="$trans('Assignee(s)')"
              label-for="order-assigned-to"
              label-cols="3"
              label-class="dimmed">

              <label class="col-form-label order-assignee" v-for="person in order.assigned_user_info">{{ person.full_name }}</label>
            </b-form-group>
            
          </div>
          
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

          
          <h6>
            {{ $trans('Documents') }}
            <router-link v-if="!isCreate" :to="{name: 'order-documents', params : {'orderPk': pk}}">edit documents</router-link>
          </h6>
          <div class="order-documents section">
            <div class="my-2" v-if="!isCreate && order.documents && order.documents.length > 0">
              <ul class="listing">
                <li v-for="doc in order.documents" :key="doc.url">
                  <a class="listing-item" :href="doc.url" target="_blank">
                    <span>{{ doc.name}}</span>
                  </a>
                </li>
              </ul>
            </div>
            <b-form-group
            v-if="isCreate"
              v-bind:label="$trans('Choose files')"
              label-cols="3">
              <b-form-file
                v-model="files"
                multiple
                v-bind:placeholder="$trans('Choose a file or drop it here...')"
                @input="filesSelected"
              ></b-form-file>
            </b-form-group>

            <b-row>
              <b-col cols="12">
                <b-table v-if="documents.length > 0" small :fields="documentFields" :items="documents" responsive="md">
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <b-link class="h5 mx-2" @click.prevent="deleteDocument(data.index)">
                        <b-icon-trash></b-icon-trash>
                      </b-link>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
          </div>
          <h6>{{$trans('Order lines')}}</h6>
          <div class="order-lines section">
            <b-row>
              <b-col cols="12">
                <b-table v-if="order.orderlines.length > 0" small :fields="orderLineFields" :items="order.orderlines" responsive="md">
                  <template #cell()="data">
                    {{ data.value }}
                  </template>
                  <template #cell(icons)="data">
                    <div class="float-right">
                      <b-link class="h5 mx-2" @click="editOrderLine(data.item, data.index)">
                        <b-icon-pencil></b-icon-pencil>
                      </b-link>
                      <b-link class="h5 mx-2" @click.prevent="deleteOrderLine(data.index)">
                        <b-icon-trash></b-icon-trash>
                      </b-link>
                    </div>
                  </template>
                </b-table>
              </b-col>
            </b-row>
            
            <div v-if="usesEquipment">
              <!-- equipment -->
              <b-form-group
                v-bind:label="$trans('Equipment')"
                label-cols="3">
                <b-input-group 
                  class="flex-columns align-items-center space-between"
                  >
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
                    style="max-width: 50%"
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
                    {{ product }}
                    <b-icon-check v-if="equipment"></b-icon-check>
                  </span>
                </b-input-group>
              </b-form-group>

              <!-- equipment locations -->
              <b-form-group
                v-bind:label="$trans('Location')"
                label-cols="3"
                >
                <b-input-group class="flex-columns align-items-center space-between">
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
                    style="max-width: 50%"
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
                    {{ location }}
                    <b-icon-check v-if="equipment_location"></b-icon-check>
                  </span>
                  
                </b-input-group>
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
              label-cols="3"
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

          <div class="info-lines section" v-if="!hasBranches">
            <h6>{{ $trans('Info lines') }}</h6>
            <div class="flex-columns mt-3">
              <b-form-input
                id="order-infoline-info"
                v-model="info"
              ></b-form-input>

              <b-button v-if="isEditInfoLine" @click="doEditInfoLine" class="btn btn-primary"  type="button" variant="warning">
                {{ $trans('edit') }}
              </b-button>
              <b-button v-if="!isEditInfoLine" @click="addInfoLine" class="btn btn-primary"  type="button" variant="primary">
                {{ $trans('add') }}
              </b-button>
            </div>
            <ul class="listing full-size mt-3">
              <li v-for="(item, index) of order.infolines" :key="index">
                {{ item.info }}
                <div class="float-right">
                  <b-link class="h5 mx-2" @click="editInfoLine(item, index)">
                    <b-icon-pencil></b-icon-pencil>
                  </b-link>
                  <b-link class="h5 mx-2" @click.prevent="deleteInfoLine(index)">
                    <b-icon-trash></b-icon-trash>
                  </b-link>
                </div>
              </li>
            </ul>
          </div>

        </div>
        <div class="panel col-1-3">
          <!-- order start/end times -->
            <h6>{{ $trans('Planning') }}</h6>
            <div class="flex-columns">
              <b-form-group
                label-class="p-sm-0"
                :label="$trans('Start date')"
                label-for="start_date"
                label-cols="4"
              >
                <b-form-datepicker
                  id="start_date"
                  
                  class="p-sm-0"
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

              <b-form-group
                label-class="p-sm-0"
                :label="$trans('Start time')"
                label-for="start_time"
                label-cols="4"
              >
                <b-form-timepicker
                  id="start_time"
                  
                  v-model="order.start_time"
                  :placeholder="$trans('Set time')"
                  :hour12=false
                ></b-form-timepicker>
              </b-form-group>
            </div>
            <div class="flex-columns">
              <b-form-group
                label-class="p-sm-0"
                v-bind:label="$trans('End date')"
                label-for="end_date"
                label-cols="4"
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

              <b-form-group
                :label="$trans('End time')"
                label-class="p-sm-0"
                label-for="end_time"
                label-cols="4"
              >
                <b-form-timepicker
                  id="end_time"
                  
                  v-model="order.end_time"
                  class="mb-2"
                  :placeholder="$trans('Set time')"
                  :hour12=false
                ></b-form-timepicker>
              </b-form-group>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import moment from 'moment'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import Multiselect from 'vue-multiselect'

import orderNotAcceptedModel from '../../models/orders/OrderNotAccepted.js'
import orderModel from '../../models/orders/Order.js'
import customerModel from '../../models/customer/Customer.js'
import engineerModel from '../../models/company/UserEngineer.js'
import documentModel from '../../models/orders/Document.js'
import Assign from '../../models/mobile/Assign.js'
import OrderTypesSelect from '../../components/OrderTypesSelect.vue'
import Collapse from '../../components/Collapse.vue'
import {componentMixin} from "../../utils";
import branchModel from "../../models/company/Branch";
import timeRegistrationModel from "../../models/company/TimeRegistration";
import equipmentModel from "../../models/equipment/equipment";
import locationModel from "../../models/equipment/location";
import orderlineModel from "../../models/orders/Orderline";
import infolineModel from "../../models/orders/Infoline";
import CustomerCard from '../../components/CustomerCard.vue'

export default {
  mixins: [componentMixin],
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
    OrderTypesSelect,
    Collapse, 
    CustomerCard
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
  },
  watch: {
    startDate(val) {
      console.info("WATCH: startDate", val)
      if (new Date(this.endDate) < new Date(val)) {
        this.order.end_date = val
      }
    },
    endDate(val) {
      console.info("WATCH: endDate", val)
      if (new Date(val) < new Date(this.startDate)) {
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
        { key: 'product', label: this.$trans('Product') },
        { key: 'location', label: this.$trans('Location') },
        { key: 'remarks', label: this.$trans('Remarks') },
        { key: 'icons', label: '' }
      ],
      infoLineFields: [
        { key: 'info', label: this.$trans('Info') },
        { key: 'icons', label: '' }
      ],
      documentFields: [
        { key: 'name', label: this.$trans('Name') },
        { key: 'icons', label: '' }
      ],
      recommendedUsers: [],
      recommendedUsersFields: [
        { key: 'full_name', label: this.$trans('Name') },
      ],
      submitClicked: false,
      countries: [],
      order: orderModel.getFields(),
      errorMessage: null,
      customers: [],
      customerSearch: '',
      getCustomersDebounced: null,
      branches: [],
      branchSearch: '',
      getBranchesDebounced: null,
      engineers: [],
      selectedEngineers: [],
      files: [],
      documents: [],
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
    }
  },
  validations() {
    if (!this.hasBranches) {
      return {
        order: {
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
        },
      }
    }

    return {
      order: {
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
      console.warn("COMPUTED: startDate", this.order.start_date)
      return this.order.start_date
    },
    endDate() {
      console.info("COMPUTED: endDate", this.order.end_date)
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
    const { results } = await engineerModel.list()
    this.engineers = results

    if (this.isCreate) {
      this.order = orderModel.getFields()

      if (this.maintenance) {
        this.isLoading = true
        const data = this.$store.getters.getMaintenanceEquipment

        if (data) {
          const {maintenanceEquipment, customer_pk, contract_pk} = data

          const customer = await customerModel.detail(customer_pk)
          this.fillCustomer(customer)

          for (const equipmentData of maintenanceEquipment) {
            const equipment = await this.equipmentService.detail(equipmentData.equipment_pk)

            this.order.orderlines.push({
              product: equipment.name,
              location: equipment.location_name,
              remarks: "",
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
            await equipmentModel.quickAddCustomerPlanning(this.newEquipmentName, this.order.customer_relation) :
            await equipmentModel.quickAddCustomerNonPlanning(this.newEquipmentName)

          this.equipment = response.id
          this.product = response.name
        } else {
          const response = await equipmentModel.quickAddBranchPlanning(this.newEquipmentName, this.order.branch);

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
          this.equipmentSearch = await equipmentModel.searchBranch(query, this.order.branch)
        } else {
          this.equipmentSearch = await equipmentModel.searchCustomer(query, this.order.customer_relation)
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
            await locationModel.quickAddCustomerPlanning(this.newLocationName, this.order.customer_relation) :
            await locationModel.quickAddCustomerNonPlanning(this.newLocationName)

          this.equipment_location = response.id
          this.location = response.name
        } else {
          const response = await locationModel.quickAddBranchPlanning(this.newLocationName, this.order.branch);

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
          this.locationSearch = await locationModel.searchBranch(query, this.order.branch)
        } else {
          this.locationSearch = await locationModel.searchCustomer(query, this.order.customer_relation)
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

    // documents
    filesSelected(files) {
      for (let i=0;i<files.length; i++) {
        const reader = new FileReader()
        reader.onload = (f) => {
          const b64 = f.target.result
          this.documents.push({
            file: b64,
            name: files[i].name,
            description: ''
          })
        }

        reader.readAsDataURL(files[i])
      }
    },
    async deleteDocument(index) {
      const deleted = this.documents.splice(index, 1)
      try {
        for (const document of deleted) {
          await documentModel.delete(document.id)
        }
      } catch(error) {
        console.log('Error deleting documents', error)
      }
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
      await orderNotAcceptedModel.setRejected(this.pk)
      this.cancelForm()
    },
    async submitForm(e) {
      
      if(e.target.value == 'dispatch') this.nextField = 'dispatch';

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

      let newOrder;
      if (this.isCreate) {
        try {
          const orderlines = this.order.orderlines
          this.order.orderlines = []

          const infolines = this.order.infolines
          this.order.infolines = []

          newOrder = await orderModel.insert(this.order)

          // add orderlines
          try {
            for (const orderline of orderlines) {
              orderline.order = newOrder.id
              await orderlineModel.insert(orderline)
            }
          } catch(error) {
            console.log('Error creating infolines', error)
          }

          // add infolines
          try {
            for (const infoline of infolines) {
              infoline.order = newOrder.id
              await infolineModel.insert(infoline)
            }
          } catch(error) {
            console.log('Error creating infolines', error)
          }

          this.infoToast(this.$trans('Created'), this.$trans('Order has been created'))
          this.buttonDisabled = false
          this.isLoading = false
        } catch(error) {
          console.log('Error creating order', error)
          this.errorToast(this.$trans('Error creating order'))
          this.isLoading = false
          this.buttonDisabled = false
          return
        }

        // insert documents
        try {
          for (const document of this.documents) {
            document.order = newOrder.id
            await documentModel.insert(document)
          }

          if (this.documents.length) {
            this.infoToast(this.$trans('Created'), this.$trans('Document(s) added'))
          }
        } catch(error) {
          console.log('Error creating documents', error)
          this.errorToast(this.$trans('Error creating documents'))
          this.isLoading = false
          this.buttonDisabled = false
        }

        // assign engineers
        try {
          for (const engineer of this.selectedEngineers) {
            await Assign.assignToUser(engineer.id, [newOrder.order_id], true)
          }

          if (this.selectedEngineers.length) {
            this.infoToast(this.$trans('Assigned'), this.$trans('Order assigned'))
          }
        } catch(error) {
          console.log('error assigning to users', error)
          this.errorToast(this.$trans('Error assigning to users'))
          this.isLoading = false
          this.buttonDisabled = false
          return
        }

        if (this.nextField === 'orders' || this.hasBranches) {
          this.$router.go(-1)
        } else if (this.nextField === 'dispatch') {
          await this.$router.push({name: 'mobile-dispatch'})
        }

        return
      }

      // edit
      try {
        delete this.order.customer_order_accepted
        const orderlines = this.order.orderlines
        this.order.orderlines = []

        const infolines = this.order.infolines
        this.order.infolines = []

        await orderModel.update(this.pk, this.order)

        // orderlines create/update
        for (let orderline of orderlines) {
          orderline.order = this.pk
          if (orderline.id) {
            await orderlineModel.update(orderline.id, orderline)
            // this.infoToast(this.$trans('Orderline updated'), this.$trans('Orderline has been updated'))
          } else {
            await orderlineModel.insert(orderline)
            // this.infoToast(this.$trans('Orderline created'), this.$trans('Orderline has been created'))
          }
        }

        // orderlines delete
        for (const orderline of this.deletedOrderlines) {
          if (orderline.id) {
            await orderlineModel.delete(orderline.id)
            // this.infoToast(this.$trans('Orderline removed'), this.$trans('Orderline has been removed'))
          }
        }

        // infolines create/update
        for (let infoline of infolines) {
          infoline.order = this.pk
          if (infoline.id) {
            await infolineModel.update(infoline.id, infoline)
            // this.infoToast(this.$trans('Orderline updated'), this.$trans('Orderline has been updated'))
          } else {
            await infolineModel.insert(infoline)
            // this.infoToast(this.$trans('Orderline created'), this.$trans('Orderline has been created'))
          }
        }

        for (const infoline of this.deletedInfolines) {
          if (infoline.id) {
            await infolineModel.delete(infoline.id)
            // this.infoToast(this.$trans('Orderline removed'), this.$trans('Orderline has been removed'))
          }
        }

        this.infoToast(this.$trans('Updated'), this.$trans('Order has been updated'))
        this.isLoading = false
        this.buttonDisabled = false
      } catch(error) {
        console.log('Error updating order', error)
        this.errorToast(this.$trans('Error updating order'))
        this.isLoading = false
        this.buttonDisabled = false
        return
      }

      if (this.acceptOrder) {
        try {
          await orderNotAcceptedModel.setAccepted(this.pk)

          // assign engineers
          try {
            for (const engineer of this.selectedEngineers) {
              await Assign.assignToUser(engineer.id, [this.order.order_id], true)
            }

            if (this.selectedEngineers.length) {
              this.infoToast(this.$trans('Assigned'), this.$trans('Order assigned'))
            }
          } catch (error) {
            console.log('error assigning to users', error)
            this.errorToast(this.$trans('Error assigning to users'))
            this.isLoading = false
            this.buttonDisabled = false
            return
          }

          this.infoToast(this.$trans('Accepted'), this.$trans('Order has been accepted'))
        } catch(error) {
          console.log('Error accepting order', error)
          this.errorToast(this.$trans('Error accepting order'))
        }
      }

      this.$router.go(-1)
    },
    async getCustomers(query) {
      if (query === '') return
      this.isLoading = true

      try {
        this.customers = await customerModel.search(query)
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
        this.branches = await branchModel.search(query)
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
        this.order = await orderModel.detail(this.pk)
        this.order.start_date = this.$moment(this.order.start_date).format('YYYY-MM-DD')
        this.order.end_date = this.$moment(this.order.end_date).format('YYYY-MM-DD')
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

</style>
