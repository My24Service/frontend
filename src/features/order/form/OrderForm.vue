<template>
  <b-modal
    id="new-equipment-modal"
    ref="new-equipment-modal"
    :title="$trans('New equipment')"
    @ok="submitCreateEquipment"
  >
    <form @submit.stop.prevent="submitCreateEquipment">
      <BFormGroup
        :label="$trans('Equipment name')"
        label-for="maintenance_equipment_new_equipment"
      >
        <BFormInput
          id="maintenance_equipment_new_equipment"
          v-model="newEquipmentName"
        />
      </BFormGroup>
    </form>
  </b-modal>

  <b-modal
    id="new-location-modal"
    ref="new-location-modal"
    :title="$trans('New location')"
    @ok="submitCreateLocation"
  >
    <form @submit.stop.prevent="submitCreateLocation">
      <BFormGroup
        :label="$trans('Location name')"
        label-for="new_location"
      >
        <BFormInput
          id="new_location"
          v-model="newLocationName"
        />
      </BFormGroup>
    </form>
  </b-modal>

  <div class="app-page">
    <header>
      <div class="page-title">
        <h3 v-if="isCreate">
          <IBiFileEarmarkPlus />
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <strong>{{ $trans("new") }}</strong>
        </h3>
        <h3 v-else>
          <IBiFileEarmarkTextFill />
          <router-link :to="{name: 'order-list'}">{{ $trans("Orders") }}</router-link> /
          <router-link :to="{name: 'order-view', params: {pk: id}}">#<strong>{{ record?.order_id ?? id }}</strong></router-link>
          / {{ $trans("edit") }}
        </h3>

        <div class="flex-columns">
          <template v-if="canAccept">
            <BButton
              type="button"
              variant="danger"
              :disabled="buttonDisabled"
              @click="reject"
            >{{ $trans('Reject') }}</BButton>
            <BButton
              name="order-done-next"
              type="button"
              variant="primary"
              :disabled="buttonDisabled"
              @click="editAndAccept"
            >{{ $trans('Save &amp; accept') }}</BButton>
          </template>

          <BButton
            type="button"
            variant="secondary"
            @click="cancelForm"
          >
            {{ $trans('Cancel') }}
          </BButton>

          <b-dropdown
            v-if="role === 'planning'"
            split
            :text="$trans('Submit')"
            variant="primary"
            :disabled="buttonDisabled"
            @click="submit('back')"
          >
            <b-dropdown-item-button
              name="nextPage"
              @click="submit('dispatch')"
            >{{ $trans('Submit') }} {{ $trans('and open dispatch') }}</b-dropdown-item-button>
          </b-dropdown>
          <BButton
            v-else
            type="button"
            variant="primary"
            :disabled="buttonDisabled"
            @click="submit('back')"
          >
            {{ $trans('Submit') }}
          </BButton>
        </div>
      </div>
    </header>

    <div class="page-detail">
      <b-overlay
        :show="isLoading"
        rounded="sm"
      >
        <div class="flex-columns">
          <!-- Contact ------------------------------------------------------ -->
          <div class="panel col-1-3">
            <h6>{{ $trans('Contact') }}</h6>

            <BFormGroup
              v-if="role === 'planning' && !hasBranches"
              label-cols="3"
              :label="$trans('Customer')"
              label-for="order-customer-search"
            >
              <VueMultiselect
                id="order-customer-search"
                track-by="id"
                :placeholder="$trans('Type to search name, address..')"
                open-direction="bottom"
                :options="customers"
                :multiple="false"
                :internal-search="false"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :hide-selected="true"
                :custom-label="addressLabel"
                @search-change="(term: string) => (customerTerm = term)"
                @select="selectCustomer"
              >
                <template #noResult>{{ $trans('Nothing found.') }}</template>
              </VueMultiselect>
            </BFormGroup>

            <BFormGroup
              v-if="role === 'planning' && hasBranches && !fromQuotation"
              label-cols="3"
              :label="$trans('Branch')"
              label-for="order-branch-search"
            >
              <VueMultiselect
                id="order-branch-search"
                track-by="id"
                :placeholder="$trans('Type to search name, address..')"
                open-direction="bottom"
                :options="branches"
                :multiple="false"
                :internal-search="false"
                :options-limit="30"
                :limit="10"
                :max-height="600"
                :hide-selected="true"
                :custom-label="addressLabel"
                @search-change="(term: string) => (branchTerm = term)"
                @select="fillBranch"
              >
                <template #noResult>{{ $trans('Nothing found.') }}</template>
              </VueMultiselect>
            </BFormGroup>

            <BFormGroup
              :label="hasBranches ? $trans('Branch') : $trans('Customer')"
              label-for="order_name"
              label-cols="3"
            >
              <b-input-group>
                <BFormInput
                  id="order_name"
                  v-model="order.order_name"
                  :state="submitClicked ? !(errors.order_name || ownerError) : null"
                />
                <template
                  v-if="!hasBranches"
                  #append
                >
                  <BFormInput
                    id="customer_id"
                    v-model="order.customer_id"
                    :readonly="true"
                    :title="$trans('Customer ID')"
                    style="max-width: 9ch"
                  />
                </template>
              </b-input-group>
              <b-form-invalid-feedback :state="submitClicked ? !(errors.order_name || ownerError) : null">
                {{ ownerError || errors.order_name }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <details
              v-if="order.customer_id || hasBranches || role !== 'planning'"
              open
            >
              <summary class="flex-columns space-between">
                <h6>{{ $trans('Customer details') }}</h6>
                <IBiChevronDown />
              </summary>

              <BFormGroup
                :label="$trans('Address')"
                label-for="order_address"
                label-cols="3"
              >
                <BFormInput
                  id="order_address"
                  v-model="order.order_address"
                  :state="submitClicked ? !errors.order_address : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.order_address : null">
                  {{ errors.order_address }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                :label="$trans('Postal')"
                label-for="order_postal"
                label-cols="3"
              >
                <BFormInput
                  id="order_postal"
                  v-model="order.order_postal"
                  :state="submitClicked ? !errors.order_postal : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.order_postal : null">
                  {{ errors.order_postal }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                :label="$trans('Country')"
                label-for="order_country_code"
                label-cols="3"
              >
                <BFormSelect
                  id="order_country_code"
                  v-model="order.order_country_code"
                  :options="countries"
                />
              </BFormGroup>

              <BFormGroup
                :label="$trans('City')"
                label-for="order_city"
                label-cols="3"
              >
                <BFormInput
                  id="order_city"
                  v-model="order.order_city"
                  :state="submitClicked ? !errors.order_city : null"
                />
                <b-form-invalid-feedback :state="submitClicked ? !errors.order_city : null">
                  {{ errors.order_city }}
                </b-form-invalid-feedback>
              </BFormGroup>

              <BFormGroup
                :label="$trans('Contacts')"
                label-for="order_contact"
                label-cols="3"
              >
                <BFormInput
                  id="order_contact"
                  v-model="order.order_contact"
                />
              </BFormGroup>

              <BFormGroup
                :label="$trans('Email')"
                label-for="order_email"
                label-cols="3"
              >
                <BFormInput
                  id="order_email"
                  v-model="order.order_email"
                  placeholder="email address"
                />
              </BFormGroup>

              <BFormGroup
                :label="$trans('Mobile')"
                label-for="order_mobile"
                label-cols="3"
              >
                <BFormInput
                  id="order_mobile"
                  v-model="order.order_mobile"
                />
              </BFormGroup>

              <BFormGroup
                :label="$trans('Phone')"
                label-for="order_tel"
                label-cols="3"
              >
                <BFormInput
                  id="order_tel"
                  v-model="order.order_tel"
                />
              </BFormGroup>

              <BFormGroup
                :label="$trans('Customer remarks')"
                label-for="customer_remarks"
                label-cols="3"
              >
                <BFormTextarea
                  id="customer_remarks"
                  v-model="order.customer_remarks"
                  rows="3"
                />
              </BFormGroup>
            </details>
          </div>

          <!-- Order details ------------------------------------------------ -->
          <div class="panel col-1-3">
            <h6>{{ $trans("Order details") }}</h6>

            <BFormGroup
              :label="$trans('Order type')"
              label-for="order_type"
              label-cols="3"
            >
              <BFormSelect
                id="order_type"
                v-model="order.order_type"
                :options="orderTypeOptions"
                :state="submitClicked ? !errors.order_type : null"
              />
              <b-form-invalid-feedback :state="submitClicked ? !errors.order_type : null">
                {{ errors.order_type }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              :label="$trans('Reference')"
              label-for="order_reference"
              label-cols="3"
            >
              <BFormInput
                id="order_reference"
                v-model="order.order_reference"
              />
            </BFormGroup>

            <BFormGroup
              v-if="role !== 'customer'"
              :label="$trans('Customer reference')"
              label-for="customer_reference"
              label-cols="3"
            >
              <BFormInput
                id="customer_reference"
                v-model="order.customer_reference"
              />
            </BFormGroup>

            <BFormGroup
              :label="$trans('Remarks')"
              label-for="remarks"
              label-cols="3"
            >
              <BFormTextarea
                id="remarks"
                v-model="order.remarks"
                rows="3"
              />
            </BFormGroup>

            <h6>{{ $trans('Planning') }}</h6>
            <b-container>
              <b-row>
                <BFormGroup
                  :label="$trans('Start date')"
                  label-for="start_date"
                  label-cols="3"
                >
                  <VueDatePicker
                    id="start_date"
                    v-model="order.start_date"
                    :placeholder="$trans('Select date')"
                    :locale="nl"
                    auto-apply
                    arrow-navigation
                    :enable-time-picker="false"
                    :formats="{ input: 'dd/MM/yyyy' }"
                  />
                  <b-form-invalid-feedback :state="submitClicked ? !errors.start_date : null">
                    {{ errors.start_date }}
                  </b-form-invalid-feedback>
                </BFormGroup>
                <b-col cols="2" />
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
                    :state="submitClicked ? !errors.start_time : null"
                  />
                  <VueDatePicker
                    :model-value="timePickerValue(order.start_time)"
                    :placeholder="$trans('Set time')"
                    time-picker
                    arrow-navigation
                    @update:model-value="(value: TimeValue) => (order.start_time = formatTime(value))"
                  >
                    <template #trigger>
                      <p class="clock-icon"><IBiClock /></p>
                    </template>
                  </VueDatePicker>
                  <b-form-invalid-feedback :state="submitClicked ? !errors.start_time : null">
                    {{ errors.start_time }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-row>
            </b-container>

            <b-container>
              <b-row>
                <BFormGroup
                  :label="$trans('End date')"
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
                    :enable-time-picker="false"
                    :formats="{ input: 'dd/MM/yyyy' }"
                  />
                  <b-form-invalid-feedback :state="submitClicked ? !errors.end_date : null">
                    {{ errors.end_date }}
                  </b-form-invalid-feedback>
                </BFormGroup>
                <b-col cols="2" />
                <BFormGroup
                  :label="$trans('End time')"
                  label-for="end_time"
                  label-cols="3"
                >
                  <BFormInput
                    id="end_time"
                    v-model="order.end_time"
                    type="text"
                    placeholder="HH:mm"
                    class="time-input"
                    :state="submitClicked ? !errors.end_time : null"
                  />
                  <VueDatePicker
                    :model-value="timePickerValue(order.end_time)"
                    class="mb-2"
                    :placeholder="$trans('Set time')"
                    time-picker
                    arrow-navigation
                    @update:model-value="(value: TimeValue) => (order.end_time = formatTime(value))"
                  >
                    <template #trigger>
                      <p class="clock-icon"><IBiClock /></p>
                    </template>
                  </VueDatePicker>
                  <b-form-invalid-feedback :state="submitClicked ? !errors.end_time : null">
                    {{ errors.end_time }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-row>
            </b-container>

            <template v-if="role === 'planning' && !hasBranches">
              <div class="assign-engineer section">
                <BFormGroup
                  :label="$trans('Assign to')"
                  label-for="order-assign"
                  label-cols="3"
                >
                  <VueMultiselect
                    id="order-assign"
                    v-model="selectedEngineers"
                    track-by="user_id"
                    label="full_name"
                    :max-height="600"
                    :placeholder="$trans('Type to search engineer(s)')"
                    open-direction="bottom"
                    :options="engineers"
                    :multiple="true"
                  >
                    <template #noResult>{{ $trans('Nothing found.') }}</template>
                  </VueMultiselect>
                </BFormGroup>
              </div>
              <BFormGroup
                :label="$trans('Assignee(s)')"
                label-for="order-assigned-to"
                label-cols="3"
              >
                <div v-if="!assignees.length">
                  <label class="col-form-label order-assignee dimmed">{{ $trans('Nobody assigned') }}</label>
                </div>
                <div
                  v-for="engineer in assignees"
                  :key="engineer.user_id ?? engineer.full_name"
                  class="col-form-label order-assignee"
                  :class="{'text-decoration-line-through': isRemoved(engineer)}"
                >
                  <span>{{ engineer.full_name }}</span>
                  <BButton
                    v-if="engineer.user_id !== null && !isRemoved(engineer)"
                    class="float-right h5 mx-2"
                    variant="light"
                    :title="$trans('Unassign')"
                    @click="unassignEngineer(engineer)"
                  >
                    <IBiTrashFill />
                  </BButton>
                </div>
              </BFormGroup>
            </template>

            <template v-if="role === 'planning'">
              <BFormGroup
                label-for="planning_remarks"
                :label="$trans('Planning remarks')"
              >
                <BFormTextarea
                  id="planning_remarks"
                  v-model="order.planning_remarks"
                  rows="1"
                />
              </BFormGroup>
              <BFormGroup
                :label="$trans('Order email extra')"
                label-for="order-email-extra"
              >
                <VueMultiselect
                  id="order-email-extra"
                  v-model="extraRecipients"
                  track-by="email"
                  label="email"
                  :max-height="600"
                  :placeholder="$trans('Type to search sales user(s)')"
                  open-direction="bottom"
                  :options="salesUserOptions"
                  :multiple="true"
                  :taggable="true"
                  :internal-search="false"
                  @search-change="(term: string) => (salesUserTerm = term)"
                  @tag="addRecipientTag"
                >
                  <template #noResult>
                    {{ $trans('Oops! No elements found. Consider changing the search query.') }}
                  </template>
                </VueMultiselect>
              </BFormGroup>
            </template>
          </div>

          <!-- Documents, orderlines, infolines ------------------------------ -->
          <div class="panel col-1-3">
            <div class="documents section">
              <OrderDocumentsPanel
                ref="documents"
                :documents="record?.documents ?? []"
              />
            </div>

            <div class="order-lines section">
              <h6>{{ $trans('Order lines') }}</h6>
              <b-container fluid="sm">
                <b-row
                  v-for="(orderline, index) of orderlines.rows.value"
                  :key="orderline.id ?? `new-${index}`"
                  no-gutters
                  style="padding-bottom: 10px"
                >
                  <b-col cols="9">
                    <div>{{ $trans("Product") }}: <b>{{ orderline.product }}</b></div>
                    <div>{{ $trans("Location") }}: <b>{{ orderline.location }}</b></div>
                    <div>{{ $trans("Remarks") }}: <b>{{ orderline.remarks }}</b></div>
                  </b-col>
                  <b-col cols="3">
                    <div class="float-right">
                      <BLink
                        class="h5 mx-2"
                        :title="$trans('Edit')"
                        @click.prevent="orderlines.edit(index)"
                      ><IBiPencil /></BLink>
                      <BLink
                        class="h5 mx-2"
                        :title="$trans('Delete')"
                        @click.prevent="orderlines.remove(index)"
                      ><IBiTrash /></BLink>
                    </div>
                  </b-col>
                </b-row>
              </b-container>

              <hr v-if="orderlines.rows.value.length > 0">

              <div v-if="usesEquipment && role !== 'customer'">
                <h5 v-if="orderlines.isEditing.value">{{ $trans("Edit") }}</h5>
                <h5 v-else>{{ $trans("New") }}</h5>

                <BFormGroup :label="$trans('Equipment')">
                  <VueMultiselect
                    id="maintenance-contract-equipment-name"
                    ref="equipmentMultiselect"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('(type to search)')"
                    open-direction="bottom"
                    :options="equipmentOptions"
                    :multiple="false"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    :disabled="!ownerChosen"
                    @search-change="(term: string) => (equipmentTerm = term)"
                    @select="selectEquipment"
                  >
                    <template #noResult>
                      <h5>{{ $trans('No equipment found') }}</h5>
                      <p v-if="canQuickCreateEquipment">
                        <BButton
                          type="button"
                          variant="primary"
                          @click="showAddEquipmentModal"
                        >{{ $trans("Add new equipment") }}</BButton>
                      </p>
                    </template>
                  </VueMultiselect>
                  <span>
                    <strong>{{ orderlines.rowEdit.value.product }}</strong>
                    <IBiCheck v-if="orderlines.rowEdit.value.equipment" />
                  </span>
                </BFormGroup>

                <BFormGroup :label="$trans('Location')">
                  <VueMultiselect
                    id="location-name"
                    ref="locationMultiselect"
                    track-by="id"
                    label="name"
                    :placeholder="$trans('(type to search)')"
                    open-direction="bottom"
                    :options="locationOptions"
                    :multiple="false"
                    :internal-search="false"
                    :clear-on-select="true"
                    :close-on-select="true"
                    :options-limit="30"
                    :limit="10"
                    :max-height="600"
                    :show-no-results="true"
                    :hide-selected="true"
                    :disabled="!ownerChosen || locationLockedByEquipment"
                    @search-change="(term: string) => (locationTerm = term)"
                    @select="selectLocation"
                  >
                    <template #noResult>
                      <h5>{{ $trans('No locations found') }}</h5>
                      <p v-if="canQuickCreateLocation">
                        <BButton
                          type="button"
                          variant="primary"
                          @click="showAddLocationModal"
                        >{{ $trans("Add new location") }}</BButton>
                      </p>
                    </template>
                  </VueMultiselect>
                  <span>
                    <strong>{{ orderlines.rowEdit.value.location }}</strong>
                    <IBiCheck v-if="orderlines.rowEdit.value.equipment_location" />
                  </span>
                </BFormGroup>

                <BFormGroup
                  v-if="maintenance"
                  :label="$trans('Amount')"
                  label-for="order-orderline-amount"
                  label-cols="3"
                >
                  <BFormInput
                    id="order-orderline-amount"
                    v-model.number="orderlines.rowEdit.value.amount"
                    type="number"
                  />
                </BFormGroup>
                <BFormGroup
                  v-else
                  label-for="order-orderline-remarks"
                  :label="$trans('Remarks')"
                >
                  <BFormTextarea
                    id="order-orderline-remarks"
                    v-model="orderlines.rowEdit.value.remarks"
                    rows="1"
                  />
                </BFormGroup>
              </div>

              <div v-else>
                <BFormGroup
                  :label="$trans('Equipment')"
                  label-for="order-orderline-product"
                  label-cols="3"
                >
                  <BFormInput
                    id="order-orderline-product"
                    v-model="orderlines.rowEdit.value.product"
                    placeholder="(item name)"
                  />
                </BFormGroup>
                <BFormGroup
                  :label="$trans('Location')"
                  label-for="order-orderline-location"
                  label-cols="3"
                >
                  <BFormInput
                    id="order-orderline-location"
                    v-model="orderlines.rowEdit.value.location"
                    placeholder="(location name)"
                  />
                </BFormGroup>
                <BFormGroup
                  :label="$trans('Remarks')"
                  label-for="order-orderline-remarks"
                  label-cols="3"
                >
                  <BFormInput
                    id="order-orderline-remarks"
                    v-model="orderlines.rowEdit.value.remarks"
                    placeholder="(notes)"
                  />
                </BFormGroup>
              </div>

              <BFormGroup class="text-right">
                <BButton
                  v-if="orderlines.isEditing.value"
                  type="button"
                  variant="warning"
                  :disabled="!orderlineComplete"
                  @click="commitOrderline"
                >{{ $trans('Edit orderline') }}</BButton>
                <BButton
                  v-else
                  type="button"
                  variant="primary"
                  :disabled="!orderlineComplete"
                  @click="addOrderline"
                >{{ $trans('Add orderline') }}</BButton>
              </BFormGroup>
            </div>

            <template v-if="role === 'planning' && !hasBranches">
              <hr>
              <div class="info-lines section">
                <h6>{{ $trans('Info lines') }}</h6>
                <b-container fluid="sm">
                  <b-row
                    v-for="(infoline, index) of infolines.rows.value"
                    :key="infoline.id ?? `new-${index}`"
                    no-gutters
                    style="padding-bottom: 10px"
                  >
                    <b-col cols="9"><b>{{ infoline.info }}</b></b-col>
                    <b-col cols="3">
                      <div class="float-right">
                        <BLink
                          class="h5 mx-2"
                          :title="$trans('Edit')"
                          @click.prevent="infolines.edit(index)"
                        ><IBiPencil /></BLink>
                        <BLink
                          class="h5 mx-2"
                          :title="$trans('Delete')"
                          @click.prevent="infolines.remove(index)"
                        ><IBiTrash /></BLink>
                      </div>
                    </b-col>
                  </b-row>
                </b-container>

                <hr v-if="infolines.rows.value.length > 0">

                <h5 v-if="infolines.isEditing.value">{{ $trans("Edit") }}</h5>
                <h5 v-else>{{ $trans("New") }}</h5>
                <BFormGroup
                  :label="$trans('Info')"
                  label-for="order-infoline-info"
                >
                  <BFormTextarea
                    id="order-infoline-info"
                    v-model="infolines.rowEdit.value.info"
                  />
                </BFormGroup>
                <BFormGroup class="text-right">
                  <BButton
                    v-if="infolines.isEditing.value"
                    type="button"
                    variant="warning"
                    @click="infolines.commitEdit()"
                  >{{ $trans('edit') }}</BButton>
                  <BButton
                    v-else
                    type="button"
                    variant="primary"
                    :disabled="!infolines.rowEdit.value.info.trim()"
                    @click="infolines.add()"
                  >{{ $trans('add') }}</BButton>
                </BFormGroup>
              </div>
            </template>
          </div>
        </div>
      </b-overlay>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation, useQuery } from '@tanstack/vue-query'
import { useToast } from 'bootstrap-vue-next'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import VueMultiselect from 'vue-multiselect'
import { nl } from 'date-fns/locale'

import {
  companyBranchMyRetrieveOptions,
  customerCustomerRetrieveOptions,
  equipmentEquipmentRetrieveOptions,
  mobileAssignUserCreateMutation,
  mobileUnassignUserCreateMutation,
  orderInfolineCreateMutation,
  orderInfolineDestroyMutation,
  orderInfolinePartialUpdateMutation,
  orderOrderCreateMutation,
  orderOrderListQueryKey,
  orderOrderlineCreateMutation,
  orderOrderlineDestroyMutation,
  orderOrderlinePartialUpdateMutation,
  orderOrderRetrieveOptions,
  orderOrderRetrieveQueryKey,
  orderOrderSetOrderAcceptedCreateMutation,
  orderOrderSetOrderRejectedCreateMutation,
  orderOrderPartialUpdateMutation,
  quotationQuotationRetrieveOptions,
} from '@/api/@tanstack/vue-query.gen'
import type { AssignedUserInfo, OrderDetail } from '@/api/types.gen'
import { useAuthStore } from '@/features/auth'
import { useQueryErrorToast } from '@/features/forms/use-query-error-toast'
import { useResourceForm } from '@/features/forms/use-resource-form'
import { $trans, errorToast, infoToast } from '@/services/i18n'
import { useMainStore } from '@/stores/main'
import OrderDocumentsPanel from './OrderDocumentsPanel.vue'
import {
  emptyOrder,
  emptyOrderline,
  infolineFromRecord,
  isOrderlineComplete,
  orderFromRecord,
  orderlineFromRecord,
  parseInfolineBody,
  parseOrderBody,
  parseOrderlineBody,
  validateOrderForm,
  type FormRole,
  type InfolineRow,
  type OrderBody,
  type OrderFieldErrors,
  type OrderFormValues,
  type OrderlineRow,
} from './schemas'
import {
  useEngineerOptions,
  useEquipmentPickers,
  useOwnerPickers,
  useSalesUserOptions,
  type EquipmentOption,
} from './use-order-pickers'
import { useStagedRows } from './use-staged-rows'

/**
 * The order create/edit form. One screen; the user's role picks the
 * variant (see `FormRole` in ./schemas.ts), which decides the owner
 * picker, the engineer and infoline sections, and which generated request
 * body the save parses.
 *
 * The save is a sequence: the order, then its orderlines, infolines and
 * documents against the new id, then the engineer assignments, then — for
 * "Save & accept" — the acceptance. A failure past the order write reports
 * as a failed save and keeps the user on the form with what they entered.
 */
const props = withDefaults(defineProps<{
  pk?: string | number | null
  /** Create with the maintenance-contract equipment the contract view staged in the store. */
  maintenance?: boolean
  /** Create from a quotation: its customer and reference are copied over. */
  fromQuotation?: boolean
  quotationId?: string | number | null
}>(), {
  pk: null,
  maintenance: false,
  fromQuotation: false,
  quotationId: null,
})

const router = useRouter()
const authStore = useAuthStore()
const mainStore = useMainStore()
const {create} = useToast()

const hasBranches = computed(() => Boolean(mainStore.getMemberHasBranches))
const usesEquipment = computed(() => Boolean(mainStore.getMemberUsesEquipment))
const countries = computed(() => mainStore.getCountries ?? [])
const orderTypeOptions = computed(() => [
  {value: '', text: $trans('Select order type')},
  ...((mainStore.getOrderTypes ?? []) as string[]).map((type) => ({value: type, text: type})),
])

const role = computed<FormRole>(() => {
  if (authStore.isPlanning || authStore.isStaff || authStore.isSuperuser) return 'planning'
  if (authStore.isBranchEmployee) return 'employee'
  return 'customer'
})
const variant = computed(() => ({role: role.value, hasBranches: hasBranches.value}))

// The order ------------------------------------------------------------------

const documents = useTemplateRef<InstanceType<typeof OrderDocumentsPanel>>('documents')
const orderlines = useStagedRows<OrderlineRow>(emptyOrderline)
const infolines = useStagedRows<InfolineRow>(() => ({info: ''}))

/** Where the save goes: back to the list, or on to the dispatch screen. */
const next = ref<'back' | 'dispatch'>('back')
const acceptOnSave = ref(false)

const {
  values: order,
  errors,
  record,
  isCreate,
  id,
  isLoading: baseIsLoading,
  buttonDisabled,
  submitClicked,
  saving,
  submitForm,
  cancelForm,
} = useResourceForm<OrderFormValues, OrderDetail, OrderBody, OrderFieldErrors>({
  pk: () => props.pk,
  retrieve: (id) => orderOrderRetrieveOptions({path: {id}}),
  create: orderOrderCreateMutation(),
  update: orderOrderPartialUpdateMutation(),
  invalidate: async (qc) => {
    await qc.invalidateQueries({queryKey: orderOrderListQueryKey()})
    if (!isCreate.value) await qc.invalidateQueries({queryKey: orderOrderRetrieveQueryKey({path: {id: id.value}})})
  },
  empty: emptyOrder,
  fromRecord: orderFromRecord,
  validate: (values, context) => validateOrderForm(values, variant.value, context),
  parse: (values, context) => parseOrderBody(values, variant.value, context),
  onSaved: async (result, context) => {
    const saved = result as {id: number; order_id: string}
    const orderId = context.isCreate ? saved.id : context.id
    const orderCode = saved.order_id ?? record.value?.order_id ?? ''

    await orderlines.replay(orderId, {
      create: (row, parent) => createOrderline.mutateAsync({body: parseOrderlineBody(row, parent)}),
      update: (rowId, row, parent) => updateOrderline.mutateAsync({path: {id: rowId}, body: parseOrderlineBody(row, parent)}),
      destroy: (rowId) => destroyOrderline.mutateAsync({path: {id: rowId}}),
    })
    if (role.value === 'planning' && !hasBranches.value) {
      await infolines.replay(orderId, {
        create: (row, parent) => createInfoline.mutateAsync({body: parseInfolineBody(row, parent)}),
        update: (rowId, row, parent) => updateInfoline.mutateAsync({path: {id: rowId}, body: parseInfolineBody(row, parent)}),
        destroy: (rowId) => destroyInfoline.mutateAsync({path: {id: rowId}}),
      })
      await replayEngineers(orderId, orderCode)
    }
    await documents.value?.replay(orderId)

    if (acceptOnSave.value && !context.isCreate) {
      await acceptMutation.mutateAsync({path: {id: context.id}})
      infoToast(create, $trans('Accepted'), $trans('Order has been accepted'))
    }
  },
  // A refused unassign names the engineer; every other failure keeps the
  // generic copy.
  reasonOf: (error, fallback) => (error instanceof UnassignRefused ? error.message : fallback),
  afterSave: async () => {
    if (next.value === 'dispatch') await router.push({name: 'mobile-dispatch'})
    else router.go(-1)
  },
  copy: {
    fetchError: $trans('Error fetching order'),
    created: $trans('Created'),
    createdDetail: $trans('Order has been created'),
    updated: $trans('Updated'),
    updatedDetail: $trans('Order has been updated'),
    createError: $trans('Error creating order'),
    updateError: $trans('Error updating order'),
  },
})

// The record's child rows seed the staged sets; a create starts empty.
watch(
  record,
  (loaded) => {
    if (!loaded) return
    orderlines.seed(loaded.orderlines.map(orderlineFromRecord))
    infolines.seed(loaded.infolines.map(infolineFromRecord))
    removedEngineers.value = []
    selectedEngineers.value = []
    extraRecipients.value = (loaded.order_email_extra ?? []).map((email) => ({email}))
  },
  {immediate: true},
)

const createOrderline = useMutation({...orderOrderlineCreateMutation()})
const updateOrderline = useMutation({...orderOrderlinePartialUpdateMutation()})
const destroyOrderline = useMutation({...orderOrderlineDestroyMutation()})
const createInfoline = useMutation({...orderInfolineCreateMutation()})
const updateInfoline = useMutation({...orderInfolinePartialUpdateMutation()})
const destroyInfoline = useMutation({...orderInfolineDestroyMutation()})
const acceptMutation = useMutation({...orderOrderSetOrderAcceptedCreateMutation()})
const rejectMutation = useMutation({...orderOrderSetOrderRejectedCreateMutation()})

/**
 * The submit button and its dropdown: where to go once saved. A click on
 * the dropdown item bubbles to the split button's own handler, so the
 * second call arrives while the first save is in flight and must not
 * overwrite the destination.
 */
function submit(destination: 'back' | 'dispatch') {
  if (saving.value) return
  next.value = destination
  acceptOnSave.value = false
  return submitForm()
}

/** Edit + accept, for a customer-placed order awaiting confirmation. */
function editAndAccept() {
  next.value = 'back'
  acceptOnSave.value = true
  return submitForm()
}

const canAccept = computed(
  () => !isCreate.value && !hasBranches.value && role.value === 'planning' && record.value?.customer_order_accepted === false,
)

async function reject() {
  try {
    await rejectMutation.mutateAsync({path: {id: id.value}})
    cancelForm()
  } catch {
    errorToast(create, $trans('Error rejecting order'))
  }
}

// Owner ------------------------------------------------------------------

const {customerTerm, customers, branchTerm, branches, addressLabel, fillCustomer, fillBranch} =
  useOwnerPickers(order, {hasBranches: () => hasBranches.value})

const ownerError = computed(() => errors.value.customer_relation ?? errors.value.branch ?? '')

function selectCustomer(option: Parameters<typeof fillCustomer>[0]) {
  fillCustomer(option)
}

// A branch employee orders for their own branch: one read, copied over on
// a create the way a planning user's picker would.
const myBranchQuery = useQuery(() => ({
  ...companyBranchMyRetrieveOptions(),
  enabled: role.value === 'employee' && isCreate.value,
}))
useQueryErrorToast(myBranchQuery.error, $trans('Error fetching branch'))
watch(
  () => myBranchQuery.data.value,
  (branch) => {
    if (branch) fillBranch(branch)
  },
  {immediate: true},
)

// A customer user orders for their own company.
const ownCustomerId = computed(() => {
  const user = authStore.userInfo as {customer_user?: {customer?: number}} | null
  return user?.customer_user?.customer ?? null
})
const ownCustomerQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({path: {id: ownCustomerId.value as number}}),
  enabled: role.value === 'customer' && isCreate.value && ownCustomerId.value !== null,
}))
useQueryErrorToast(ownCustomerQuery.error, $trans('Error fetching customer'))
watch(
  () => ownCustomerQuery.data.value,
  (customer) => {
    if (customer) fillCustomer(customer)
  },
  {immediate: true},
)

// Create from a quotation: its customer, and its reference.
const quotationQuery = useQuery(() => ({
  ...quotationQuotationRetrieveOptions({path: {id: Number(props.quotationId)}}),
  enabled: props.fromQuotation && props.quotationId !== null && isCreate.value,
}))
useQueryErrorToast(quotationQuery.error, $trans('Error fetching quotation'))
const quotationCustomerQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({path: {id: quotationQuery.data.value?.customer_relation as number}}),
  enabled: quotationQuery.data.value?.customer_relation != null,
}))
watch(
  () => quotationCustomerQuery.data.value,
  (customer) => {
    const quotation = quotationQuery.data.value
    if (!customer || !quotation) return
    fillCustomer(customer)
    order.value.quotation = quotation.id
    order.value.order_reference = quotation.quotation_reference ?? ''
  },
  {immediate: true},
)

