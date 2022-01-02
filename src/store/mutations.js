import my24 from '@/services/my24';

import {
  SET_MEMBER_INFO,
  SET_LANGUAGE,
  SET_USER_INFO,
  SET_TOKEN,
  SET_MEMBER_CONTRACT,
  DATA_LOADED,
  SET_STATUSCODES,
  SET_ASSIGN_ORDERS,
} from './mutation-types';

export const mutations = {
  [SET_ASSIGN_ORDERS](state, orders) {
    state.assignOrders = orders;
  },
  [SET_TOKEN](state, token) {
    state.token = token;
  },
  [SET_MEMBER_INFO](state, memberInfo) {
    state.memberInfo = memberInfo;
  },
  [SET_LANGUAGE](state, language) {
    state.currentLanguage = language;
  },
  [SET_USER_INFO](state, userInfo) {
    state.userInfo = userInfo;
    state.memberContract = userInfo.member_contract ? my24.getModelsFromString(userInfo.member_contract) : {};
  },
  [SET_MEMBER_CONTRACT](state, contract) {
    state.memberContract = contract;
  },
  [DATA_LOADED](state, data) {
    state.data = data.results;
    state.next = data.next || null;
    state.previous = data.previous || null;
    state.count = data.count || 0;
    state.num_pages = data.num_pages || 0;
  },
  [SET_STATUSCODES](state, statuscodes) {
    state.statuscodes = statuscodes;
  }
};
