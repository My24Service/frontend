import BASE_URL from './services/base-url'
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
import { toggleTheme } from "vite-plugin-theme-preprocessor/dist/browser-utils";
import { activeTheme } from "@/theme";
import {createPinia} from "pinia";

// style & themes
import './scss/app.scss'
import './scss/shltr.scss'
// after the theme SCSS so `tw:` utilities win over Bootstrap on shltr markup
import './scss/tailwind.css'
import 'vue-loading-overlay/dist/css/index.css';
import '@vuepic/vue-datepicker/dist/main.css'

toggleTheme({
  scopeName: activeTheme,
});

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
app.config.globalProperties.$log = console.log

// tired of those "v$ already defined" warnings -_-
app.config.silent = true
app.mount('#app')
