<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="app-page">
      <header>
        <div class="page-title">
          <h3>
            <IBiBuilding></IBiBuilding>
            <span v-if="isCreate">{{ $trans('New member') }}</span>
            <span v-else>{{ $trans('Edit member') }}</span>
          </h3>
          <div class="flex-columns">
            <BButton @click="cancelForm" type="button" variant="secondary outline">
              {{ $trans('Cancel') }}</BButton>
            <BButton @click="submitForm" type="button" variant="primary">
              {{ $trans('Save') }}</BButton>
          </div>
        </div>
      </header>

      <div class="page-detail">
        <ApiResult
          class="app-detail"
          v-if="member.hasOwnProperty('apiOk')"
          :error="member.error"
          :success-message='$trans("Member created")'
        />
        <div class="container app-detail">
          <b-form v-if="member">
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Name')"
                  label-for="member_name"
                >
                  <BFormInput
                    v-model="member.name"
                    id="member_name"
                    size="sm"
                    :state="isSubmitClicked ? !v$.member.name.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.name.$error : null">
                    {{ $trans('Please enter a name') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Company code')"
                  label-for="member_companycode"
                  description="[companycode].my24service.com"
                >
                  <BFormInput
                    id="member_companycode"
                    size="sm"
                    @change="companyCodeChange"
                    v-model="member.companycode"
                    :state="member.companycode ? !v$.member.companycode.$invalid : undefined"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    v-if="member.companycode && member.companycode !== '' && !v$.member.companycode.minLength.$invalid"
                    :state="!v$.member.companycode.isUnique.$invalid">
                    {{ $trans('Company code is already in use') }}
                  </b-form-invalid-feedback>
                  <b-form-invalid-feedback
                    v-if="member.companycode === ''"
                    :state="v$.member.companycode.required">
                    {{ $trans('Company code is required') }}
                  </b-form-invalid-feedback>
                  <b-form-invalid-feedback
                    v-if="v$.member.companycode.minLength.$invalid"
                    :state="v$.member.companycode.minLength.$invalid">
                    {{ $trans('Company code must have at least 2 characters') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Contract')"
                  label-for="member_contract"
                >
                  <BFormSelect v-model="member.contract" :options="contracts" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Type')"
                  label-for="member_member_type"
                >
                  <BFormSelect v-model="member.member_type" :options="memberTypes" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group" v-if="showRequestedList">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Requested')"
                  label-for="member_is_requested"
                >
                  <BFormSelect v-model="member.is_requested" :options="isRequestedOptions" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group" v-if="showDeletedList">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Deleted')"
                  label-for="member_is_deleted"
                >
                  <BFormSelect v-model="member.is_deleted" :options="isDeletedOptions" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="1" role="group" v-if="isRequest || (!showRequestedList && !showDeletedList)">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Branches?')"
                  label-for="member_has_branches"
                >
                  <BFormCheckbox
                    id="member_has_branches"
                    v-model="member.has_branches"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="3" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Address')"
                  label-for="member_address"
                >
                  <BFormInput
                    id="member_address"
                    size="sm"
                    v-model="member.address"
                    :state="isSubmitClicked ? !v$.member.address.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.address.$error : null">
                    {{ $trans('Please enter an address') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Postal')"
                  label-for="member_postal"
                >
                  <BFormInput
                    id="member_postal"
                    size="sm"
                    v-model="member.postal"
                    :state="isSubmitClicked ? !v$.member.postal.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.postal.$error : null">
                    {{ $trans('Please enter a postal') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('City')"
                  label-for="member_city"
                >
                  <BFormInput
                    id="member_city"
                    size="sm"
                    v-model="member.city"
                    :state="isSubmitClicked ? !v$.member.city.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.city.$error : null">
                    {{ $trans('Please enter a city') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Country')"
                  label-for="member_country"
                >
                  <BFormSelect v-model="member.country_code" :options="countries" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Chamber of commerce')"
                  label-for="member_chamber_of_commerce"
                >
                  <BFormInput
                    id="member_chamber_of_commerce"
                    size="sm"
                    v-model="member.chamber_of_commerce"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('VAT number')"
                  label-for="member_vat_number"
                >
                  <BFormInput
                    id="member_vat_number"
                    size="sm"
                    v-model="member.vat_number"
                  ></BFormInput>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Tel.')"
                  label-for="member_tel"
                >
                  <BFormInput
                    id="member_tel"
                    size="sm"
                    v-model="member.tel"
                    :state="isSubmitClicked ? !v$.member.tel.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.tel.$error : null">
                    {{ $trans('Please enter a number') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Email')"
                  label-for="member_email"
                >
                  <BFormInput
                    id="member_email"
                    size="sm"
                    v-model="member.email"
                    :state="isSubmitClicked ? !v$.member.email.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.email.$error : null">
                    {{ $trans('Please enter a valid email') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Website (http://...)')"
                  label-for="member_www"
                >
                  <BFormInput
                    id="member_www"
                    size="sm"
                    v-model="member.www"
                    :state="isSubmitClicked ? !v$.member.www.$error : null"
                  ></BFormInput>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.www.$error : null">
                    {{ $trans('Please enter a website') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row v-if="!isRequest">
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Public?')"
                  label-for="member_is_public"
                >
                  <BFormCheckbox
                    id="member_is_public"
                    v-model="member.is_public"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="1" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('API users?')"
                  label-for="member_has_api_users"
                >
                  <BFormCheckbox
                    id="member_has_api_users"
                    v-model="member.has_api_users"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Mobile activity users select?')"
                  label-for="member_has_mobile_activity_user_select"
                >
                  <BFormCheckbox
                    id="member_has_mobile_activity_user_select"
                    v-model="member.has_mobile_activity_user_select"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="1" role="group" v-if="showRequestedList || showDeletedList">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Branches?')"
                  label-for="member_has_branches"
                >
                  <BFormCheckbox
                    id="member_has_branches"
                    v-model="member.has_branches"
                  >
                  </BFormCheckbox>
                </BFormGroup>
              </b-col>
              <b-col cols="2" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Equipment QR code type')"
                  label-for="member_country"
                >
                  <BFormSelect v-model="member.equipment_qr_type" :options="equipmentQrTypes" size="sm"></BFormSelect>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Contacts')"
                  label-for="member_contacts"
                >
                  <BFormTextarea
                    id="member_contacts"
                    v-model="member.contacts"
                    rows="5"
                    :state="isSubmitClicked ? !v$.member.contacts.$error : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.contacts.$error : null">
                    {{ $trans('Please enter some contacts') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Activities')"
                  label-for="member_activities"
                >
                  <BFormTextarea
                    id="member_activities"
                    v-model="member.activities"
                    rows="5"
                    :state="isSubmitClicked ? !v$.member.activities.$error : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.activities.$error : null">
                    {{ $trans('Please enter some activities') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4" role="group">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Info')"
                  label-for="member_info"
                >
                  <BFormTextarea
                    id="member_info"
                    v-model="member.info"
                    rows="5"
                    :state="isSubmitClicked ? !v$.member.info.$error : null"
                  ></BFormTextarea>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked ? !v$.member.info.$error : null">
                    {{ $trans('Please enter some info') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Company logo')"
                  label-for="member_companylogo"
                  :description="`${$trans('Accepted file formats')}: ${allowed_extensions.join(', ')}`"
                >
                  <b-form-file
                    id="member_companylogo"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here...')"
                    @input="imageSelected"
                  ></b-form-file>
                  <b-form-invalid-feedback
                    :state="isSubmitClicked && v$.member.companylogo ? !v$.member.companylogo.$error : null">
                    {{ $trans('Please upload a company logo') }}
                  </b-form-invalid-feedback>
                </BFormGroup>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Current image') }}</h3>
                <img width="200px" :src="current_image" alt=""/>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Upload preview') }}</h3>
                <img width="200px" :src="upload_preview" alt=""/>
              </b-col>
            </b-row>
            <b-row>
              <b-col cols="4">
                <BFormGroup
                  label-size="sm"
                  v-bind:label="$trans('Optional logo for on the workorder')"
                  label-for="member_companylogo_workorder"
                >
                  <b-form-file
                    id="member_companylogo_workorder"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here...')"
                    @input="imageWorkorderSelected"
                  ></b-form-file>
                </BFormGroup>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Current image') }}</h3>
                <img width="200px" :src="current_image_workorder" alt=""/>
              </b-col>
              <b-col cols="4">
                <h3>{{ $trans('Upload preview') }}</h3>
                <img width="200px" :src="upload_preview_workorder" alt=""/>
              </b-col>
            </b-row>

            <div class="mx-auto">
              <footer class="modal-footer">
                <BButton @click="cancelForm" class="btn btn-secondary" type="button" variant="secondary">
                  {{ $trans('Cancel') }}
                </BButton>
                <BButton @click="preSubmitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
                  {{ $trans('Submit') }}
                </BButton>
              </footer>
            </div>
          </b-form>
        </div>
      </div>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import {url, email, required, minLength} from '@vuelidate/validators'
import { helpers } from '@vuelidate/validators'

import {
  MemberService,
  EQUIPMENT_QR_TYPES,
  MemberModel,
  EQUIPMENT_QR_TYPE_MY24SERVICE,
  EQUIPMENT_QR_TYPE_SHLTR
} from '@/models/member/Member'
import { ContractService } from '@/models/member/Contract'
import {NO_IMAGE_URL} from "@/constants";

import ApiResult from "@/components/ApiResult.vue";

export default {
  components: {ApiResult},

  setup() {
    return { v$: useVuelidate() }
  },
  props: {
    pk: {
      type: [String, Number],
      default: null
    },
    isRequest: {
      type: [Boolean],
      default: false
    },
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      memberTypes: [
        {value: 'temps', text: 'temps'},
        {value: 'maintenance', text: 'maintenance'},
      ],
      equipmentQrTypes: EQUIPMENT_QR_TYPES,
      contracts: [],
      member: new MemberModel({}),
      orgCompanycode: null,
      isDeletedOptions: [
        {value: true, text: $trans('Is deleted')},
        {value: false, text: $trans('Not deleted')},
      ],
      isRequestedOptions: [
        {value: true, text: $trans('Is requested')},
        {value: false, text: $trans('Is accepted')},
      ],
      suppliers: [],
      current_image: NO_IMAGE_URL,
      upload_preview: NO_IMAGE_URL,
      current_image_workorder: NO_IMAGE_URL,
      upload_preview_workorder: NO_IMAGE_URL,
      fileChanged: false,
      fileWorkorderChanged: false,
      memberService: new MemberService(),
      contractService: new ContractService(),
      memberIsRequest: false,
      isDeleted: false,
      allowed_extensions: ['png', 'jpg', 'jpeg'],
    }
  },
  validations() {
    let validations = {
      member: {
        name: {
          required,
        },
        address: {
          required,
        },
        postal: {
          required,
        },
        city: {
          required,
        },
        tel: {
          required,
        },
        email: {
          required,
          email
        },
        www: {
          required,
          url
        },
        contacts: {
          required,
        },
        activities: {
          required,
        },
        info: {
          required,
        },
      },
    }

    if (this.isCreate) {
      const isUnique = (value) => {
        if (value === '' || value.length < 2) return undefined

        return this.checkCompanyCode(value)
      }

      validations['member']['companycode'] = {
        required,
        minLength: minLength(2),
        isUnique: helpers.withAsync(isUnique)
      }

      validations['member']['companylogo'] = {
        required,
      }
    } else {
      const isUnique = (value) => {
        if (this.orgCompanycode === this.member.companycode) {
          return true
        }

        if (value === '' || value.length < 2) {
          return undefined
        }

        return this.checkCompanyCode(value)
      }

      validations['member']['companycode'] = {
        required,
        minLength: minLength(2),
        isUnique: helpers.withAsync(isUnique)
      }
    }

    return validations
  },
  computed: {
    isCreate() {
      return !this.pk
    },
    isSubmitClicked() {
      return this.submitClicked
    },
    showRequestedList() {
      return this.$store.getters.getIsSuperuser && this.memberIsRequest
    },
    showDeletedList() {
      return this.$store.getters.getIsSuperuser && this.isDeleted
    }
  },
  async created() {
    this.isLoading = true
    this.countries = await this.$store.dispatch('getCountries')

    try {
      const data = await this.contractService.list()
      for(let i=0;i<data.results.length; i++) {
        this.contracts.push({
          value: data.results[i].id,
          text: data.results[i].name,
        })
      }
    } catch(error) {
      console.log('error fetching contracts', error)
      return
    }

    if (!this.isCreate) {
      await this.loadData()
      this.memberIsRequest = this.member.is_requested
      this.isDeleted = this.member.is_deleted
    } else {
      this.member = new MemberModel({
        www: 'https://'
      })
      this.member.country_code = 'NL'
      this.member.member_type = 'maintenance'
      this.member.contract = this.contracts[0].value
    }
    this.isLoading = false
  },
  methods: {
    getExtension(filename) {
      const parts = filename.split('.')
      return parts[parts.length-1].toLowerCase()
    },
    async checkCompanyCode(value) {
      return await this.memberService.companycodeExists(value)
    },
    async companyCodeChange() {
      if (this.member.companycode && this.member.companycode.length > 2) {
        this.v$.member.companycode.$touch()
      }
    },
    imageSelected(file) {
      const extension = this.getExtension(file.name)
      if (this.allowed_extensions.indexOf(extension) === -1) {
        return
      }
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.upload_preview = b64
        this.member.companylogo = b64
      }

      reader.readAsDataURL(file)
      this.fileChanged = true
      this.v$.member.companylogo.$touch()
    },
    imageWorkorderSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.upload_preview_workorder = b64
        this.member.companylogo_workorder = b64
      }

      reader.readAsDataURL(file)
      this.fileWorkorderChanged = true
    },
    selectSupplier(option) {
      this.member.supplier_relation = option.id
      this.member.supplier_name = option.name
    },

    preSubmitForm() {
      this.buttonDisabled = true
      this.submitClicked = true
      this.v$.$touch()

      setTimeout(() => {
        this.submitForm()
      }, 1000)
    },
    async submitForm() {
      this.v$.$touch()

      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid, this.v$)
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      this.buttonDisabled = true

      if (!this.fileChanged) {
        delete this.member.companylogo
      }

      if (!this.fileWorkorderChanged) {
        delete this.member.companylogo_workorder
      }

      if (this.isCreate) {
        if (this.isRequest) {
          this.member.equipment_qr_type = this.member.has_branches ? EQUIPMENT_QR_TYPE_SHLTR : EQUIPMENT_QR_TYPE_MY24SERVICE
          this.member.has_api_users = false
          this.member.is_requested = true
          this.member.is_public = true
          this.member.is_deleted = false
        }
        this.isLoading = true
        try {
          await this.memberService.insert(this.member)
          this.member.apiOk = true
          if (this.isRequest) {
            infoToast(create, $trans('Requested'), $trans('Request has been created'))
          } else {
            infoToast(create, $trans('Created'), $trans('Member has been created'))
          }
          this.buttonDisabled = false
          this.isLoading = false
          this.$router.go(-1)
        } catch(error) {
          console.log('Error creating member', error)
          errorToast(create, $trans('Error creating member'))
          this.member.apiOk = false
          this.member.error = error
          this.buttonDisabled = false
          this.isLoading = false
        }

        return
      }

      try {
        if (!this.fileChanged) {
          delete this.member.companylogo
        }

        this.isLoading = true

        await this.memberService.update(this.pk, this.member)
        this.member.apiOk = true
        infoToast(create, $trans('Updated'), $trans('Member has been updated'))
        this.buttonDisabled = false
        this.isLoading = false
        this.$router.go(-1)
      } catch(error) {
        console.log('Error updating member', error)
        errorToast(create, $trans('Error updating member'))
        this.member.apiOk = false
        this.member.error = error
        this.isLoading = false
        this.buttonDisabled = false
      }
    },
    async loadData() {
      this.isLoading = true

      try {
        this.member = await this.memberService.detail(this.pk)
        this.current_image = this.member.companylogo ? this.member.companylogo : NO_IMAGE_URL
        this.current_image_workorder = this.member.companylogo_workorder ? this.member.companylogo_workorder : NO_IMAGE_URL
        this.orgCompanycode = this.member.companycode
        this.isLoading = false
      } catch(error) {
        console.log('error fetching member', error)
        errorToast(create, $trans('Error fetching member'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
