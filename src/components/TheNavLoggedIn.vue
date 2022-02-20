<template>
  <div>
    <b-modal
      id="password-change-modal"
      ref="password-change-modal"
      v-bind:title="$trans('Password change')"
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
            :state="isSubmitClicked ? !v$.new_password1.$error : null"
          ></b-form-input>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? v$.new_password2.sameAs : null">
            {{ $trans('Passwords do not match') }}
          </b-form-invalid-feedback>
        </b-form-group>
      </form>
    </b-modal>

    <b-modal
      id="logout-modal"
      ref="logout-modal"
      v-bind:title="$trans('Log out?')"
      @ok="doLogout"
    >
      <p class="my-4">{{ $trans('Are you sure you want to log out?') }}</p>
    </b-modal>
    <b-navbar toggleable="sm" variant="primary">
      <b-container>

        <NavBrand />

        <NavItems />

        <b-collapse id="nav-collapse" is-nav>
          <b-navbar-nav class="ml-auto">
            <b-nav-item-dropdown v-bind:text="username" right>
              <b-dropdown-item v-b-modal.password-change-modal>{{ $trans('Change password') }}</b-dropdown-item>
              <b-dropdown-item @click="logout">{{ $trans('Logout') }}</b-dropdown-item>
            </b-nav-item-dropdown>
            <TheLanguageChooser />
          </b-navbar-nav>
        </b-collapse>

        <Version />

      </b-container>
    </b-navbar>
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'
import Password from 'vue-password-strength-meter'

import accountModel from '@/models/account/Account.js'
import { componentMixin } from '@/utils.js'
import socket from "@/socket.js"

import TheLanguageChooser from "@/components/TheLanguageChooser.vue"
import Version from "@/components/Version.vue"
import NavItems from "@/components/NavItems.vue"
import NavBrand from "@/components/NavBrand.vue"

export default {
  setup() {
    return { v$: useVuelidate() }
  },
  mixins: [componentMixin],
  components: {
    TheLanguageChooser,
    NavItems,
    NavBrand,
    Password,
    Version,
  },
  validations: {
    old_password: {
      required
    },
    new_password1: {
      required
    },
    new_password2: {
      required,
      sameAs: sameAs('new_password1')
    }
  },
  computed: {
    isSubmitClicked() {
      return this.submitClicked
    }
  },
  data() {
    return {
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
    doPasswordChange() {
      this.submitClicked = true
      this.v$.$touch()

      if (this.v$.$invalid) {
        this.buttonDisabled = false
        this.isLoading = false
        return
      }

      this.buttonDisabled = true

      this.isLoading = true

      this.$store.dispatch('getCsrfToken').then((token) => {
        accountModel.changePassword(token, this.old_password, this.new_password1, this.new_password2).then(() => {
          this.infoToast(this.$trans('Password changed'), this.$trans('Your password is changed'))
          this.$refs['password-change-modal'].hide()
        })
        .catch((error) => {
          console.log(error)
          this.errorToast(this.$trans('Error changing your password'))
        })
      })
    },

    logout() {
      this.$refs['logout-modal'].show()
    },
    async doLogout() {
      // do logout
      const userPk = this.$store.getters.getUserPk
      const memberPk = this.$store.getters.getMemberPk

      let loader = this.$loading.show()

      try {
        await accountModel.logout()
        this.$auth.logout(false)
        await this.$store.dispatch('getInitialData')

        loader.hide()

        socket.removeOnmessageHandlerUser(userPk)
        socket.removeSocketUser(userPk)

        socket.removeOnmessageHandlerMember(memberPk)
        socket.removeSocketMember(memberPk)

        this.infoToast(this.$trans('Logged out'), this.$trans('You are now logged out'))

        if(this.$router.currentRoute.path !== '/') {
          this.$router.push({path: '/'})
        }
      } catch (error) {
        console.log(error)
        loader.hide()
        this.errorToast(this.$trans('Error logging you out'))
      }
    },
  },
}
</script>
<style scoped>
.navbar {
  padding: 0 !important;
}
</style>
