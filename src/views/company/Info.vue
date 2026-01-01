<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3>
          <b-icon icon="bookmark-star"></b-icon>
          <span v-if="member.name">{{ member.name }}</span>
          <span v-else class="dimmed">{{ $trans('Company name')}}</span>
        </h3>
        <b-button-toolbar>
          <b-button @click="() => isEditing = !isEditing" class="btn btn-primary" type="button" variant="primary" v-show="!isEditing">
            <b-icon icon="pencil"></b-icon>
            {{ $trans("Edit") }}
          </b-button>
          <b-button type="button" @click="cancelForm" v-if="isEditing" variant="outline">{{ $trans("Cancel") }}</b-button>
          <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="submit" variant="primary" v-if="isEditing">
            <b-icon icon="save"></b-icon>
            {{ $trans('Save') }}
          </b-button>
        </b-button-toolbar>
      </div>
    </header>
    <div class="page-detail">
      <b-form class="flex-columns">
        <div class="panel col-1-3">
          <h6>{{$trans('Company details')}}</h6>

          <fieldset :disabled="!isEditing">
            <span class="company-image profile-picture" :class="isEditing ? 'isEditing' :''">
              <img class="" width="200px" :src="upload_preview ? upload_preview : current_image" alt=""/>
              <b-icon
                @click="() => this.$refs['memberCompanyLogo'].$el.querySelector('input').showPicker()"
                icon="camera"
                class="button-icon" style="width: 72px; height: 72px" v-show="isEditing"></b-icon>
            </span>
            <br>

            <b-form-group
                class="hidden"
                v-if="isEditing"
                label-size="sm"
                label-cols="3"
                v-bind:label="$trans('Replace logo')"
                label-for="member_companylogo"
              >
                <b-form-file
                  id="member_companylogo"
                  ref="memberCompanyLogo"
                  accept="image/*"
                  :placeholder="$trans('Choose a file or drop it here...')"
                  @input="imageSelected"
                ></b-form-file>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
              label-cols="3"
              label-for="member_name"
            >
              <b-form-input
                v-model="member.name"
                id="member_name"
                size="sm"
                :state="isSubmitClicked ? !v$.member.name.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.name.$error : null">
                {{ $trans('Please enter a name') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Company code')"
              label-cols="3"
              label-for="member_companycode"
            >
              <b-form-input
                id="member_companycode"
                readonly
                size="sm"
                v-model="member.companycode"
              ></b-form-input>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('Chamber of commerce')"
              label-for="member_chamber_of_commerce"
            >
              <b-form-input
                id="member_chamber_of_commerce"
                size="sm"
                v-model="member.chamber_of_commerce"
              ></b-form-input>
            </b-form-group>

            <b-form-group
              label-size="sm"
              label-cols="3"
              v-bind:label="$trans('VAT number')"
              label-for="member_vat_number"
            >
              <b-form-input
                id="member_vat_number"
                size="sm"
                v-model="member.vat_number"
              ></b-form-input>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
              label-cols="3"
              label-for="member_address"
            >
              <b-form-input
                id="member_address"
                size="sm"
                v-model="member.address"
                :state="isSubmitClicked ? !v$.member.address.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.address.$error : null">
                {{ $trans('Please enter an address') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
              label-cols="3"
              label-for="member_postal"
            >
              <b-form-input
                id="member_postal"
                size="sm"
                v-model="member.postal"
                :state="isSubmitClicked ? !v$.member.postal.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.postal.$error : null">
                {{ $trans('Please enter an postal code') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
              label-cols="3"
              label-for="member_city"
              >
              <b-form-input
                id="member_city"
                size="sm"
                v-model="member.city"
                :state="isSubmitClicked ? !v$.member.city.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.city.$error : null">
                {{ $trans('Please enter a city') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-cols="3"
              label-for="member_country"
            >
              <b-form-select v-model="member.country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Phone')"
              label-cols="3"
              label-for="member_tel"
            >
              <b-form-input
                v-model="member.tel"
                id="member_tel"
                size="sm"
                :state="isSubmitClicked ? !v$.member.tel.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.tel.$error : null">
                {{ $trans('Please enter a number') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Website')"
              label-cols="3"
              label-for="member_www"
            >
              <b-form-input
                id="member_www"
                size="sm"
                v-model="member.www"
                :state="isSubmitClicked ? !v$.member.www.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.www.$error : null">
                {{ $trans('Please enter a website') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
                label-size="sm"
                v-bind:label="$trans('E-mail')"
                label-cols="3"
                label-for="member_email"
              >
                <b-form-input
                  id="member_email"
                  size="sm"
                  v-model="member.email"
                  :state="isSubmitClicked ? !v$.member.email.$error : null"
                ></b-form-input>
                <b-form-invalid-feedback
                  :state="isSubmitClicked ? !v$.member.email.$error : null">
                  {{ $trans('Please enter a valid email') }}
                </b-form-invalid-feedback>
            </b-form-group>

          </fieldset>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Contact') }} &amp; {{ $trans('Info') }} </h6>
          <fieldset :disabled="!isEditing">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="member_contacts"
            >
              <b-form-textarea
                id="member_contacts"
                v-model="member.contacts"
                rows="5"
                :state="isSubmitClicked ? !v$.member.contacts.$error : null"
              ></b-form-textarea>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.contacts.$error : null">
                {{ $trans('Please enter some contacts') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Info')"
              label-for="member_info"
            >
              <b-form-textarea
                id="member_info"
                v-model="member.info"
                rows="5"
                :state="isSubmitClicked ? !v$.member.info.$error : null"
              ></b-form-textarea>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.info.$error : null">
                {{ $trans('Please enter some info') }}
              </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Activities')"
              label-for="member_activities"
            >
              <b-form-textarea
                id="member_activities"
                v-model="member.activities"
                rows="10"
                :state="isSubmitClicked ? !v$.member.activities.$error : null"
              ></b-form-textarea>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.member.activities.$error : null">
                {{ $trans('Please enter some activities') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </fieldset>
        </div>

        <div class="panel col-1-3">
          <h6>{{ $trans('Workorder image') }}</h6>
          <fieldset :disabled="!isEditing">
            <span class="company-image workorder-image" :class="isEditing ? 'isEditing' :''">
              <img class="" width="200px" :src="upload_preview_workorder ? upload_preview_workorder : current_image_workorder" alt=""/>
              <b-icon
                @click="() => this.$refs['memberCompanyLogoWorkorder'].$el.querySelector('input').showPicker()"
                icon="camera"
                class="button-icon" style="width: 72px; height: 72px" v-show="isEditing"></b-icon>

                <b-form-group
                  label-size="sm"
                  v-show="isEditing"
                  label-for="member_companylogo_workorder"
                >
                  <b-form-file
                    ref="memberCompanyLogoWorkorder"
                    id="member_companylogo_workorder"
                    accept="image/*"
                    :placeholder="$trans('Choose a file or drop it here...')"
                    @input="imageWorkorderSelected"
                  ></b-form-file>
                </b-form-group>
            </span>
            <small>{{$trans('Optional logo for on the workorder')}}</small>
          </fieldset>
        </div>
      </b-form>
    </div>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import {email, required, url} from '@vuelidate/validators'

import memberModel from '../../models/member/Member.js'
import {NO_IMAGE_URL} from "@/constants"
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast, $trans} from "@/utils";
const {create} = useToast()

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
  },
  data() {
    return {
      isLoading: false,
      isEditing: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      member: memberModel.getFields(),
      errorMessage: null,
      current_image: '',
      upload_preview: '',
      current_image_workorder: '',
      upload_preview_workorder: '',
      fileChanged: false,
      fileWorkorderChanged: false,
    }
  },
  validations: {
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
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    this.$store.dispatch('getCountries').then((countries) => {
      this.countries = countries
      this.loadData()
    })
  },
  methods: {
    imageSelected(file) {
      const reader = new FileReader()
      reader.onload = (f) => {
        const b64 = f.target.result
        this.upload_preview = b64
        this.member.companylogo = b64
      }

      reader.readAsDataURL(file)
      this.fileChanged = true
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
    async submitForm() {
      this.submitClicked = true
      this.isEditing = false
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.buttonDisabled = true
      this.isLoading = true

      try {
        if (!this.fileChanged) {
          delete this.member.companylogo
        }

        if (!this.fileWorkorderChanged) {
          delete this.member.companylogo_workorder
        }

        await memberModel.updateMe(this.member)
        infoToast(create, $trans('Updated'), $trans('Info updated'))

        this.buttonDisabled = false
        this.isLoading = false
      } catch(error) {
        console.log('error updating member/me', error)
        errorToast(create, $trans('Error updating info'))
        this.isLoading = false
        this.buttonDisabled = false
      }
    },

    cancelForm() {
      this.loadData()
      this.isEditing = false
    },
    async loadData() {
      this.isLoading = true

      try {
        this.member = await memberModel.getMe()
        this.current_image = this.member.companylogo ? this.member.companylogo : NO_IMAGE_URL
        this.current_image_workorder = this.member.companylogo_workorder ? this.member.companylogo_workorder : NO_IMAGE_URL
        this.isLoading = false
      } catch(error) {
        console.log('error fetching member/me', error)
        errorToast(create, $trans('Error fetching member info'))
        this.isLoading = false
      }
    },
  }
}
</script>
