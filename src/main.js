import BASE_URL from './services/base-url'

const base = document.createElement("base")
base.href = BASE_URL
document.head.appendChild(base)

const script = document.createElement("script")
script.src = `${BASE_URL}/jsi18n/`
script.async = false
document.head.appendChild(script)

import Vue from 'vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Loading from 'vue-loading-overlay'
import axios from '@/services/api'
import VueAxios from 'vue-axios'
import { ColorPicker, ColorPanel } from "one-colorpicker"

import VueCompositionAPI from '@vue/composition-api'
Vue.use(VueCompositionAPI)

import { BadgePlugin } from 'bootstrap-vue'
Vue.use(BadgePlugin)

import { BootstrapVueIcons } from 'bootstrap-vue'
Vue.use(BootstrapVueIcons)

import { BreadcrumbPlugin } from 'bootstrap-vue'
Vue.use(BreadcrumbPlugin)

import { ButtonPlugin } from 'bootstrap-vue'
Vue.use(ButtonPlugin)

import { ButtonGroupPlugin } from 'bootstrap-vue'
Vue.use(ButtonGroupPlugin)

import { ButtonToolbarPlugin } from 'bootstrap-vue'
Vue.use(ButtonToolbarPlugin)

import { CarouselPlugin } from 'bootstrap-vue'
Vue.use(CarouselPlugin)

import { DropdownPlugin } from 'bootstrap-vue'
Vue.use(DropdownPlugin)

import { FormPlugin } from 'bootstrap-vue'
Vue.use(FormPlugin)

import { FormCheckboxPlugin } from 'bootstrap-vue'
Vue.use(FormCheckboxPlugin)

import { FormDatepickerPlugin } from 'bootstrap-vue'
Vue.use(FormDatepickerPlugin)

import { FormFilePlugin } from 'bootstrap-vue'
Vue.use(FormFilePlugin)

import { FormGroupPlugin } from 'bootstrap-vue'
Vue.use(FormGroupPlugin)

import { FormInputPlugin } from 'bootstrap-vue'
Vue.use(FormInputPlugin)

import { FormRadioPlugin } from 'bootstrap-vue'
Vue.use(FormRadioPlugin)

import { FormSelectPlugin } from 'bootstrap-vue'
Vue.use(FormSelectPlugin)

import { FormTextareaPlugin } from 'bootstrap-vue'
Vue.use(FormTextareaPlugin)

import { FormTimepickerPlugin } from 'bootstrap-vue'
Vue.use(FormTimepickerPlugin)

import { LayoutPlugin } from 'bootstrap-vue'
Vue.use(LayoutPlugin)

import { LinkPlugin } from 'bootstrap-vue'
Vue.use(LinkPlugin)

import { ModalPlugin } from 'bootstrap-vue'
Vue.use(ModalPlugin)

import { NavPlugin } from 'bootstrap-vue'
Vue.use(NavPlugin)

import { NavbarPlugin } from 'bootstrap-vue'
Vue.use(NavbarPlugin)

import { OverlayPlugin } from 'bootstrap-vue'
Vue.use(OverlayPlugin)

import { PaginationPlugin } from 'bootstrap-vue'
Vue.use(PaginationPlugin)

import { ProgressPlugin } from 'bootstrap-vue'
Vue.use(ProgressPlugin)

import { SpinnerPlugin } from 'bootstrap-vue'
Vue.use(SpinnerPlugin)

import { TablePlugin, TableLitePlugin, TableSimplePlugin } from 'bootstrap-vue'
Vue.use(TablePlugin)
Vue.use(TableLitePlugin)
Vue.use(TableSimplePlugin)

import { TabsPlugin } from 'bootstrap-vue'
Vue.use(TabsPlugin)

import { ToastPlugin } from 'bootstrap-vue'
Vue.use(ToastPlugin)

import VCalendar from 'v-calendar'
Vue.use(VCalendar)

import App from './App.vue'
import store from './store'
import router from './router'

import './app.scss'
import 'vue-loading-overlay/dist/vue-loading.css'

// global mixins
import toastMix from '@/mixins/toast'
Vue.mixin(toastMix)

// auth
import auth from '@/services/auth'
import client from '@/services/api'
auth.setInterceptors(client)

Vue.config.productionTip = false

Vue.prototype.$trans = (text) => {
  if (text in window.member_type_text) {
    return gettext(window.member_type_text[text])
  }

  return gettext(text)
}

Vue.use(Vuex)
Vue.use(VueRouter)
Vue.use(Loading)
Vue.use(VueAxios, axios)
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
      console.log('data', error.response.data);
      console.log('status', error.response.status);
      if (error.response.status === 401) {
        auth.logout()
      }
    }
  })