// Create for a maintenance contract: the contract view staged the
// equipment rows and the customer in the store.
type MaintenanceSeed = {
  maintenanceEquipment: Array<{equipment_pk: number; remarks?: string; amount?: number}>
  customer_pk: number
  contract_pk: number
}
const maintenanceSeed = computed<MaintenanceSeed | null>(() => {
  if (!props.maintenance || !isCreate.value) return null
  const staged = mainStore.getMaintenanceEquipment as unknown
  return staged && typeof staged === 'object' && 'customer_pk' in staged ? (staged as MaintenanceSeed) : null
})
const maintenanceCustomerQuery = useQuery(() => ({
  ...customerCustomerRetrieveOptions({path: {id: maintenanceSeed.value?.customer_pk as number}}),
  enabled: maintenanceSeed.value !== null,
}))
watch(
  () => maintenanceCustomerQuery.data.value,
  (customer) => {
    if (customer) fillCustomer(customer)
  },
  {immediate: true},
)
const maintenanceEquipmentQueries = computed(() => maintenanceSeed.value?.maintenanceEquipment ?? [])
for (const seedRow of maintenanceEquipmentQueries.value) {
  const equipmentQuery = useQuery(() => equipmentEquipmentRetrieveOptions({path: {id: seedRow.equipment_pk}}))
  watch(
    () => equipmentQuery.data.value,
    (equipment) => {
      if (!equipment || !maintenanceSeed.value) return
      orderlines.rows.value.push({
        product: equipment.name,
        location: equipment.location_name ?? '',
        remarks: seedRow.remarks ?? '',
        equipment: equipment.id,
        equipment_location: equipment.location ?? null,
        amount: seedRow.amount ?? null,
        maintenance_contract: maintenanceSeed.value.contract_pk,
      })
    },
    {immediate: true},
  )
}

