import my24 from '@/services/my24';

import {
  SET_MEMBER_INFO,
  SET_LANGUAGE,
  SET_LANGUAGES,
  SET_SET_LANGUAGE_URL,
  SET_USER_INFO,
  SET_TOKEN,
  SET_MEMBER_CONTRACT,
  SET_STATUSCODES,
  SET_ASSIGN_ORDERS,
  SET_UNACCEPTED_COUNT,
  SET_MAINTENANCE_PRODUCTS,
  SET_STREAM_INFO,
} from './mutation-types'

export const mutations = {
  [SET_STREAM_INFO](state, streamInfo) {
    state.streamInfo = streamInfo
  },
  [SET_UNACCEPTED_COUNT](state, count) {
    state.unacceptedCount = count
  },
  [SET_MAINTENANCE_PRODUCTS](state, maintenanceProducts) {
    state.maintenanceProducts = maintenanceProducts
  },
  [SET_ASSIGN_ORDERS](state, orders) {
    state.assignOrders = orders
  },
  [SET_TOKEN](state, token) {
    state.token = token
  },
  [SET_MEMBER_INFO](state, memberInfo) {
    state.memberInfo = memberInfo
  },
  [SET_LANGUAGE](state, language) {
    state.currentLanguage = language
  },
  [SET_LANGUAGES](state, languages) {
    state.languages = languages
  },
  [SET_SET_LANGUAGE_URL](state, url) {
    state.setLanguageUrl = url
  },
  [SET_USER_INFO](state, userInfo) {
    state.userInfo = userInfo
    state.memberContract = userInfo.member_contract ? my24.getModelsFromString(userInfo.member_contract) : {}
  },
  [SET_MEMBER_CONTRACT](state, contract) {
    state.memberContract = contract
  },
  [SET_STATUSCODES](state, statuscodes) {
    state.statuscodes = statuscodes
  }
};
