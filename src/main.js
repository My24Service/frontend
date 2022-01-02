import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import FlashMessage from '@smartweb/vue-flash-message'
import Loading from 'vue-loading-overlay'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Vuelidate from 'vuelidate'
const moment = require('moment')
import { ColorPicker, ColorPanel } from "one-colorpicker"

import App from './App.vue'
import store from './store'
import router from './router'
import './app.scss'
import 'vue-loading-overlay/dist/vue-loading.css'


const currentLanguageEl = document.getElementById('current_language')
window.locale = currentLanguageEl ? JSON.parse(currentLanguageEl.textContent) : 'en'

moment.locale(window.locale)

Vue.config.productionTip = false

Vue.prototype.$trans = (text) => {
  if (text in window.member_type_text) {
    return gettext(window.member_type_text[text])
  }

  return gettext(text)
}

Vue.use(BootstrapVue)
Vue.use(BootstrapVueIcons)
Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(FlashMessage, {time: 1500, strategy: 'multiple'})
Vue.use(Loading)
Vue.use(VueAxios, axios)
Vue.use(Vuelidate)
Vue.use(ColorPanel)
Vue.use(ColorPicker)
Vue.use(require('vue-moment'), {
    moment
})

store.dispatch('initStore')
  .then(() => {
    new Vue({
      store,
      router,
      render: (h) => h(App),
    }).$mount('#app')
  })
  .catch((error) => {
    console.log('error initStore', error)
  })