// Times --------------------------------------------------------------------

type TimeValue = {hours: number; minutes: number} | null

function formatTime(value: TimeValue): string {
  if (!value) return ''
  return `${String(value.hours).padStart(2, '0')}:${String(value.minutes).padStart(2, '0')}`
}

function timePickerValue(value: string): TimeValue {
  const match = /^(\d{1,2}):(\d{2})/.exec(value)
  return match ? {hours: Number(match[1]), minutes: Number(match[2])} : null
}

// The end may not precede the start; whichever moved drags the other along.
watch(() => order.value.start_date, (start) => {
  if (start && order.value.end_date && order.value.end_date < start) order.value.end_date = start
})
watch(() => order.value.end_date, (end) => {
  if (end && order.value.start_date && end < order.value.start_date) order.value.start_date = end
})

// Engineers --------------------------------------------------------------

const {engineers} = useEngineerOptions(() => role.value === 'planning' && !hasBranches.value)
const selectedEngineers = ref<Array<{user_id: number; full_name: string}>>([])
const removedEngineers = ref<AssignedUserInfo[]>([])
const assignees = computed(() => record.value?.assigned_user_info ?? [])

function isRemoved(engineer: AssignedUserInfo) {
  return removedEngineers.value.includes(engineer)
}

function unassignEngineer(engineer: AssignedUserInfo) {
  if (!isRemoved(engineer)) removedEngineers.value.push(engineer)
}

