<template>
  <b-overlay :show="isLoading" rounded="sm">
    <div class="subnav-pills">
      <PillsCompanyCompany />
    </div>
    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('Company info') }}</h2>
        <b-row>
          <b-col cols="8" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Name')"
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
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Company code')"
              label-for="member_companycode"
            >
              <b-form-input
                id="member_companycode"
                readonly
                size="sm"
                v-model="member.companycode"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Address')"
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
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Postal')"
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
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('City')"
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
          </b-col>
          <b-col cols="2" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Country')"
              label-for="member_country"
            >
              <b-form-select v-model="member.country_code" :options="countries" size="sm"></b-form-select>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Tel.')"
              label-for="member_tel"
            >
              <b-form-input
                v-model="member.tel"
                id="member_tel"
                size="sm"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('WWW')"
              label-for="member_www"
            >
              <b-form-input
                id="member_www"
                size="sm"
                v-model="member.www"
              ></b-form-input>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('E-mail')"
              label-for="member_email"
            >
              <b-form-input
                id="member_email"
                size="sm"
                v-model="member.email"
              ></b-form-input>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Contacts')"
              label-for="member_contacts"
            >
              <b-form-textarea
                id="member_contacts"
                v-model="member.contacts"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Activities')"
              label-for="member_activities"
            >
              <b-form-textarea
                id="member_activities"
                v-model="member.activities"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
          <b-col cols="4" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Info')"
              label-for="member_info"
            >
              <b-form-textarea
                id="member_info"
                v-model="member.info"
                rows="5"
              ></b-form-textarea>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="4">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Company logo')"
              label-for="member_companylogo"
            >
              <b-form-file
                id="member_companylogo"
                accept="image/*"
                :placeholder="$trans('Choose a file or drop it here...')"
                @input="imageSelected"
              ></b-form-file>
            </b-form-group>
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

        <div class="mx-auto">
          <footer class="modal-footer">
            <b-button @click="submitForm" :disabled="buttonDisabled" class="btn btn-primary" type="button" variant="primary">
              {{ $trans('Submit') }}
            </b-button>
          </footer>
        </div>
      </b-form>
    </div>
  </b-overlay>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required } from '@vuelidate/validators'

import memberModel from '@/models/member/Member.js'

import PillsCompanyCompany from "@/components/PillsCompanyCompany.vue"

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    PillsCompanyCompany,
  },
  data() {
    return {
      isLoading: false,
      buttonDisabled: false,
      submitClicked: false,
      countries: [],
      member: memberModel.getFields(),
      errorMessage: null,
      current_image: '/static/core/img/noimg.png',
      upload_preview: '/static/core/img/noimg.png',
      fileChanged: false
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
    submitForm() {
      this.submitClicked = true
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      // remove null fields
      const null_fields = ['companylogo']
      for (let i=0; i<null_fields.length; i++) {
        if (this.member[null_fields[i]] === null) {
          delete this.member[null_fields[i]]
        }
      }

      this.buttonDisabled = true
      this.isLoading = true

      this.$store.dispatch('getCsrfToken').then((token) => {
        if (!this.fileChanged) {
          delete this.member.companylogo
        }

        memberModel.updateMe(token, this.member).then(() => {
          this.flashMessage.show({
            status: 'info',
            title: this.$trans('Updated'),
            message: this.$trans('Info updated')
          })

          this.buttonDisabled = false
          this.isLoading = false
        }).catch(() => {
          this.flashMessage.show({
            status: 'error',
            title: this.$trans('Error'),
            message: this.$trans('Error updating info')
          })

          this.isLoading = false
          this.buttonDisabled = false
        })
      })
    },
    async loadData() {
      this.isLoading = true

      memberModel.getMe().then((member) => {
        this.member = member
        this.current_image = this.member.companylogo ? this.member.companylogo : '/static/core/img/noimg.png'
        this.isLoading = false
      }).catch((error) => {
        console.log('error fetching member/me', error)
        this.flashMessage.show({
          status: 'error',
          title: this.$trans('Error'),
          message: this.$trans('Error fetching member info')
        })

        this.isLoading = false
      })
    },
  }
}
</script>
