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
      return sessionStorage.getItem('accessToken')
    },
    authenticate ({ accessToken }) {
      sessionStorage.setItem('accessToken', accessToken)
      this.authState = true
    },
    logout (refresh = true, to_home = true) {
      if (refresh) window.location.reload()
      sessionStorage.removeItem('accessToken')
      this.authState = false
      if (to_home) document.location.href = '/'
    },
    isAuthenticated () {
      return this.authState
    },
    setInterceptors (client) {
      clientDriver(client, this)
    }
  }
})

Vue.$auth = Vue.prototype.$auth = vm

export default vm
