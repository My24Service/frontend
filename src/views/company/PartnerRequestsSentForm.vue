<template>
  <b-overlay :show="isLoading" rounded="sm">

    <div class="container app-form">
      <b-form>
        <h2>{{ $trans('New partner request') }}</h2>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              label-class="p-sm-0"
              v-bind:label="$trans('Search member')"
              label-for="partner_request_member_search"
            >
              <multiselect
                id="partner_request_member_search"
                track-by="id"
                :placeholder="$trans('Type to search')"
                open-direction="bottom"
                :options="members"
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
                @search-change="getMembers"
                @select="selectMember"
                :custom-label="memberLabel"
              >
                <span slot="noResult">{{ $trans('Oops! No elements found. Consider changing the search query.') }}</span>
              </multiselect>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col cols="12" role="group">
            <b-form-group
              label-size="sm"
              v-bind:label="$trans('Member')"
              label-for="partner_request_company_info"
            >
              <b-form-input
                id="partner_request_company_info"
                size="sm"
                readonly
                v-model="member_info"
                :state="isSubmitClicked ? !v$.partnerRequest.to_member.$error : null"
              ></b-form-input>
              <b-form-invalid-feedback
                :state="isSubmitClicked ? !v$.partnerRequest.to_member.$error : null">
                {{ $trans('Please select a member') }}
              </b-form-invalid-feedback>
            </b-form-group>
          </b-col>
        </b-row>

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
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import partnerRequestsSentModel from '@/models/company/PartnerRequestsSent.js'
import memberModel from '@/models/member/Member.js'

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  components: {
    Multiselect,
  },
  validations: {
    partnerRequest: {
      to_member: {
        required
      }
    }
  },
  data () {
    return {
      isLoading: false,
      submitClicked: false,
      partnerRequest: partnerRequestsSentModel.getFields(),
      errorMessage: null,
      members: [],
      member_info: '',
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  created() {
    this.getMembers('')
  },
  methods: {
    getMembers(query) {
      this.isLoading = true

      memberModel.getForPartnerSelect(query).then((response) => {
        this.members = response
        this.isLoading = false
      }).catch(() => {
        this.errorToast(this.$trans('Error fetching members'))
        this.isLoading = false
      })
    },
    memberLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectMember(option) {
      this.partnerRequest.to_member = option.id
      this.member_info = `${option.companycode}, ${option.name}, ${option.city}`
    },

    submitForm() {
      this.submitClicked = true
      this.v$.$reset()
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      return this.$store.dispatch('getCsrfToken').then((token) => {
        delete this.partnerRequest.status

        partnerRequestsSentModel.insert(token, this.partnerRequest).then((action) => {
          this.infoToast(this.$trans('Created'), this.$trans('Partner request has been sent'))
          this.isLoading = false
          this.cancelForm()
        }).catch(() => {
          this.errorToast(this.$trans('Error sending partner request'))
          this.isLoading = false
        })
      })
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
