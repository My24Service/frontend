<template>
  <div>
  </div>
</template>

<script>
import {AccountService} from "../models/account/Account";
import componentMixin from "@/mixins/common";
import {useAuthStore} from "@/stores/auth";

export default {
  setup() {
    const authStore = useAuthStore()

    return {
      authStore
    }
  },
  mixins: [componentMixin],
  data() {
    return {
      intervalIdToken: null,
      intervalMinutes: 15,
      // 'SLIDING_TOKEN_LIFETIME': timedelta(days=2),
      // 'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=14),
      expireRefreshThresholdSec: 60*60*12,
      accountService: new AccountService()
    }
  },
  methods: {
    parseJwt (token) {
      const base64Url = token.split('.')[1];
      const  base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const  jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    },
    async checkToken() {
      const token = localStorage.getItem('accessToken')
      const tokenVars = this.parseJwt(token)
      const expireInSeconds = tokenVars.exp - Math.round(Date.now()/1000)
      const expireInHours = Math.round(expireInSeconds/(60*60))
      const debugStr = `threshold: ${this.expireRefreshThresholdSec/(60*60)} hrs, expire in seconds: ${expireInSeconds}, ${expireInHours} hrs`

      if (expireInSeconds <= this.expireRefreshThresholdSec) {
        console.debug(`refreshing token (${debugStr})`)

        try {
          await this.authStore.refreshToken(token)
        } catch (e) {
          console.error('error refreshing token', e)
        }
      } else {
        console.debug(`not refreshing token (${debugStr})`)
      }
    },
  },
  mounted() {
    this.checkToken()
    this.intervalIdToken = setInterval(this.checkToken, 1000*60*this.intervalMinutes)
  },
  beforeDestroy() {
    clearInterval(this.intervalIdToken)
  }
}
</script>
