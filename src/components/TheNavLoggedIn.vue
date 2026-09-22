<template>
  <div class="main-menu logged-in">
    <NotificationListener v-if="isLoggedIn && !isCustomer" />
    <TokenRefresh />
    <b-modal
      id="password-change-modal"
      ref="password-change-modal"
      :title="$trans('Change password')"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <form ref="password-change-form" @submit.stop.prevent="doPasswordChange">
        <BFormGroup
          :label="$trans('Old password')"
          label-for="old-password-input"
        >
          <BFormInput
            :autofocus="true"
            id="old-password-input"
            v-model="old_password"
            type="password"
            autocomplete="false"
            :state="isSubmitClicked ? !v$.old_password.$error : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.old_password.$error : null">
            {{ $trans('Please enter your old password') }}
          </b-form-invalid-feedback>
        </BFormGroup>
        <BFormGroup
          :label="$trans('New password')"
          label-for="new-password1-input"
        >
          <BFormInput
            id="new-password1-input"
            type="password"
            autocomplete="false"
            v-model="new_password1"
            :state="isSubmitClicked ? !v$.new_password1.$error : null"
          ></BFormInput>
          <password-meter :password="new_password1" />
          <b-form-invalid-feedback
            :state="isSubmitClicked ? !v$.new_password1.$error : null">
            {{ $trans('Please enter a new password') }}
          </b-form-invalid-feedback>
        </BFormGroup>
        <BFormGroup
          :label="$trans('Password again')"
          label-for="new-password2-input"
        >
          <BFormInput
            id="new-password2-input"
            type="password"
            autocomplete="false"
            v-model="new_password2"
            :state="isSubmitClicked ? !v$.new_password2.$error : null"
          ></BFormInput>
          <b-form-invalid-feedback
            :state="isSubmitClicked ? v$.new_password2.sameAs.$invalid : null">
            {{ $trans('Passwords do not match') }}
          </b-form-invalid-feedback>
        </BFormGroup>
      </form>
    </b-modal>

    <b-modal
      id="logout-modal"
      ref="logout-modal"
      :title="$trans('Log out?')"
      @ok="doLogout"
      auto-focus-button="ok"
    >
      <p class="my-4">{{ $trans('Are you sure you want to log out?') }}</p>
    </b-modal>

    <b-modal
      id="lang-modal"
      ref="lang-modal"
      :title="$trans('Change language')"
      :ok-disabled="true"
    >
      <template #footer="{cancel}">
        <BButton
          variant="secondary"
          size="sm"
          class="float-right"
          @click="() => cancel()"
        >
          {{ $trans('Close') }}
        </BButton>
      </template>
      <TheLanguageChooser />
  </b-modal>

    <TheSidebar :only-settings="onlySettings" />
  </div>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import { required, sameAs } from '@vuelidate/validators'

import { changePasswordCreate } from '@/api/sdk.gen'

import userSocket from '../services/websocket/UserSocket'
import memberSocket from '../services/websocket/MemberSocket'
import MemberNewDataSocket from '../services/websocket/MemberNewDataSocket'
import {NEW_DATA_EVENTS} from "@/constants";

import TheLanguageChooser from "../components/TheLanguageChooser.vue"
import TheSidebar from "./the_nav/TheSidebar.vue"
import NotificationListener from '../components/NotificationListener.vue'
import { TokenRefresh, useAuthStore } from '@/features/auth'
import componentMixin from "@/mixins/common";
import {errorToast, infoToast} from "@/services/i18n";

import {useMainStore} from "@/stores/main";

import PasswordMeter from "vue-simple-password-meter";

export default {
  setup() {
    const mainStore = useMainStore()
    const authStore = useAuthStore()
    const memberInfo = computed(() => mainStore.memberInfo);
    const userInfo = computed(() => authStore.userInfo);
    const {create} = useToast()

    return {
      v$: useVuelidate(),
      mainStore,
      authStore,
      memberInfo,
      userInfo,
      create,
    }
  },
  props: {
    onlySettings: Boolean
  },
  mixins: [componentMixin],
  components: {
    PasswordMeter,
    TheLanguageChooser,
    TheSidebar,
    NotificationListener,
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
    },
    getUsername() {
      return this.authStore.getUserName
    }
  },
  data() {
    return {
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
        // /api/change-password/, not /api/accounts/change-password/: the two
        // endpoints take different field names for the new password.
        await changePasswordCreate({
          body: { old_password: this.old_password, new_password1: this.new_password1 },
          throwOnError: true,
        })
        infoToast(this.create, this.$trans('Password changed'), this.$trans('Your password is changed'))
        await this.$refs['password-change-modal'].hide()
      } catch(error) {
        console.log(error)
        errorToast(this.create, this.$trans('Error changing your password'))
      }
    },
    async doLogout() {
      let loader = this.$loading.show()

      try {
        this.authStore.logout();
        await this.mainStore.getInitialData()

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
        errorToast(this.create, this.$trans('Error logging you out'))
      }
    },
    onContractChange(data) {
      if (data.type === NEW_DATA_EVENTS.CONTRACT) {
        this.mainStore.getInitialData()
      }
    },
  },
  async created() {
    await this.mainStore.checkInitialData()
    await this.memberNewDataSocket.init(NEW_DATA_EVENTS.CONTRACT)
    this.memberNewDataSocket.setOnmessageHandler(this.onContractChange)
    this.memberNewDataSocket.getSocket()
  },
  async beforeUnmount() {
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
</style>
