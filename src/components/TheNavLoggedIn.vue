<template>
  <div class="main-menu logged-in">
    <Notification v-if="isLoggedIn && !isCustomer" />
    <TokenRefresh />
    <b-modal
      id="password-change-modal"
      ref="password-change-modal"
      v-bind:title="$trans('Change password')"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <form ref="password-change-form" @submit.stop.prevent="doPasswordChange">
        <b-form-group
          v-bind:label="$trans('Old password')"
          label-for="old-password-input"
        >
          <b-form-input
            autofocus
            id="old-password-input"
            v-model="old_password"
            type="password"
            :state="isSubmitClicked ? !v$.old_password.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.old_password.$error : null">
            {{ $trans('Please enter your old password') }}
          </b-form-invalid-feedback>
        </b-form-group>
        <b-form-group
          v-bind:label="$trans('New password')"
          label-for="new-password1-input"
        >
          <b-form-input
            id="new-password1-input"
            type="password"
            v-model="new_password1"
            :state="isSubmitClicked ? !v$.new_password1.$error : null"
          ></b-form-input>
          <password v-model="new_password1" :strength-meter-only="true"/>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.new_password1.$error : null">
            {{ $trans('Please enter a new password') }}
          </b-form-invalid-feedback>
        </b-form-group>
        <b-form-group
          v-bind:label="$trans('Password again')"
          label-for="new-password2-input"
        >
          <b-form-input
            id="new-password2-input"
            type="password"
            v-model="new_password2"
            :state="isSubmitClicked ? !v$.new_password2.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? v$.new_password2.sameAs.$invalid : null">
            {{ $trans('Passwords do not match') }}
          </b-form-invalid-feedback>
        </b-form-group>
      </form>
      {{ v$.new_password2.sameAs }}
    </b-modal>

    <b-modal
      id="logout-modal"
      ref="logout-modal"
      v-bind:title="$trans('Log out?')"
      @ok="doLogout"
      auto-focus-button="ok"
    >
      <p class="my-4">{{ $trans('Are you sure you want to log out?') }}</p>
    </b-modal>

    <b-modal
    id="lang-modal"
    ref="lang-modal"
    v-bind:title="$trans('Change language')"
    ok-disabled
    >
      <template #modal-footer>
        <b-button
          variant="secondary"
          size="sm"
          class="float-right"
          @click="$bvModal.hide('lang-modal')"
        >
          {{ $trans('Close') }}
        </b-button>
      </template>
      <TheLanguageChooser />
  </b-modal>

    <nav class="app-sidebar">
      <NavBrand />
      <NavItems />
      <hr />
      <b-nav-item-dropdown dropup v-bind:text="username" right>
        <template slot="button-content">
          <b-icon icon="person-circle"></b-icon>
          <span>{{ username }}</span>
        </template>
        <li style="text-align: center;">
          {{ memberInfo.name }}
        </li>
        <li><span class='dropdown-item'><Version /></span></li>
        <b-dropdown-divider></b-dropdown-divider>
        <b-dropdown-item v-b-modal.lang-modal>{{ $trans('App Language') }}</b-dropdown-item>
        <b-dropdown-item v-b-modal.password-change-modal>{{ $trans('Change password') }}</b-dropdown-item>
        <b-dropdown-item @click="logout">{{ $trans('Logout') }}</b-dropdown-item>
      </b-nav-item-dropdown>
    </nav>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'
import Password from 'vue-password-strength-meter'

import accountModel from '../models/account/Account.js'

import userSocket from '../services/websocket/UserSocket.js'
import memberSocket from '../services/websocket/MemberSocket.js'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket.js'
import {NEW_DATA_EVENTS} from "../constants";

import TheLanguageChooser from "../components/TheLanguageChooser.vue"
import Version from "../components/Version.vue"
import NavItems from "../components/NavItems.vue"
import NavBrand from "../components/NavBrand.vue"
import Notification from '../components/Notification'
import TokenRefresh from '../components/TokenRefresh'

export default {
  setup() {
    return { v$: useVuelidate() }
  },

  components: {
    TheLanguageChooser,
    NavItems,
    NavBrand,
    Password,
    Version,
    Notification,
    TokenRefresh,
  },
  validations() {
    return {
      old_password: {
        required
      },
      new_password1: {
        required
      },
      new_password2: {
        required,
        sameAs: sameAs(this.new_password1)
      }
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  data() {
    return {
      memberInfo: this.$store.state.memberInfo,
      memberNewDataSocket: new MemberNewDataSocket(),
      old_password: null,
      new_password1: null,
      new_password2: null,
      buttonDisabled: false,
      submitClicked: false,
    }
  },
  methods: {
    handleOk(modalEvt) {
      modalEvt.preventDefault()
      this.doPasswordChange();
    },
    resetModal() {
      this.old_password = ''
      this.new_password1 = ''
      this.new_password2 = ''
    },
    async doPasswordChange() {
      this.submitClicked = true
      this.v$.$touch()

      if (this.v$.$invalid) {
        this.buttonDisabled = false
        this.isLoading = false
        console.log('invalid', this.v$)
        return
      }

      this.buttonDisabled = true

      this.isLoading = true

      try {
        await accountModel.changePassword(this.old_password, this.new_password1)
        infoToast(create, $trans('Password changed'), $trans('Your password is changed'))
        this.$refs['password-change-modal'].hide()
      } catch(error) {
        console.log(error)
        errorToast(create, $trans('Error changing your password'))
      }
    },
    logout() {
      this.$refs['logout-modal'].show()
    },
    async doLogout() {
      // do logout
      let loader = this.$loading.show()

      try {
        await this.$store.dispatch('auth/logout');
        await this.$store.dispatch('getInitialData')

        loader.hide()

        await userSocket.init()
        userSocket.removeOnmessageHandler()
        userSocket.removeSocket()

        await memberSocket.init()
        memberSocket.removeOnmessageHandler()
        memberSocket.removeSocket()

        await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
        this.memberNewDataSocket.removeOnmessageHandler()
        this.memberNewDataSocket.removeSocket()

        await this.memberNewDataSocket.init(NEW_DATA_EVENTS.CONTRACT)
        this.memberNewDataSocket.removeOnmessageHandler()
        this.memberNewDataSocket.removeSocket()

        if(this.$router.currentRoute.path !== '/') {
          await this.$router.push({path: '/'})
        }
      } catch (error) {
        console.log(error)
        loader.hide()
        errorToast(create, $trans('Error logging you out'))
      }
    },
    onContractChange(data) {
      if (data.type === NEW_DATA_EVENTS.CONTRACT) {
        this.$store.dispatch('getInitialData')
      }
    },
  },
  async created() {
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.CONTRACT)
    this.memberNewDataSocket.setOnmessageHandler(this.onContractChange)
    this.memberNewDataSocket.getSocket()
  },
  async beforeDestroy() {
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.UNACCEPTED_ORDER)
    this.memberNewDataSocket.removeOnmessageHandler()
    this.memberNewDataSocket.removeSocket()

    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.CONTRACT)
    this.memberNewDataSocket.removeOnmessageHandler()
    this.memberNewDataSocket.removeSocket()
  }
}
</script>
<style scoped>
.navbar {
  padding: 0 !important;
}
</style>
