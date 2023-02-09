import { createLocalVue } from '@vue/test-utils'
import { BootstrapVue, BootstrapVueIcons } from 'bootstrap-vue'
import VueRouter from 'vue-router'
import VueI18n from 'vue-i18n'
import Vuex from 'vuex'
import toastMix from '@/mixins/toast'
// import {componentMixin} from "../../src/utils"

const localVue = createLocalVue()
localVue.mixin(toastMix)
// localVue.mixin(componentMixin)
localVue.use(BootstrapVue)
localVue.use(BootstrapVueIcons)
localVue.use(VueI18n)
localVue.use(VueRouter)
localVue.use(Vuex)

export default localVue
