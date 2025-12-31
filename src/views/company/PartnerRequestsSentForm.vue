<template>
  <div class="app-page">
    <header>
      <div class='page-title'>
        <h3><b-icon icon="person-square"></b-icon>{{ $trans('Partners') }}</h3>

      </div>
    </header>

    <b-form class="page-detail">
      <div class='flex-columns'>
        <div class='col-1-3'></div>
        <div class='panel col-1-3'>
          <h6>{{ $trans('New partner request') }}</h6>
          <br>
              <b-form-group
                label-size="sm"
                label-class="p-sm-0"
                label-for="partner_request_member_search"
                :label="$trans('Send partner request to')"
              >
                <multiselect
                  id="partner_request_member_search"
                  track-by="id"
                  :placeholder="`${$trans('Member')} ${$trans('(type to search)')}`"
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

              <b-form-group
                v-if="this.member_info"
                label-size="sm"
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
              <b-button-toolbar class="flex-columns" v-if="this.member_info">
                <div></div>
                <b-button @click="cancelForm" type="button" variant="secondary">
                  {{ $trans('Cancel') }}</b-button>
                <b-button @click="submitForm" type="button" variant="primary">
                  {{ $trans('Submit') }}</b-button>
            </b-button-toolbar>
        </div>

        <div class='col-1-3'></div>

      </div>
    </b-form>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs, email } from '@vuelidate/validators'
import Multiselect from 'vue-multiselect'

import partnerRequestsSentModel from '@/models/company/PartnerRequestsSent.js'
import memberModel from '@/models/member/Member.js'
import {useToast} from "bootstrap-vue-next";
import {errorToast, infoToast} from "@/utils";
const {create} = useToast()

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
    async getMembers(query) {
      this.isLoading = true

      try {
        this.members = await memberModel.getForPartnerSelect(query)
        this.isLoading = false
      } catch(error) {
        console.log('Error fetching members', error)
        errorToast(create, this.$trans('Error fetching members'))
        this.isLoading = false
      }
    },
    memberLabel({ name, city}) {
      return `${name} - ${city}`
    },
    selectMember(option) {
      this.partnerRequest.to_member = option.id
      this.member_info = `${option.name}, ${option.city}`
    },

    async submitForm() {
      this.submitClicked = true
      this.v$.$reset()
      this.v$.$touch()
      if (this.v$.$invalid) {
        console.log('invalid?', this.v$.$invalid)
        return
      }

      this.isLoading = true

      try {
        delete this.partnerRequest.status

        await partnerRequestsSentModel.insert(this.partnerRequest)
        infoToast(create, this.$trans('Created'), this.$trans('Partner request has been sent'))
        this.isLoading = false
        this.cancelForm()
      } catch(error) {
        console.log('Error sending partner request', error)
        errorToast(create, this.$trans('Error sending partner request'))
        this.isLoading = false
      }
    },
    cancelForm() {
      this.$router.go(-1)
    }
  }
}
</script>