const assignMutation = useMutation({...mobileAssignUserCreateMutation()})
const unassignMutation = useMutation({...mobileUnassignUserCreateMutation()})

/** The backend refused to unassign: the engineer has booked hours or materials. */
class UnassignRefused extends Error {}

async function replayEngineers(orderId: number, orderCode: string) {
  const refused: string[] = []
  for (const engineer of removedEngineers.value) {
    if (engineer.user_id === null) continue
    const result = await unassignMutation.mutateAsync({path: {id: engineer.user_id}, body: {order_pk: orderId}})
    // A zero result is the backend refusing: the engineer has booked hours
    // or materials on the order.
    if (!result.result) refused.push(`${engineer.full_name} ${$trans('has booked hours or materials')}`)
  }
  removedEngineers.value = []
  if (refused.length) throw new UnassignRefused(refused.join(', '))

  for (const engineer of selectedEngineers.value) {
    await assignMutation.mutateAsync({path: {id: engineer.user_id}, query: {notify_user: '1'}, body: {order_ids: orderCode}})
  }
  if (selectedEngineers.value.length) infoToast(create, $trans('Assigned'), $trans('Order assigned'))
  selectedEngineers.value = []
}

// Extra recipients ----------------------------------------------------------

const {salesUserTerm, salesUsers} = useSalesUserOptions(() => role.value === 'planning')
const salesUserOptions = computed(() => salesUsers.value.map((user) => ({email: user.email})))
const extraRecipients = ref<Array<{email: string}>>([])

