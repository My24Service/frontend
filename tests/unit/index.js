import { createLocalVue } from '@vue/test-utils'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Vuex from 'vuex'
import FlashMessage from '@smartweb/vue-flash-message';

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(BootstrapVueIcons)
localVue.use(VueI18n)
localVue.use(VueRouter)
localVue.use(Vuex)
localVue.use(FlashMessage);

export default localVue
