import BASE_URL from './services/base-url'
const companycode = BASE_URL.split('//')[1].split('.')[0]
// const base = document.createElement("base")
// base.href = BASE_URL
// document.head.appendChild(base)

const script = document.createElement("script")
script.src = `${BASE_URL}/api/jsi18n/`
script.async = false
document.head.appendChild(script)

import { createApp } from 'vue'

// import 'vue-spinners/dist/vue-spinners.css'
// import VueSpinners from 'vue-spinners/dist/vue-spinners.common'

// import VCalendar from 'v-calendar'
// Vue.use(VCalendar)

import App from './App.vue'
import {router} from './router'
import componentMixin from "@/mixins/common";
import { VueDatePicker } from '@vuepic/vue-datepicker';
import {LoadingPlugin} from 'vue-loading-overlay';
import '@vuepic/vue-datepicker/dist/main.css'
import { toggleTheme } from "@zougt/vite-plugin-theme-preprocessor/dist/browser-utils";
import {createPinia} from "pinia";

function createOurApp() {
  const pinia = createPinia()
  const app = createApp(App)
      .use(pinia)
      .use(LoadingPlugin)
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

// style & themes
import './scss/app.scss'
import 'vue-loading-overlay/dist/css/index.css';
import "./scss/shared.scss";

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
toggleTheme({
  scopeName: theme,
});

// const app = createOurApp()
// app.mount('#app')

const pinia = createPinia()
const app = createApp(App)
  .use(pinia)
  .use(LoadingPlugin)
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
app.mount('#app')
