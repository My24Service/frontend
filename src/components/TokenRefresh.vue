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
      intervalMinutes: 15,
      // 'SLIDING_TOKEN_LIFETIME': timedelta(days=2),
      // 'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=14),
      expireRefreshThresholdSec: 60*60*12
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
        console.debug(`refreshing token (${debugStr})`)

        try {
          const result = await accountModel.refreshToken(token)
          console.debug('token refresh result', result)
          this.$auth.authenticate({ accessToken: result.token })
          console.debug('token refreshed')
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
