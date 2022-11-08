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
      intervalMinutes: 60,
      // 'SLIDING_TOKEN_LIFETIME': timedelta(days=2),
      // 'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=14),
      expireRefreshThresholdSec: 60*60*30
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
      const expireInSeconds = tokenVars.exp - Math.round(Date.now()/1000)
      const expireInHours = Math.round(expireInSeconds/(60*60))
      const debugStr = `threshold: ${this.expireRefreshThresholdSec/(60*60)} hrs, expire in seconds: ${expireInSeconds}, ${expireInHours} hrs`

      if (expireInSeconds <= this.expireRefreshThresholdSec) {
        console.log(`refreshing token (${debugStr})`)

        try {
          const result = await accountModel.refreshToken(token)
          console.log('token refresh result', result)
          this.$auth.authenticate({ accessToken: result.token })
          console.log('token refreshed')
        } catch (e) {
          console.error('error refreshing token', e)
        }
      } else {
        console.log(`not refreshing token (${debugStr})`)
      }
    },
  },
  mounted() {
    console.log('setting interval')
    this.intervalIdToken = setInterval(this.checkToken, 1000*60*this.intervalMinutes)
  },
  beforeDestroy() {
    console.log('clearing interval')
    clearInterval(this.intervalIdToken)
  }
}
</script>
