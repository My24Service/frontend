<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
            <h3>
              <IBiTools></IBiTools>
              <span class="backlink" @click=cancelForm>{{ $trans("Equipment") }}</span> /
              <span v-if="isCreate && !equipment.name">{{ $trans('new') }}</span>
              <span v-if="!isCreate && !equipment.name"><span class="dimmed">{{ $trans('edit') }}</span></span>
              <span v-else>{{ equipment.name }}</span>
            </h3>
            <div class="flex-columns">
              <BButton @click="cancelForm" type="button" variant="secondary">
                {{ $trans('Cancel') }}</BButton>
              <BButton @click="submitForm" type="button" variant="primary">
                {{ $trans('Submit') }}</BButton>
              <BButton
                @click="submitFormBulk"
                type="button"
                variant="success"
                v-if="isCreate"
              >
                {{ $trans('Bulk') }}
              </BButton>
            </div>
        </div>
      </header>

      <div class="page-detail flex-columns">
        <div class="panel col-1-3">
          <h6>{{ $trans('Equipment') }} {{ $trans('Customer')}}</h6>

          <b-row v-if="!hasBranches && !isCustomer">
            <b-col cols="12" role="group">
              <BFormGroup
                label-size="sm"
                label-for="equipment_customer_search"
              >
                <VueMultiselect
                  v-if="!isLoading"
                  id="equipment_customer_search"
                  track-by="id"
                  :placeholder="`${$trans('Select customer')} (${$trans('type to search')})`"
                  open-direction="bottom"
                  :options="customersSearch"
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
                  @search-change="getCustomersDebounced"
                  @select="selectCustomer"
                  :custom-label="customerLabel"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </VueMultiselect>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.equipment.customer.$error : null">
                  {{ $trans('Please select a customer') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>

          <b-row v-if="hasBranches && !isEmployee">
            <b-col cols="12" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Search branches')"
                label-for="equipment_branch_search"
              >
                <VueMultiselect
                  v-if="!isLoading"
                  id="equipment_branch_search"
                  track-by="id"
                  :placeholder="`${$trans('Select branch')} (${$trans('type to search')})`"
                  open-direction="bottom"
                  :options="branchesSearch"
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
                  @search-change="getBranchesDebounced"
                  @select="selectBranch"
                  :custom-label="branchLabel"
                >
                  <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
                </VueMultiselect>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.equipment.branch.$error : null">
                  {{ $trans('Please select a branch') }}
                </b-form-invalid-feedback>
              </BFormGroup>
            </b-col>
          </b-row>

          <!-- customer info -->
          <div v-if="customer && !hasBranches">
            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Customer')"
              label-for="equipment_customer_name"
            >
              <BFormInput
                id="equipment_customer_name"
                size="sm"
                v-model="customer.name"
                readonly
              ></BFormInput>
            </BFormGroup>
            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Address')"
              label-for="equipment_customer_address"
            >
              <BFormInput
                id="equipment_customer_address"
                size="sm"
                v-model="customer.address"
                readonly
              ></BFormInput>
            </BFormGroup>


            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('City')"
              label-for="equipment_customer_city"
            >
              <BFormInput
                id="equipment_customer_city"
                size="sm"
                v-model="customer.city"
                readonly
              ></BFormInput>
            </BFormGroup>


            <BFormGroup
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Country')"
              label-for="equipment_customer_country_code"
            >
              <BFormInput
                id="equipment_customer_country_code"
                size="sm"
                v-model="customer.country_code"
                readonly
              ></BFormInput>
            </BFormGroup>

          </div>
          <div v-if="branch && hasBranches">
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Branch')"
                label-for="equipment_branch_name"
              >
                <BFormInput
                  id="equipment_branch_name"
                  size="sm"
                  v-model="branch.name"
                  readonly
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="4" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Address')"
                label-for="equipment_branch_address"
              >
                <BFormInput
                  id="equipment_branch_address"
                  size="sm"
                  v-model="branch.address"
                  readonly
                ></BFormInput>
              </BFormGroup>
            </b-col>
            <b-col cols="2" role="group">
              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('City')"
                label-for="equipment_branch_city"
              >
                <BFormInput
                  id="equipment_branch_city"
                  size="sm"
                  v-model="branch.city"
                  readonly
                ></BFormInput>
              </BFormGroup>
            </b-col>

              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Country')"
                label-for="equipment_branch_country_code"
              >
                <BFormInput
                  id="equipment_branch_country_code"
                  size="sm"
                  v-model="branch.country_code"
                  readonly
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                v-bind:label="$trans('Lifespan (months)')"
                label-for="equipment_default_replace_months"
              >
                <BFormInput
                  id="equipment_default_replace_months"
                  size="sm"
                  v-model="equipment.default_replace_months"
                ></BFormInput>
              </BFormGroup>

              <BFormGroup
                label-size="sm"
                label-cols="3"
                v-bind:label="$trans('Price')"
                label-for="equipment_serialnumber"
              >
                <PriceInput
                  v-model="equipment.price"
                  :currency="equipment.price_currency"
                  @priceChanged="(val) => priceChanged(val)"
                />
              </BFormGroup>


          </div>
        </div>

        <div class="panel col-1-3">
          <h6>{{  $trans('Equipment details') }}</h6>

        <b-row v-if="branch && hasBranches">
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Branch')"
              label-for="equipment_branch_name"
            >
              <BFormInput
                id="equipment_branch_name"
                size="sm"
                v-model="branch.name"
                readonly
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="4" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-for="equipment_branch_address"
            >
              <BFormInput
                id="equipment_branch_address"
                size="sm"
                v-model="branch.address"
                readonly
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('City')"
              label-for="equipment_branch_city"
            >
              <BFormInput
                id="equipment_branch_city"
                size="sm"
                v-model="branch.city"
                readonly
              ></BFormInput>
            </BFormGroup>
          </b-col>
          <b-col cols="2" role="group">
            <BFormGroup
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="equipment_branch_country_code"
            >
              <BFormInput
                id="equipment_branch_country_code"
                size="sm"
                v-model="branch.country_code"
                readonly
              ></BFormInput>
            </BFormGroup>
          </b-col>
        </b-row>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Name')"
              label-for="equipment_name"
            >
              <BFormInput
                :state="isSubmitClicked ? !v$.equipment.name.$error : null"
                id="equipment_name"
                size="sm"
                ref="name"
                v-model="equipment.name"
              ></BFormInput>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.equipment.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Brand')"
              label-for="equipment_name"
            >
              <BFormInput
                id="equipment_name"
                size="sm"
                v-model="equipment.brand"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Identifier')"
              label-for="equipment_identifier"
            >
              <BFormInput
                id="equipment_identifier"
                size="sm"
                v-model="equipment.identifier"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Serial number')"
              label-for="equipment_serialnumber"
            >
              <BFormInput
                id="equipment_serialnumber"
                size="sm"
                v-model="equipment.serialnumber"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Lifespan (months)')"
              label-for="equipment_default_replace_months"
            >
              <BFormInput
                id="equipment_default_replace_months"
                size="sm"
                v-model="equipment.default_replace_months"
              ></BFormInput>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Price')"
              label-for="equipment_serialnumber"
            >
              <PriceInput
                v-model="equipment.price"
                :currency="equipment.price_currency"
                @priceChanged="(val) => priceChanged(val)"
              />
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Description')"
              label-for="equipment_remarks"
            >
              <BFormTextarea
                id="equipment_remarks"
                v-model="equipment.description"
                rows="1"
              ></BFormTextarea>
            </BFormGroup>
        </div>
        <div class="panel col-1-3">
          <h6>{{ $trans("Usage") }}</h6>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Installation date')"
              label-for="equipment_installation_date"
            >
              <VueDatePicker
                id="equipment_installation_date"
                size="sm"
                class="p-sm-0"
                v-model="equipment.installation_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="equipment.installation_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
            </BFormGroup>

            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Production date')"
              label-for="equipment_production_date"
            >
              <VueDatePicker
                id="equipment_production_date"
                size="sm"
                class="p-sm-0"
                v-model="equipment.production_date"
                v-bind:placeholder="$trans('Choose a date')"
                value="equipment.production_date"
                locale="nl"
                :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit' }"
              ></VueDatePicker>
            </BFormGroup>

          <BFormGroup
            label-size="sm"
            label-cols="4"
            v-bind:label="$trans('Standard hours/mins.')"
            label-for="equipment_standard_hours_hour"
          >
            <BFormInput
              id="equipment_standard_hours_hour"
              size="sm"
              v-model="equipment.standard_hours_hour"
            ></BFormInput>
          </BFormGroup>
            <BFormGroup
              label-size="sm"
              label-cols="4"
              v-bind:label="$trans('Location')"
              label-for="equipment_location"
            >
              <BFormSelect
                id="equipment_location"
                v-model="equipment.location"
                :options="locations"
                size="sm"
                value-field="id"
                text-field="name"
              ></BFormSelect>
            </BFormGroup>
        </div>
        <div class="panel col-1-3">
          <div class="documents section">
            <DocumentsComponent
              :equipment="equipment"
              :is-view="false"
            />
          </div>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<style scoped>
.wide {
  min-width: 66%;
  max-width: unset !important;
}
</style>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'
import VueMultiselect from 'vue-multiselect'
import AwesomeDebouncePromise from 'awesome-debounce-promise'
import { CustomerService } from '@/models/customer/Customer'
import {
  EquipmentService,
  EquipmentModel
} from '@/models/equipment/equipment'
import { BranchService } from "@/models/company/Branch";
import { LocationService } from "@/models/equipment/location";
import PriceInput from "../../components/PriceInput";
import DocumentsComponent from "@/views/equipment/equipment_form/DocumentsComponent.vue";
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
import {useMainStore} from "@/stores/main";

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
  components: {
    VueMultiselect,
    PriceInput,
    DocumentsComponent
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
  },
  validations() {
    if (!this.hasBranches && !this.isCustomer) {
      return {
        equipment: {
          customer: {
            required
          },
          name: {
            required,
          },
        }
      }
    }

    if (this.hasBranches && !this.isEmployee) {
      return {
        equipment: {
          branch: {
            required
          },
          name: {
            required,
          },
        }
      }
    }

    // customer or employee
    return {
      equipment: {
        name: {
          required,
        },
      }
    }

  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      equipment: this.newModel(),
      errorMessage: null,
      equipmentObjects: [],

      getCustomersDebounced: null,
      customersSearch: [],
      customer: null,

      getBranchesDebounced: null,
      branchesSearch: [],
      branch: null,

      locations: [],

      customerService: new CustomerService(),
      branchService: new BranchService(),
      locationService: new LocationService(),
      equipmentService: new EquipmentService()
    }
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  async created() {
    this.getCustomersDebounced = AwesomeDebouncePromise(this.getCustomers, 500)
    this.getBranchesDebounced = AwesomeDebouncePromise(this.getBranches, 500)

    if (!this.isCreate) {
      await this.loadData()
    }
  },
  methods: {
    newModel() {
      return new EquipmentModel({
        default_currency: this.mainStore.getDefaultCurrency,
        price: '0.00',
        price_currency: this.mainStore.getDefaultCurrency,
      })
    },
    priceChanged(priceDinero) {
      this.equipment.setPriceField('price', priceDinero)
    },
    // customers
    async getCustomers(query) {
      try {
        this.customersSearch = await this.customerService.search(query)
      } catch(error) {
        console.log('Error fetching customers', error)
        errorToast(this.create, $trans('Error fetching customers'))
      }
    },
    customerLabel({ name, city}) {
      return `${name} - ${city}`
    },
    async selectCustomer(option) {
      this.equipment.customer = option.id
      this.customer = option
      this.locations = await this.locationService.listForSelectCustomer(option.id)
      this.$refs.name.focus()
    },
    // branches
    async getBranches(query) {
      try {
        this.branchesSearch = await this.branchService.search(query)
      } catch(error) {
        console.log('Error fetching branches', error)
        errorToast(this.create, $trans('Error fetching branches'))
      }
    },
    branchLabel({ name, city}) {
      return `${name} - ${city}`
    },
    async selectBranch(option) {
      this.equipment.branch = option.id
      this.branch = option
      this.locations = await this.locationService.listForSelectBranch(option.id)
      this.$refs.name.focus()
    },

    async submitForm() {
      await this._submitForm(false)
    },
    async submitFormBulk() {
      await this._submitForm(true)
    },
    async _submitForm(isBulk) {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      if (this.isCreate) {
        try {
          await this.equipmentService.insert(this.equipment)
          infoToast(this.create, $trans('Created'), $trans('Equipment has been created'))
          this.isLoading = false

          if (isBulk) {
            let empty = this.newModel()
            empty.branch = this.equipment.branch
            empty.customer = this.equipment.customer
            this.equipment = empty
            this.v$.$reset()
            this.$refs.name.$el.focus()
          } else {
            this.$router.go(-1)
          }
        } catch(error) {
          console.log('Error creating equipment', error)
          errorToast(this.create, $trans('Error creating equipment'))
          this.isLoading = false
        }

        return
      }

      try {
        await this.equipmentService.update(this.pk, this.equipment)
        infoToast(this.create, $trans('Updated'), $trans('Equipment has been updated'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error updating equipment', error)
        errorToast(this.create, $trans('Error updating equipment'))
        this.isLoading = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        const equipmentData = await this.equipmentService.detail(this.pk)
        this.equipment = new EquipmentModel(equipmentData)

        if (this.hasBranches && !this.isEmployee) {
          if (this.equipment.branch) {
            this.branch = await this.branchService.detail(this.equipment.branch)
            this.locations = await this.locationService.listForSelectBranch(this.branch.id)
          }
        }
        if (!this.hasBranches && !this.isCustomer) {
          if (this.equipment.customer) {
            this.customer = await this.customerService.detail(this.equipment.customer)
            this.locations = await this.locationService.listForSelectCustomer(this.customer.id)
          }
        }

        this.isLoading = false
      } catch(error) {
        console.log('error fetching equipment', error)
        errorToast(this.create, $trans('Error loading equipment'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
