import Vue from 'vue'
import axios from '@/services/api'

import my24 from '@/services/my24'
import { isEmpty } from '@/utils'

import {
  SET_MEMBER_INFO,
  SET_LANGUAGES,
  SET_LANGUAGE,
  SET_SET_LANGUAGE_URL,
  SET_USER_INFO,
  SET_TOKEN,
  SET_MEMBER_CONTRACT,
  DATA_LOADED,
  SET_STATUSCODES,
  SET_ASSIGN_ORDERS,
  SET_UNACCEPTED_COUNT,
} from './mutation-types'

export const actions = {
  setUnacceptedCount({commit}, count) {
    commit(SET_UNACCEPTED_COUNT, count)
  },
  setAssignOrders({commit}, orders) {
    commit(SET_ASSIGN_ORDERS, orders)
  },
  getAssignOrders({state}) {
    return new Promise((resolve) => {
      resolve(state.assignOrders)
    })
  },
  setLanguage({commit}, language) {
    commit(SET_LANGUAGE, language)
  },
  async getInitialData({ commit }) {
    return new Promise(async (resolve, reject) => {
      try {
        const languageVars = await my24.getLanguageVars()
        const initialData = await my24.getInitialData()
        const memberContract = !isEmpty(initialData.userInfo) ? my24.getModelsFromString(initialData.userInfo.member_contract) : {}

        document.title = initialData.memberInfo.name
        window.member_type_text = initialData.memberInfo.member_texts

        commit(SET_SET_LANGUAGE_URL, languageVars.set_language_url)
        commit(SET_LANGUAGE, languageVars.current_language)
        commit(SET_LANGUAGES, languageVars.languages)
        commit(SET_USER_INFO, initialData.userInfo)
        commit(SET_MEMBER_INFO, initialData.memberInfo)
        commit(SET_MEMBER_CONTRACT, memberContract)
        commit(SET_STATUSCODES, initialData.statuscodes)
        resolve()
      } catch(e) {
        reject(e)
      }
    })
  },
  getCsrfToken({ commit }) {
    return new Promise((resolve, reject) => {
      axios.get('/get-csrf-token/')
        .then((response) => {
          commit(SET_TOKEN, response.data.token)
          resolve(response.data.token)
        })
        .catch((error) => {
          console.log('Error getting token')
          reject()
        })
    })
  },
  hasAccessToRoute({ state }, route) {
    let parts = route.split('/')
    parts.shift()
    const lenParts = parts.length
    const [mod, part] = parts

    const result = my24.hasAccessToModule({
      contract: state.memberContract,
      module: mod,
      part,
      lenParts,
      isStaff: state.userInfo.is_staff,
      isSuperuser: state.userInfo.is_superuser
    })

    return new Promise((resolve) => {
      resolve(result)
    })
  },
  status2color({ state }, status) {
    // return new Promise((resolve) => {
      if (!status) {
        console.log('no status')
        return
      }

      for (let i=0; i<state.statuscodes.length; i++) {
        const statuscode = state.statuscodes[i]
        let color = statuscode.color

        if (color.substr(0, 1) !== '#') color = '#' + color

        // first try regex
        const re = new RegExp(statuscode, 'i')
        if (re.test(status)) {
          return color
        }

        if (status === statuscode) {
          return color
        }
      }
    return ''
  },
  getStatuscodes({ state }) {
    return new Promise((resolve) => {
      resolve(state.statuscodes)
    })
  },
  getCountries({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.countries)
    })
  },
  getOrderTypes({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.order_types)
    })
  },
  getMemberType({ state }) {
    return new Promise((resolve) => {
      resolve(state.memberInfo.member_type)
    })
  },
  getIsStaff({ state }) {
    return new Promise((resolve) => {
      resolve(state.userInfo.is_staff)
    })
  },
  getIsSuperuser({ state }) {
    return new Promise((resolve) => {
      resolve(state.userInfo.is_superuser)
    })
  }
}
