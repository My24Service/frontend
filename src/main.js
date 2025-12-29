import BASE_URL from './services/base-url'
const companycode = BASE_URL.split('//')[1].split('.')[0]
const base = document.createElement("base")
base.href = BASE_URL
document.head.appendChild(base)

const script = document.createElement("script")
script.src = `${BASE_URL}/api/jsi18n/`
script.async = false
document.head.appendChild(script)

import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Loading from 'vue-loading-overlay'
import { ColorPicker, ColorPanel } from "one-colorpicker"

import 'vue-spinners/dist/vue-spinners.css'
import VueSpinners from 'vue-spinners/dist/vue-spinners.common'

Vue.use(VueSpinners)

// import VCalendar from 'v-calendar'
// Vue.use(VCalendar)

import App from './App.vue'
import store from './store'
import router from './router'

import './scss/app.scss'
// import 'vue-loading-overlay/dist/vue-loading.css'
// import './scss/shared.scss'

// themes
const defaultTheme = 'theme-default'
const themes = {
  'shltr': 'theme-shltr',
  'shltr-installation': 'theme-shltr',
  'wsmes': 'theme-shltr',
  'wsmes-corporate': 'theme-shltr',
  'riedel': 'theme-shltr',
  'amex': 'theme-shltr',
  'rivieramaison': 'theme-shltr',
  'poelgeest': 'theme-shltr',
  'graafbakeries': 'theme-shltr',
  'dpwn': 'theme-shltr',
  'dpworld': 'theme-shltr',
  'trioworld': 'theme-shltr',
}
const theme = companycode in themes ? themes[companycode] : defaultTheme

import { toggleTheme } from "@zougt/vite-plugin-theme-preprocessor/dist/browser-utils";
toggleTheme({
  scopeName: theme,
});

// global mixins
import toastMix from '@/mixins/toast'
Vue.mixin(toastMix)

// auth
import auth from '@/services/auth'
import client from '@/services/api'
import accountModel from "./models/account/Account";
auth.setInterceptors(client)

Vue.config.productionTip = false

// tired of those "v$ already defined" warnings -_-
Vue.config.silent = true

Vue.prototype.$trans = (text) => {
  if (text in window.member_type_text) {
    return gettext(window.member_type_text[text])
  }

  return gettext(text)
}

Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(Loading)
Vue.use(ColorPanel)
Vue.use(ColorPicker)

store.dispatch('getInitialData')
  .then(() => {
    new Vue({
      store,
      router,
      render: (h) => h(App),
    }).$mount('#app')
  })
  .catch((error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.log('401 in main')
        // try to refresh token
        try {
          const token = auth.getAccessToken()
          if (token) {
            accountModel.refreshToken(token).then((result) => {
              console.debug('token refresh result', result)
              auth.authenticate({ accessToken: result.token })
              console.debug('token refreshed, reload window')
              window.location.reload()
            })
          } else {
            console.log('no token, logout and reload')
            auth.logout(true)
          }
        } catch (e) {
          console.error('error refreshing token', e)
          console.log('logout and reload')
          auth.logout(true)
        }

        // console.log('401 in main, logout and reload')
        // auth.logout(true)
      }
    }
  })