function addRecipientTag(email: string) {
  extraRecipients.value.push({email})
}

watch(extraRecipients, (recipients) => {
  order.value.order_email_extra = recipients.map((recipient) => recipient.email)
}, {deep: true})

// Orderlines ------------------------------------------------------------

const {
  ownerChosen,
  equipmentTerm,
  equipmentOptions,
  locationTerm,
  locationOptions,
  createEquipment,
  createLocation,
  canQuickCreateEquipment,
  canQuickCreateLocation,
} = useEquipmentPickers(order, {
  hasBranches: () => hasBranches.value,
  scopedByOwner: () => role.value === 'planning',
})

const orderlineComplete = computed(() => isOrderlineComplete(orderlines.rowEdit.value))
const locationLockedByEquipment = ref(false)

function selectEquipment(option: EquipmentOption) {
  orderlines.rowEdit.value.equipment = option.id
  orderlines.rowEdit.value.product = option.name ?? ''
  if (option.location) {
    orderlines.rowEdit.value.equipment_location = option.location.id
    orderlines.rowEdit.value.location = option.location.name
    locationLockedByEquipment.value = true
  } else {
    locationLockedByEquipment.value = false
  }
}

function selectLocation(option: {id: number; name: string | null}) {
  orderlines.rowEdit.value.equipment_location = option.id
  orderlines.rowEdit.value.location = option.name ?? ''
}

