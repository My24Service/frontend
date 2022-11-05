<template>
  <div>
  </div>
</template>

<script>
import accountModel from "../models/account/Account";

export default {
  data() {
    return {
      intervalIdToken: null,
      expireRefreshThresholdSec: 60*60*24*13
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
      const token = this.$auth.getAccessToken()
      const tokenVars = this.parseJwt(token)
      const expireInSeconds = tokenVars.refresh_exp - Math.round(Date.now()/1000)
      const expireInHours = Math.round(expireInSeconds/(60*60))
      const expireInDays = Math.round(expireInHours/24)

      console.debug(`${expireInSeconds} <= ${this.expireRefreshThresholdSec}`)
      if (expireInSeconds <= this.expireRefreshThresholdSec) {
        console.log(`refreshing token`)

        try {
          const result = await accountModel.refreshToken(token)
          this.$auth.authenticate({ accessToken: result.token })
          console.log('token refreshed')
        } catch (e) {
          console.error('error refreshing token', e)
        }
      } else {
        console.debug(`not refreshing token (threshold: ${this.expireRefreshThresholdSec}, expire in seconds: ${expireInSeconds} - ${expireInHours} hour, ${expireInDays} days)`)
      }
    },
  },
  mounted() {
    console.log('setting interval')
    this.intervalIdToken = setInterval(this.checkToken, 1000*10)
  },
  beforeDestroy() {
    console.log('clearing interval')
    clearInterval(this.intervalIdToken)
  }
}
</script>
