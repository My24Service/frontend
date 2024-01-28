import Vue from 'vue'
import clientDriver from './clientDriver'

const vm = new Vue({
  data: {
    authState: !!localStorage.getItem('accessToken')
  },
  computed: {
    authenticated () {
      return this.authState
    }
  },
  methods: {
    getAccessToken () {
      return localStorage.getItem('accessToken')
    },
    authenticate ({ accessToken }) {
      localStorage.setItem('accessToken', accessToken)
      this.authState = true
    },
    logout (refresh = true, to_home = true) {
      localStorage.removeItem('accessToken')
      this.authState = false
      if (to_home) document.location.href = `${document.location.origin}/#/`
      if (refresh) window.location.reload()
    },
    isAuthenticated () {
      return this.authState
    },
    setInterceptors (client) {
      if (client) {
        clientDriver(client, this)
      }
    }
  }
})

Vue.$auth = Vue.prototype.$auth = vm

export default vm
