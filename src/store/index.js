import Vue from 'vue';
import Vuex from 'vuex';

import { actions } from './actions';
import { getters } from './getters';
import { mutations } from './mutations';

Vue.use(Vuex);

let store = new Vuex.Store({
  state: {
    data: [],
    next: null,
    previous: null,
    count: 0,
    num_pages: 0,
    urls: null,
    memberContract: null,
    currentLanguage: null,
    languages: [],
    memberInfo: null,
    userInfo: null,
    statuscodes: [],
    token: undefined,
    unacceptedCount: null,
  },
  actions,
  getters,
  mutations,
});

export default store;