function addOrderline() {
  orderlines.add()
  locationLockedByEquipment.value = false
}

function commitOrderline() {
  orderlines.commitEdit()
  locationLockedByEquipment.value = false
}

// The quick-create modals: the search term typed so far becomes the name.
type Multiselect = {deactivate?: () => void; $refs?: {search?: {value?: string}}}
const equipmentMultiselect = useTemplateRef<Multiselect>('equipmentMultiselect')
const locationMultiselect = useTemplateRef<Multiselect>('locationMultiselect')
const newEquipmentModal = useTemplateRef<{show: () => void; hide: () => void}>('new-equipment-modal')
const newLocationModal = useTemplateRef<{show: () => void; hide: () => void}>('new-location-modal')
const newEquipmentName = ref('')
const newLocationName = ref('')

function typedTerm(picker: Multiselect | null): string {
  picker?.deactivate?.()
  return picker?.$refs?.search?.value ?? ''
}

function showAddEquipmentModal() {
  newEquipmentName.value = typedTerm(equipmentMultiselect.value)
  newEquipmentModal.value?.show()
}

function showAddLocationModal() {
  newLocationName.value = typedTerm(locationMultiselect.value)
  newLocationModal.value?.show()
}

async function submitCreateEquipment() {
  const created = await createEquipment(newEquipmentName.value)
  if (!created) return
  selectEquipment(created)
  newEquipmentModal.value?.hide()
}

async function submitCreateLocation() {
  const created = await createLocation(newLocationName.value)
  if (!created) return
  selectLocation(created)
  newLocationModal.value?.hide()
}

const isLoading = computed(() => baseIsLoading.value || myBranchQuery.isLoading.value || ownCustomerQuery.isLoading.value)
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style scoped>
.multiselect {
  width: auto;
  flex-grow: 1;
}
.time-input {
  width: 100px !important;
  float: left !important;
}
.clock-icon {
  margin: .5em auto auto;
}
</style>
