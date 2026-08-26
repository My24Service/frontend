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
// @ts-expect-error - vite-plugin-theme-preprocessor ships no type declarations
import { toggleTheme } from "vite-plugin-theme-preprocessor/dist/browser-utils";
import { activeTheme } from "@/theme";
import {createPinia} from "pinia";
import {installApiInterceptors} from "@/services/api-client/interceptors";
import {installQueryClient} from "@/services/query-client";

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

// The generated SDK's client: Authorization, the 401 redirect and CSRF on
// writes. Its baseURL is already set at construction (see
// services/api-client/runtimeConfig.ts); only these need an existing instance.
installApiInterceptors()

const pinia = createPinia()
const app = createApp(App)
  .use(pinia)
  .use(LoadingPlugin)
  .use(router)
  .mixin(componentMixin)
  .component('VueDatePicker', VueDatePicker);

// Vue Query is the fetching layer (docs/adr/0001-vue-query-as-fetching-layer.md).
// Nothing calls it yet: the generated query options in src/api/@tanstack/ need
// a client in scope before any screen can be converted to use them.
installQueryClient(app)

// app.use(VueSpinners)
// app.use(Loading)
// app.use(ColorPanel)
// app.use(ColorPicker)

app.config.globalProperties.$log = console.log

app.mount('#app')
