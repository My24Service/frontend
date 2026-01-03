import BASE_URL from './services/base-url'
const companycode = BASE_URL.split('//')[1].split('.')[0]
const base = document.createElement("base")
base.href = BASE_URL
document.head.appendChild(base)

const script = document.createElement("script")
script.src = `${BASE_URL}/api/jsi18n/`
script.async = false
document.head.appendChild(script)

import { createApp } from 'vue'
// import Loading from 'vue-loading-overlay'
// import { ColorPicker, ColorPanel } from "one-colorpicker"

// import 'vue-spinners/dist/vue-spinners.css'
// import VueSpinners from 'vue-spinners/dist/vue-spinners.common'

// import VCalendar from 'v-calendar'
// Vue.use(VCalendar)

import App from './App.vue'
import {router} from './router'
import componentMixin from "@/mixins/common";
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'

function createOurApp() {
  const app = createApp(App)
      .use(router)
      .mixin(componentMixin)
      .component('VueDatePicker', VueDatePicker);

  // app.use(VueSpinners)
  // app.use(Loading)
  // app.use(ColorPanel)
  // app.use(ColorPicker)

  app.config.productionTip = false

  // tired of those "v$ already defined" warnings -_-
  app.config.silent = true

  return app
}

import './scss/default.scss'
// import 'vue-loading-overlay/dist/vue-loading.css'
import "./scss/shared.scss";

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

store.dispatch('getInitialData')
  .then(() => {
    const app = createOurApp();
    app.mount('#app')
  })
  .catch(async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('401 in main')
      // try to refresh token
      await store.dispatch('refreshToken')
    }
  })
