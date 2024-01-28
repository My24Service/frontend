// import 'regenerator-runtime/runtime'
import { beforeAll } from 'vitest';
import Vue from 'vue';
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Vuex from 'vuex'
import toastMix from '@/mixins/toast'
// import VueCompositionAPI from '@vue/composition-api'

beforeAll(() => {
  Vue.mixin(toastMix)
// Vue.mixin(componentMixin)
//   Vue.use(VueCompositionAPI)
  Vue.use(BootstrapVue)
  Vue.use(BootstrapVueIcons)
  Vue.use(VueI18n)
  Vue.use(VueRouter)
  Vue.use(Vuex)
});
